#!/bin/bash

# ==============================================
# 部署前安全检查脚本
# ==============================================

set -e

echo "🔍 开始部署前安全检查..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# 检查函数
check_pass() {
  echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
  echo -e "${RED}✗${NC} $1"
  ((ERRORS++))
}

check_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
  ((WARNINGS++))
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. 检查敏感文件是否被忽略"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查 .gitignore
if [ -f ".gitignore" ]; then
  if grep -q "^\.env$" .gitignore && grep -q "^credentials/" .gitignore && grep -q "^\*\.db$" .gitignore; then
    check_pass ".gitignore 配置正确"
  else
    check_fail ".gitignore 缺少必要的忽略规则"
    echo "   请确保包含: .env, credentials/, *.db"
  fi
else
  check_fail ".gitignore 文件不存在"
fi

# 检查是否有 .env 文件被追踪
if git ls-files | grep -q "\.env$"; then
  check_fail ".env 文件已被 Git 追踪！请立即移除"
  echo "   运行: git rm --cached .env"
else
  check_pass ".env 文件未被追踪"
fi

# 检查 credentials 文件夹
if git ls-files | grep -q "^credentials/"; then
  check_fail "credentials/ 文件夹中有文件被追踪！"
  echo "   运行: git rm --cached -r credentials/"
else
  check_pass "credentials/ 文件夹未被追踪"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. 检查硬编码的敏感信息"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查硬编码密码
if grep -r "admin@126.com\|dongnanyaqifei" app/api --include="*.ts" --include="*.tsx" > /dev/null 2>&1; then
  check_fail "发现硬编码的管理员凭证！"
  echo "   位置: app/api/auth/login/route.ts"
  echo "   请修复后再部署"
else
  check_pass "未发现硬编码凭证"
fi

# 检查是否有 API Key 泄露
if grep -rE "(sk-[a-zA-Z0-9]{32,}|AIza[a-zA-Z0-9]{35})" app lib src --include="*.ts" --include="*.tsx" --include="*.js" > /dev/null 2>&1; then
  check_warn "可能发现硬编码的 API Key"
  echo "   请手动检查并确保使用环境变量"
else
  check_pass "未发现硬编码的 API Key"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. 检查环境变量配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查是否有环境变量模板
if [ -f ".env.example" ] || [ -f ".env.production.template" ]; then
  check_pass "环境变量模板存在"
else
  check_warn "缺少环境变量模板文件"
  echo "   建议创建 .env.production.template"
fi

# 检查 .env.local 是否包含生产环境配置
if [ -f ".env.local" ]; then
  if grep -q "NODE_ENV=production" .env.local; then
    check_warn ".env.local 包含生产环境配置"
    echo "   生产环境应使用云平台的环境变量功能"
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. 检查数据库配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查 Prisma schema
if [ -f "prisma/schema.prisma" ]; then
  if grep -q 'provider = "sqlite"' prisma/schema.prisma; then
    check_warn "数据库仍使用 SQLite"
    echo "   生产环境建议使用 PostgreSQL 或 MySQL"
  else
    check_pass "数据库配置适合生产环境"
  fi
else
  check_fail "未找到 prisma/schema.prisma"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. 检查 Docker 配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "Dockerfile" ]; then
  check_pass "Dockerfile 存在"
  
  if [ -f ".dockerignore" ]; then
    check_pass ".dockerignore 存在"
  else
    check_warn ".dockerignore 不存在"
    echo "   建议创建以减小镜像大小"
  fi
else
  check_warn "Dockerfile 不存在"
  echo "   某些部署平台可能需要 Dockerfile"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. 检查 Next.js 配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "next.config.js" ]; then
  if grep -q "output.*:.*['\"]standalone['\"]" next.config.js; then
    check_pass "Next.js 已配置 standalone 输出"
  else
    check_warn "Next.js 未配置 standalone 输出"
    echo "   Docker 部署建议添加: output: 'standalone'"
  fi
else
  check_fail "next.config.js 不存在"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. 检查依赖安全性"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v npm &> /dev/null; then
  echo "运行 npm audit..."
  if npm audit --audit-level=high > /dev/null 2>&1; then
    check_pass "未发现高危漏洞"
  else
    check_warn "发现依赖包安全问题"
    echo "   运行 'npm audit' 查看详情"
  fi
else
  check_warn "npm 未安装，跳过依赖检查"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "检查完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}❌ 发现 $ERRORS 个错误，请修复后再部署！${NC}"
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  发现 $WARNINGS 个警告，建议修复${NC}"
  echo ""
  echo "是否继续部署？ (y/N)"
  read -r response
  if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "部署已取消"
    exit 1
  fi
else
  echo -e "${GREEN}✅ 所有检查通过，可以安全部署！${NC}"
fi

echo ""
echo "下一步："
echo "  1. 确保云平台已配置所有环境变量"
echo "  2. 运行 'git push' 触发部署"
echo "  3. 部署后运行数据库迁移"
echo ""

