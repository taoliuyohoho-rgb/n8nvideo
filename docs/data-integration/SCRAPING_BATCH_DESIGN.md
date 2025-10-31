# 批量抓取/分析功能设计文档

## 功能概述
证据摄入层：通过爬取外部平台数据，补齐商品信息，为推荐引擎提供前验特征和后验反馈。

## 核心价值
- **前验**：为推荐引擎提供商品特征（sellingPoints、painPoints、targetMarkets、targetAudiences）
- **后验**：通过 evidenceHash 关联生成结果，形成"特征×模型/模板"效果统计
- **自动化**：24h 定时补齐，减少手动维护成本

## 数据模型

### ProductEvidence 表
```sql
CREATE TABLE ProductEvidence (
  id String @id @default(cuid())
  productId String
  platform String  // tiktok, amazon, meta, etc.
  url String
  title String
  description String?
  images String[]   // 图片URL数组
  targetMarkets String[]  // 目标市场
  targetAudiences String[]  // 目标受众
  sellingPoints String[]   // 卖点短句
  painPoints String[]      // 痛点短句
  angles String[]          // 角度/热词
  evidenceMeta Json        // {capturedAt, parserVer, source}
  version Int @default(1)
  rawPointerId String?     // 关联原始响应
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([productId])
  @@index([platform])
  @@index([createdAt])
)
```

### RawPointer 表
```sql
CREATE TABLE RawPointer (
  id String @id @default(cuid())
  storageKey String @unique  // 存储键
  sha256 String @unique      // 内容哈希
  size Int                   // 字节数
  ttlExpireAt DateTime       // 7天TTL
  createdAt DateTime @default(now())

  @@index([ttlExpireAt])
)
```

### Product 表聚合字段
```sql
// 新增字段到现有 Product 表
sellingPointsTop5 String[]   // 聚合的Top5卖点
painPointsTop5 String[]      // 聚合的Top5痛点
targetMarkets String[]       // 聚合的目标市场
targetAudiences String[]     // 聚合的目标受众
description String?          // 聚合描述
images String[]              // 去重合并的图片
```

## API 设计

### POST /api/admin/scraping/batch
**请求体**
```typescript
{
  urls?: string[]           // 直接指定URL
  productIds?: string[]     // 商品ID列表
  options?: {
    platform?: string       // 指定平台
    concurrency?: number    // 并发数，默认5
    rateLimit?: {
      perSec?: number       // 每秒请求数，默认3
    }
    force?: boolean         // 强制刷新，忽略24h去重
    idempotencyKey?: string // 幂等键
  }
}
```

**响应体**
```typescript
{
  success: boolean
  data: {
    batchId: string
    accepted: number        // 接受的任务数
    duplicated: number      // 重复的任务数
    planned: number         // 计划执行的任务数
  }
  traceId: string
}
```

### GET /api/admin/scraping/batch/:batchId
**响应体**
```typescript
{
  success: boolean
  data: {
    total: number
    done: number
    running: number
    failed: number
    failedSamples: Array<{
      taskId: string
      url: string
      platform: string
      errorCode: string
      message: string
    }>  // 最多20个失败样本
  }
  traceId: string
}
```

## 调度策略

### 触发时机
1. **立即补齐**：新商品创建或被访问时
2. **24h 去重**：同一商品24小时内不重复抓取
3. **7天每日**：连续7天每天补齐一次
4. **渐退策略**：7天后每3天或每周一次
5. **手动强制**：Admin 可随时 force 刷新

### 并发控制
- 默认5个并发任务
- 按平台分桶，每平台 QPS≈3
- 重试≤3次，指数退避
- 24h 去重检查

## 平台支持

### 电商平台（优先级1）
- TikTok Shop, 抖音电商
- Amazon, Shopee, PDD
- 淘宝, 京东, 1688
- Lazada, AliExpress（可选）

### 广告库（优先级2）
- Meta Ad Library
- TikTok Creative Center

### 内容平台（东南亚优先）
- Instagram, YouTube（可选）
- 按地区路由/代理

## 推荐引擎集成

### 前验特征注入
```typescript
// RecommendationSelector context
{
  category: string
  markets: string[]      // 来自 targetMarkets
  audiences: string[]    // 来自 targetAudiences
  top5: {
    sellingPoints: string[]
    painPoints: string[]
  }
  angles: string[]       // 来自 angles
}
```

### 后验反馈
```typescript
// 生成任务时记录
{
  evidenceHash: string   // 关联的evidence哈希
  modelId: string
  templateId: string
  result: {
    success: boolean
    quality: number
  }
}
```

## UI 入口

### Admin 商品管理
- 批量"补齐证据"按钮（工具栏）
- 行内"补齐/强刷"按钮
- 显示 batch 进度和最近失败样本

### Workbench 视频生成
- Step1 选中商品后后台自动补齐
- "补齐证据"按钮（可见，不阻塞流程）

## 技术实现

### 存储策略
- 原始响应：GZIP 压缩存储到 RawPointer
- TTL：7天自动清理
- 仅 Admin 可下载原始数据

### 观测性
- 全链路 traceId
- 日志不泄露响应体
- 原始数据前置脱敏（token/cookie等）

## 里程碑

### D1：前验闭环
- [x] 设计文档
- [ ] 建表（ProductEvidence, RawPointer）
- [ ] POST/GET 批量抓取 API
- [ ] 聚合回写 Product 表
- [ ] 原始指针存储

### D2：入口与推荐侧
- [ ] Admin 批量入口
- [ ] Workbench 补齐按钮
- [ ] RecommendationSelector 读特征
- [ ] 后验埋点接入

## 配置示例

### 环境变量
```bash
# 抓取配置
SCRAPING_CONCURRENCY=5
SCRAPING_RATE_LIMIT=3
SCRAPING_TTL_DAYS=7

# 存储配置
RAW_STORAGE_PATH=/tmp/scraping-raw
RAW_STORAGE_MAX_SIZE=100MB
```

### 平台配置
```json
{
  "platforms": {
    "tiktok": {
      "rateLimit": 2,
      "userAgent": "Mozilla/5.0...",
      "proxy": "optional"
    },
    "amazon": {
      "rateLimit": 3,
      "userAgent": "Mozilla/5.0...",
      "proxy": "required"
    }
  }
}
```

## 风险评估

### 技术风险
- 反爬虫机制：需要轮换 UA、代理、延迟
- 数据质量：需要解析器版本管理和回滚
- 存储成本：原始数据 TTL 和压缩策略

### 业务风险
- 合规性：遵守平台 ToS，避免过度抓取
- 数据准确性：需要人工校验和反馈机制
- 性能影响：避免影响主业务数据库性能

## 后续优化

### 短期（1-2周）
- 解析器版本管理
- 失败重试策略优化
- 监控告警完善

### 中期（1个月）
- 机器学习辅助解析
- 多语言支持（东南亚）
- 实时流式处理

### 长期（3个月）
- 分布式爬虫集群
- 智能调度算法
- 跨平台数据融合
