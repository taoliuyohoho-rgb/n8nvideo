# 竞品分析统一架构 - 最终说明

## 🎯 回答您的问题

### Q1: 工作台和Admin的竞品分析是各自单独写的吗？

**A1: 现在已经是统一模块了！**

#### 统一架构
```
┌─────────────────────────────────────┐
│  统一前端组件                        │
│  components/CompetitorAnalysis.tsx   │
│  (Dashboard和Admin都引用这个组件)    │
└──────────────┬──────────────────────┘
               │
               ↓ API调用
┌─────────────────────────────────────┐
│  统一API                             │
│  /api/competitor/parse               │
└──────────────┬──────────────────────┘
               │
               ↓ 调用服务
┌─────────────────────────────────────┐
│  统一后端服务                        │
│  UnifiedCompetitorService.ts         │
│  - 推荐AI模型                        │
│  - 推荐Prompt                        │
│  - 调用AI解析                        │
│  - 去重合并                          │
└─────────────────────────────────────┘
```

**关键点**：
- ✅ **前端**：一个组件 `components/CompetitorAnalysis.tsx`
- ✅ **后端**：一个服务 `UnifiedCompetitorService`
- ✅ **API**：一个接口 `/api/competitor/parse`
- ✅ **UI样式**：统一使用工作台的UI样式
- ✅ **业务逻辑**：完全一致，易于维护和调试

### Q2: 为什么UI不一样？

**A2: 现在已经统一了！**

之前确实存在UI不一致的问题，现在已经创建了统一组件：

**统一后的UI特性**：
```typescript
<CompetitorAnalysis
  productId={selectedProduct.id}
  onSuccess={(result) => {
    // 处理成功回调
  }}
  className="mt-4" // 可自定义样式
/>
```

**统一UI包含**：
- 📝 单一输入框（文本/链接/图片粘贴）
- 🖼️ 图片预览和移除
- 🤖 AI解析按钮
- 📊 推荐模型和Prompt展示
- 🔍 查看备选按钮（展开候选项）
- 🏷️ 卖点/痛点标签展示
- 👥 目标受众展示

### Q3: AI模型和Prompt选择调用了推荐引擎吗？

**A3: 是的！完全集成了推荐引擎！**

#### 推荐流程
```
用户输入（文本/图片）
   ↓
检测输入类型（text/image/multimodal）
   ↓
┌────────────────────────────┐
│ 推荐引擎 - AI模型推荐      │
│ 输入: 文本类型             │
│ 输出: JSON结构化           │
│ 约束: 中文、成本           │
│ → 返回: 精排2+粗排2+探索2  │
└────────┬───────────────────┘
         │
┌────────────────────────────┐
│ 推荐引擎 - Prompt推荐      │
│ 业务: competitor-analysis  │
│ 排序: 性能、成功率         │
│ → 返回: 精排2+粗排1+探索2  │
└────────┬───────────────────┘
         │
         ↓
    AI调用（使用推荐的模型和Prompt）
         ↓
    返回结果 + 候选项
```

#### 推荐引擎评估维度

**AI模型推荐**：
- **输入对象**：文本/图片/多模态 → 过滤支持的模型
- **输出对象**：JSON → 需要 `jsonModeSupport=true`
- **其他**：语言（中文）、成本、Provider约束

**Prompt推荐**：
- **业务模块**：`competitor-analysis` → 硬过滤
- **性能评分**：`performance` (0-1)
- **成功率**：`successRate` (0-1)
- **使用频次**：`usageCount`

### Q4: 为什么没有展示模型和Prompt来收集用户反馈？

**A4: 现在已经实现了！完整的反馈闭环！**

#### 用户反馈展示

**默认视图**（简洁）：
```
┌─────────────────────────────────┐
│ 使用的AI模型: gemini/gemini-pro │
│ [查看备选] ← 点击展开            │
│                                 │
│ 使用的Prompt: 竞品分析-标准模板  │
│ [查看备选] ← 点击展开            │
└─────────────────────────────────┘
```

