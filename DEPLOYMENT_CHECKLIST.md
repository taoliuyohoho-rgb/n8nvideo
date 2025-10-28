# ✅ 部署检查清单

在部署到生产环境之前，请逐项检查以下内容：

## 📋 部署前（必须完成）

### 1. 代码安全
- [ ] 所有硬编码的密码和 API Key 已移除
- [ ] 管理员凭证使用环境变量配置
- [ ] 密码使用 bcrypt 加密存储
- [ ] 敏感文件已加入 `.gitignore`

### 2. 环境变量
- [ ] 创建 `.env.production` 或在云平台配置环境变量
- [ ] `DATABASE_URL` 已配置（PostgreSQL）
- [ ] `NEXTAUTH_SECRET` 已生成（强随机密钥）
- [ ] `ADMIN_EMAIL` 和 `ADMIN_PASSWORD_HASH` 已配置
- [ ] 所有 AI API Keys 已配置：
  - [ ] `OPENAI_API_KEY`
  - [ ] `GOOGLE_AI_API_KEY`
  - [ ] `DOUBAO_API_KEY`
  - [ ] `DEEPSEEK_API_KEY`
- [ ] Google Service Account 凭证已配置
- [ ] `NEXT_PUBLIC_APP_URL` 已设置为生产域名

### 3. 数据库
- [ ] 数据库从 SQLite 迁移到 PostgreSQL
- [ ] `prisma/schema.prisma` 已更新为 `postgresql`
- [ ] 运行 `npx prisma migrate deploy` 创建表结构
- [ ] 运行 `npx prisma db seed` 初始化数据（如需要）

### 4. 配置文件
- [ ] `next.config.js` 配置 `output: 'standalone'`
- [ ] `.dockerignore` 已创建
- [ ] `Dockerfile` 已测试

### 5. Git 仓库
- [ ] 运行 `git status --ignored` 确认敏感文件未被追踪
- [ ] 如有敏感文件被追踪，运行 `git rm --cached <file>`
- [ ] 提交所有必要的代码变更

---

## 🚀 部署过程

### Railway 部署
- [ ] 在 Railway 创建新项目
- [ ] 连接 GitHub 仓库
- [ ] 添加 PostgreSQL 插件
- [ ] 配置所有环境变量（参考 `.env.production.template`）
- [ ] 触发部署：`git push origin master`
- [ ] 等待构建完成

### Vercel 部署（如使用）
- [ ] 在 Vercel 创建新项目
- [ ] 连接 GitHub 仓库
- [ ] 配置外部 PostgreSQL 数据库
- [ ] 在项目设置中添加环境变量
- [ ] 部署

### Docker 部署（如使用）
- [ ] 构建镜像：`docker build -t n8nvideo:latest .`
- [ ] 测试容器：`docker run --env-file .env.production -p 3000:3000 n8nvideo:latest`
- [ ] 推送到容器仓库
- [ ] 在云平台部署

---

## 🔍 部署后验证

### 1. 健康检查
- [ ] 访问 `https://your-domain.com/api/health` 返回成功
- [ ] 首页可以正常访问
- [ ] 无 CORS 错误

### 2. 功能测试
- [ ] 管理员登录功能正常
- [ ] 数据库连接正常（可以查询数据）
- [ ] AI API 调用正常：
  - [ ] OpenAI API
  - [ ] Gemini API
  - [ ] 豆包 API
  - [ ] DeepSeek API
- [ ] Google Sheets API 连接正常
- [ ] 文件上传功能正常（如适用）

### 3. 性能检查
- [ ] 页面加载时间 < 3 秒
- [ ] API 响应时间正常
- [ ] 没有内存泄漏

### 4. 日志检查
- [ ] 检查应用日志：`railway logs` 或云平台控制台
- [ ] 无严重错误
- [ ] 无未处理的异常

---

## 🔒 安全检查

### 1. 环境变量
- [ ] 环境变量中无明文密码
- [ ] API Keys 未泄露在前端代码中
- [ ] `.env` 文件未提交到 Git

### 2. 网络安全
- [ ] HTTPS 已启用
- [ ] CORS 配置正确（仅允许自己的域名）
- [ ] 敏感 API 端点有认证保护

### 3. 数据库安全
- [ ] 数据库密码强度足够
- [ ] 数据库仅允许应用服务器访问
- [ ] 启用 SSL 连接（如适用）

---

## 📊 监控设置（可选但推荐）

- [ ] 配置错误追踪（Sentry）
- [ ] 配置性能监控
- [ ] 配置日志聚合
- [ ] 配置告警通知（邮件/Slack）

---

## 🔄 后续维护

### 定期任务
- [ ] 定期备份数据库
- [ ] 定期更新依赖包
- [ ] 定期检查安全漏洞：`npm audit`
- [ ] 定期查看日志和错误

### 紧急响应计划
- [ ] 准备回滚方案
- [ ] 记录紧急联系人
- [ ] 准备数据库恢复流程

---

## 📝 部署信息记录

```
部署日期: ______________
部署环境: Railway / Vercel / Docker / 其他: ______________
应用 URL: https://______________________________
数据库: PostgreSQL / MySQL / 其他: ______________
数据库主机: ______________
部署者: ______________

环境变量配置位置:
- [ ] Railway Dashboard
- [ ] Vercel Project Settings
- [ ] .env.production (服务器)
- [ ] 其他: ______________

初始管理员账号:
Email: ______________
密码: (安全保存，不要写在这里)

备注:
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
```

---

## 🆘 遇到问题？

1. 查看 `DEPLOYMENT_GUIDE.md` 中的"常见问题"章节
2. 检查应用日志
3. 运行 `scripts/deploy-check.sh` 进行诊断
4. 查看云平台文档

---

**最后更新**: 2025-10-25

