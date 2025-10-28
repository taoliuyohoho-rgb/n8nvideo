#!/bin/bash

# 云端部署脚本
set -e

echo "🚀 开始云端部署..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

# 检查docker-compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose未安装，请先安装docker-compose"
    exit 1
fi

echo "✅ Docker环境检查通过"

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose -f docker-compose.prod.yml down || true

# 构建镜像
echo "🔨 构建Docker镜像..."
docker-compose -f docker-compose.prod.yml build

# 启动服务
echo "🚀 启动服务..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ 服务启动成功！"
    echo "🌐 访问地址: http://localhost:3000"
    echo "🔧 健康检查: http://localhost:3000/api/health"
else
    echo "❌ 服务启动失败，请检查日志："
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

echo ""
echo "📋 常用命令："
echo "  查看日志: docker-compose -f docker-compose.prod.yml logs -f"
echo "  停止服务: docker-compose -f docker-compose.prod.yml down"
echo "  重启服务: docker-compose -f docker-compose.prod.yml restart"
echo "  查看状态: docker-compose -f docker-compose.prod.yml ps"
echo ""
echo "🎉 部署完成！"
