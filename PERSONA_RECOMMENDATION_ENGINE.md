# 人设生成推荐引擎集成

## 🎯 更新说明

已经集成真正的推荐引擎，使用你后台搭建的推荐系统来推荐 AI 模型和 Prompt 模板。

## 📊 推荐流程

### 1. 推荐引擎调用

```typescript
// 推荐 AI 模型
const modelRecommendation = await recommendRank({
  scenario: 'task->model',  // 使用 task->model 评分器
  task: { 
    taskType: 'persona-generation',
    contentType: 'text',
    jsonRequirement: true,
    subjectRef: productId ? {
      entityType: 'product',
      entityId: productId
    } : undefined
  },
  context: { 
    category: '3C数码',           // 类目信息
    region: '马来西亚',           // 目标市场
    channel: 'admin'              // 渠道
  },
  constraints: { 
    maxLatencyMs: 10000,          // 最大延迟 10秒
    maxCost: 0.1                  // 最大成本 $0.1
  },
  options: {
    topK: 3,                      // 返回前3个候选
    strategyVersion: 'v1'
  }
})

// 推荐 Prompt 模板
const promptRecommendation = await recommendRank({
  scenario: 'task->prompt',  // 使用 task->prompt 评分器
  task: { 
    taskType: 'persona-generation',
    contentType: 'text',
    jsonRequirement: true
  },
  context: { 
    category: '3C数码',
    region: '马来西亚'
  },
  options: {
    topK: 3
  }
})
```

### 2. 推荐结果处理

```typescript
// 模型推荐结果
const recommendedModel = {
  id: modelRecommendation.chosen.id,           // 模型ID
  name: modelRecommendation.chosen.title,      // 模型名称
  provider: 'Google / 字节跳动 / OpenAI',      // 提供商
  reason: '基于历史表现推荐',                   // 推荐理由
  decisionId: modelRecommendation.decisionId,  // 决策ID（用于反馈）
  alternatives: [...]                          // 备选模型
}

// Prompt 推荐结果
const recommendedPrompt = {
  id: promptRecommendation.chosen.id,          // Prompt模板ID
  content: '...',                              // 模板内容
  variables: ['category', 'targetMarket'],    // 变量列表
  decisionId: promptRecommendation.decisionId  // 决策ID
}
```

### 3. 推荐数据持久化

推荐引擎自动将推荐决策保存到数据库：

- **`recommendation_candidate_sets`** - 候选集
- **`recommendation_candidates`** - 候选项（M个粗排候选）
- **`recommendation_decisions`** - 推荐决策
- **`recommendation_events`** - 反馈事件

可以在 Admin 后台查看推荐历史和效果。

## 🖥️ 界面展示

### 推荐结果卡片

当用户第一次点击"生成预览"后，会在表单下方显示推荐结果：

```
┌────────────── ✨ AI 推荐结果 ──────────────┐
│                                             │
│  推荐模型                 推荐 Prompt       │
│  ─────────                ──────────        │
│  Gemini 2.0 Flash         模板ID: clxxxx... │
│  Google                   变量: category,   │
│  适合3C数码类目的         targetMarket,     │
│  人设生成，速度快且       productInfo        │
│  质量高                   决策ID: cmxxx...  │
│  决策ID: cmxxx...                           │
│                                             │
└─────────────────────────────────────────────┘
```

## 📈 推荐引擎特性

### 1. 多阶段推荐

- **粗排（Coarse Ranking）**：快速筛选 M 个候选
- **精排（Fine Ranking）**：精细评分选出 K 个最佳
- **Exploration**：使用 epsilon-greedy 策略探索新候选

### 2. 上下文感知

考虑因素：
- ✅ 类目（category）
- ✅ 目标市场/地区（region）
- ✅ 渠道（channel）
- ✅ 商品信息（subjectRef）
- ✅ 任务类型（taskType）

### 3. 约束条件

- ✅ 最大延迟（maxLatencyMs）
- ✅ 最大成本（maxCost）
- ✅ JSON 格式要求（jsonRequirement）

