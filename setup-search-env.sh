#!/bin/bash

# 设置 Tavily 搜索服务环境变量脚本
# 使用方法: ./setup-search-env.sh

echo "🔧 设置 Tavily 搜索服务环境变量..."

# 检查 .env.local 文件是否存在
if [ ! -f .env.local ]; then
    echo "📝 创建 .env.local 文件..."
    touch .env.local
else
    echo "📝 更新 .env.local 文件..."
fi

# 备份现有配置
cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)

# 添加或更新搜索服务配置
echo "" >> .env.local
echo "# Search Service Configuration" >> .env.local
echo "SEARCH_PROVIDER=tavily" >> .env.local
echo "TAVILY_API_KEY=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" >> .env.local

echo "✅ 环境变量已设置:"
echo "   SEARCH_PROVIDER=tavily"
echo "   TAVILY_API_KEY=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"

echo ""
echo "🔄 重启开发服务器..."

# 停止现有进程（如果有）
pkill -f "next dev" || true
pkill -f "npm run dev" || true

# 等待进程完全停止
sleep 2

# 启动开发服务器
echo "🚀 启动开发服务器..."
npm run dev

echo ""
echo "✨ 完成！现在商品分析中的 AI 搜索将使用真实的 Tavily 搜索结果。"
echo "📝 备份文件: .env.local.backup.*"
