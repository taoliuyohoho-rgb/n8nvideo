# 竞品分析统一架构实现总结

## 🎯 核心改进

### 1. 统一架构
- **Admin和Dashboard**：共用同一个竞品分析服务（`UnifiedCompetitorService`）
- **一致性**：相同的业务逻辑、去重策略、错误处理

### 2. 推荐引擎集成
- **AI模型动态选择**：不再硬编码，根据输入类型（文本/图片/多模态）自动选择最优模型
- **Prompt动态选择**：不再硬编码，从Prompt库（`prompt_templates`表）中根据性能、成功率、使用频次智能召回

### 3. 核心评估维度

#### AI模型推荐
**主要评估维度**：
1. **输入对象**：
   - 文本 → 所有模型可选
   - 图片 → 仅Gemini等多模态模型
   - 多模态 → 仅Gemini
2. **输出对象**：
   - JSON结构化 → 需要 `jsonModeSupport=true`
   - 自然语言 → 无约束
3. **其他约束**：
   - 语言支持（中文/英文）
   - 成本预算
   - Provider白名单/黑名单

**评分公式**：
```
score = (langMatch * 1.0 + jsonSupport * 0.6 + price * 0.5) / 2.1
```

#### Prompt推荐
**主要评估维度**：
1. **业务模块匹配**：`businessModule = 'competitor-analysis'`（硬过滤）
2. **历史性能**：`performance` (0-1) → 权重40分
3. **成功率**：`successRate` (0-1) → 权重30分
4. **是否默认**：`isDefault=true` → 权重30分
5. **使用频次**：`usageCount` → 权重10分（对数缩放）

**评分公式**：
```
score = (isDefault ? 30 : 10) 
      + performance * 40 
      + successRate * 30 
      + log10(usageCount+1) * 3
```

## 📂 文件结构

### 新增文件
```
src/services/competitor/UnifiedCompetitorService.ts  # 统一竞品分析服务
scripts/init-competitor-prompts.js                   # Prompt模板初始化脚本
docs/COMPETITOR_ANALYSIS_UNIFIED.md                  # 详细架构文档
docs/COMPETITOR_ANALYSIS_TEST.md                     # 测试计划
```

### 修改文件
```
app/api/competitor/parse/route.ts    # 统一API，调用UnifiedCompetitorService
app/dashboard/page.tsx                # 前端显示模型和Prompt信息
```

### 保持独立
```
app/api/competitor/analyze/route.ts  # 视频竞品分析（暂未统一）
```

## 🔧 数据库表

### Prompt模板表
```sql
prompt_templates (已存在)
├── id              # 唯一ID
├── name            # 模板名称
├── businessModule  # 业务模块（'competitor-analysis'）
├── content         # Prompt内容（支持变量 {{var}}）
├── variables       # 变量定义（JSON字符串）
├── performance     # 性能评分 0-1
├── successRate     # 成功率 0-1
├── usageCount      # 使用次数
├── isActive        # 是否激活
└── isDefault       # 是否默认
```

### 推荐决策表
```sql
reco_decisions (已存在)
├── id                # 决策ID
├── candidateSetId    # 候选集ID
├── chosenTargetType  # 选择的目标类型（model/prompt）
├── chosenTargetId    # 选择的目标ID
└── strategyVersion   # 策略版本
```

## 🚀 使用方式

### 初始化Prompt模板
```bash
node scripts/init-competitor-prompts.js
```

**内置模板**：
1. `竞品分析-标准模板`（默认）- 适用于大多数商品
2. `竞品分析-快速版` - 适用于简单商品

### API调用
```typescript
POST /api/competitor/parse

{
  productId: "xxx",
  input: "竞品文本或链接",
  images: ["data:image/png;base64,..."],  // 可选
  isUrl: false
}

// 响应
{
  success: true,
  data: {
    sellingPoints: ["卖点1", "卖点2", ...],
    painPoints: ["痛点1", ...],
    aiModelUsed: "gemini/gemini-pro",      // 使用的AI模型
    promptUsed: "竞品分析-标准模板",        // 使用的Prompt
    addedSellingPoints: 5,
    totalSellingPoints: 12
  }
}
```

