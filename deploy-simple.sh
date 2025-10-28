#!/bin/bash

echo "🚀 开始简单部署..."

# 创建临时部署目录
DEPLOY_DIR="deploy-simple"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

echo "📦 复制必要文件..."

# 复制核心文件
cp package.json $DEPLOY_DIR/
cp package-lock.json $DEPLOY_DIR/
cp next.config.js $DEPLOY_DIR/
cp tsconfig.json $DEPLOY_DIR/
cp tailwind.config.js $DEPLOY_DIR/
cp postcss.config.js $DEPLOY_DIR/
cp next-env.d.ts $DEPLOY_DIR/
cp prisma/schema.prisma $DEPLOY_DIR/prisma/
mkdir -p $DEPLOY_DIR/prisma
cp prisma/schema.prisma $DEPLOY_DIR/prisma/

# 复制应用文件
cp -r app $DEPLOY_DIR/
cp -r components $DEPLOY_DIR/
cp -r lib $DEPLOY_DIR/

# 复制Dockerfile
cp Dockerfile.gcp $DEPLOY_DIR/Dockerfile

echo "📊 检查部署包大小..."
du -sh $DEPLOY_DIR

echo "✅ 简单部署包已创建在 $DEPLOY_DIR 目录"
echo "💡 现在可以构建和部署："
echo "   cd $DEPLOY_DIR"
echo "   docker build --platform linux/amd64 -t gcr.io/ecommerce-475403/n8nvideo ."
echo "   docker push gcr.io/ecommerce-475403/n8nvideo"
echo "   gcloud run deploy n8nvideo --image gcr.io/ecommerce-475403/n8nvideo --platform managed --region asia-southeast1 --allow-unauthenticated --min-instances 0 --max-instances 10 --cpu 1 --memory 512Mi --port 8080 --project ecommerce-475403"
