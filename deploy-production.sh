#!/bin/bash

# ==============================================
# 生产环境部署脚本
# ==============================================
# 
# 用途：自动化部署流程，包含安全检查
# 
# 使用方式：
#   chmod +x deploy-production.sh
#   ./deploy-production.sh [platform]
# 
# 支持的平台：
#   railway  - 部署到 Railway
#   vercel   - 部署到 Vercel
#   docker   - 构建 Docker 镜像
#   check    - 仅运行检查（不部署）
# ==============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取部署平台
PLATFORM=${1:-check}

echo -e "${BLUE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 n8n Video AI - 生产环境部署"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"
echo "目标平台: $PLATFORM"
echo ""

# ============================================================
# 步骤 1: 运行安全检查
# ============================================================

echo -e "${BLUE}[步骤 1/5]${NC} 运行部署前安全检查..."
echo ""

if [ -f "scripts/deploy-check.sh" ]; then
  chmod +x scripts/deploy-check.sh
  if ! bash scripts/deploy-check.sh; then
    echo -e "${RED}❌ 安全检查未通过，部署中止${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠️  警告: 未找到 deploy-check.sh，跳过安全检查${NC}"
fi

echo ""

# 如果只是检查，到此结束
if [ "$PLATFORM" == "check" ]; then
  echo -e "${GREEN}✅ 检查完成！${NC}"
  echo ""
  echo "要部署到生产环境，请运行："
  echo "  ./deploy-production.sh railway"
  echo "  ./deploy-production.sh vercel"
  echo "  ./deploy-production.sh docker"
  exit 0
fi

# ============================================================
# 步骤 2: 确认部署
# ============================================================

echo -e "${BLUE}[步骤 2/5]${NC} 确认部署..."
echo ""
echo -e "${YELLOW}⚠️  您即将部署到生产环境！${NC}"
echo ""
echo "请确认："
echo "  1. 已备份当前生产数据库"
echo "  2. 已在云平台配置所有环境变量"
echo "  3. 已测试所有关键功能"
echo ""
echo -n "确认继续部署？ (yes/no): "
read -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo -e "${RED}部署已取消${NC}"
  exit 0
fi

echo ""

# ============================================================
# 步骤 3: 安装依赖
# ============================================================

echo -e "${BLUE}[步骤 3/5]${NC} 安装依赖..."
echo ""

if [ -f "package-lock.json" ]; then
  npm ci
else
  npm install
fi

echo -e "${GREEN}✓ 依赖安装完成${NC}"
echo ""

# ============================================================
# 步骤 4: 构建项目
# ============================================================

echo -e "${BLUE}[步骤 4/5]${NC} 构建项目..."
echo ""

# 生成 Prisma Client
echo "生成 Prisma Client..."
npx prisma generate

# 构建 Next.js 应用
echo "构建 Next.js 应用..."
npm run build

echo -e "${GREEN}✓ 构建完成${NC}"
echo ""

# ============================================================
# 步骤 5: 部署
# ============================================================

echo -e "${BLUE}[步骤 5/5]${NC} 部署到 $PLATFORM..."
echo ""

case $PLATFORM in
  railway)
    echo "正在部署到 Railway..."
    
    # 检查 Railway CLI
    if ! command -v railway &> /dev/null; then
      echo -e "${RED}❌ Railway CLI 未安装${NC}"
      echo ""
      echo "请先安装 Railway CLI："
      echo "  npm install -g @railway/cli"
      echo ""
      exit 1
    fi
    
    # 登录 Railway
    echo "检查 Railway 登录状态..."
    if ! railway whoami &> /dev/null; then
      echo "请先登录 Railway："
      railway login
    fi
    
    # 部署
    echo "开始部署..."
    railway up
    
    echo ""
    echo -e "${GREEN}✅ 部署到 Railway 成功！${NC}"
    echo ""
    echo "下一步："
    echo "  1. 访问 Railway Dashboard 查看部署状态"
    echo "  2. 运行数据库迁移: railway run npx prisma migrate deploy"
    echo "  3. 运行种子数据: railway run npx prisma db seed"
    echo "  4. 访问应用 URL 测试功能"
    ;;
    
  vercel)
    echo "正在部署到 Vercel..."
    
    # 检查 Vercel CLI
    if ! command -v vercel &> /dev/null; then
      echo -e "${RED}❌ Vercel CLI 未安装${NC}"
      echo ""
      echo "请先安装 Vercel CLI："
      echo "  npm install -g vercel"
      echo ""
      exit 1
    fi
    
    # 部署
    echo "开始部署..."
    vercel --prod
    
    echo ""
    echo -e "${GREEN}✅ 部署到 Vercel 成功！${NC}"
    echo ""
    echo "下一步："
    echo "  1. 在 Vercel Dashboard 中配置环境变量"
    echo "  2. 配置外部 PostgreSQL 数据库"
    echo "  3. 运行数据库迁移"
    echo "  4. 访问应用 URL 测试功能"
    ;;
    
  docker)
    echo "正在构建 Docker 镜像..."
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
      echo -e "${RED}❌ Docker 未安装${NC}"
      exit 1
    fi
    
    # 构建镜像
    IMAGE_NAME="n8nvideo"
    IMAGE_TAG="latest"
    
    echo "构建镜像: $IMAGE_NAME:$IMAGE_TAG"
    docker build -t $IMAGE_NAME:$IMAGE_TAG .
    
    echo ""
    echo -e "${GREEN}✅ Docker 镜像构建成功！${NC}"
    echo ""
    echo "镜像: $IMAGE_NAME:$IMAGE_TAG"
    echo ""
    echo "下一步："
    echo "  1. 测试镜像："
    echo "     docker run -p 3000:3000 --env-file .env.production $IMAGE_NAME:$IMAGE_TAG"
    echo ""
    echo "  2. 推送到容器仓库："
    echo "     docker tag $IMAGE_NAME:$IMAGE_TAG your-registry/$IMAGE_NAME:$IMAGE_TAG"
    echo "     docker push your-registry/$IMAGE_NAME:$IMAGE_TAG"
    echo ""
    echo "  3. 在云平台部署容器"
    ;;
    
  *)
    echo -e "${RED}❌ 不支持的平台: $PLATFORM${NC}"
    echo ""
    echo "支持的平台："
    echo "  railway  - 部署到 Railway"
    echo "  vercel   - 部署到 Vercel"
    echo "  docker   - 构建 Docker 镜像"
    echo "  check    - 仅运行检查（不部署）"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  🎉 部署流程完成！${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