### 前端展示
Dashboard竞品分析成功后，会显示：
```
解析成功！
新增 5 个卖点，2 个痛点
已识别目标受众
使用模型: gemini/gemini-pro
使用Prompt: 竞品分析-标准模板
```

## 🎨 核心设计原则

### 1. ❌ 不要硬编码AI模型
```typescript
// ❌ 错误
aiExecutor.execute({
  provider: 'gemini',  // 硬编码
  prompt: '...'
})

// ✅ 正确
const model = await recommendModel(inputType)
aiExecutor.execute({
  provider: model.provider,  // 推荐引擎选择
  prompt: '...'
})
```

### 2. ❌ 不要硬编码Prompt
```typescript
// ❌ 错误
const prompt = `请分析竞品...`  // 硬编码

// ✅ 正确
const promptTemplate = await recommendPrompt()
const prompt = fillVariables(promptTemplate.content, variables)
```

### 3. ✅ 记录模型和Prompt
所有AI调用都应记录：
- 使用的模型（provider/model）
- 使用的Prompt（name）
- 推荐决策ID（用于反馈闭环）

## 📊 推荐引擎工作流程

```
用户输入
  ↓
检测输入类型（text/image/multimodal）
  ↓
┌─────────────────┐  ┌─────────────────┐
│ 推荐AI模型       │  │ 推荐Prompt       │
│ 输入: 文本       │  │ 业务: 竞品分析    │
│ 输出: JSON      │  │ 排序: 性能优先    │
│ 约束: 中文/成本  │  │ 默认: 标准模板    │
└────────┬────────┘  └────────┬────────┘
         │                    │
         └───────┬────────────┘
                 ↓
        填充Prompt变量
                 ↓
        AI Executor调用
                 ↓
        JSON解析与清洗
                 ↓
        去重合并到商品库
                 ↓
        记录推荐决策
                 ↓
        返回结果（含模型/Prompt信息）
```

## 🔍 监控与优化

### 推荐决策记录
每次推荐都会记录到数据库：
- `reco_decisions` - 最终选择
- `reco_candidate_sets` - 候选集快照
- `reco_candidates` - 候选项详情（分数/理由）

### 反馈闭环（待实现）
1. 收集解析成功/失败数据
2. 更新Prompt的 `performance` 和 `successRate`
3. 推荐引擎自动调整排序

### A/B测试（待实现）
对比不同Prompt模板效果，优化评分权重

## ⚠️ 注意事项

### 输入类型限制
- **文本**：所有模型可用
- **图片**：仅Gemini支持（`estimation_models.toolUseSupport=true`）
- **多模态**：仅Gemini支持

### 链接解析
大多数平台不允许爬取，建议用户：
1. 复制商品详情文本
2. 截图粘贴商品图片

### 成本控制
Gemini Vision价格较高，建议：
1. 优先使用文本分析
2. 仅必要时使用图片分析
3. 设置成本预算约束（`maxCostUSD`）

## 📈 扩展计划

### 短期
1. ✅ 统一商品竞品分析（已完成）
2. ⏳ 反馈闭环：收集成功率，更新Prompt性能
3. ⏳ 探索策略：10%概率尝试新Prompt

### 中期
1. 统一视频竞品分析（接入推荐引擎）
2. A/B测试：对比Prompt效果
3. 成本优化：根据任务复杂度选择模型

### 长期
1. 用户个性化：根据用户历史偏好推荐
2. 实时学习：动态调整评分权重
3. 多维度评估：增加响应速度、输出质量等维度

## ✅ 验收清单

- [x] 统一服务类 `UnifiedCompetitorService`
- [x] AI模型推荐（输入类型、输出类型评估）
- [x] Prompt推荐（性能、成功率排序）
- [x] API统一调用 `/api/competitor/parse`
- [x] 前端显示模型和Prompt信息
- [x] Prompt模板初始化脚本
- [x] 详细文档（架构、测试、总结）
- [ ] 反馈闭环实现（待开发）
- [ ] A/B测试框架（待开发）

## 📝 相关文档

- **详细架构**：`docs/COMPETITOR_ANALYSIS_UNIFIED.md`
- **测试计划**：`docs/COMPETITOR_ANALYSIS_TEST.md`
- **推荐引擎设计**：`docs/ENGINEERING.md` - Recommendation Engine章节

