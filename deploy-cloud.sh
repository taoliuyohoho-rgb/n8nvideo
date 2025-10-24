#!/bin/bash

# 云端部署脚本
# 使用方法: ./deploy-cloud.sh [gcp|docker|local]

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_ID=${GCP_PROJECT_ID:-"your-project-id"}
SERVICE_NAME="n8n-video-ai"
REGION="asia-east1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

# 检查参数
DEPLOY_TYPE=${1:-"gcp"}

echo -e "${GREEN}🚀 开始部署 n8n-video-ai 到云端...${NC}"

# 检查必要工具
check_requirements() {
    echo -e "${YELLOW}📋 检查部署要求...${NC}"
    
    if [ "$DEPLOY_TYPE" = "gcp" ]; then
        if ! command -v gcloud &> /dev/null; then
            echo -e "${RED}❌ 请安装 Google Cloud CLI${NC}"
            echo "安装命令: curl https://sdk.cloud.google.com | bash"
            exit 1
        fi
        
        if ! command -v docker &> /dev/null; then
            echo -e "${RED}❌ 请安装 Docker${NC}"
            exit 1
        fi
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ 请安装 Docker${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 所有要求已满足${NC}"
}

# 构建Docker镜像
build_image() {
    echo -e "${YELLOW}🔨 构建Docker镜像...${NC}"
    
    # 清理旧的镜像
    docker rmi $IMAGE_NAME:latest 2>/dev/null || true
    
    # 构建新镜像
    docker build -t $IMAGE_NAME:latest .
    
    echo -e "${GREEN}✅ Docker镜像构建完成${NC}"
}

# 部署到Google Cloud Run
deploy_gcp() {
    echo -e "${YELLOW}☁️  部署到Google Cloud Run...${NC}"
    
    # 检查认证
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        echo -e "${YELLOW}🔐 请先登录Google Cloud${NC}"
        gcloud auth login
    fi
    
    # 设置项目
    gcloud config set project $PROJECT_ID
    
    # 启用必要API
    gcloud services enable run.googleapis.com
    gcloud services enable cloudbuild.googleapis.com
    
    # 构建并推送镜像
    echo -e "${YELLOW}📦 构建并推送镜像到Container Registry...${NC}"
    gcloud builds submit --tag $IMAGE_NAME .
    
    # 部署到Cloud Run
    echo -e "${YELLOW}🚀 部署到Cloud Run...${NC}"
    gcloud run deploy $SERVICE_NAME \
        --image $IMAGE_NAME \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --port 3000 \
        --memory 1Gi \
        --cpu 1 \
        --max-instances 10 \
        --min-instances 0 \
        --timeout 300
    
    # 获取服务URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')
    echo -e "${GREEN}🎉 部署成功！${NC}"
    echo -e "${GREEN}服务地址: $SERVICE_URL${NC}"
}

# 本地Docker运行
deploy_docker() {
    echo -e "${YELLOW}🐳 使用Docker本地运行...${NC}"
    
    # 停止旧容器
    docker stop $SERVICE_NAME 2>/dev/null || true
    docker rm $SERVICE_NAME 2>/dev/null || true
    
    # 运行新容器
    docker run -d \
        --name $SERVICE_NAME \
        -p 3000:3000 \
        -e NODE_ENV=production \
        $IMAGE_NAME:latest
    
    echo -e "${GREEN}🎉 本地Docker运行成功！${NC}"
    echo -e "${GREEN}访问地址: http://localhost:3000${NC}"
}

# 本地直接运行
deploy_local() {
    echo -e "${YELLOW}💻 本地直接运行...${NC}"
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ 请安装Node.js 18+${NC}"
        exit 1
    fi
    
    # 安装依赖
    echo -e "${YELLOW}📦 安装依赖...${NC}"
    npm ci
    
    # 构建应用
    echo -e "${YELLOW}🔨 构建应用...${NC}"
    npm run build
    
    # 启动应用
    echo -e "${YELLOW}🚀 启动应用...${NC}"
    npm start
}

# 主函数
main() {
    check_requirements
    
    case $DEPLOY_TYPE in
        "gcp")
            build_image
            deploy_gcp
            ;;
        "docker")
            build_image
            deploy_docker
            ;;
        "local")
            deploy_local
            ;;
        *)
            echo -e "${RED}❌ 无效的部署类型: $DEPLOY_TYPE${NC}"
            echo "使用方法: $0 [gcp|docker|local]"
            exit 1
            ;;
    esac
}

# 显示帮助信息
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "n8n-video-ai 部署脚本"
    echo ""
    echo "使用方法:"
    echo "  $0 gcp     - 部署到Google Cloud Run"
    echo "  $0 docker  - 本地Docker运行"
    echo "  $0 local   - 本地直接运行"
    echo ""
    echo "环境变量:"
    echo "  GCP_PROJECT_ID - Google Cloud项目ID"
    echo ""
    echo "示例:"
    echo "  GCP_PROJECT_ID=my-project $0 gcp"
    exit 0
fi

# 运行主函数
main
