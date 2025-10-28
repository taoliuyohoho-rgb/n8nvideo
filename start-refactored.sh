#!/bin/bash

# 架构重构后的启动脚本

set -e

echo "🚀 启动重构后的 n8nvideo 项目..."
echo ""

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
  echo "📦 安装依赖..."
  npm install
  echo "✅ 依赖安装完成"
  echo ""
fi

# 生成 Prisma Client
echo "🔧 生成 Prisma Client..."
npm run db:generate
echo "✅ Prisma Client 生成完成"
echo ""

# 推送数据库结构
echo "🗄️  同步数据库结构..."
npm run db:push
echo "✅ 数据库结构同步完成"
echo ""

# 提示用户
echo "✨ 准备工作完成！"
echo ""
echo "请在不同的终端窗口运行以下命令："
echo ""
echo "终端 1 (Web 服务):"
echo "  npm run dev"
echo ""
echo "终端 2 (Worker):"
echo "  npm run worker:video"
echo ""
echo "然后访问:"
echo "  - 用户工作台: http://localhost:3000/dashboard"
echo "  - 管理后台: http://localhost:3000/admin"
echo "  - 任务监控: http://localhost:3000/admin/tasks"
echo ""
echo "📚 更多信息请查看 ARCHITECTURE_REFACTORING_GUIDE.md"
echo ""




