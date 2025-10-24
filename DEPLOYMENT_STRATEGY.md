# 云端部署技术方案

## 问题分析
- 项目总大小：818MB
- node_modules：680MB
- 主要问题：依赖包过大，不适合直接部署

## 解决方案

### 方案一：Docker容器化部署（推荐）

#### 优势
- 环境一致性
- 依赖隔离
- 部署简单
- 镜像大小优化后约200-300MB

#### 部署步骤

1. **本地准备**
```bash
# 1. 清理本地node_modules（可选）
rm -rf node_modules package-lock.json
npm install

# 2. 构建Docker镜像
docker build -t n8n-video-ai:latest .

# 3. 测试本地运行
docker run -p 3000:3000 n8n-video-ai:latest
```

2. **Google Cloud部署**

**选项A：Cloud Run（推荐）**
```bash
# 1. 配置Google Cloud CLI
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. 构建并推送到Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/n8n-video-ai

# 3. 部署到Cloud Run
gcloud run deploy n8n-video-ai \
  --image gcr.io/YOUR_PROJECT_ID/n8n-video-ai \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated \
  --port 3000
```

**选项B：Compute Engine + Docker**
```bash
# 1. 创建VM实例
gcloud compute instances create n8n-video-ai \
  --image-family=cos-stable \
  --image-project=cos-cloud \
  --machine-type=e2-medium \
  --zone=asia-east1-a

# 2. 在VM上安装Docker并运行
gcloud compute ssh n8n-video-ai --command="
  sudo docker run -d -p 80:3000 --name n8n-video-ai n8n-video-ai:latest
"
```

### 方案二：GitHub Actions + Cloud Run（自动化）

#### 配置文件：`.github/workflows/deploy.yml`
```yaml
name: Deploy to Google Cloud Run

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Google Cloud CLI
      uses: google-github-actions/setup-gcloud@v1
      with:
        service_account_key: ${{ secrets.GCP_SA_KEY }}
        project_id: ${{ secrets.GCP_PROJECT_ID }}
    
    - name: Configure Docker
      run: gcloud auth configure-docker
    
    - name: Build and Push
      run: |
        docker build -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/n8n-video-ai:${{ github.sha }} .
        docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/n8n-video-ai:${{ github.sha }}
    
    - name: Deploy to Cloud Run
      run: |
        gcloud run deploy n8n-video-ai \
          --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/n8n-video-ai:${{ github.sha }} \
          --platform managed \
          --region asia-east1 \
          --allow-unauthenticated
```

### 方案三：传统服务器部署

#### 服务器要求
- Ubuntu 20.04+ 或 CentOS 8+
- 2GB+ RAM
- 20GB+ 存储空间

#### 部署步骤
```bash
# 1. 安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 安装PM2进程管理器
sudo npm install -g pm2

# 3. 克隆项目（只克隆代码，不包含node_modules）
git clone https://github.com/your-repo/n8nvideo.git
cd n8nvideo

# 4. 安装依赖
npm ci --production

# 5. 构建应用
npm run build

# 6. 启动应用
pm2 start npm --name "n8n-video-ai" -- start
pm2 save
pm2 startup
```

## 成本对比

| 方案 | 月成本 | 优势 | 劣势 |
|------|--------|------|------|
| Cloud Run | $5-20 | 按需付费，自动扩缩容 | 冷启动延迟 |
| Compute Engine | $20-50 | 稳定性能 | 需要手动管理 |
| 传统VPS | $10-30 | 成本低，完全控制 | 需要运维知识 |

## 推荐方案

**最佳选择：Cloud Run + GitHub Actions**

理由：
1. 自动化部署，减少人工错误
2. 按需付费，成本可控
3. 自动扩缩容，应对流量变化
4. 无需管理服务器

## 部署前检查清单

- [ ] 环境变量配置完成
- [ ] 数据库连接配置
- [ ] 域名和SSL证书准备
- [ ] 监控和日志配置
- [ ] 备份策略制定

## 监控和维护

1. **健康检查**
   - 配置 `/api/health` 端点
   - 设置监控告警

2. **日志管理**
   - 使用Google Cloud Logging
   - 配置日志轮转

3. **备份策略**
   - 数据库定期备份
   - 配置文件版本控制

## 安全建议

1. 使用环境变量存储敏感信息
2. 配置防火墙规则
3. 定期更新依赖包
4. 使用HTTPS
5. 设置访问控制
