# 🌐 云端部署完整指南

## 📋 部署包内容

```
deploy-temp/
├── 📁 app/                    # Next.js应用代码
├── 📁 components/             # React组件
├── 📁 lib/                    # 工具库
├── 📁 prisma/                 # 数据库配置
├── 📁 src/                    # 源代码
├── 🐳 Dockerfile.ultra-minimal # 优化的Dockerfile
├── 🐳 docker-compose.prod.yml  # 生产环境配置
├── 🚀 deploy.sh               # 一键部署脚本
├── 📖 README-DEPLOYMENT.md    # 详细部署文档
└── 📦 其他配置文件...
```

**总大小**: 1.5MB (从697MB优化而来，减少99.8%)

## 🚀 三种部署方式

### 方式1: 一键部署（推荐）

```bash
# 在云端服务器上运行
./deploy.sh
```

### 方式2: Docker Compose（生产环境推荐）

```bash
# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 检查状态
docker-compose -f docker-compose.prod.yml ps
```

### 方式3: 手动Docker部署

```bash
# 构建镜像
docker build -f Dockerfile.ultra-minimal -t n8nvideo .

# 运行容器
docker run -d -p 3000:3000 --name n8nvideo n8nvideo
```

## 🔧 环境配置

### 必需配置

在 `docker-compose.prod.yml` 中设置：

```yaml
environment:
  - DATABASE_URL=file:./dev.db
  - OPENAI_API_KEY=your_openai_key
  - GOOGLE_API_KEY=your_google_key
```

### 数据库选择

- **开发/测试**: SQLite (`file:./dev.db`)
- **生产环境**: PostgreSQL/MySQL

## 📊 性能指标

- **Docker镜像大小**: 335MB
- **内存使用**: 建议512MB+
- **CPU**: 建议1核心+
- **存储**: 建议1GB+

## 🌐 访问地址

- **主页**: http://your-server:3000
- **管理后台**: http://your-server:3000/admin
- **API健康检查**: http://your-server:3000/api/health

## 🔍 监控命令

```bash
# 检查服务状态
curl http://localhost:3000/api/health

# 查看容器日志
docker logs n8nvideo

# 查看资源使用
docker stats n8nvideo
```

## 🚨 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 检查端口
   netstat -tlnp | grep 3000
   # 使用其他端口
   docker run -d -p 3001:3000 n8nvideo
   ```

2. **内存不足**
   ```bash
   # 增加内存限制
   docker run -d -p 3000:3000 --memory=1g n8nvideo
   ```

3. **数据库连接失败**
   ```bash
   # 重新初始化数据库
   docker exec n8nvideo npx prisma db push
   ```

## 📝 更新应用

```bash
# 1. 停止服务
docker-compose -f docker-compose.prod.yml down

# 2. 更新代码
git pull origin main

# 3. 重新构建
docker-compose -f docker-compose.prod.yml build

# 4. 启动服务
docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 安全建议

1. **使用HTTPS**: 配置SSL证书
2. **防火墙**: 只开放必要端口
3. **环境变量**: 保护敏感信息
4. **定期更新**: 保持系统更新

## 📞 支持

遇到问题请检查：
1. Docker环境是否正确
2. 端口是否被占用
3. 环境变量是否正确
4. 查看容器日志

---

**🎉 部署完成！你的N8N Video AI应用已经可以在云端运行了！**