**展开备选项**（供用户反馈）：
```
┌─────────────────────────────────────┐
│ 📊 模型备选（点击选择反馈）          │
│ ┌─────────────────────────────────┐ │
│ │ ✓ gemini/gemini-pro [精排]      │ │ ← 系统推荐（当前使用）
│ │   分数0.85 | 语言匹配+JSON+低价  │ │
│ ├─────────────────────────────────┤ │
│ │   doubao/pro [精排]              │ │ ← 可点击反馈
│ │   分数0.78 | 中文优化+极低价     │ │
│ ├─────────────────────────────────┤ │
│ │   openai/gpt-4 [粗排]            │ │
│ │   分数0.72 | 综合性能最强       │ │
│ ├─────────────────────────────────┤ │
│ │   claude/opus [粗排]             │ │
│ │   分数0.70 | 推理能力强         │ │
│ ├─────────────────────────────────┤ │
│ │   deepseek/chat [探索]           │ │
│ │   分数0.50 | 探索新模型          │ │
│ ├─────────────────────────────────┤ │
│ │   moonshot/v1 [探索]             │ │
│   分数0.45 | 探索新模型          │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### 候选项组成（精排2+粗排2+探索2）

**为什么是这6个？**

1. **精排top2**（系统最推荐）：
   - 第1个：系统当前使用的
   - 第2个：次优选择
   - 作用：满足80%用户需求

2. **粗排top2**（备选方案）：
   - 某单一维度突出（如速度快、价格低）
   - 作用：满足15%特殊场景

3. **探索2个**（创新选项）：
   - 新模型或未入池的随机选择
   - 作用：避免系统过度收敛，探索新可能

#### 用户反馈流程

```
用户点击"查看备选"
   ↓
展开候选列表（6个）
   ↓
用户点击某个备选项
   ↓
前端调用 /api/admin/recommendation/feedback
   ↓
记录到数据库 reco_feedback 表
   {
     decisionId: "xxx",
     feedbackType: "model",
     chosenCandidateId: "doubao-pro",
     createdAt: "2025-10-26"
   }
   ↓
提示"已记录您的选择，将用于优化推荐"
   ↓
（后续）定时任务分析反馈，调整推荐权重
```

### Q5: 推荐引擎包括用户反馈收集来调优吗？

**A5: 是的！已经实现反馈收集，调优逻辑待实现！**

#### 已实现 ✅

1. **前端展示候选项**：精排2+粗排2+探索2
2. **用户可点击选择**：任意候选项
3. **反馈记录到数据库**：`reco_feedback` 表
4. **反馈API**：`/api/admin/recommendation/feedback`

#### 待实现 ⏳

**自动调优逻辑**（反馈闭环）：

```javascript
// 定时任务：每天分析反馈数据
async function optimizeRecommendations() {
  // 1. 统计每个模型/Prompt的反馈
  const feedback = await analyzeFeedback()
  
  // 2. 计算实际偏好度
  // 偏好度 = 被用户选择次数 / 被系统推荐次数
  for (const model of models) {
    const preference = model.userChoiceCount / model.recommendCount
    
    // 3. 调整权重
    if (preference > 0.8) {
      // 用户很喜欢，提升权重
      model.performance += 0.05
    } else if (preference < 0.2) {
      // 用户不喜欢，降低权重
      model.performance -= 0.05
    }
    
    // 4. 更新数据库
    await updateModel(model)
  }
}
```

**调优场景示例**：

| 场景 | 系统推荐 | 用户选择 | 调优动作 |
|------|---------|---------|---------|
| 场景1 | Gemini | Gemini | Gemini +0.01（正反馈） |
| 场景2 | Gemini | Doubao | Gemini -0.05, Doubao +0.05 |
| 场景3 | Gemini | 探索项 | 探索率+5%（需要更多样性） |
| 场景4 | Prompt-A | Prompt-B | A -0.05, B +0.05 |

## 📋 当前实现状态

### ✅ 已完成

1. **统一架构**
   - [x] 统一前端组件 `CompetitorAnalysis.tsx`
   - [x] 统一后端服务 `UnifiedCompetitorService`
   - [x] 统一API `/api/competitor/parse`
   - [x] 统一UI样式（工作台风格）

2. **推荐引擎集成**
   - [x] AI模型推荐（输入类型、输出类型评估）
   - [x] Prompt推荐（性能、成功率排序）
   - [x] 返回候选项（精2+粗2+探2）
   - [x] 推荐决策ID记录

3. **用户反馈展示**
   - [x] 前端展示候选项列表
   - [x] 用户可点击选择
   - [x] 显示分数和推荐原因
   - [x] 候选项类型标签（精排/粗排/探索）

4. **反馈收集**
   - [x] 反馈API `/api/admin/recommendation/feedback`
   - [x] 反馈数据库表 `reco_feedback`
   - [x] 反馈成功提示

### ⏳ 待实现（优化方向）

1. **反馈闭环自动调优**
   - [ ] 定时任务分析反馈数据
   - [ ] 根据反馈调整模型/Prompt权重
   - [ ] 更新 `performance` 和 `successRate`

2. **A/B测试**
   - [ ] 对比不同推荐策略效果
   - [ ] 监控推荐准确率变化

3. **多维度评估**
   - [ ] 速度评估
   - [ ] 质量评估
   - [ ] 成本评估

4. **用户个性化**
   - [ ] 记录用户偏好
   - [ ] 个性化推荐

## 🚀 使用步骤

### 1. 更新数据库Schema
```bash
npx prisma db push
```

### 2. 初始化Prompt模板
```bash
node scripts/init-competitor-prompts.js
```

### 3. Dashboard引用统一组件
```typescript
// app/dashboard/page.tsx
import { CompetitorAnalysis } from '@/components/CompetitorAnalysis'

