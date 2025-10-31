# Docker 镜像优化说明

## 📦 镜像大小对比

### 本地开发环境
- `node_modules/`: **745MB**
- 总项目大小: **1.1GB**

### 最终生产镜像（估计）
- 基础镜像 (`node:18-alpine`): ~50MB
- Next.js standalone 构建: ~100-150MB  
- Prisma 客户端: ~20MB
- 运行时依赖: ~30MB
- **总计: ~200-250MB** ⬇️ **减少约 66%**

## ✅ 已实施的优化措施

### 1. `.dockerignore` 排除文件
```dockerfile
# .dockerignore 已配置排除：
- node_modules/          # 745MB - 不会被复制到构建上下文
- .next/                 # 构建产物会在容器内重新生成
- *.db                   # 本地数据库文件
- .env.*                 # 环境变量文件
```

### 2. 多阶段构建 (Multi-stage Build)
```dockerfile
# 阶段 1: deps - 只安装生产依赖（不复制到最终镜像）
FROM node:18-alpine AS deps
RUN npm ci --only=production

# 阶段 2: builder - 构建应用
FROM node:18-alpine AS builder  
RUN npm ci  # 安装所有依赖（包括 devDependencies）
RUN npm run build

# 阶段 3: runner - 最终镜像（只包含运行时必需文件）
FROM node:18-alpine AS runner
COPY --from=builder /app/.next/standalone ./
# 只复制构建产物，不包含 node_modules
```

### 3. Next.js Standalone 模式
在 `next.config.js` 中配置：
```javascript
output: 'standalone'
```

这会生成一个独立的、最小化的构建，只包含：
- 运行应用所需的 Node.js 模块
- 预编译的页面和 API 路由
- 静态资源

### 4. Alpine Linux 基础镜像
使用 `node:18-alpine` 而非完整 Debian 镜像：
- 基础镜像大小: ~50MB (vs ~200MB)
- 启动速度更快
- 内存占用更少

## 🚀 Cloud Build 优化

### 构建上下文大小
虽然本地项目是 1.1GB，但由于 `.dockerignore`：
- 实际上传到 Cloud Build 的压缩包: **~4-5MB**
- 不包含 `node_modules/` 和构建产物

### 构建时间
- 首次构建: ~10-15 分钟（需要安装依赖）
- 后续构建: ~5-8 分钟（层缓存）

## 📊 成本影响

### 镜像存储
- 镜像大小: ~250MB
- Google Container Registry 存储成本: ~$0.026/GB/月
- 每月成本: **~$0.007** (几乎可忽略)

### 传输时间
- 镜像拉取时间: <30 秒（在 Cloud Run 同一区域）
- 对冷启动影响: 很小

## 💡 进一步优化建议（如需要）

### 1. 移除未使用的依赖
```bash
# 检查依赖使用情况
npm prune --dry-run
```

### 2. 使用 npm ci 而非 npm install
✅ 已实施 - Dockerfile 中使用 `npm ci --frozen-lockfile`

### 3. 考虑使用 distroless 镜像（高级）
```dockerfile
FROM gcr.io/distroless/nodejs18-debian11
# 更小但调试更困难
```

### 4. 分析依赖大小
```bash
# 找出最大的依赖包
npm ls --depth=0 | wc -l  # 依赖数量
du -sh node_modules/* | sort -h | tail -20  # 最大的包
```

## ✅ 结论

**当前配置已经很好！**
- ✅ 使用多阶段构建
- ✅ 排除不必要的文件
- ✅ 使用 Alpine 基础镜像
- ✅ Next.js standalone 模式
- ✅ 最终镜像大小预计 200-250MB（比本地减少 66%）

**无需担心 node_modules 大小**，因为：
1. `.dockerignore` 已排除它
2. 最终镜像不包含完整的 node_modules
3. 只包含运行时必需的模块

