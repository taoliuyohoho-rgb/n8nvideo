#!/bin/bash

# 云端部署脚本
# 这个脚本会创建部署包并提供部署指令

set -e

echo "🚀 开始准备云端部署..."

# 创建部署包
./deploy-optimized.sh

echo ""
echo "📦 部署包已准备完成！"
echo ""
echo "📋 部署步骤："
echo ""
echo "1️⃣ 上传 deploy-temp 目录到云端服务器"
echo "   - 使用 scp, rsync 或其他工具上传"
echo "   - 例如: scp -r deploy-temp user@server:/path/to/deploy/"
echo ""
echo "2️⃣ 在云端服务器上运行以下命令："
echo ""
echo "   # 进入部署目录"
echo "   cd deploy-temp"
echo ""
echo "   # 构建Docker镜像"
echo "   docker build -t n8nvideo ."
echo ""
echo "   # 运行容器"
echo "   docker run -d -p 3000:3000 --name n8nvideo n8nvideo"
echo ""
echo "   # 或者使用docker-compose（推荐）"
echo "   docker-compose up -d"
echo ""
echo "3️⃣ 检查部署状态："
echo "   docker ps"
echo "   curl http://localhost:3000/api/health"
echo ""
echo "4️⃣ 如果需要停止服务："
echo "   docker stop n8nvideo"
echo "   docker rm n8nvideo"
echo ""
echo "✅ 部署包大小: $(du -sh deploy-temp | cut -f1)"
echo "✅ Docker镜像大小: $(docker images n8nvideo --format "table {{.Size}}" | tail -1)"
echo ""
echo "🎉 准备就绪！可以开始云端部署了！"
