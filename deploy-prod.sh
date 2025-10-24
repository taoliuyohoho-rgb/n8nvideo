#!/bin/bash

# 生产环境部署脚本
set -e

echo "🚀 开始部署到生产环境..."

# 检查环境变量
if [ ! -f ".env.production" ]; then
    echo "❌ 请先配置 .env.production 文件"
    exit 1
fi

# 停止现有服务
echo "停止现有服务..."
docker-compose -f docker-compose.prod.yml down || true

# 构建新镜像
echo "构建 Docker 镜像..."
docker build -t n8nvideo-app:latest .

# 启动服务
echo "启动生产服务..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 检查服务状态
echo "检查服务状态..."
docker-compose -f docker-compose.prod.yml ps

# 健康检查
echo "执行健康检查..."
for i in {1..5}; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ 服务启动成功！"
        echo "🌐 访问地址: http://localhost:3000"
        echo "📊 管理后台: http://localhost:3000/admin"
        echo "⚙️ 排序调参: http://localhost:3000/admin/ranking-tuning"
        echo "📈 效果监控: http://localhost:3000/admin/ranking-tuning/monitoring"
        exit 0
    else
        echo "等待服务启动... ($i/5)"
        sleep 5
    fi
done

echo "❌ 服务启动失败，请检查日志"
docker-compose -f docker-compose.prod.yml logs app
exit 1
