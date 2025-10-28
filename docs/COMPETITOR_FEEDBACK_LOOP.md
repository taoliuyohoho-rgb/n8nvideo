# 竞品分析 - 用户反馈闭环实现

## 概述

竞品分析模块现已完全统一，并实现了推荐引擎的用户反馈闭环。

## ✅ 已实现功能

### 1. 统一前后端组件
- **统一前端组件**：`components/CompetitorAnalysis.tsx`
  - Admin和Dashboard都可以直接引用
  - 统一UI样式和交互逻辑
  - 支持文本/图片/链接输入
  - 支持图片粘贴（Ctrl/Cmd+V）

- **统一后端服务**：`src/services/competitor/UnifiedCompetitorService.ts`
  - 单一服务类，两个地方调用
  - 集成推荐引擎选择AI模型和Prompt
  - 降级处理和错误提示

- **统一API**：`/api/competitor/parse`
  - 接收 `returnCandidates` 参数，控制是否返回候选项
  - 返回推荐决策ID（用于反馈）

### 2. 推荐引擎集成

#### AI模型推荐
**返回结构**：
```typescript
{
  chosen: { provider: 'gemini', model: 'gemini-pro' },
  candidates: [
    // 精排top2
    { id: 'xxx', title: 'gemini/gemini-pro', score: 0.85, reason: '...', type: 'fine-top' },
    { id: 'yyy', title: 'doubao/pro', score: 0.78, reason: '...', type: 'fine-top' },
    // 粗排top2（不在精排中）
    { id: 'zzz', title: 'openai/gpt-4', score: 0.72, reason: '...', type: 'coarse-top' },
    // 探索2个（未入池的随机）
    { id: 'aaa', title: 'deepseek/chat', score: 0.50, reason: '...', type: 'explore' }
  ],
  decisionId: 'decision-123'
}
```

**候选项组成**：
- **精排top2**：推荐引擎精排后的前2个
- **粗排top2**：粗排中不在精排的前2个
- **探索2个**：未入池的随机2个（探索新模型）

#### Prompt推荐
**返回结构**：
```typescript
{
  chosen: { name: '竞品分析-标准模板', content: '...', variables: {...} },
  candidates: [
    // 精排top2
    { id: 'prompt-1', name: '竞品分析-标准模板', score: 0.90, reason: '性能0.85 成功率0.90 默认', type: 'fine-top' },
    { id: 'prompt-2', name: '竞品分析-快速版', score: 0.80, reason: '性能0.80 成功率0.88', type: 'fine-top' },
    // 粗排top1（使用频次高）
    { id: 'prompt-3', name: '竞品分析-详细版', score: 0.50, reason: '使用50次', type: 'coarse-top' },
    // 探索2个（新模板）
    { id: 'prompt-4', name: '竞品分析-实验版', score: 0.30, reason: '新模板探索（使用3次）', type: 'explore' }
  ]
}
```

**候选项组成**：
- **精排top2**：按性能和成功率排序的前2个
- **粗排top1**：按使用频次排序的前1个（不在精排中）
- **探索2个**：新模板（使用次数<10）

### 3. 前端展示与反馈收集

#### UI展示
```
┌─────────────────────────────────┐
│ 竞品分析                         │
├─────────────────────────────────┤
│ [输入框：文本/链接/粘贴图片]      │
│ [已粘贴图片预览]                 │
│ [AI解析按钮]                     │
├─────────────────────────────────┤
│ 使用的AI模型: gemini/gemini-pro  │
│ [查看备选] ← 点击展开              │
├─────────────────────────────────┤
│ 📊 模型备选（点击选择反馈）       │
│ ┌─────────────────────────────┐ │
│ │ ✓ gemini/gemini-pro [精排]  │ │ ← 当前选择
│ │   分数0.85 | 语言匹配+JSON   │ │
│ ├─────────────────────────────┤ │
│ │   doubao/pro [精排]          │ │ ← 可点击反馈
│ │   分数0.78 | 语言匹配+低价   │ │
│ ├─────────────────────────────┤ │
│ │   openai/gpt-4 [粗排]        │ │
│ │   分数0.72 | 综合性能        │ │
│ ├─────────────────────────────┤ │
│ │   deepseek/chat [探索]       │ │
│ │   分数0.50 | 探索新模型      │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 使用的Prompt: 竞品分析-标准模板   │
│ [查看备选] ← 点击展开              │
├─────────────────────────────────┤
│ 卖点 (12)                        │
│ [卖点标签们...]                  │
│ 痛点 (5)                         │
│ [痛点标签们...]                  │
└─────────────────────────────────┘
```

#### 用户反馈流程
1. 用户点击"查看备选"按钮
2. 展开候选列表（精排2+粗排2+探索2）
3. 用户点击备选项
4. 前端调用 `/api/admin/recommendation/feedback`
5. 记录用户选择到数据库（`reco_feedback`表）
6. 提示"已记录您的选择，将用于优化推荐"

### 4. 反馈数据库表

```sql
reco_feedback (新增)
├── id                  # 反馈ID
├── decisionId          # 推荐决策ID
├── feedbackType        # 反馈类型（'model' / 'prompt'）
├── chosenCandidateId   # 用户选择的候选项ID
├── reason              # 反馈原因（可选）
└── createdAt           # 反馈时间
```

## 📋 使用方式

### Dashboard使用统一组件

