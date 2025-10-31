# 推荐引擎 UI 集成说明

## ✅ 已完成的集成

### 1. 推荐引擎调用流程

```
用户填写表单
    ↓
点击"生成预览"
    ↓
调用 /api/persona/recommend
    ├─ 推荐 AI 模型 (task->model scorer)
    └─ 推荐 Prompt 模板 (task->prompt scorer)
    ↓
调用 /api/persona/generate
    ├─ 使用推荐的模型
    └─ 使用推荐的 Prompt
    ↓
显示生成预览
    ├─ 推荐信息卡片（一直显示）
    └─ 人设内容预览
```

### 2. 推荐信息 UI 设计

#### 在表单页面
```
┌────────────────── 推荐引擎结果 ──────────────────┐
│ ✨ 推荐引擎结果                                   │
│                                                   │
│ 🤖 推荐模型              📝 推荐 Prompt 模板     │
│ ┌──────────────┐        ┌──────────────────┐    │
│ │ Gemini 2.0   │        │ cmhafi5r...      │    │
│ │ 提供商: Google│        │ 📌 变量: category │    │
│ │ 💡 适合3C类目 │        │ targetMarket     │    │
│ │ 决策ID: cmxxx..│       │ 决策ID: cmxxx... │    │
│ └──────────────┘        └──────────────────┘    │
└───────────────────────────────────────────────────┘
```

#### 在预览页面
```
┌────────────────── 推荐引擎结果 ──────────────────┐
│ ✨ 推荐引擎结果                    ✓ 已使用       │
│                                                   │
│ 🤖 推荐模型              📝 推荐 Prompt 模板     │
│ ┌──────────────┐        ┌──────────────────┐    │
│ │ Gemini 2.0   │        │ cmhafi5r...      │    │
│ │ ...          │        │ ...              │    │
│ └──────────────┘        └──────────────────┘    │
└───────────────────────────────────────────────────┘
```

### 3. 推荐引擎工作原理

#### Task->Model Scorer
从 `estimation_models` 表中选择候选模型：

**评分因素：**
- ✅ 语言支持（language: 'zh'）
- ✅ JSON 模式支持（jsonModeSupport）
- ✅ 价格（pricePer1kTokens）
- ✅ 提供商验证（verified-models.json）
- ✅ 硬约束（maxCostUSD, maxLatencyMs）

**候选池（4个模型）：**
- `gemini/gemini-2.5-flash`
- `doubao/doubao-seed-1-6-lite`
- `deepseek/deepseek-chat`
- `openai/gpt-4o-mini`

#### Task->Prompt Scorer
从 `prompt_templates` 表中选择候选模板：

**筛选条件：**
- ✅ businessModule = 'persona.generate'
- ✅ isActive = true

**评分因素：**
- 模板性能（performance）
- 使用次数（usageCount）
- 成功率（successRate）
- 是否默认（isDefault）

**候选池（6个模板）：**
- 基础人设生成模版
- 北美日常风人设模版
- 美妆护肤风人设模版
- 健身健康风人设模版
- 科技极客风人设模版
- 家居实用风人设模版

### 4. 推荐结果使用

#### 前端调用
```typescript
// 1. 获取推荐
const recommendResponse = await fetch('/api/persona/recommend', {
  method: 'POST',
  body: JSON.stringify({
    categoryId,
    productId,
    targetCountry
  })
})

const { recommendedModel, recommendedPrompt } = recommendResponse.data

// 2. 使用推荐结果生成人设
const generateResponse = await fetch('/api/persona/generate', {
  method: 'POST',
  body: JSON.stringify({
    categoryId,
    productId,
    aiModel: recommendedModel.id,         // gemini/gemini-2.5-flash
    promptTemplate: recommendedPrompt.id  // cmhafi5r...
  })
})
```

#### 后端推荐
```typescript
// 推荐模型
const modelRec = await recommendRank({
  scenario: 'task->model',
  task: {
    taskType: 'persona-generation',
    language: 'zh',
    jsonRequirement: true,
    category: '3C数码',
    region: '马来西亚'
  },
  constraints: {
    maxCostUSD: 0.1,
    requireJsonMode: true
  }
})

// 推荐 Prompt
const promptRec = await recommendRank({
  scenario: 'task->prompt',
  task: {
    taskType: 'persona.generate',
    category: '3C数码',
    region: '马来西亚'
  }
})
```

