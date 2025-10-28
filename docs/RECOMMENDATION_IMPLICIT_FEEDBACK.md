# 推荐引擎隐式反馈系统设计与实现

## 背景与动机

### 问题
用户反馈稀疏：推荐引擎依赖用户显式反馈（点赞/选择备选项）来优化，但用户往往懒得反馈，导致：
- 数据稀疏，推荐引擎迭代慢
- 无法覆盖所有场景的优化
- 探索不足，陷入局部最优

### 解决方案
**"少打扰 + 多埋点 + 自动探索"策略**
- **隐式反馈信号**：自动采集用户行为，不打扰用户
- **在线探索**：epsilon-greedy策略，自动探索新候选
- **质量代理指标**：用执行结果质量推断满意度

## 系统架构

### 1. 数据模型

#### RecommendationEvent（新增）
```prisma
model RecommendationEvent {
  id         String                   @id @default(cuid())
  decisionId String
  eventType  String                   // expose | select | execute | implicit_positive | implicit_negative
  payload    String?
  createdAt  DateTime                 @default(now())
  decision   RecommendationDecision   @relation(fields: [decisionId], references: [id])
}
```

**事件类型：**
- `expose`: 候选项曝光给用户
- `select`: 用户改选了备选项
- `execute`: 用户执行了AI任务
- `implicit_positive`: 自动推断的正反馈（结果好）
- `implicit_negative`: 自动推断的负反馈（结果差）

#### RecommendationOutcome（已有，增强）
存储执行结果的质量指标：
- `latencyMs`: 执行耗时
- `addedSellingPoints/addedPainPoints`: 新增内容数
- `rerunCount`: 重跑次数
- `editDistance`: 编辑距离（后续扩展）
- `conversion`: 是否最终采用

### 2. 隐式反馈信号采集

#### 曝光（Expose）
**触发时机：** 用户获取推荐候选项后
**信号含义：** 用户看到了哪些候选
**采集位置：** `CompetitorAnalysis.tsx` - `handleGetRecommendations`

```typescript
// 记录曝光事件
fetch('/api/recommend/feedback', {
  method: 'POST',
  body: JSON.stringify({
    decisionId: data.data.decisionId,
    eventType: 'expose',
    payload: {
      modelCandidates: data.data.modelCandidates.map(c => c.id),
      promptCandidates: data.data.promptCandidates.map(c => c.id)
    }
  })
})
```

#### 选择（Select）
**触发时机：** 用户手动改选了模型/Prompt
**信号含义：** 
- 对默认推荐的**负反馈**（用户不满意默认）
- 对所选项的**正反馈**（用户认为更好）
**采集位置：** `CompetitorAnalysis.tsx` - `handleSelectCandidate`

```typescript
// 记录选择事件
fetch('/api/recommend/feedback', {
  method: 'POST',
  body: JSON.stringify({
    decisionId: window.__lastRecoDecisionId,
    eventType: 'select',
    payload: { type, index }
  })
})
```

#### 执行（Execute）
**触发时机：** 用户点击"AI解析"执行任务
**信号含义：** 
- 未改选 + 执行 = **弱正反馈**（接受默认）
- 改选 + 执行 = **观察结果质量**
**采集位置：** `CompetitorAnalysis.tsx` - `handleAnalyze`

```typescript
// 记录执行事件
const startTime = Date.now()
// ... 执行AI ...
const latencyMs = Date.now() - startTime

fetch('/api/recommend/feedback', {
  method: 'POST',
  body: JSON.stringify({
    decisionId,
    eventType: 'execute',
    payload: { usedModel, usedPrompt, latencyMs }
  })
})
```

#### 隐式正/负反馈（Auto-inferred）
**触发时机：** 执行完成后自动判定
**判定规则：**

**隐式正反馈（implicit_positive）条件：**
- 新增内容多（≥3个卖点/痛点）
- 无重跑（rerunCount = 0）
- 编辑距离小（≤10%）

**隐式负反馈（implicit_negative）条件：**
- 新增内容少（0个）
- 重跑多次（≥2次）
- 编辑距离大（>30%）

**采集位置：** `/api/admin/recommendation/outcome` 自动判定（或直接用 `/api/recommend/feedback` 的 Outcome 字段进行 upsert）

```typescript
let implicitSignal = null
const totalAdded = addedSellingPoints + addedPainPoints

if (totalAdded === 0 || rerunCount > 1) {
  implicitSignal = 'implicit_negative'
} else if (totalAdded >= 3 && rerunCount === 0) {
  implicitSignal = 'implicit_positive'
}

if (editDistance > 0.3) {
  implicitSignal = 'implicit_negative'
}
```

### 3. 在线探索策略

#### Epsilon-Greedy
**位置：** `src/services/recommendation/recommend.ts`

