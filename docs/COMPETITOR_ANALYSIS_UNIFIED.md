# 竞品分析统一架构

## 概述

竞品分析模块已统一，Admin和Dashboard共用同一套服务，通过**推荐引擎**动态选择AI模型和Prompt模板。

## 架构设计

### 核心服务
`UnifiedCompetitorService` - 统一竞品分析服务
- 位置：`src/services/competitor/UnifiedCompetitorService.ts`
- 功能：统一入口，协调推荐引擎、AI调用、数据合并

### 推荐引擎集成

#### 1. AI模型推荐（task->model）
**评估维度**：
- **输入对象**：文本/图片/多模态
  - 文本：所有模型均可
  - 图片：仅Gemini等多模态模型
  - 多模态：仅Gemini
- **输出对象**：JSON结构化输出
  - 需要 `jsonModeSupport: true`
- **其他约束**：
  - 语言：中文（zh）
  - 成本：根据预算筛选
  - Provider白名单/黑名单

**评分逻辑**（`taskToModelScorer`）：
```typescript
// 粗排特征
f.langMatch = 支持中文 ? 1 : 0.7
f.jsonSupport = 支持JSON模式 ? 1 : 0
f.price = 1 - min(1, price/0.1) // 价格越低越好

// 综合分数
score = (f.langMatch * 1.0 + f.jsonSupport * 0.6 + f.price * 0.5) / 2.1
```

**降级策略**：
- 多模态/图片 → 默认Gemini
- 纯文本 → 默认Gemini/最优模型

#### 2. Prompt推荐（task->prompt）
**评估维度**：
- **业务模块**：`businessModule = 'competitor-analysis'`
- **历史性能**：`performance` (0-1)
- **成功率**：`successRate` (0-1)
- **使用频次**：`usageCount`
- **是否默认**：`isDefault`

**评分逻辑**（`taskToPromptScorer`）：
```typescript
// 基础分
score += isDefault ? 30 : 10

// 历史性能分 (0-40)
score += performance * 40

// 成功率分 (0-30)
score += successRate * 30

// 变量匹配度 (0-15)
score += matchRate * 15

// 使用频次 (0-10)
score += min(10, log10(usageCount + 1) * 3)
```

**Prompt模板变量**：
```handlebars
{{minSellingPoints}} - 最少卖点数
{{maxSellingPoints}} - 最多卖点数
{{minPainPoints}} - 最少痛点数
{{maxPainPoints}} - 最多痛点数
{{maxOther}} - 最多其他信息数
{{text}} - 输入文本
{{hasImages}} - 是否有图片
{{imageCount}} - 图片数量
```

### 数据流程

```
用户输入（文本/图片/链接）
  ↓
检测输入类型（text/image/multimodal）
  ↓
推荐引擎选择AI模型
  ├─ 输入类型: multimodal → Gemini
  ├─ 输入类型: text → 综合评分最优
  └─ 约束条件: JSON输出、中文、成本
  ↓
推荐引擎选择Prompt模板
  ├─ 业务模块: competitor-analysis
  ├─ 排序: performance > successRate > usageCount
  └─ 降级: 默认模板
  ↓
填充Prompt变量
  ↓
AI Executor调用（队列/重试/断路器）
  ↓
JSON解析与清洗
  ↓
去重合并到商品库
  ↓
返回结果（包含模型/Prompt信息）
```

## 使用方式

### API调用
```typescript
POST /api/competitor/parse

{
  productId: "xxx",
  input: "竞品文本或链接",
  images: ["data:image/png;base64,..."],
  isUrl: false
}

// 响应
{
  success: true,
  data: {
    sellingPoints: ["卖点1", "卖点2", ...],
    painPoints: ["痛点1", ...],
    targetAudience: "18-45岁女性",
    other: ["使用场景1", ...],
    aiModelUsed: "gemini/gemini-pro",
    promptUsed: "竞品分析-标准模板",
    addedSellingPoints: 5,
    addedPainPoints: 2,
    totalSellingPoints: 12,
    totalPainPoints: 5
  }
}
```

### 服务调用
```typescript
import { unifiedCompetitorService } from '@/src/services/competitor/UnifiedCompetitorService'

const result = await unifiedCompetitorService.analyzeCompetitor({
  productId: 'xxx',
  input: '竞品文本',
  images: ['data:image...'],
  isUrl: false
})
```

## Prompt模板管理

### 数据库表
`prompt_templates` - Prompt模板库
```prisma
model PromptTemplate {
  id             String   // 唯一ID
  name           String   // 模板名称
  businessModule String   // 业务模块
  content        String   // Prompt内容
  variables      String?  // 变量定义(JSON)
  description    String?  // 描述
  performance    Float?   // 性能评分(0-1)
  usageCount     Int      // 使用次数
  successRate    Float?   // 成功率(0-1)
  isActive       Boolean  // 是否激活
  isDefault      Boolean  // 是否默认
  createdBy      String?  // 创建者
  createdAt      DateTime
  updatedAt      DateTime
}
```