### 5. 决策追踪

#### 保存决策信息
推荐引擎自动将决策保存到数据库：

```sql
-- 候选集
INSERT INTO recommendation_candidate_sets (
  subject_type, subject_id, target_type
) VALUES ('task', NULL, 'model');

-- 候选项
INSERT INTO recommendation_candidates (
  candidate_set_id, target_id, coarse_score, fine_score
) VALUES (...);

-- 决策
INSERT INTO recommendation_decisions (
  candidate_set_id, chosen_target_id, strategy_version
) VALUES (...);
```

#### 查看决策历史
```sql
-- 最近的推荐决策
SELECT 
  d.id,
  d.chosen_target_id,
  d.strategy_version,
  d.created_at
FROM recommendation_decisions d
ORDER BY d.created_at DESC
LIMIT 10;

-- 推荐效果分析
SELECT 
  d.chosen_target_id,
  COUNT(*) as usage_count,
  AVG(o.quality_score) as avg_quality
FROM recommendation_decisions d
LEFT JOIN recommendation_outcomes o ON d.id = o.decision_id
GROUP BY d.chosen_target_id;
```

## 🎨 UI 特点

### 1. 始终可见
- ✅ 表单页面显示推荐结果
- ✅ 预览页面继续显示推荐结果
- ✅ 用户始终知道使用了哪个模型和 Prompt

### 2. 信息完整
- ✅ 模型名称和提供商
- ✅ 推荐理由
- ✅ 决策 ID（可追溯）
- ✅ Prompt 变量列表
- ✅ 是否使用默认模板的提示

### 3. 状态指示
- 表单页面：蓝色渐变卡片
- 预览页面：显示"✓ 已使用"标签

## 🧪 测试步骤

### 1. 启动服务
```bash
npm run dev
```

### 2. 访问 Admin
```
http://localhost:3000/admin
```

### 3. 测试推荐流程
1. 点击"人设管理" Tab
2. 点击"添加人设"按钮
3. 填写表单：
   - 人设名称：马来科技达人
   - 目标市场：马来西亚
   - 类目：3C数码
   - 关联商品：选择一个
   - 人设描述：25-35岁的年轻专业人士...
4. 点击"生成预览"
5. **观察推荐引擎结果卡片**（应该在表单下方显示）
6. 等待生成完成
7. **观察预览页面的推荐信息**（带"✓ 已使用"标签）

### 4. 验证推荐结果
打开浏览器控制台，查看日志：

```javascript
📊 推荐结果: {
  model: "Gemini 2.0 Flash (Google)",
  prompt: "cmhafi5r...",
  modelReason: "评分: {...}",
  modelDecisionId: "cmxxx...",
  promptDecisionId: "cmxxx..."
}
```

### 5. 数据库验证
```sql
-- 查看最新决策
SELECT * FROM recommendation_decisions 
ORDER BY created_at DESC 
LIMIT 5;

-- 查看候选项
SELECT * FROM recommendation_candidates 
WHERE candidate_set_id IN (
  SELECT id FROM recommendation_candidate_sets 
  ORDER BY created_at DESC 
  LIMIT 1
);
```

## 📊 推荐质量监控

### 1. 决策ID追踪
每次推荐都有唯一的 `decisionId`：
- 可以追溯推荐过程
- 记录用户是否采纳
- 分析推荐效果

### 2. 反馈收集（TODO）
```typescript
// 记录用户反馈
await recordRecommendationFeedback({
  decisionId: modelRec.decisionId,
  feedbackType: 'quality_score',
  score: 0.85
})
```

### 3. A/B 测试（TODO）
- epsilon-greedy 探索策略
- 不同推荐策略对比
- 持续优化推荐质量

## 🚀 下一步优化

### 1. 增强 Scorer
- [ ] 根据类目特征调整权重
- [ ] 考虑目标市场语言偏好
- [ ] 加入历史表现数据

### 2. 反馈循环
- [ ] 收集生成质量评分
- [ ] 记录用户修改行为
- [ ] 更新模型和 Prompt 权重

### 3. UI 增强
- [ ] 显示备选模型和 Prompt
- [ ] 允许用户手动选择
- [ ] 显示推荐置信度

---

**更新时间**: 2025-10-29  
**状态**: ✅ 推荐引擎已集成 UI  
**版本**: v5.0 - UI 完整集成

