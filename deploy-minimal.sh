#!/bin/bash

echo "🚀 开始最小化部署..."

# 创建最小部署目录
DEPLOY_DIR="deploy-minimal"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

echo "📦 复制核心文件..."

# 复制必要的配置文件
cp package.json $DEPLOY_DIR/
cp package-lock.json $DEPLOY_DIR/
cp next.config.js $DEPLOY_DIR/
cp tsconfig.json $DEPLOY_DIR/
cp tailwind.config.js $DEPLOY_DIR/
cp postcss.config.js $DEPLOY_DIR/
cp next-env.d.ts $DEPLOY_DIR/

# 复制Prisma配置
mkdir -p $DEPLOY_DIR/prisma
cp prisma/schema.prisma $DEPLOY_DIR/prisma/

# 复制应用代码（只复制必要的）
cp -r app $DEPLOY_DIR/
cp -r components $DEPLOY_DIR/
cp -r lib $DEPLOY_DIR/

# 复制简化的Dockerfile
cat > $DEPLOY_DIR/Dockerfile << 'EOF'
# 使用官方 Node.js 18 镜像作为基础镜像
FROM node:18-alpine AS base

# 安装依赖阶段
FROM base AS deps
WORKDIR /app

# 安装必要的系统依赖
RUN apk add --no-cache libc6-compat openssl

# 复制 package.json 和 package-lock.json
COPY package*.json ./
# 使用 npm ci 而不是 npm install，更快且更可靠
RUN npm ci --only=production --frozen-lockfile

# 构建阶段
FROM base AS builder
WORKDIR /app

# 安装必要的系统依赖
RUN apk add --no-cache libc6-compat openssl

COPY package*.json ./
# 安装所有依赖（包括devDependencies用于构建）
RUN npm ci --frozen-lockfile

# 复制源代码
COPY . .

# 生成 Prisma 客户端
RUN npx prisma generate

# 构建应用
RUN npm run build

# 生产阶段 - 使用更小的基础镜像
FROM node:18-alpine AS runner
WORKDIR /app

# 安装必要的系统依赖
RUN apk add --no-cache libc6-compat openssl curl

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
RUN mkdir -p ./public
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 复制 Prisma 相关文件
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# 暴露端口
EXPOSE 8080

# 切换到非 root 用户
USER nextjs

# 启动应用
CMD ["node", "server.js"]
EOF

echo "📊 检查部署包大小..."
du -sh $DEPLOY_DIR

echo "✅ 最小部署包已创建在 $DEPLOY_DIR 目录"
echo "💡 现在可以构建和部署："
echo "   cd $DEPLOY_DIR"
echo "   docker build --platform linux/amd64 -t gcr.io/ecommerce-475403/n8nvideo ."
echo "   docker push gcr.io/ecommerce-475403/n8nvideo"
echo "   gcloud run deploy n8nvideo --image gcr.io/ecommerce-475403/n8nvideo --platform managed --region asia-southeast1 --allow-unauthenticated --min-instances 0 --max-instances 10 --cpu 1 --memory 512Mi --port 8080 --project ecommerce-475403"
