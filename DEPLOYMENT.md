# 🚀 部署指南

本指南将帮助您部署 AI 视频生成工具到生产环境。

## 📋 部署前准备

### 1. 环境要求
- Node.js 18+
- Docker (可选)
- Google Cloud 账户
- 域名 (生产环境)

### 2. 环境变量配置
复制环境变量模板并配置：
```bash
cp env.production .env.production
```

配置以下关键变量：
- `DATABASE_URL`: 数据库连接字符串
- `GOOGLE_APPLICATION_CREDENTIALS`: Google 服务账户密钥文件路径
- `GOOGLE_SHEETS_ID`: Google Sheets ID
- `OPENAI_API_KEY`: OpenAI API 密钥
- `NEXTAUTH_SECRET`: 认证密钥
- `NEXTAUTH_URL`: 应用访问地址

## 🐳 Docker 部署 (推荐)

### 1. 构建和启动
```bash
# 构建镜像
docker build -t n8n-video-ai .

# 启动服务
docker-compose up -d
```

### 2. 查看日志
```bash
docker-compose logs -f app
```

### 3. 停止服务
```bash
docker-compose down
```

## 💻 本地部署

### 1. 开发环境
```bash
# 安装依赖
npm install

# 初始化数据库
npx prisma generate
npx prisma db push

# 启动开发服务器
npm run dev
```

### 2. 生产环境
```bash
# 安装生产依赖
npm ci --only=production

# 构建应用
npm run build

# 启动应用
npm start
```

## 🚀 一键部署

使用提供的部署脚本：

```bash
# 本地开发
./deploy.sh local

# Docker 部署
./deploy.sh docker

# 生产环境
./deploy.sh production
```

## 🔧 配置说明

### 数据库配置
- 开发环境：SQLite (`file:./dev.db`)
- 生产环境：PostgreSQL 或 MySQL

### Google Cloud 配置
1. 创建 Google Cloud 项目
2. 启用 Google Sheets API
3. 创建服务账户并下载密钥文件
4. 将服务账户邮箱添加到 Google Sheet 的共享权限

### 域名和 SSL
- 配置域名解析
- 设置 SSL 证书 (Let's Encrypt 推荐)
- 更新 `NEXTAUTH_URL` 环境变量

## 📊 监控和维护

### 健康检查
访问 `/api/health` 端点检查应用状态：
```bash
curl http://localhost:3000/api/health
```

### 日志管理
```bash
# Docker 日志
docker-compose logs -f

# 应用日志
tail -f logs/app.log
```

### 数据库备份
```bash
# SQLite 备份
cp prisma/prod.db prisma/backup-$(date +%Y%m%d).db

# PostgreSQL 备份
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

## 🔒 安全配置

### 1. 环境变量安全
- 使用强密码和密钥
- 定期轮换 API 密钥
- 不要在代码中硬编码敏感信息

### 2. 网络安全
- 配置防火墙规则
- 使用 HTTPS
- 设置适当的 CORS 策略

### 3. 数据安全
- 定期备份数据库
- 加密敏感数据
- 实施访问控制

## 🚨 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查数据库文件权限
   ls -la prisma/
   
   # 重新初始化数据库
   npx prisma db push
   ```

2. **Google Sheets API 错误**
   - 检查服务账户密钥文件
   - 确认 Google Sheets API 已启用
   - 验证共享权限设置

3. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :3000
   
   # 修改端口
   PORT=3001 npm start
   ```

### 性能优化

1. **数据库优化**
   - 添加索引
   - 优化查询
   - 定期清理数据

2. **应用优化**
   - 启用缓存
   - 压缩静态资源
   - 使用 CDN

## 📞 技术支持

如遇到部署问题，请检查：
1. 环境变量配置
2. 依赖安装
3. 数据库连接
4. 网络连接
5. 日志文件

---

🎉 **部署完成！** 您的 AI 视频生成工具现在已经成功部署并运行。
