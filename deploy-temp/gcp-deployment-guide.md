# 🌐 Google Cloud Run 部署指南

## 📋 部署信息

- **项目ID**: ecommerce-475403
- **服务名称**: n8nvideo
- **区域**: asia-southeast1 (新加坡)
- **域名**: tiktokvideostyle.asia
- **预算**: 按需付费，无流量时 $0

## 🚀 一键部署

```bash
# 运行部署脚本
./deploy-gcp.sh
```

## 📊 成本预估

### 免费额度（每月）
- **请求数**: 200万次
- **内存**: 360,000 GB-秒
- **CPU**: 180,000 vCPU-秒

### 超出免费额度后
- **请求**: $0.40/百万次
- **内存**: $0.0000025/GB-秒
- **CPU**: $0.00002400/vCPU-秒

### 预估月费用（4-5人使用）
- **无流量**: $0
- **轻度使用**: $1-5
- **中等使用**: $5-20

## 🔧 部署步骤详解

### 1. 前置要求

```bash
# 安装 Google Cloud SDK
# macOS
brew install google-cloud-sdk

# 或下载安装包
# https://cloud.google.com/sdk/docs/install
```

### 2. 认证

```bash
# 登录 Google Cloud
gcloud auth login

# 设置项目
gcloud config set project ecommerce-475403
```

### 3. 部署

```bash
# 进入部署目录
cd deploy-temp

# 运行部署脚本
./deploy-gcp.sh
```

## 🌐 域名配置

### 配置自定义域名

```bash
# 映射域名到 Cloud Run 服务
gcloud run domain-mappings create \
  --service n8nvideo \
  --domain tiktokvideostyle.asia \
  --region asia-southeast1
```

### DNS 配置

在域名提供商处添加 CNAME 记录：
```
类型: CNAME
名称: @
值: ghs.googlehosted.com
```

## 🔒 HTTPS 配置

Cloud Run 自动提供 HTTPS，无需额外配置：
- ✅ 免费 SSL 证书
- ✅ 自动续期
- ✅ 强制 HTTPS 重定向

## 📊 监控和管理

### 查看服务状态

```bash
# 查看服务详情
gcloud run services describe n8nvideo --region asia-southeast1

# 查看日志
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=n8nvideo"
```

### 更新服务

```bash
# 重新构建和部署
./deploy-gcp.sh
```

### 设置环境变量

```bash
# 设置环境变量
gcloud run services update n8nvideo \
  --set-env-vars "OPENAI_API_KEY=your_key" \
  --region asia-southeast1
```

## 🔍 故障排除

### 常见问题

1. **认证失败**
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

2. **权限不足**
   ```bash
   # 确保有 Cloud Run Admin 权限
   gcloud projects add-iam-policy-binding ecommerce-475403 \
     --member="user:your-email@gmail.com" \
     --role="roles/run.admin"
   ```

3. **构建失败**
   ```bash
   # 检查 Docker 是否运行
   docker --version
   # 重新登录 GCR
   gcloud auth configure-docker
   ```

## 📈 性能优化

### 自动扩缩容配置

- **最小实例**: 0（无流量时停止）
- **最大实例**: 10（处理突发流量）
- **并发数**: 100（每个实例处理100个请求）

### 资源限制

- **内存**: 512MB
- **CPU**: 1核心
- **超时**: 300秒

## 🎯 访问地址

部署完成后，你可以通过以下地址访问：

- **Cloud Run URL**: `https://n8nvideo-xxx-uc.a.run.app`
- **自定义域名**: `https://tiktokvideostyle.asia`
- **健康检查**: `https://tiktokvideostyle.asia/api/health`

## 💡 最佳实践

1. **环境变量**: 使用 Google Secret Manager 存储敏感信息
2. **监控**: 设置 Cloud Monitoring 告警
3. **备份**: 定期备份数据库
4. **更新**: 定期更新依赖和镜像

---

**🎉 现在开始部署吧！运行 `./deploy-gcp.sh` 即可！**
