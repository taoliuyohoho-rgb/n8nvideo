#!/bin/bash

# 优化的云端部署脚本
# 这个脚本会创建一个最小化的部署包

set -e

echo "🚀 开始优化部署..."

# 创建临时部署目录
DEPLOY_DIR="deploy-temp"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

echo "📦 复制必要文件..."

# 复制核心文件
cp package.json $DEPLOY_DIR/
cp package-lock.json $DEPLOY_DIR/
cp next.config.js $DEPLOY_DIR/
cp tailwind.config.js $DEPLOY_DIR/
cp postcss.config.js $DEPLOY_DIR/
cp tsconfig.json $DEPLOY_DIR/
cp next-env.d.ts $DEPLOY_DIR/

# 复制应用代码
cp -r app $DEPLOY_DIR/
cp -r components $DEPLOY_DIR/
cp -r lib $DEPLOY_DIR/
cp -r src $DEPLOY_DIR/
cp -r prisma $DEPLOY_DIR/

# 复制Docker相关文件
cp Dockerfile $DEPLOY_DIR/
cp .dockerignore $DEPLOY_DIR/
cp docker-compose.yml $DEPLOY_DIR/
cp docker-compose.prod.yml $DEPLOY_DIR/
cp nginx.conf $DEPLOY_DIR/

# 复制环境配置
cp env.example $DEPLOY_DIR/
cp env.production $DEPLOY_DIR/

# 复制README
cp README.md $DEPLOY_DIR/

echo "📊 检查部署包大小..."
du -sh $DEPLOY_DIR

echo "✅ 优化部署包已创建在 $DEPLOY_DIR 目录"
echo "💡 现在可以上传 $DEPLOY_DIR 目录到云端服务器"
echo "💡 在云端服务器上运行:"
echo "   cd $DEPLOY_DIR"
echo "   docker build -t n8nvideo ."
echo "   docker run -p 3000:3000 n8nvideo"
