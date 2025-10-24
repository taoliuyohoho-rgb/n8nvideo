#!/bin/bash

# AI 视频生成工具部署脚本
# 支持本地部署和 Docker 部署

set -e

echo "🚀 开始部署 AI 视频生成工具..."

# 检查参数
DEPLOY_TYPE=${1:-"local"}
ENVIRONMENT=${2:-"development"}

echo "部署类型: $DEPLOY_TYPE"
echo "环境: $ENVIRONMENT"

if [ "$DEPLOY_TYPE" = "docker" ]; then
    echo "🐳 使用 Docker 部署..."
    
    # 构建 Docker 镜像
    echo "构建 Docker 镜像..."
    docker build -t n8n-video-ai .
    
    # 停止现有容器
    echo "停止现有容器..."
    docker-compose down || true
    
    # 启动服务
    echo "启动服务..."
    docker-compose up -d
    
    echo "✅ Docker 部署完成！"
    echo "访问地址: http://localhost:3000"
    
elif [ "$DEPLOY_TYPE" = "production" ]; then
    echo "🏭 生产环境部署..."
    
    # 安装依赖
    echo "安装生产依赖..."
    npm ci --only=production
    
    # 生成 Prisma 客户端
    echo "生成 Prisma 客户端..."
    npx prisma generate
    
    # 构建应用
    echo "构建应用..."
    npm run build
    
    # 启动应用
    echo "启动应用..."
    npm start
    
else
    echo "💻 本地开发部署..."
    
    # 安装依赖
    echo "安装依赖..."
    npm install
    
    # 生成 Prisma 客户端
    echo "生成 Prisma 客户端..."
    npx prisma generate
    
    # 推送数据库结构
    echo "初始化数据库..."
    npx prisma db push
    
    # 启动开发服务器
    echo "启动开发服务器..."
    npm run dev
fi

echo "🎉 部署完成！"
