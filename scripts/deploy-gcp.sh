#!/bin/bash

# Google Cloud 部署脚本
# 项目ID: ecommerce-475403

set -e

PROJECT_ID="ecommerce-475403"
REGION="asia-east1"
SERVICE_NAME="n8n-video-ai"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 开始部署到 Google Cloud Platform..."
echo "项目ID: ${PROJECT_ID}"
echo "区域: ${REGION}"
echo "服务名: ${SERVICE_NAME}"
echo ""

# 1. 设置项目
echo "📋 1/7: 设置 Google Cloud 项目..."
gcloud config set project ${PROJECT_ID}

# 2. 启用必要的 API
echo ""
echo "🔧 2/7: 启用必要的 Google Cloud API..."
gcloud services enable cloudbuild.googleapis.com \
  cloudrun.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  containerregistry.googleapis.com \
  --project=${PROJECT_ID} 2>/dev/null || echo "API 可能已经启用"

# 3. 检查是否已有 Cloud SQL 实例
echo ""
echo "🗄️  3/7: 检查 Cloud SQL 数据库..."
DB_INSTANCE_NAME="${SERVICE_NAME}-db"
DB_EXISTS=$(gcloud sql instances list --filter="name:${DB_INSTANCE_NAME}" --format="value(name)" --project=${PROJECT_ID} 2>/dev/null || echo "")

if [ -z "$DB_EXISTS" ]; then
  echo "   创建新的 Cloud SQL PostgreSQL 实例..."
  echo "   ⚠️  注意：这会创建一个新的数据库实例，可能需要几分钟"
  
  # 创建 Cloud SQL 实例（最小配置，降低成本）
  # PostgreSQL 不支持 bin-log（只有 MySQL 支持）
  DB_PASSWORD=$(openssl rand -base64 16)
  echo "   数据库密码已生成（请保存）：${DB_PASSWORD}"
  
  gcloud sql instances create ${DB_INSTANCE_NAME} \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=${REGION} \
    --root-password=${DB_PASSWORD} \
    --storage-type=SSD \
    --storage-size=10GB \
    --backup-start-time=03:00 \
    --project=${PROJECT_ID} || {
    echo "   ❌ 创建数据库实例失败"
    echo "   💡 提示：如果配额不足，请手动在 Cloud Console 创建或使用现有数据库"
    read -p "   是否继续使用外部数据库？(y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  }
  
  # 创建数据库
  gcloud sql databases create n8nvideo \
    --instance=${DB_INSTANCE_NAME} \
    --project=${PROJECT_ID} 2>/dev/null || echo "   数据库可能已存在"
  
  echo "   ✅ 数据库实例创建完成"
else
  echo "   ✅ 数据库实例已存在: ${DB_INSTANCE_NAME}"
fi

# 获取数据库连接信息
DB_CONNECTION_NAME=$(gcloud sql instances describe ${DB_INSTANCE_NAME} --format="value(connectionName)" --project=${PROJECT_ID} 2>/dev/null || echo "")
DB_PUBLIC_IP=$(gcloud sql instances describe ${DB_INSTANCE_NAME} --format="value(ipAddresses[0].ipAddress)" --project=${PROJECT_ID} 2>/dev/null || echo "")

if [ -z "$DB_CONNECTION_NAME" ]; then
  echo "   ⚠️  无法获取数据库连接信息，请手动配置 DATABASE_URL"
  echo "   你可以在 Cloud Console 查看数据库连接信息"
fi

# 4. 配置 Docker 认证
echo ""
echo "🐳 4/7: 配置 Docker 认证..."
gcloud auth configure-docker gcr.io --quiet

# 5. 构建并推送 Docker 镜像
echo ""
echo "📦 5/7: 构建并推送 Docker 镜像..."
echo "   这可能需要几分钟..."
gcloud builds submit --tag ${IMAGE_NAME} \
  --project=${PROJECT_ID} \
  --timeout=20m || {
  echo "   ❌ 构建失败"
  exit 1
}

echo "   ✅ 镜像构建完成: ${IMAGE_NAME}"

# 6. 部署到 Cloud Run
echo ""
echo "🚀 6/7: 部署到 Cloud Run..."

# 生成 NEXTAUTH_SECRET
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# 准备环境变量
# 注意：实际部署时需要配置真实的 API keys
ENV_VARS="NODE_ENV=production,PORT=3000,HOSTNAME=0.0.0.0,NEXTAUTH_SECRET=${NEXTAUTH_SECRET}"

# 如果数据库可用，添加数据库连接
if [ -n "$DB_PUBLIC_IP" ]; then
  # 注意：实际密码需要从 Secret Manager 或手动设置
  echo "   ⚠️  数据库 IP: ${DB_PUBLIC_IP}"
  echo "   ⚠️  请手动配置 DATABASE_URL 环境变量"
  echo "   DATABASE_URL 格式: postgresql://postgres:PASSWORD@${DB_PUBLIC_IP}:5432/n8nvideo?schema=public"
fi

gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 3000 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars "${ENV_VARS}" \
  --add-cloudsql-instances ${DB_CONNECTION_NAME} \
  --project=${PROJECT_ID} || {
  echo "   ❌ 部署失败"
  exit 1
}

# 7. 获取服务 URL
echo ""
echo "🌐 7/7: 获取服务 URL..."
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --platform managed \
  --region ${REGION} \
  --format="value(status.url)" \
  --project=${PROJECT_ID})

echo ""
echo "✅✅✅ 部署完成！✅✅✅"
echo ""
echo "📍 服务信息："
echo "   URL: ${SERVICE_URL}"
echo "   区域: ${REGION}"
echo "   服务名: ${SERVICE_NAME}"
echo ""
echo "⚠️  重要：下一步操作"
echo ""
echo "1. 配置环境变量（在 Cloud Run 控制台或使用以下命令）："
echo "   gcloud run services update ${SERVICE_NAME} \\"
echo "     --region ${REGION} \\"
echo "     --update-env-vars DATABASE_URL='postgresql://...',OPENAI_API_KEY='...',GOOGLE_AI_API_KEY='...'"
echo ""
echo "2. 初始化数据库（在 Cloud Run 实例中运行）："
echo "   gcloud run jobs create init-db \\"
echo "     --image ${IMAGE_NAME} \\"
echo "     --command 'sh' \\"
echo "     --args '-c,npx prisma migrate deploy && npx prisma db seed' \\"
echo "     --set-env-vars DATABASE_URL='...' \\"
echo "     --region ${REGION}"
echo ""
echo "   或者手动运行数据库迁移："
echo "   gcloud run execute init-db --region ${REGION}"
echo ""
echo "3. 更新 NEXTAUTH_URL："
echo "   gcloud run services update ${SERVICE_NAME} \\"
echo "     --region ${REGION} \\"
echo "     --update-env-vars NEXTAUTH_URL='${SERVICE_URL}'"
echo ""
echo "📚 更多信息："
echo "   - Cloud Run 控制台: https://console.cloud.google.com/run?project=${PROJECT_ID}"
echo "   - 数据库实例: https://console.cloud.google.com/sql/instances?project=${PROJECT_ID}"