**实现：**
```typescript
// 从数据库读取epsilon配置（默认10%）
const setting = await prisma.recommendationSetting.findUnique({ 
  where: { scenario } 
})
const epsilon = setting?.epsilon ?? 0.10

// 构建备选池（fine-top2 + coarse-top2 + explore-2）
const altPool = [topK[1], ...coarseExtras, ...outOfPool]

// epsilon概率探索
if (altPool.length > 0 && Math.random() < epsilon) {
  const picked = altPool[Math.floor(Math.random() * altPool.length)]
  chosen = picked
  exploreFlags = {
    epsilon,
    explored: true,
    pickedId: picked.id,
    bucket: /* fine/coarse/oop */
  }
}
```

**探索记录：**
- `exploreFlags` 存储在 `reco_decisions.exploreFlags` 字段
- 可后续分析探索效果 vs 默认效果

### 4. API接口

#### POST `/api/recommend/feedback`
**功能：** 记录推荐事件（显式/隐式通用），并可同时 Upsert Outcome 字段

**请求：**
```json
{
  "decisionId": "clxxx",
  "eventType": "expose | select | execute | implicit_positive | implicit_negative",
  "payload": {
    // 事件相关数据
  },
  // 可选：显式反馈
  "userChoice": "candidate-id",
  "type": "model | prompt",
  "reason": "用户原因",
  // 可选：Outcome 相关字段，若提供将 upsert 到 RecommendationOutcome
  "latencyMs": 2500,
  "qualityScore": 0.9,
  "conversion": true
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "feedback": {"id": "..."},
    "event": {"id": "..."},
    "outcome": {"id": "..."}
  }
}
```

（兼容保留）#### POST `/api/admin/recommendation/outcome`
**功能：** 记录执行结果质量指标，自动推断隐式反馈（新推荐：也可通过 `/api/recommend/feedback` 直接写入 Outcome 字段）

#### GET `/api/admin/recommendation/dashboard`
**功能：** 推荐质量看板，按模型/Prompt聚合统计

**参数：**
- `scenario`: 场景（默认 `task->model`）
- `days`: 统计天数（默认7天）

**响应：**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalDecisions": 150,
      "totalExposes": 150,
      "totalExecutes": 120,
      "totalSelects": 15,
      "avgSelectRate": 0.10,
      "avgLatency": 2300,
      "positiveRate": 0.65,
      "negativeRate": 0.15
    },
    "items": [
      {
        "targetType": "model",
        "targetId": "gemini-pro",
        "exposeCount": 80,
        "executeCount": 75,
        "selectCount": 5,
        "selectRate": 0.0625,
        "avgLatency": 2100,
        "implicitPositive": 50,
        "implicitNegative": 10,
        "implicitScore": 0.53,
        "exploreRate": 0.08
      }
    ]
  }
}
```

## 数据流

```
用户输入 
  → 获取推荐（recommendRank + epsilon-greedy）
  → 返回 decisionId + candidates
  → [埋点] expose事件
  ↓
用户查看候选
  → 可选：改选模型/Prompt
  → [埋点] select事件（负反馈 default，正反馈 selected）
  ↓
用户点击"AI解析"
  → [计时] startTime
  → 执行AI任务
  → [计时] latencyMs
  → [埋点] execute事件
  ↓
返回结果
  → [埋点] outcome（latencyMs + addedPoints + rerunCount）
  → [自动推断] implicit_positive | implicit_negative
  ↓
后台聚合
  → 按模型/Prompt统计
  → 通过率、改选率、平均耗时、隐式分数
  → 推荐质量看板
```

## 指标定义

### 改选率（Select Rate）
```
改选率 = selectCount / exposeCount
```
**含义：** 用户对默认推荐不满意的比例
**优化方向：** 越低越好（<10%优秀，<5%卓越）

### 执行率（Execute Rate）
```
执行率 = executeCount / exposeCount
```
**含义：** 获取推荐后真正执行的比例
**优化方向：** 越高越好（>80%优秀）

### 隐式分数（Implicit Score）
```
隐式分数 = (implicit_positive - implicit_negative) / executeCount
```
**含义：** 执行结果质量的净得分
**优化方向：** 越高越好（>0.5优秀，>0.7卓越）

### 探索率（Explore Rate）
```
探索率 = exploreCount / executeCount
```
**含义：** 实际探索流量占比
**预期值：** 应接近配置的epsilon（约10%）

## 使用指南

### 1. 查看推荐质量看板
```bash
curl "http://localhost:3000/api/admin/recommendation/dashboard?days=7"
```

返回Top 50模型/Prompt的统计数据。

### 2. 配置探索率
修改数据库中的 `recommendation_settings` 表：
```sql
UPDATE recommendation_settings
SET epsilon = 0.15  -- 调整为15%探索
WHERE scenario = 'task->model';
```

### 3. 分析改选行为
查询用户改选了哪些候选：
```sql
SELECT 
  d.decisionId,
  d.chosenTargetId AS defaultChoice,
  e.payload AS userSelection,
  e.createdAt
