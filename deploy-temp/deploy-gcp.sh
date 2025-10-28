#!/bin/bash

# Google Cloud Run 部署脚本
set -e

# 配置信息
PROJECT_ID="ecommerce-475403"
SERVICE_NAME="n8nvideo"
REGION="asia-southeast1"  # 新加坡，离中国最近
DOMAIN="tiktokvideostyle.asia"

echo "🚀 开始部署到 Google Cloud Run..."
echo "项目ID: $PROJECT_ID"
echo "服务名称: $SERVICE_NAME"
echo "区域: $REGION"
echo "域名: $DOMAIN"

# 检查 gcloud 是否安装
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI 未安装，请先安装 Google Cloud SDK"
    echo "安装指南: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# 设置项目
echo "🔧 设置 Google Cloud 项目..."
gcloud config set project $PROJECT_ID

# 启用必要的 API
echo "🔧 启用必要的 API..."
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com

# 构建并推送 Docker 镜像
echo "🐳 构建 Docker 镜像..."
docker build -f Dockerfile.gcp -t gcr.io/$PROJECT_ID/$SERVICE_NAME .

echo "📤 推送镜像到 Google Container Registry..."
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME

# 部署到 Cloud Run
echo "🚀 部署到 Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production

# 获取服务 URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo ""
echo "✅ 部署完成！"
echo "🌐 服务URL: $SERVICE_URL"
echo "🔧 健康检查: $SERVICE_URL/api/health"
echo ""
echo "📋 下一步："
echo "1. 测试服务: curl $SERVICE_URL/api/health"
echo "2. 配置自定义域名: gcloud run domain-mappings create --service $SERVICE_NAME --domain $DOMAIN --region $REGION"
echo "3. 设置环境变量（如需要）: gcloud run services update $SERVICE_NAME --set-env-vars KEY=VALUE"
echo ""
echo "💰 预估成本："
echo "- 无流量时: $0/月"
echo "- 轻度使用: $1-5/月"
echo "- 中等使用: $5-20/月"
