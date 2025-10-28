# 🚀 n8n Video AI - 完整部署指南

## 📌 目录
1. [专案架构分析](#专案架构分析)
2. [部署前准备](#部署前准备)
3. [环境变量配置](#环境变量配置)
4. [数据库迁移](#数据库迁移)
5. [部署方案对比](#部署方案对比)
6. [推荐部署方案](#推荐部署方案)
7. [安全检查清单](#安全检查清单)
8. [常见问题](#常见问题)

---

## 📊 专案架构分析

### 当前架构
```
n8n Video AI (Next.js 14 全栈应用)
├── 前端: Next.js App Router + React + Tailwind
├── 后端: Next.js API Routes (Node.js Serverless)
├── 数据库: SQLite (开发) → PostgreSQL (生产)
├── ORM: Prisma
└── 第三方服务:
    ├── OpenAI API
    ├── Google Gemini API
    ├── 豆包 (Doubao) API
    ├── DeepSeek API
    └── Google Sheets API
```

### ⚠️ 关键问题识别

1. **数据库问题**
   - ❌ SQLite 不适合云部署（无持久化、无并发支持）
   - ✅ 需要迁移到 PostgreSQL/MySQL

2. **安全问题**
   - ❌ 硬编码管理员凭证在代码中
   - ✅ API Keys 需要通过环境变量管理

3. **部署兼容性**
   - ✅ 已配置 `output: 'standalone'`（支持 Docker）
   - ❌ Google Service Account JSON 文件需要特殊处理

---

## 🛠 部署前准备

### 1. 代码检查与清理

```bash
# 1. 检查 .gitignore 是否正确
cat .gitignore | grep -E "\.env|credentials|\.db"

# 2. 确保敏感文件不会被提交
git status --ignored

# 3. 删除临时部署文件夹（如果不需要）
rm -rf deploy-temp/ deploy-minimal/ deploy-simple/
```

### 2. 安全修复（必须）

**文件：`app/api/auth/login/route.ts`**

⚠️ **当前硬编码凭证：**
```typescript
// 不安全！
if (email === 'admin@126.com' && password === 'dongnanyaqifei') {
```

**修复方案：**
```typescript
// 使用环境变量
const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH

// 使用 bcrypt 验证
import bcrypt from 'bcryptjs'
const isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH)
```

### 3. 数据库迁移准备

```bash
# 生成当前 SQLite 数据库的备份
cp prisma/dev.db prisma/dev.db.backup

# 导出现有数据（如果有）
npx prisma db push --force-reset
npx prisma db seed
```

---

## 🔐 环境变量配置

### 创建 `.env.production` 模板

创建文件：`.env.production.template`

```bash
# ==============================================
# 🚨 生产环境配置 - 不要直接提交此文件
# ==============================================

# ============ 应用配置 ============
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
PORT=3000

# ============ 数据库配置 ============
# 使用 PostgreSQL (推荐) 或 MySQL
# 格式: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
DATABASE_URL="postgresql://username:password@hostname:5432/n8nvideo_prod?schema=public"

# ============ 认证配置 ============
# 管理员账号（生产环境）
ADMIN_EMAIL="your-admin@example.com"
# 使用 bcrypt 生成密码哈希：node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
ADMIN_PASSWORD_HASH="$2a$10$..."

# NextAuth 配置
NEXTAUTH_SECRET="生成一个强密钥: openssl rand -base64 32"
NEXTAUTH_URL="https://your-domain.com"

# ============ AI 服务配置 ============
# OpenAI
OPENAI_API_KEY="sk-..."
OPENAI_ORG_ID=""  # 可选

# Google Gemini
GOOGLE_AI_API_KEY="..."

# 豆包 (Doubao/火山引擎)
DOUBAO_API_KEY="..."
DOUBAO_ENDPOINT="https://ark.cn-beijing.volces.com/api/v3"

# DeepSeek
DEEPSEEK_API_KEY="sk-..."
DEEPSEEK_BASE_URL="https://api.deepseek.com"

# ============ Google Cloud 配置 ============
# Google Sheets API
GOOGLE_SHEETS_ID="1q_ZqVw4DVRbcAA78ZVndXq4XcFEySNmRoLHiFkllFls"

# Google Service Account (JSON 格式，单行)
# 生成方式：cat credentials/google-service-account.json | jq -c
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'

# 或使用文件路径（Docker 部署）
GOOGLE_APPLICATION_CREDENTIALS="/app/credentials/google-service-account.json"

# Google OAuth 2.0 (可选)
GOOGLE_CLIENT_ID="your-client-id.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-client-secret"
GOOGLE_REDIRECT_URI="https://your-domain.com/api/auth/google/callback"

# ============ 云存储配置 (可选) ============
GOOGLE_CLOUD_PROJECT_ID="your-project-id"
GOOGLE_CLOUD_STORAGE_BUCKET="your-bucket-name"

# ============ 监控与日志 (可选) ============
SENTRY_DSN=""
LOG_LEVEL="info"
```

### 环境变量管理最佳实践

1. **本地开发**：使用 `.env.local`
2. **生产环境**：
   - Vercel: 在项目设置中配置
   - Railway: 使用 Variables 面板
   - Docker: 使用 `.env.production` + Docker secrets

---

## 🗄 数据库迁移

### 从 SQLite 迁移到 PostgreSQL

#### 步骤 1：更新 `prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"  // 改为 postgresql
  url      = env("DATABASE_URL")
}
```

#### 步骤 2：创建迁移

```bash
# 生成迁移文件
npx prisma migrate dev --name init_postgresql

# 生成 Prisma Client
npx prisma generate
```

#### 步骤 3：导出 SQLite 数据（如果需要）

```bash
# 安装 pgloader（macOS）
brew install pgloader

# 转换数据（示例）
pgloader sqlite:./prisma/dev.db postgresql://user:pass@host:5432/dbname
```

或使用 Prisma 脚本迁移：

```typescript
// scripts/migrate-to-postgres.ts
import { PrismaClient as SQLitePrisma } from '@prisma/client'
import { PrismaClient as PostgresPrisma } from '@prisma/client'

const sqliteDb = new SQLitePrisma({
  datasources: { db: { url: 'file:./prisma/dev.db' } }
})

const postgresDb = new PostgresPrisma({
  datasources: { db: { url: process.env.DATABASE_URL } }
})

async function migrate() {
  // 迁移用户
  const users = await sqliteDb.user.findMany()
  await postgresDb.user.createMany({ data: users })
  
  // 迁移其他表...
  console.log('✅ 数据迁移完成')
}

migrate()
```

---

## 🔄 部署方案对比

### 方案 1: Vercel (最简单，有限制) ⭐

**优点：**
- ✅ 一键部署，零配置
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ✅ 自动扩展

**缺点：**
- ❌ Serverless 函数有 10s 超时限制
- ❌ 无法使用文件系统（视频上传受限）
- ❌ 需要外部数据库（Vercel Postgres 或 Supabase）

**适合场景：**
- 轻量级应用
- 不涉及长时间运行的任务
- 不需要大文件上传

### 方案 2: Railway (推荐) ⭐⭐⭐

**优点：**
- ✅ 支持 Docker 完整部署
- ✅ 内置 PostgreSQL
- ✅ 支持文件上传与长时间任务
- ✅ 简单易用，价格合理

**缺点：**
- ⚠️ 免费额度有限（$5/月）

**适合场景：**
- 中小型全栈应用（推荐！）
- 需要数据库和文件存储
- 需要后台任务

### 方案 3: Render (类似 Railway)

**优点/缺点：**
- 类似 Railway，但配置稍复杂

### 方案 4: Docker + Cloud Run (最灵活) ⭐⭐

**优点：**
- ✅ 完全控制
- ✅ 可扩展性强
- ✅ 支持所有功能

**缺点：**
- ⚠️ 配置复杂
- ⚠️ 需要管理基础设施

---

## 🎯 推荐部署方案

### 🚀 方案：Railway + PostgreSQL（推荐）

#### 步骤 1：准备代码

```bash
# 1. 更新数据库配置
# 修改 prisma/schema.prisma 使用 postgresql

# 2. 确保 Dockerfile 正确
# 已有 Dockerfile 可以直接使用

# 3. 创建 .dockerignore
cat > .dockerignore << 'EOF'
node_modules
npm-debug.log
.next
.env
.env.local
credentials/
*.db
*.db-journal
.git
README.md
deploy-*/
EOF
```

#### 步骤 2：Railway 部署

1. **创建 Railway 账号**
   - 访问 https://railway.app
   - 使用 GitHub 登录

2. **创建新项目**
   ```bash
   # 方法 1: 从 GitHub 部署（推荐）
   # 在 Railway 控制台：New Project → Deploy from GitHub Repo
   
   # 方法 2: 使用 Railway CLI
   npm install -g @railway/cli
   railway login
   railway init
   railway up
   ```

3. **添加 PostgreSQL 数据库**
   - 在 Railway 项目中：Add Plugin → PostgreSQL
   - Railway 会自动设置 `DATABASE_URL`

4. **配置环境变量**
   - 在 Railway 项目设置中添加所有环境变量（参考上面的模板）
   - 特别注意：
     ```
     NODE_ENV=production
     NEXT_PUBLIC_APP_URL=https://your-app.railway.app
     DATABASE_URL=(自动生成)
     ADMIN_EMAIL=your-email
     ADMIN_PASSWORD_HASH=your-hash
     OPENAI_API_KEY=sk-...
     GOOGLE_AI_API_KEY=...
     DOUBAO_API_KEY=...
     ```

5. **部署**
   ```bash
   # Railway 会自动检测 Dockerfile 并构建
   # 或推送到 GitHub 触发自动部署
   git push origin master
   ```

6. **运行数据库迁移**
   ```bash
   railway run npx prisma migrate deploy
   railway run npx prisma db seed
   ```

#### 步骤 3：验证部署

```bash
# 检查健康状态
curl https://your-app.railway.app/api/health

# 测试登录
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email","password":"your-password"}'
```

---

## 🔒 安全检查清单

### 部署前必查

- [ ] `.env` 文件已加入 `.gitignore`
- [ ] `credentials/` 文件夹已加入 `.gitignore`
- [ ] 移除所有硬编码的密码和 API Keys
- [ ] 管理员密码使用 bcrypt 加密
- [ ] `NEXTAUTH_SECRET` 使用强随机字符串
- [ ] 所有 AI API Keys 通过环境变量配置
- [ ] Google Service Account JSON 安全存储
- [ ] 数据库连接使用 SSL（生产环境）
- [ ] CORS 配置正确（仅允许自己的域名）
- [ ] Rate limiting 已配置（防止 API 滥用）

### 生产环境检查

- [ ] 数据库定期备份
- [ ] 日志监控已配置
- [ ] 错误追踪（Sentry）已配置
- [ ] HTTPS 已启用
- [ ] 环境变量已正确设置
- [ ] 数据库迁移已运行
- [ ] 测试所有关键功能

---

## 🐳 Docker 部署（可选）

### 本地测试

```bash
# 1. 构建镜像
docker build -t n8nvideo:latest .

# 2. 运行容器（使用 PostgreSQL）
docker run -d \
  --name n8nvideo \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e OPENAI_API_KEY="sk-..." \
  -e NEXTAUTH_SECRET="your-secret" \
  n8nvideo:latest

# 3. 查看日志
docker logs -f n8nvideo

# 4. 进入容器
docker exec -it n8nvideo sh
```

### Docker Compose

创建 `docker-compose.production.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:password@db:5432/n8nvideo
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      GOOGLE_AI_API_KEY: ${GOOGLE_AI_API_KEY}
      DOUBAO_API_KEY: ${DOUBAO_API_KEY}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: n8nvideo
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

运行：

```bash
docker-compose -f docker-compose.production.yml up -d
```

---

## 📝 常见问题

### Q1: Google Service Account JSON 如何在 Railway 中配置？

**方法 1: 环境变量（推荐）**
```bash
# 将 JSON 转为单行字符串
GOOGLE_SERVICE_ACCOUNT_JSON=$(cat credentials/google-service-account.json | jq -c)

# 在 Railway 中设置环境变量
# 然后在代码中使用：
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
```

**方法 2: 文件挂载**
- 使用 Railway 的 Volume 功能（如果支持）

### Q2: SQLite 数据如何迁移到 PostgreSQL？

参考上面的"数据库迁移"章节。

### Q3: 如何生成安全的密码哈希？

```bash
# 使用 Node.js
node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"

# 或创建脚本
cat > scripts/hash-password.js << 'EOF'
const bcrypt = require('bcryptjs');
const password = process.argv[2];
console.log(bcrypt.hashSync(password, 10));
EOF

node scripts/hash-password.js "your-password"
```

### Q4: 部署后 API 返回 500 错误？

检查：
1. 环境变量是否正确配置
2. 数据库连接是否正常
3. Prisma 迁移是否运行
4. 查看应用日志：`railway logs`

### Q5: 文件上传在 Vercel 上不工作？

Vercel Serverless 函数无法持久化文件。需要：
- 使用 S3/Google Cloud Storage
- 或改用 Railway/Render

---

## 🎉 部署成功后

1. **访问应用**
   - URL: `https://your-app.railway.app`
   - 使用配置的管理员账号登录

2. **初始化数据**
   ```bash
   # 运行种子脚本（如果有）
   railway run npm run db:seed
   ```

3. **监控运行状态**
   - Railway Dashboard
   - 查看日志和指标

4. **配置自定义域名（可选）**
   - 在 Railway 项目设置中添加

---

## 📚 相关文档

- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Railway 文档](https://docs.railway.app)
- [Prisma 部署指南](https://www.prisma.io/docs/guides/deployment)
- [Vercel 部署指南](https://vercel.com/docs)

---

**最后更新**: 2025-10-25
**维护者**: AI Video Team

