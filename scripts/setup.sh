#!/bin/bash

echo "🚀 开始设置 AI 视频生成工具..."

# 检查 Node.js 版本
echo "📋 检查环境..."
if ! command -v node &> /dev/null; then
    echo "❌ 请先安装 Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ 需要 Node.js 18+，当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js 版本检查通过: $(node -v)"

# 安装依赖
echo "📦 安装依赖包..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "✅ 依赖安装完成"

# 生成 Prisma 客户端
echo "🗄️ 设置数据库..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Prisma 客户端生成失败"
    exit 1
fi

# 推送数据库结构
npx prisma db push

if [ $? -ne 0 ]; then
    echo "❌ 数据库结构推送失败"
    exit 1
fi

# 运行种子数据
echo "🌱 初始化数据..."
npx tsx prisma/seed.ts

if [ $? -ne 0 ]; then
    echo "❌ 种子数据初始化失败"
    exit 1
fi

echo "✅ 数据库设置完成"

# 创建环境变量文件
if [ ! -f .env.local ]; then
    echo "📝 创建环境变量文件..."
    cat > .env.local << EOF
# 数据库配置
DATABASE_URL="file:./dev.db"

# OpenAI API (可选，用于高级AI功能)
# OPENAI_API_KEY="your-openai-api-key"

# 其他配置
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
EOF
    echo "✅ 环境变量文件已创建"
else
    echo "✅ 环境变量文件已存在"
fi

echo ""
echo "🎉 设置完成！"
echo ""
echo "📋 下一步操作："
echo "1. 运行 'npm run dev' 启动开发服务器"
echo "2. 访问 http://localhost:3000 查看应用"
echo "3. 访问 http://localhost:3000/admin 进入管理控制台"
echo ""
echo "🔧 可用命令："
echo "- npm run dev: 启动开发服务器"
echo "- npm run build: 构建生产版本"
echo "- npm run db:generate: 生成 Prisma 客户端"
echo "- npm run db:push: 推送数据库结构"
echo "- npm run db:seed: 运行种子数据"
echo ""
echo "📚 查看 README.md 了解更多信息"
