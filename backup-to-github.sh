#!/bin/bash

# 备份到 GitHub 脚本
# 用于推送代码和回滚点标签

echo "================================"
echo "正在推送到 GitHub..."
echo "================================"

# 推送代码
echo ""
echo "步骤 1/2: 推送代码到 master 分支..."
git push origin master

if [ $? -eq 0 ]; then
    echo "✅ 代码推送成功！"
else
    echo "❌ 代码推送失败，请检查网络和认证"
    exit 1
fi

# 推送标签
echo ""
echo "步骤 2/2: 推送回滚点标签..."
git push origin v1.0-before-refactor

if [ $? -eq 0 ]; then
    echo "✅ 标签推送成功！"
else
    echo "❌ 标签推送失败"
    exit 1
fi

echo ""
echo "================================"
echo "✅ 备份完成！"
echo "================================"
echo ""
echo "回滚点信息："
echo "  - 提交: $(git rev-parse HEAD)"
echo "  - 标签: v1.0-before-refactor"
echo "  - 分支: master"
echo ""
echo "如需回滚到此点："
echo "  git reset --hard v1.0-before-refactor"
echo ""

