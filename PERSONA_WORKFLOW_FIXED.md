# 人设生成工作流程（已修复）

## ✅ 正确的用户体验流程

```
1. 用户打开创建人设弹窗
   ↓
2. 填写基本信息（名称、目标市场、类目）
   ↓
3. 【自动触发】选择类目后，系统自动调用推荐引擎
   ├─ 显示"正在推荐最佳AI模型和Prompt模板..."
   └─ 推荐完成后显示"✨ 已为你推荐最佳生成方案"
   ↓
4. （可选）用户可以查看或修改推荐的模型/Prompt
   ↓
5. 用户点击"生成预览"
   ├─ 使用推荐的（或用户选择的）模型和Prompt
   └─ 调用AI生成人设内容
   ↓
6. 显示预览页面
   ├─ 展示生成的人设内容（4个Tab）
   └─ 用户可以编辑修改
   ↓
7. 用户点击"保存到库"
   └─ 保存到数据库
```

## 🔄 与之前的区别

### ❌ 之前的流程（错误）
```
填表 → 点生成 → 【调用推荐】→【调用生成】→ 预览
```
问题：推荐和生成同时进行，用户无法选择

### ✅ 现在的流程（正确）
```
填表 → 【自动推荐】→ (用户可选择) → 点生成 → 【调用生成】→ 预览
```
优点：
- 提前推荐，用户可以看到和选择
- 不需要等待推荐，体验更快
- 用户有控制权

## 🎨 UI 状态

### 状态 1：未选择类目
```
┌─ 创建人设 ─────────────────────────────┐
│                                         │
│ 人设名称: [_________]  目标市场: [马来] │
│ 类目: [选择类目 ▼]                      │
│                                         │
│ （没有推荐信息）                         │
└─────────────────────────────────────────┘
```

### 状态 2：推荐中
```
┌─ 创建人设 ─────────────────────────────┐
│                                         │
│ 人设名称: [_________]  目标市场: [马来] │
│ 类目: [3C数码 ▼]                        │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🔄 正在推荐最佳AI模型和Prompt模板... │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 状态 3：推荐完成
```
┌─ 创建人设 ─────────────────────────────┐
│                                         │
│ 人设名称: [_________]  目标市场: [马来] │
│ 类目: [3C数码 ▼]                        │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ✅ 已为你推荐最佳生成方案：          │ │
│ │    Gemini 2.0 Flash + cmhafi5r...   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [取消]                    [生成预览 👁] │
└─────────────────────────────────────────┘
```

## 🔧 技术实现

### 自动推荐触发
```typescript
// 监听类目和目标市场变化
useEffect(() => {
  if (categoryId && targetCountry && open) {
    fetchRecommendations(categoryId, productId)
  }
}, [categoryId, productId, targetCountry, open])
```

### 推荐函数
```typescript
const fetchRecommendations = async (catId: string, prodId?: string) => {
  setIsRecommending(true)
  try {
    const response = await fetch('/api/persona/recommend', {
      method: 'POST',
      body: JSON.stringify({
        categoryId: catId,
        productId: prodId,
        targetCountry,
        textDescription
      })
    })
    
    const data = await response.json()
    if (data.success) {
      // 保存推荐结果
      setRecommendedModel(data.data.recommendedModel)
      setRecommendedPrompt(data.data.recommendedPrompt)
      
      // 自动选中推荐的
      setSelectedModel(data.data.recommendedModel.id)
      setSelectedPrompt(data.data.recommendedPrompt.id)
    }
  } finally {
    setIsRecommending(false)
  }
}
```

### 生成预览（使用推荐的模型）
```typescript
const handleGeneratePreview = async () => {
  // 验证已有推荐
  if (!selectedModel || !selectedPrompt) {
    setError('请等待AI推荐完成')
    return
  }
  
  // 使用推荐的模型和Prompt生成
  const response = await fetch('/api/persona/generate', {
    method: 'POST',
    body: JSON.stringify({
      aiModel: selectedModel,          // 来自推荐
      promptTemplate: selectedPrompt,  // 来自推荐
      categoryId,
      ...
    })
  })
}
```

## 🧪 测试步骤

1. 访问 `http://localhost:3000/admin`
2. 点击"人设管理" → "添加人设"
3. 填写人设名称："马来科技达人"
4. 选择目标市场："马来西亚"
5. **选择类目："3C数码"** ← 这一步会触发推荐
6. **观察**：应该立即显示"正在推荐..."，然后显示"✅ 已推荐"
7. 填写人设描述（可选）
8. 点击"生成预览"
9. 等待生成完成
10. 查看预览并编辑
11. 点击"保存到库"

## 🐛 常见问题

### Q1: 没有显示推荐信息？
**检查**：
- 是否选择了类目？
- 是否选择了目标市场？
- 打开浏览器控制台，查看是否有错误

### Q2: 推荐失败？
**检查**：
- `/api/persona/recommend` 是否返回 200
- 数据库是否有 estimation_models 和 prompt_templates
- 控制台是否显示"✅ 推荐完成"

### Q3: 生成失败？
**检查**：
- 是否等待推荐完成？
- selectedModel 和 selectedPrompt 是否有值？
- `/api/persona/generate` 的参数是否正确

## 📊 推荐引擎工作原理

### 输入
- `categoryId`: 类目ID（3C数码、美妆等）
- `targetCountry`: 目标市场（马来西亚等）
- `productId`: 关联商品（可选）
- `textDescription`: 人设描述（可选）

### 输出
```json
{
  "recommendedModel": {
    "id": "gemini/gemini-2.5-flash",
    "name": "Gemini 2.0 Flash",
    "provider": "Google",
    "reason": "评分: {...}",
    "decisionId": "cmxxx..."
  },
  "recommendedPrompt": {
    "id": "cmhafi5r...",
    "content": "...",
    "variables": ["category", "targetMarket", ...],
    "decisionId": "cmxxx..."
  }
}
```

### 推荐逻辑
1. **模型推荐**：根据类目、市场、JSON要求、成本等因素评分
2. **Prompt推荐**：根据业务模块、历史表现、成功率等因素评分
3. **决策记录**：保存到 recommendation_decisions 表，可追溯

---

**更新时间**: 2025-10-29  
**状态**: ✅ 工作流程已修复  
**版本**: v6.0 - 自动推荐

