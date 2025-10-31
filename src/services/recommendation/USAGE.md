# 推荐引擎使用指南

## 支持的场景

### 1. `product->persona` - 商品推荐人设
根据商品特征推荐最适合的人设。

```typescript
import { recommendRank } from '@/src/services/recommendation'

const recommendation = await recommendRank({
  scenario: 'product->persona',
  task: {
    subjectRef: {
      entityType: 'product',
      entityId: 'product_123'
    },
    category: '厨房用品',
    subcategory: '电磁炉',
    productName: '折叠电磁炉'
  },
  context: {
    region: 'MY',  // 马来西亚
    channel: 'tiktok'
  }
})

console.log('推荐的人设:', recommendation.chosen)
console.log('Top 3:', recommendation.topK)
```

**评分维度**：
- productId/productName 匹配（+50分）
- subcategory 匹配（+30分）
- category 匹配（+25分）
- region 匹配（+15分）
- channel 匹配（+10分）
- 新鲜度（0-10分）
- 历史效果（待实现，+40分）

---

### 2. `product->script` - 商品推荐脚本
根据商品特征推荐最适合的视频脚本（需要先创建 Script 表）。

```typescript
const recommendation = await recommendRank({
  scenario: 'product->script',
  task: {
    subjectRef: {
      entityType: 'product',
      entityId: 'product_123'
    },
    category: '厨房用品',
    subcategory: '电磁炉',
    tone: 'professional'  // 脚本语气
  },
  context: {
    region: 'MY',
    channel: 'tiktok'
  }
})
```

**评分维度**：
- productId 匹配（+50分）
- subcategory 匹配（+30分）
- category 匹配（+25分）
- region 匹配（+15分）
- channel 匹配（+10分）
- tone 匹配（+10分）
- 新鲜度（0-10分）
- 历史效果（待实现，+60分）

---

### 3. `product->content-elements` - 商品内容元素推荐
从商品的卖点/痛点/目标受众中选择最适合视频的 Top 5。

```typescript
const product = await prisma.product.findUnique({
  where: { id: 'product_123' }
})

// 推荐卖点 Top 5
const sellingPointsRec = await recommendRank({
  scenario: 'product->content-elements',
  task: {
    subjectRef: {
      entityType: 'product',
      entityId: product.id
    },
    elementType: 'selling-point',
    elements: product.sellingPoints,  // 所有卖点数组
    category: product.category
  },
  context: {
    region: 'MY',
    channel: 'tiktok'
  },
  topK: 5  // 返回 Top 5
})

// 推荐痛点 Top 5
const painPointsRec = await recommendRank({
  scenario: 'product->content-elements',
  task: {
    subjectRef: {
      entityType: 'product',
      entityId: product.id
    },
    elementType: 'pain-point',
    elements: product.painPoints,
    category: product.category
  },
  context: {
    region: 'MY',
    channel: 'tiktok'
  },
  topK: 5
})

// 推荐目标受众 Top 5
const audienceRec = await recommendRank({
  scenario: 'product->content-elements',
  task: {
    subjectRef: {
      entityType: 'product',
      entityId: product.id
    },
    elementType: 'target-audience',
    elements: product.targetAudience,
    category: product.category
  },
  context: {
    region: 'MY',
    channel: 'tiktok'
  },
  topK: 5
})

console.log('推荐卖点:', sellingPointsRec.topK.map(c => c.title))
console.log('推荐痛点:', painPointsRec.topK.map(c => c.title))
console.log('推荐受众:', audienceRec.topK.map(c => c.title))
```

**评分维度**：
- 文本长度（10-30字最佳，+15分）
- 关键词密度（包含目标市场词汇，+10分）
- 情感强度（积极/负面词汇，+5-25分）
- 可视化程度（易于视频展示，+8分）
- 具体性（包含数字，+5分）
- 历史效果（待实现，+50分）

---

### 4. `task->model` - 任务推荐AI模型
根据任务类型推荐最适合的 AI 模型。

```typescript
const recommendation = await recommendRank({
  scenario: 'task->model',
  task: {
    taskType: 'persona-generation',
    contentType: 'text',
    jsonRequirement: true,
    language: 'zh',
    category: '厨房用品'
  },
  context: {
    region: 'MY',
    channel: 'admin'
  },
  constraints: {
    maxCostUSD: 0.1,
    requireJsonMode: true
  }
})
```

---

### 5. `task->prompt` - 任务推荐Prompt模板
根据任务类型推荐最适合的 Prompt 模板。

```typescript
const recommendation = await recommendRank({
  scenario: 'task->prompt',
  task: {
    taskType: 'persona.generate',
    contentType: 'text',
    category: '厨房用品'
  },
  context: {
    region: 'MY',
    channel: 'admin'
  }
})
```

---

## 反馈机制

推荐引擎支持用户反馈，用于持续优化：

```typescript
import { submitRecommendationFeedback } from '@/src/services/recommendation'

// 用户使用推荐结果后提交反馈
await submitRecommendationFeedback({
  decisionId: recommendation.decisionId,
  qualityScore: 0.8,  // 0-1，质量评分
  latencyMs: 1500,    // 实际延迟
  costActual: 0.05,   // 实际花费
  notes: '效果很好'
})

// 用户选择了非Top1的候选项
await submitRecommendationFeedback({
  decisionId: recommendation.decisionId,
  userSelectedId: 'alternative_id',  // 用户实际选择的ID
  bucket: 'fine',  // 来自哪个候选池
  qualityScore: 0.9
})
```

---

## 优先级排序规则

### product->persona / product->script
1. **productId = productName**（最高优先级，+50分）
2. **subcategory**（次优先，+30分）
3. **category**（再次优先，+25分）
4. 同分数情况下，按**创建时间降序**（最新的在前）

### product->content-elements
1. **历史效果**（待实现，最重要，+50分）
2. **文本特征**（长度、关键词、情感，+38分）
3. **可视化程度**（+8分）
4. **具体性**（+5分）

---

## 待优化功能

1. ✅ 删除 `product->style` 场景
2. ✅ 创建 `product->persona` 评分器
3. ✅ 创建 `product->script` 评分器（需要 Script 表）
4. ✅ 创建 `product->content-elements` 评分器
5. ⏳ 集成历史效果数据（从 `outcome` 表）
6. ⏳ A/B 测试框架
7. ⏳ 多臂老虎机算法优化

---

## 性能优化

- **缓存机制**：推荐结果缓存 5-10 分钟
- **异步持久化**：候选集和决策数据异步写入数据库
- **批量查询**：使用 `findMany` + `IN` 条件减少数据库查询次数

