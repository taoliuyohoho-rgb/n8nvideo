#!/bin/bash

# 清理冗余文件脚本
# 运行前已经创建了备份点：v1.0-before-refactor

echo "================================"
echo "开始清理冗余文件..."
echo "================================"
echo ""

# 确认
echo "⚠️  即将删除以下内容："
echo "  - deploy-minimal/, deploy-simple/, deploy-temp/ (约12MB)"
echo "  - test-*.html, test-*.js 文件"
echo "  - 备份文件 (.bak, .backup)"
echo "  - .npm-cache/ 目录 (9.5MB)"
echo "  - 重复的部署脚本"
echo "  - 构建缓存文件"
echo ""
echo "✅ 安全回滚点已创建：v1.0-before-refactor"
echo ""

read -p "确认删除吗？(输入 yes 继续): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ 已取消"
    exit 0
fi

echo ""
echo "开始清理..."
echo ""

# 删除计数
deleted_count=0

# 1. 删除冗余部署目录
echo "📁 清理部署目录..."
for dir in deploy-minimal deploy-simple deploy-temp; do
    if [ -d "$dir" ]; then
        echo "  删除: $dir/"
        rm -rf "$dir"
        ((deleted_count++))
    fi
done

# 2. 删除测试 HTML 文件
echo ""
echo "🧪 清理测试文件..."
for file in test-*.html; do
    if [ -f "$file" ]; then
        echo "  删除: $file"
        rm -f "$file"
        ((deleted_count++))
    fi
done

# 3. 删除测试 JS 文件（排除 scripts/ 目录）
for file in test-*.js; do
    if [ -f "$file" ]; then
        echo "  删除: $file"
        rm -f "$file"
        ((deleted_count++))
    fi
done

# 4. 删除备份文件
echo ""
echo "💾 清理备份文件..."
find . -type f \( -name "*.bak" -o -name "*.backup" \) -not -path "./node_modules/*" | while read file; do
    echo "  删除: $file"
    rm -f "$file"
    ((deleted_count++))
done

# 5. 删除 npm 缓存
echo ""
echo "📦 清理 npm 缓存..."
if [ -d ".npm-cache" ]; then
    echo "  删除: .npm-cache/"
    rm -rf .npm-cache
    ((deleted_count++))
fi

# 6. 删除重复的部署脚本（保留 deploy.sh）
echo ""
echo "🚀 清理重复部署脚本..."
for file in deploy-cloud.sh deploy-prod.sh deploy-production.sh deploy-to-cloud.sh deploy-optimized.sh deploy-minimal.sh deploy-simple.sh; do
    if [ -f "$file" ]; then
        echo "  删除: $file"
        rm -f "$file"
        ((deleted_count++))
    fi
done

# 7. 删除构建缓存
echo ""
echo "🔨 清理构建缓存..."
if [ -f "tsconfig.tsbuildinfo" ]; then
    echo "  删除: tsconfig.tsbuildinfo"
    rm -f tsconfig.tsbuildinfo
    ((deleted_count++))
fi

# 8. 删除临时调试文件
echo ""
echo "🐛 清理调试文件..."
for file in setup-admin.html create-admin-user.js; do
    if [ -f "$file" ]; then
        echo "  删除: $file"
        rm -f "$file"
        ((deleted_count++))
    fi
done

echo ""
echo "================================"
echo "✅ 清理完成！"
echo "================================"
echo ""
echo "统计："
echo "  - 删除项目数: $deleted_count"
echo ""

# 显示清理后的大小
echo "当前项目大小（不含 node_modules）："
du -sh --exclude=node_modules . 2>/dev/null || du -sh . | grep -v node_modules

echo ""
echo "💡 提示："
echo "  - 如需回滚: git reset --hard v1.0-before-refactor"
echo "  - 查看变更: git status"
echo ""

