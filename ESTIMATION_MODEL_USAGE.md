## 预估模型（Estimation Model）使用指南

### 快速开始

#### 1. 数据库迁移
```bash
# 生成 Prisma Client
npx prisma generate

# 应用 schema 变更
npx prisma db push
```

#### 2. 初始化模型池
```bash
node scripts/init-estimation-models.js
```

这将从 `verified-models.json` 或使用默认模型池初始化 `estimation_models` 表。

#### 3. 同步实体特征（可选）
```bash
node scripts/sync-entity-features.js
```

从 `products` 和 `styles` 表同步特征到 `entity_features`，用于后续排序。

### API 使用

#### Rank API - 选择最优模型

**请求示例（最简）**
```bash
curl -X POST http://localhost:3000/api/ai/auto-select/rank \
  -H "Content-Type: application/json" \
  -d '{
    "task": {
      "lang": "ms",
      "category": "beauty"
    }
  }'
```

**请求示例（完整）**
```json
{
  "task": {
    "lang": "ms",
    "category": "beauty",
    "style": "youthful",
    "styleTags": ["playful", "engaging"],
    "structure": "hook-benefit-cta",
    "lengthHint": "short",
    "sensitive": false,
    "priceTier": "mid"
  },
  "context": {
    "festival": "christmas",
    "region": "MY",
    "channel": "tiktok",
    "audience": "genz",
    "budgetTier": "mid"
  },
  "constraints": {
    "maxCostUSD": 0.05,
    "maxLatencyMs": 6000,
    "requireJsonMode": true
  },
  "options": {
    "topK": 5,
    "explore": true,
    "requestId": "req_12345"
  }
}
```

**响应示例**
```json
{
  "decisionId": "dec_abc123",
  "candidateSetId": "cs_xyz789",
  "strategyVersion": "v1",
  "weightsVersion": "w1",
  "chosen": {
    "modelId": "model_gpt4o",
    "provider": "openai",
    "modelName": "gpt-4o",
    "coarseScore": 0.82,
    "fineScore": 0.77,
    "expectedCost": 0.03,
    "expectedLatency": 4200
  },
  "candidates": [
    {
      "modelId": "model_gpt4o",
      "provider": "openai",
      "modelName": "gpt-4o",
      "coarseScore": 0.82,
      "fineScore": 0.77
    },
    {
      "modelId": "model_claude",
      "provider": "anthropic",
      "modelName": "claude-3-5-sonnet-20241022",
      "coarseScore": 0.78,
      "fineScore": 0.74
    }
  ],
  "timings": {
    "coarseMs": 12,
    "fineMs": 38,
    "totalMs": 52
  }
}
```

#### Feedback API - 反馈结果

在生成完成后，上报实际结果用于持续优化。

**请求示例**
```json
{
  "decisionId": "dec_abc123",
  "qualityScore": 0.85,
  "editDistance": 0.15,
  "rejected": false,
  "conversion": true,
  "latencyMs": 4100,
  "costActual": 0.028,
  "tokensInput": 1200,
  "tokensOutput": 800,
  "autoEval": {
    "structuredRate": 0.95,
    "toxicityFlag": false,
    "styleConsistency": 0.88
  },
  "feedbackSource": "auto"
}
```

**响应示例**
```json
{
  "success": true,
  "message": "Feedback recorded",
  "decisionId": "dec_abc123"
}
```

#### Models API - 查看模型池

```bash
curl http://localhost:3000/api/ai/auto-select/models
```

**响应示例**
```json
{
  "models": [
    {
      "id": "model_123",
      "provider": "openai",
      "modelName": "gpt-4o",
      "version": "gpt-4o-2024-11-20",
      "langs": ["zh", "en", "ms", "id", "th", "vi"],
      "maxContext": 128000,
      "pricePer1kTokens": 0.0025,
      "status": "active"
    }
  ],
  "total": 5
}
```

### 集成到现有生成流程

**步骤1：在生成前调用 Rank**
```typescript
import { rank } from '@/src/services/ai/estimation/rank';

// 在生成脚本/视频前
const rankResponse = await rank({
  task: {
    lang: 'ms',
    category: productCategory,
    style: 'youthful',
  },
  context: {
    region: 'MY',
    channel: 'tiktok',
  },
  options: {
    requestId: `gen_${Date.now()}`,
  },
});

const chosenModelId = rankResponse.chosen.modelId;
const chosenProvider = rankResponse.chosen.provider;
const decisionId = rankResponse.decisionId;
```

**步骤2：使用选中的模型生成**
```typescript
// 根据 provider 调用相应的生成服务
let result;
if (chosenProvider === 'openai') {
  result = await generateWithOpenAI(prompt, rankResponse.chosen.modelName);
} else if (chosenProvider === 'doubao') {
  result = await generateWithDoubao(prompt);
}
```

**步骤3：反馈结果**
```typescript
await fetch('/api/ai/auto-select/feedback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    decisionId,
    qualityScore: calculateQuality(result),
    latencyMs: actualLatency,
    costActual: actualCost,
    rejected: false,
  }),
});
```

### 监控与看板

目前指标聚合在后端，可通过以下方式查询：

```typescript
import { aggregateBySegment, getExploreShare } from '@/src/services/ai/estimation/metrics';

// 获取各段位指标（24h）
const metrics = await aggregateBySegment(1);
console.log(metrics);

// 获取探索占比
const exploreShare = await getExploreShare();
console.log(`Explore share: ${(exploreShare * 100).toFixed(2)}%`);
```

后续可在 `app/admin/` 下新建看板页面展示。

### 配置与调优

#### 调整探索参数
修改 `src/services/ai/estimation/constants.ts` 中的 `DEFAULT_EXPLORE_CONFIG`：
```typescript
export const DEFAULT_EXPLORE_CONFIG: ExploreConfig = {
  epsilon: 0.10,  // 10% 探索率
  method: 'epsilon_greedy',
  minQualityFloor: 0.60,
  budgetCap: 100,
};
```

#### 调整评分权重
修改 `DEFAULT_COARSE_WEIGHTS` 和 `DEFAULT_FINE_WEIGHTS`：
```typescript
export const DEFAULT_COARSE_WEIGHTS: ScoringWeights = {
  langMatch: 1.0,
  categoryMatch: 0.8,
  styleMatch: 0.6,
  // ...
};
```

#### 熔断与回退
```typescript
import { openCircuit, closeCircuit, setLKG } from '@/src/services/ai/estimation/fallback';

// 手动熔断某个 provider
openCircuit('doubao', 'Manual maintenance', undefined, false);

// 恢复
closeCircuit('doubao');

// 设置 LKG
setLKG('beauty|MY|tiktok', 'model_gpt4o_mini');
```

### 故障排查

#### 问题1：Rank 返回 RANK_NO_CANDIDATE
- 检查硬过滤条件（语言、成本、provider 白名单）
- 查看熔断状态：`getCircuitBreakerStates()`
- 确认模型池有可用模型：`getActiveModels()`

#### 问题2：探索占比过高
- 检查段位质量指标，可能需要降低 epsilon
- 查看是否有熔断导致候选不足

#### 问题3：Feedback 保存失败
- 确认 `decisionId` 存在
- 至少提供一个反馈信号（qualityScore / editDistance / rejected / conversion）

### 下一步计划（V2）
- LTR 精排（LambdaMART/GBDT）
- pgvector 粗排加速
- 自动权重更新与漂移监控
- 看板页面与告警集成
- 跨渠道迁移学习

详见 `ESTIMATION_MODEL_DESIGN.md`。