FROM reco_events e
JOIN reco_decisions d ON e.decisionId = d.id
WHERE e.eventType = 'select'
ORDER BY e.createdAt DESC
LIMIT 100;
```

### 4. 分析探索效果
对比探索流量 vs 默认流量的质量：
```sql
-- 探索流量的隐式分数
SELECT AVG(
  (SELECT COUNT(*) FROM reco_events WHERE decisionId = d.id AND eventType = 'implicit_positive')
  - (SELECT COUNT(*) FROM reco_events WHERE decisionId = d.id AND eventType = 'implicit_negative')
) AS exploreScore
FROM reco_decisions d
WHERE exploreFlags IS NOT NULL AND exploreFlags LIKE '%"explored":true%';

-- 默认流量的隐式分数
SELECT AVG(
  (SELECT COUNT(*) FROM reco_events WHERE decisionId = d.id AND eventType = 'implicit_positive')
  - (SELECT COUNT(*) FROM reco_events WHERE decisionId = d.id AND eventType = 'implicit_negative')
) AS defaultScore
FROM reco_decisions d
WHERE exploreFlags IS NULL OR exploreFlags NOT LIKE '%"explored":true%';
```

## 优化建议

### 短期（已实现）
- ✅ 基础埋点：expose/select/execute
- ✅ Epsilon-greedy探索（10%）
- ✅ 隐式正负反馈自动推断
- ✅ 质量看板API

### 中期（1-2周）
- [ ] **Prompt片段级偏好学习**：记录用户编辑了哪些部分
- [ ] **Thompson Sampling**：基于贝叶斯后验的探索
- [ ] **上下文Bandit**：基于类目/语言/输入类型的分层探索
- [ ] **编辑距离计算**：Levenshtein距离 or Diff算法

### 长期（1个月+）
- [ ] **下游业务指标回传**：视频CTR、GMV、转化率
- [ ] **归因模型**：推荐决策对业务结果的影响
- [ ] **Embedding相似度召回**：冷启动优化
- [ ] **A/B测试框架**：灰度发布新策略

## 监控与告警

### 关键指标监控
1. **改选率异常**：>20% 触发告警（推荐质量下降）
2. **执行率异常**：<50% 触发告警（用户不信任推荐）
3. **隐式负反馈激增**：负反馈率 >30% 告警
4. **探索率偏离**：与epsilon配置偏离 >50% 告警
5. **平均耗时异常**：>5s 告警（性能问题）

### 数据质量检查
- 每天统计新增事件数
- 检查是否有孤立的decision（无任何event）
- 检查是否有outcome但无execute事件（数据不一致）

## 技术债务

1. **批量写入优化**：当前是单条insert，高QPS场景需要批量写入
2. **事件去重**：前端可能重复发送，需要幂等性保护
3. **数据归档**：超过90天的事件数据归档到冷存储
4. **隐私合规**：payload可能包含敏感信息，需要脱敏

## 相关文件

### 数据层
- `prisma/schema.prisma` - 数据模型定义
  - `RecommendationEvent` (新增)
  - `RecommendationOutcome` (增强)
  - `RecommendationDecision` (添加exploreFlags)

### 服务层
- `src/services/recommendation/recommend.ts` - epsilon-greedy实现
- `src/services/competitor/UnifiedCompetitorService.ts` - 返回decisionId

### API层
- `app/api/recommend/feedback/route.ts` - 事件记录（统一）
- `app/api/admin/recommendation/outcome/route.ts` - 质量指标记录（兼容保留）
- `app/api/admin/recommendation/dashboard/route.ts` - 质量看板
- `app/api/competitor/recommend/route.ts` - 推荐接口（返回decisionId）

### 前端层
- `components/CompetitorAnalysis.tsx` - 埋点实现

## 总结

通过"隐式反馈 + 在线探索"的设计，我们实现了：

✅ **无打扰采集**：用户无需主动反馈，系统自动记录行为
✅ **全流程追踪**：从曝光到执行到结果质量，全链路可观测
✅ **自动探索**：epsilon-greedy保证10%流量探索新候选
✅ **质量推断**：根据执行结果自动判定满意度
✅ **数据闭环**：事件→指标→看板→优化决策

**预期效果：**
- 数据量提升10-100倍（vs 纯显式反馈）
- 推荐迭代速度提升3-5倍
- 长尾场景覆盖率提升
- 避免局部最优，持续优化

**关键成功因素：**
- 保持埋点稳定性（不能漏点）
- 定期review看板数据
- 根据数据调整epsilon
- 逐步引入更复杂的策略（Thompson Sampling / Bandit）

