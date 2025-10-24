#!/bin/bash

echo "🚀 启动 AI 视频生成工具..."

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    npm install
fi

# 检查数据库是否存在
if [ ! -f "prisma/dev.db" ]; then
    echo "🗄️ 初始化数据库..."
    npx prisma db push
    npx tsx prisma/seed.ts
fi

# 启动开发服务器
echo "🌐 启动开发服务器..."
npm run dev
