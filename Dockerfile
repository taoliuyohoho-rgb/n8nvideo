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
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 复制 Prisma 相关文件
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 暴露端口
EXPOSE 3000

# 切换到非 root 用户
USER nextjs

# 启动应用
CMD ["node", "server.js"]