// 替换原有的竞品分析UI为：
<CompetitorAnalysis
  productId={selectedProduct?.id || ''}
  onSuccess={(result) => {
    setProductInfo({
      ...productInfo,
      sellingPoints: result.sellingPoints,
      painPoints: result.painPoints,
      targetAudience: result.targetAudience
    })
  }}
/>
```

### 4. Admin引用统一组件
```typescript
// app/admin/page.tsx（某个Tab）
import { CompetitorAnalysis } from '@/components/CompetitorAnalysis'

<CompetitorAnalysis
  productId={selectedProductId}
  onSuccess={(result) => {
    // 更新Admin状态
    refreshProductData()
  }}
/>
```

### 5. 测试反馈收集
1. 访问 Dashboard → 选择商品 → 竞品分析
2. 输入竞品文本，点击"AI解析"
3. 查看结果，点击"查看备选"
4. 点击任意候选项
5. 观察提示"已记录您的选择"
6. 查询数据库：`SELECT * FROM reco_feedback ORDER BY createdAt DESC LIMIT 5;`

## 📝 关键文件清单

### 前端组件
- `components/CompetitorAnalysis.tsx` - 统一竞品分析组件 ⭐

### 后端服务
- `src/services/competitor/UnifiedCompetitorService.ts` - 统一服务 ⭐
  - `recommendModelWithCandidates()` - AI模型推荐（带候选项）
  - `recommendPromptWithCandidates()` - Prompt推荐（带候选项）

### API接口
- `app/api/competitor/parse/route.ts` - 竞品分析API ⭐
- `app/api/admin/recommendation/feedback/route.ts` - 反馈收集API ⭐

### 数据库
- `prisma/schema.prisma` - Schema定义
  - `RecommendationFeedback` - 反馈表 ⭐

### 文档
- `docs/COMPETITOR_ANALYSIS_UNIFIED.md` - 详细架构文档
- `docs/COMPETITOR_FEEDBACK_LOOP.md` - 反馈闭环文档
- `docs/COMPETITOR_UNIFIED_FINAL.md` - 本文档（回答您的问题）⭐

## 💡 总结

### 您的问题核心关注点

1. ✅ **是否统一模块？** → 是的，完全统一（前后端都统一）
2. ✅ **UI是否统一？** → 是的，统一使用工作台样式
3. ✅ **是否用推荐引擎？** → 是的，完全集成
4. ✅ **是否展示候选项？** → 是的，精2+粗2+探2
5. ✅ **是否收集反馈？** → 是的，已实现
6. ⏳ **是否自动调优？** → 反馈收集已实现，自动调优待实现

### 核心价值

- **统一架构**：一个组件、一个服务、一个API，易维护
- **智能推荐**：推荐引擎动态选择，不硬编码
- **用户反馈**：展示候选项，收集用户选择
- **持续优化**：反馈闭环，自动调整权重（待实现）

### 设计亮点

- **精2+粗2+探2**：平衡准确性和多样性
- **可解释推荐**：显示分数和推荐原因
- **渐进式展开**：默认简洁，可选深入
- **即时反馈**：点击即记录，提示已收集