### 4. 反馈循环

推荐结果包含 `decisionId`，可用于：
- 记录用户是否采纳
- 记录生成质量
- 更新推荐模型权重

## 🔍 调试信息

### 控制台日志

```bash
🔍 开始推荐模型，类目: 3C数码
✅ 模型推荐完成: gemini-2.0-flash-exp
✅ Prompt推荐完成: clxxxxx...
🎯 推荐结果: {
  model: gemini-2.0-flash-exp,
  prompt: clxxxxx...,
  modelDecisionId: cmxxxxx...,
  promptDecisionId: cmxxxxx...
}
```

### 数据库查询

```sql
-- 查看推荐历史
SELECT * FROM recommendation_decisions 
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

-- 查看推荐候选
SELECT * FROM recommendation_candidates
WHERE candidate_set_id = 'xxx';

-- 查看推荐效果
SELECT * FROM recommendation_outcomes
WHERE decision_id = 'xxx';
```

## 🎛️ 推荐策略配置

### 修改推荐设置

```sql
-- 更新 epsilon-greedy 探索率
UPDATE recommendation_settings
SET epsilon = 0.15
WHERE scenario = 'task->model';

-- 更新候选数量
UPDATE recommendation_settings
SET m_coarse = 20,  -- 粗排候选数
    k_fine = 5      -- 精排候选数
WHERE scenario = 'task->prompt';
```

### 配置项说明

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `mCoarse` | 10 | 粗排候选数量 |
| `kFine` | 3 | 精排候选数量 |
| `epsilon` | 0.10 | 探索概率（10%） |
| `minExplore` | 0.05 | 最小探索率 |
| `diversity` | true | 是否考虑多样性 |

## 📊 监控指标

### 推荐质量

- **采纳率**：用户使用推荐结果的比例
- **满意度**：用户对生成结果的评分
- **延迟**：推荐响应时间
- **成本**：AI 调用成本

### 查看推荐效果

访问 Admin 后台的推荐监控页面：
```
http://localhost:3000/admin → 推荐监控
```

## 🔧 Scorer 实现

### Task->Model Scorer

位置：`src/services/recommendation/scorers/taskToModel.ts`

评分因素：
- 模型能力匹配度
- 历史表现
- 成本效益
- 延迟要求

### Task->Prompt Scorer

位置：`src/services/recommendation/adapters/taskToPromptAdapter.ts`

评分因素：
- Prompt 模板匹配度
- 历史成功率
- 业务模块匹配
- 变量完整性

## 🚀 使用效果

### Before（简化推荐）
```typescript
// 硬编码推荐
const model = 'gemini-2.0-flash-exp'
const prompt = 'default-template'
```

### After（推荐引擎）
```typescript
// 智能推荐
const model = await recommendRank({ scenario: 'task->model', ... })
const prompt = await recommendRank({ scenario: 'task->prompt', ... })

// 特点：
// ✅ 考虑类目特性
// ✅ 考虑目标市场
// ✅ 学习历史表现
// ✅ 持续优化
// ✅ 可追溯决策
```

## 📝 后续优化

### 1. 增强评分器

- 添加更多上下文特征
- 使用机器学习模型
- A/B 测试不同策略

### 2. 反馈收集

```typescript
// 记录用户反馈
await recordRecommendationFeedback({
  decisionId: modelRecommendation.decisionId,
  feedbackType: 'quality_score',
  score: 0.85
})
```

### 3. 冷启动处理

- 新类目使用默认策略
- 逐步学习优化
- 跨类目迁移学习

## ✅ 验证清单

- [ ] 推荐 API 正常响应
- [ ] 返回有效的模型和 Prompt
- [ ] 决策 ID 正确保存到数据库
- [ ] 界面显示推荐结果
- [ ] 控制台日志正确输出
- [ ] 可以在 Admin 查看推荐历史

---

**更新时间**: 2025-10-29  
**状态**: ✅ 已集成真实推荐引擎  
**版本**: v4.0 - 推荐引擎集成

