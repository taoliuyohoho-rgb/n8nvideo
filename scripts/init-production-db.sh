#!/bin/bash

# 生产环境数据库初始化脚本
# 用途：在首次部署后初始化生产数据库（表结构 + 种子数据）

set -e

echo "🚀 开始初始化生产数据库..."

# 检查 DATABASE_URL 环境变量
if [ -z "$DATABASE_URL" ]; then
  echo "❌ 错误: DATABASE_URL 环境变量未设置"
  exit 1
fi

echo "📋 数据库连接: ${DATABASE_URL%%@*}" # 只显示用户名，不显示密码

# 步骤 1: 生成 Prisma Client
echo ""
echo "📦 步骤 1/3: 生成 Prisma Client..."
npx prisma generate

# 步骤 2: 运行数据库迁移（创建表结构）
echo ""
echo "📊 步骤 2/3: 运行数据库迁移..."
npx prisma migrate deploy

# 步骤 3: 初始化种子数据（可选）
echo ""
read -p "是否初始化种子数据（示例商品、人设等）? [y/N] " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🌱 步骤 3/3: 初始化种子数据..."
  npx tsx prisma/seed.ts
  echo "✅ 种子数据初始化完成"
else
  echo "⏭️  跳过种子数据初始化"
fi

echo ""
echo "🎉 数据库初始化完成！"
echo ""
echo "📝 下一步："
echo "1. 访问应用管理后台创建真实数据"
echo "2. 或运行 'npm run db:seed' 初始化示例数据"

