# 🚀 部署后数据库初始化指南

## ⚠️ 重要说明

**本地开发数据（`prisma/dev.db`）不应该部署到生产环境！**

- ✅ 开发数据库是 SQLite，用于本地开发
- ✅ 生产环境使用独立的 PostgreSQL 数据库
- ✅ 生产数据通过**迁移脚本**和**种子数据**初始化

---

## 📋 部署后初始化步骤

### 方法 1: Docker 部署（自动初始化）

如果你使用 Docker Compose，可以在 `docker-compose.yml` 中添加初始化服务：

```yaml
sales:
  init-db:
    image: node:18-alpine
    working_dir: /app
    volumes:
      - ./:/app
      - ./node_modules:/app/node_modules
    environment:
      - DATABASE_URL=${DATABASE_URL}
    command: >
      sh -c "
        npx prisma generate &&
        npx prisma migrate deploy &&
        npx tsx prisma/seed.ts
      "
    depends_on:
      - db
    restart: "no"
```

### 方法 2: Railway/Vercel 部署（手动初始化）

#### 步骤 1: 运行数据库迁移

```bash
# Railway
railway run npx prisma migrate deploy

# 或本地连接生产数据库
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

这会：
- ✅ 创建所有表结构
- ✅ 创建索引和约束
- ✅ 应用数据库迁移

#### 步骤 2: 初始化种子数据

```bash
# Railway
railway run npm run db:seed

# 或本地连接生产数据库
DATABASE_URL="postgresql://..." npm run db:seed
```

这会创建：
- ✅ 示例商品（3个）
- ✅ 示例竞品分析（1个）
- ✅ 示例人设模板（3个）

---

## 🔄 如果需要迁移本地开发数据到生产

### 场景 1: 只有少量数据

手动在生产环境管理后台创建即可。

### 场景 2: 需要迁移大量本地数据

#### 步骤 1: 导出本地 SQLite SIL数据

```bash
# 安装 sqlite3 命令行工具（如果还没有）
# macOS: brew install sqlite3

# 导出数据为 SQL
sqlite3 prisma/dev.db .dump > local_data.sql
```

#### 步骤 2: 转换并导入到 PostgreSQL

⚠️ **注意：** SQLite 和 PostgreSQL 语法不完全兼容，需要手动调整。

推荐使用 Prisma 数据迁移脚本：

```typescript
// scripts/migrate-local-data.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateLocalData() {
  console.log('开始迁移本地数据...')
  
  // 这里需要根据你的实际数据调整
  // 示例：迁移商品数据
  const localProducts = [
    // 从本地数据库读取的数据
  ]
  
  // 批量创建到生产数据库
  for (const product of localProducts) {
    await prisma.product.create({
      data: product
    })
  }
  
  console.log('✅ 数据迁移完成')
}

migrateLocalData()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

运行：
```bash
DATABASE_URL="postgresql://生产数据库URL" tsx scripts/migrate-local-data.ts
```

---

## ✅ 验证初始化结果

### 检查数据库表结构

```bash
# 连接生产数据库
DATABASE_URL="postgresql://..." npx prisma studio
```

或在应用管理后台检查：
- 商品管理页面应该看到示例商品
- 人设管理页面应该看到示例人设
- 竞品分析页面应该看到示例数据

### 检查 API 响应

```bash
# 健康检查
curl https://your-app.com/api/health

# 测试商品列表
curl https://your-app.com/api/admin/products
```

---

## 📝 种子数据说明

`prisma/seed.ts` 会创建以下初始数据：

1. **商品（3个）**
   - 无线蓝牙耳机
   - 智能手表
   - 护肤精华液

2. **竞品分析（1个）**
   - 示例竞品视频分析

3. **人设模板（3个）**
   - Sarah Chen（UX设计师，适合电子产品）
   - Marcus Johnson（健身教练，适合运动产品）
   - Emily Park（美容师，适合美妆产品）

这些是**示例数据**，用于快速测试和演示。生产环境建议：
- ✅ 保留示例数据用于测试
- ✅ 或者删除种子数据，仅通过管理后台创建真实数据

---

## 🛠 自定义种子数据

如果需要修改种子数据，编辑 `prisma/seed.ts`：

```typescript
// prisma/seed.ts
async function main() {
  // 添加你的初始数据
  const myProduct = await prisma.product.create({
    data: {
      name: '你的商品',
      description: '...',
      // ...
    }
  })
  
  // 可以读取配置文件
  // const config = JSON.parse(fs.readFileSync('seed-config.json'))
}
```

---

## ❓ 常见问题

### Q: 为什么本地数据不能直接部署？

**A:** 
- 本地开发数据库是 SQLite（文件数据库）
- 生产环境使用 PostgreSQL（关系型数据库）
- 两者数据结构不同，不能直接复制

### Q: 种子数据会覆盖已有数据吗？

**A:** 不会。`prisma/seed.ts` 使用 `create`，不会删除已有数据。如果遇到唯一约束冲突，会跳过。

### Q: 如何清空生产数据重新初始化？

```bash
# ⚠️ 危险操作！会删除所有数据
DATABASE_URL="postgresql://..." npx prisma migrate reset

# 然后重新运行种子数据
DATABASE_URL="postgresql://..." npm run db:seed
```

### Q: 生产环境需要运行 `db:push` 吗？

**A:** 不需要！生产环境应该使用：
- ✅ `prisma migrate deploy` - 运行迁移
- ❌ `prisma db push` - 仅用于开发环境

---

## 📚 相关文档

- [Prisma 迁移指南](https://www.prisma.io/docs/guides/migrate)
- [Prisma 种子数据指南](https://www.prisma.io/docs/guides/database/seed-database)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 完整部署指南

