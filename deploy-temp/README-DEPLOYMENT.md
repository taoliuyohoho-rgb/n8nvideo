# N8N Video AI 云端部署指南

## 📦 部署包说明

这个部署包包含了运行N8N Video AI应用所需的所有文件，大小仅1.5MB。

## 🚀 快速部署

### 方法1: 使用部署脚本（推荐）

```bash
# 在云端服务器上运行
./deploy.sh
```

### 方法2: 手动部署

```bash
# 1. 构建镜像
docker build -f Dockerfile.ultra-minimal -t n8nvideo .

# 2. 运行容器
docker run -d -p 3000:3000 --name n8nvideo n8nvideo

# 3. 检查状态
curl http://localhost:3000/api/health
```

### 方法3: 使用Docker Compose（推荐生产环境）

```bash
# 1. 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 2. 检查状态
docker-compose -f docker-compose.prod.yml ps
```

## 🔧 环境配置

### 必需的环境变量

在 `docker-compose.prod.yml` 中配置以下环境变量：

```yaml
environment:
  - DATABASE_URL=file:./dev.db  # 数据库连接
  - OPENAI_API_KEY=your_key     # OpenAI API密钥
  - GOOGLE_API_KEY=your_key     # Google API密钥
```

### 数据库配置

- **开发环境**: 使用SQLite (`file:./dev.db`)
- **生产环境**: 建议使用PostgreSQL或MySQL

## 📊 性能优化

### 镜像大小优化

- **当前大小**: 335MB
- **包含内容**: Node.js + Next.js + Prisma + 应用代码
- **优化建议**: 使用多阶段构建，只保留运行时依赖

### 资源使用

- **内存**: 建议至少512MB
- **CPU**: 建议至少1核心
- **存储**: 建议至少1GB

## 🔍 监控和维护

### 健康检查

```bash
# 检查服务状态
curl http://localhost:3000/api/health

# 查看容器日志
docker logs n8nvideo
```

### 常用命令

```bash
# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 停止服务
docker-compose -f docker-compose.prod.yml down
```

## 🌐 访问应用

- **主页**: http://localhost:3000
- **管理后台**: http://localhost:3000/admin
- **API健康检查**: http://localhost:3000/api/health

## 🚨 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 检查端口使用情况
   netstat -tlnp | grep 3000
   # 或使用其他端口
   docker run -d -p 3001:3000 n8nvideo
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据库文件权限
   ls -la ./data/
   # 重新初始化数据库
   docker exec n8nvideo npx prisma db push
   ```

3. **内存不足**
   ```bash
   # 检查内存使用
   docker stats n8nvideo
   # 增加内存限制
   docker run -d -p 3000:3000 --memory=1g n8nvideo
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

1. **使用HTTPS**: 生产环境建议配置SSL证书
2. **防火墙**: 只开放必要端口
3. **环境变量**: 不要在代码中硬编码敏感信息
4. **定期更新**: 保持Docker镜像和依赖的更新

## 📞 支持

如果遇到问题，请检查：
1. Docker和docker-compose是否正确安装
2. 端口3000是否被占用
3. 环境变量是否正确配置
4. 查看容器日志获取详细错误信息