### 初始化模板
```bash
node scripts/init-competitor-prompts.js
```

**内置模板**：
1. **竞品分析-标准模板** (默认)
   - 适用：大多数商品
   - 性能：0.85
   - 成功率：0.90

2. **竞品分析-快速版**
   - 适用：简单商品
   - 性能：0.80
   - 成功率：0.88

### 添加自定义模板
```sql
INSERT INTO prompt_templates (
  id, name, businessModule, content, 
  variables, performance, successRate, 
  isActive, isDefault, createdBy
) VALUES (
  'competitor-analysis-custom-v1',
  '竞品分析-自定义模板',
  'competitor-analysis',
  '自定义Prompt内容...',
  '{"minSellingPoints": 5}',
  0.90,
  0.95,
  true,
  false,
  'admin'
);
```

## 模型评估细节

### 输入对象评估
```typescript
输入类型 | 支持模型
--------|----------
text    | gemini, doubao, openai, deepseek, claude
image   | gemini (仅)
multimodal | gemini (仅)
```

### 输出对象评估
```typescript
输出类型 | 要求
--------|------
JSON    | jsonModeSupport = true
自然语言 | 无要求
代码    | toolUseSupport = true
```

### 模型特性矩阵
```typescript
模型      | JSON | 多模态 | 价格(/1k) | 中文
---------|------|--------|-----------|-----
gemini   | ✅   | ✅     | 0.02      | ✅
doubao   | ✅   | ❌     | 0.01      | ✅
openai   | ✅   | ✅     | 0.05      | ✅
deepseek | ✅   | ❌     | 0.008     | ✅
claude   | ✅   | ✅     | 0.08      | ✅
```

## 监控与优化

### 记录决策
每次推荐都会记录：
- `reco_decisions` - 决策记录
- `reco_candidate_sets` - 候选集
- `reco_candidates` - 候选项详情

### 反馈闭环
1. 记录使用的模型和Prompt
2. 收集解析成功率
3. 更新 `performance` 和 `successRate`
4. 调整推荐权重

### 优化策略
- **探索vs利用**：10%探索新模板
- **多样性**：避免推荐过于相似的模板
- **A/B测试**：对比不同Prompt效果

## 最佳实践

### 1. 不要硬编码模型
❌ 错误：
```typescript
aiExecutor.execute({
  provider: 'gemini', // 硬编码
  prompt: '...'
})
```

✅ 正确：
```typescript
const model = await recommendModel(inputType)
aiExecutor.execute({
  provider: model.provider, // 推荐引擎选择
  prompt: '...'
})
```

### 2. 不要硬编码Prompt
❌ 错误：
```typescript
const prompt = `请分析...` // 硬编码
```

✅ 正确：
```typescript
const promptTemplate = await recommendPrompt()
const prompt = fillVariables(promptTemplate.content, variables)
```

### 3. 记录模型和Prompt
```typescript
console.log(`使用模型: ${model.provider}/${model.model}`)
console.log(`使用Prompt: ${promptTemplate.name}`)
// 返回给前端展示
```

## 扩展点

### 添加新业务模块
1. 定义 `businessModule`（如 `product-painpoint`）
2. 创建对应Prompt模板
3. 实现粗排/精排逻辑（可选）
4. 调用统一推荐引擎

### 添加新AI模型
1. 在 `estimation_models` 表添加模型
2. 配置 `provider`, `jsonModeSupport`, `langs`
3. 推荐引擎自动评估选择

### 调整评分权重
修改 `taskToModelScorer` 或 `taskToPromptScorer` 中的权重参数。

## API对比

### 商品竞品分析 vs 视频竞品分析

| 特性 | 商品竞品分析 | 视频竞品分析 |
|------|------------|------------|
| API路径 | `/api/competitor/parse` | `/api/competitor/analyze` |
| 输入类型 | 文本/图片/链接 | 视频URL |
| 输出结果 | 卖点/痛点/目标受众 | 视频分析/脚本/数据 |
| 推荐引擎 | ✅ 集成 | ❌ 未集成 |
| 使用场景 | Dashboard/Admin商品管理 | Admin视频分析 |
| 服务类 | `UnifiedCompetitorService` | `CompetitorAnalysisService` |

**建议**：
- Dashboard竞品分析 → 使用 `/api/competitor/parse`
- Admin视频分析 → 使用 `/api/competitor/analyze`
- 后续可考虑将视频竞品分析也接入推荐引擎

## 总结

✅ 统一架构：Admin和Dashboard共用商品竞品分析
✅ 动态选择：推荐引擎选择AI和Prompt
✅ 可扩展：新模块/模型/Prompt易于添加
✅ 可监控：记录决策，反馈闭环优化
✅ 场景分离：商品分析和视频分析使用不同API