```typescript
// app/dashboard/page.tsx
import { CompetitorAnalysis } from '@/components/CompetitorAnalysis'

<CompetitorAnalysis
  productId={selectedProduct?.id || ''}
  onSuccess={(result) => {
    // 更新表单数据
    setProductInfo({
      ...productInfo,
      sellingPoints: result.sellingPoints,
      painPoints: result.painPoints
    })
  }}
/>
```

### Admin使用统一组件

```typescript
// app/admin/page.tsx (某个Tab)
import { CompetitorAnalysis } from '@/components/CompetitorAnalysis'

<CompetitorAnalysis
  productId={selectedProductId}
  onSuccess={(result) => {
    console.log('分析成功:', result)
    // 更新Admin的状态
  }}
  className="mt-4"
/>
```

## 🔄 反馈闭环优化（待实现）

### 当前状态
- ✅ 前端展示候选项
- ✅ 用户可点击选择
- ✅ 反馈记录到数据库
- ⏳ 根据反馈自动调整推荐权重（TODO）

### 优化逻辑（待实现）

#### 场景1：用户选择备选项（不是系统推荐）
**说明**：系统推荐A，用户选择B，说明推荐不够好

**优化**：
- 降低A的推荐权重（performance -= 0.05）
- 提高B的推荐权重（performance += 0.05）
- 记录原因："用户反馈偏好B"

#### 场景2：用户未选择（使用系统推荐）
**说明**：系统推荐A，用户直接使用，说明推荐OK

**优化**：
- 保持A的推荐权重（或微调 += 0.01）
- 记录成功次数（successCount++）
- 更新成功率（successRate = successCount / totalCount）

#### 场景3：用户多次选择探索项
**说明**：用户多次选择探索项，说明当前精排不满足需求

**优化**：
- 将探索项提升到精排
- 调整粗排/精排权重配置
- 增加探索概率（从10% → 20%）

### 实现步骤（TODO）

1. **定时任务**：每天分析反馈数据
2. **统计分析**：
   - 每个模型/Prompt被选择的次数
   - 每个模型/Prompt被系统推荐但用户换掉的次数
   - 计算实际偏好度 = 被选次数 / 被推荐次数
3. **权重调整**：
   - 更新 `estimation_models.performance`
   - 更新 `prompt_templates.performance`
   - 更新 `prompt_templates.successRate`
4. **验证效果**：
   - A/B测试：对比调整前后的用户满意度
   - 监控推荐准确率变化

## 🎯 推荐引擎设计思想

### 候选项组成原则

**目标**：既保证推荐准确性，又给用户选择空间，还能探索新模型

**精排top2**：
- 作用：展示系统认为最优的选项
- 依据：综合评分最高（性能+成功率+成本）

**粗排top2**：
- 作用：展示次优但可能有特殊优势的选项
- 依据：某单一维度突出（如使用频次、特殊场景）

**探索2个**：
- 作用：引入新模型/Prompt，避免系统过度收敛
- 依据：新模型（使用次数低）或随机选择

### 为什么是"精2+粗2+探2"？

- **精2**：给用户最优选择，满足80%场景
- **粗2**：提供替代方案，满足15%特殊场景
- **探2**：探索新可能，满足5%创新需求
- **共6个**：不多不少，用户可快速浏览但不overwhelm

### 用户反馈价值

**隐式反馈**：
- 用户使用系统推荐 → 推荐OK
- 用户选择备选 → 推荐不够好
- 用户选择探索 → 需要增加多样性

**显式反馈**：
- 用户可选填反馈原因（如"这个模型更快"）
- 用于定性分析，优化推荐逻辑

## 📊 效果监控

### 关键指标

1. **推荐准确率** = 用户使用系统推荐次数 / 总推荐次数
2. **备选使用率** = 用户选择备选次数 / 总推荐次数
3. **探索使用率** = 用户选择探索项次数 / 总推荐次数
4. **反馈转化率** = 用户反馈次数 / 展示候选次数

### 预期目标

- 推荐准确率：>80%（大多数用户直接使用推荐）
- 备选使用率：10-15%（部分用户有特殊需求）
- 探索使用率：<5%（少量创新用户）
- 反馈转化率：>20%（20%的用户会点击查看备选）

## 🚀 后续优化计划

### 短期（1周）
- [ ] 实现Dashboard和Admin引用统一组件
- [ ] 测试用户反馈收集流程
- [ ] 监控反馈数据积累

### 中期（1月）
- [ ] 实现反馈闭环自动调优
- [ ] A/B测试对比效果
- [ ] 优化候选项选择算法

### 长期（3月）
- [ ] 多维度评估（速度、质量、成本）
- [ ] 用户画像个性化推荐
- [ ] 实时学习和动态调整

## 📝 总结

### 核心价值

1. **统一架构**：前后端组件统一，易维护
2. **智能推荐**：推荐引擎动态选择，不硬编码
3. **反馈闭环**：收集用户选择，持续优化
4. **探索vs利用**：平衡准确性和多样性

### 关键设计

- **前端**：统一组件`CompetitorAnalysis.tsx`
- **后端**：统一服务`UnifiedCompetitorService`
- **API**：统一接口`/api/competitor/parse`
- **反馈**：`/api/admin/recommendation/feedback`

### 用户体验

- **默认简洁**：直接展示推荐结果
- **可选深入**：点击"查看备选"展开详情
- **即时反馈**：点击备选即记录，提示已收集
- **透明可解释**：显示分数和推荐原因

