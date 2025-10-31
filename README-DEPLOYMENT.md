# 快速部署指南

> 完整文档请查看 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 🚀 快速开始

### 1. 部署前检查

```bash
# 运行安全检查
chmod +x scripts/deploy-check.sh
./scripts/deploy-check.sh
```

### 2. 准备环境变量

```bash
# 复制环境变量模板
cp .env.production.template .env.production

# 编辑并填写真实值
nano .env.production
```

**必须配置的变量：**
- `DATABASE_URL` - PostgreSQL 连接字符串
- `NEXTAUTH_SECRET` - 使用 `openssl rand -base64 32` 生成
- `ADMIN_EMAIL` 和 `ADMIN_PASSWORD_HASH` - 管理员账号
- AI API Keys（至少一个）：
  - `OPENAI_API_KEY`
  - `GOOGLE_AI_API_KEY`
  - `DOUBAO_API_KEY`
  - `DEEPSEEK_API_KEY`

### 3. 生成密码哈希

```bash
# 生成管理员密码哈希
node scripts/hash-password.js "your-secure-password"

# 将输出的哈希值设置到 ADMIN_PASSWORD_HASH
```

### 4. 选择部署平台

#### 选项 A: Railway（推荐）⭐

```bash
# 1. 安装 Railway CLI
npm install -g @railway/cli

# 2. 登录
railway login

# 3. 创建项目
railway init

# 4. 添加 PostgreSQL
# 在 Railway Dashboard: New → Database → PostgreSQL

# 5. 配置环境变量
# 在 Railway Dashboard 添加所有环境变量

# 6. 部署
git push origin master
# 或使用 CLI
railway up

# 7. 运行数据库迁移
railway run npx prisma migrate deploy
railway run npx prisma db seed
```

#### 选项 B: Vercel

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 部署
vercel --prod

# 3. 在 Vercel Dashboard 配置环境变量
# 4. 配置外部 PostgreSQL 数据库（推荐 Supabase 或 Neon）
```

#### 选项 C: Docker

```bash
# 1. 构建镜像
docker build -t n8nvideo:latest .

# 2. 测试
docker run -p 3000:3000 --env-file .env.production n8nvideo:latest

# 3. 推送到容器仓库并在云平台部署
```

### 5. 验证部署

```bash
# 检查健康状态
curl https://your-app.com/api/health

# 测试登录
curl -X POST https://your-app.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email","password":"your-password"}'
```

## 📋 部署检查清单

使用 [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) 确保所有步骤完成。

## ⚠️ 重要安全提醒

1. **不要提交敏感文件到 Git**
   - `.env` 文件
   - `credentials/` 文件夹
   - 数据库文件 `*.db`

2. **修复硬编码凭证**
   - 检查 `app/api/auth/login/route.ts`
   - 移除硬编码的密码

3. **使用强密钥**
   - `NEXTAUTH_SECRET` 至少 32 字符
   - 管理员密码使用 bcrypt 加密

## 🆘 遇到问题？

### 常见问题

**Q: SQLite 在生产环境不工作？**
- A: 项目已统一为 PostgreSQL，请配置 `DATABASE_URL` 并运行 `prisma migrate deploy`

**Q: Google Service Account 如何配置？**
- A: 将 JSON 转为单行字符串，设置到 `GOOGLE_SERVICE_ACCOUNT_JSON` 环境变量

**Q: API 返回 500 错误？**
- A: 检查环境变量、数据库连接、查看日志

### 获取帮助

- 查看完整文档：[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- 运行诊断：`./scripts/deploy-check.sh`
- 查看日志：`railway logs` 或云平台控制台

## 📚 相关文档

- [完整部署指南](./DEPLOYMENT_GUIDE.md) - 详细步骤和最佳实践
- [部署检查清单](./DEPLOYMENT_CHECKLIST.md) - 逐项确认
- [项目架构](./architecture.md) - 系统设计

## 🎯 推荐部署方案

| 平台 | 难度 | 成本 | 推荐场景 |
|------|------|------|----------|
| **Railway** | ⭐ 简单 | $5-20/月 | **中小型应用（推荐）** |
| Vercel | ⭐ 简单 | $0-20/月 | 轻量级应用 |
| Docker + Cloud Run | ⭐⭐⭐ 复杂 | 按用量 | 大型应用 |

---

**最后更新**: 2025-10-25

