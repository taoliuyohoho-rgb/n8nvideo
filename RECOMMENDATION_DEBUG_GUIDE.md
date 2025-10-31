# 推荐系统调试指南

## 修复时间
2025-10-29

## 问题
用户反馈：**还是没有推荐模型和prompt**

## 调试改进

### 1. 添加详细的控制台日志

#### 组件挂载日志
```typescript
console.log('[CompetitorAnalysis] 组件挂载, productId:', productId)
console.log('[CompetitorAnalysis] 当前状态:', {
  selectedModel,
  selectedPromptDecisionId,
  recommendationTrigger
})
```

#### 推荐触发日志
```typescript
console.log('[CompetitorAnalysis] 触发初始推荐, recommendationTrigger:', recommendationTrigger)
console.log('[CompetitorAnalysis] recommendationTrigger 从', prev, '变为', prev + 1)
```

#### 推荐结果日志
```typescript
console.log('[CompetitorAnalysis] AI模型已自动选择:', modelId)
console.log('[CompetitorAnalysis] Prompt已自动选择:', promptId)
```

#### 状态变化日志
```typescript
console.log('[CompetitorAnalysis] 推荐状态变化:', {
  selectedModel,
  selectedPromptDecisionId,
  customPrompt: customPrompt ? '已设置' : '未设置'
})
```

### 2. 可视化状态显示

现在推荐状态**始终显示**，包含两种状态：

#### 等待推荐状态（黄色）
```
┌────────────────────────────────────┐
│ ⏳  等待推荐系统响应...           │
│     推荐触发次数: 1                │
│     ⏳ 推荐中...                   │
│     💡 如果长时间没有推荐，        │
│        请查看浏览器控制台日志      │
└────────────────────────────────────┘
```

#### 推荐成功状态（绿色）
```
┌────────────────────────────────────┐
│ ✓  AI已自动推荐配置               │
│    🤖 模型: gemini-2.5-flash      │
│    📝 Prompt: 已自动选择          │
│       (ID: cmhc6eyr...)           │
└────────────────────────────────────┘
```

### 3. 调试信息说明

#### 推荐触发次数
- **0**：组件刚挂载，还未触发
- **1**：组件挂载500ms后自动触发
- **2+**：用户输入文本/URL抓取/AI搜索后触发

#### 推荐状态
- **等待中**：触发了但还没收到响应
- **已推荐**：成功获取并设置了模型和Prompt

## 常见问题排查

### 问题1：推荐触发次数一直是0

**原因**：组件初始化失败或useEffect未执行

**检查**：
1. 查看控制台是否有 `[CompetitorAnalysis] 组件挂载` 日志
2. 检查是否有JavaScript错误阻止了代码执行
3. 确认React版本支持Hooks

### 问题2：推荐触发了但没有响应

**原因**：RecommendationSelector组件或API有问题

**检查**：
1. 查看控制台是否有 `[RecommendationSelector]` 开头的日志
2. 打开Network面板，检查是否有 `/api/recommend/rank` 请求
3. 检查API响应状态和内容
4. 确认 `triggerRefresh` 值是否改变

**示例日志**：
```
[CompetitorAnalysis] 组件挂载, productId: abc123
[CompetitorAnalysis] 当前状态: {
  selectedModel: "",
  selectedPromptDecisionId: "",
  recommendationTrigger: 0
}
[CompetitorAnalysis] 触发初始推荐, recommendationTrigger: 0
[CompetitorAnalysis] recommendationTrigger 从 0 变为 1
[RecommendationSelector] 开始加载推荐... { 
  scenario: "task->model",
  task: {...},
  triggerRefresh: 1
}
[RecommendationSelector] 发送推荐请求...
[RecommendationSelector] 推荐响应: {...}
[CompetitorAnalysis] AI模型已自动选择: gemini/gemini-2.5-flash
```

### 问题3：模型推荐了但Prompt没推荐

**原因**：Prompt推荐失败或Prompt API有问题

**检查**：
1. 查看是否有两个 `[RecommendationSelector]` 的日志（一个model，一个prompt）
2. 检查 `/api/recommend/rank` 是否被调用了两次
3. 检查第二次调用的 `scenario` 是否为 `task->prompt`
4. 查看 `/api/admin/prompts?id=xxx` 请求是否成功

### 问题4：推荐成功但没显示

**原因**：状态更新失败或React渲染问题

**检查**：
1. 查看 `[CompetitorAnalysis] 推荐状态变化` 日志
2. 确认 `selectedModel` 和 `selectedPromptDecisionId` 有值
3. 检查React DevTools中的组件状态

## 推荐系统工作流程

```
1. 组件挂载
   ↓
2. 延迟500ms
   ↓
3. setRecommendationTrigger(1)
   ↓
4. RecommendationSelector useEffect 触发
   ↓
5. 调用 /api/recommend/rank (model)
   ├─ scenario: "task->model"
   └─ task: { taskType: "competitor-analysis", ... }
   ↓
6. API返回推荐结果
   ↓
7. onSelect 回调执行
   ↓
8. setSelectedModel(modelId)
   ↓
9. 调用 /api/recommend/rank (prompt)
   ├─ scenario: "task->prompt"
   └─ task: { taskType: "competitor-analysis", ... }
   ↓
10. API返回推荐结果
    ↓
11. onSelect 回调执行
    ↓
12. setSelectedPromptDecisionId(decisionId)
    ↓
13. 调用 /api/admin/prompts?id=xxx
    ↓
14. setCustomPrompt(content)
    ↓
15. 显示绿色成功状态
```

## 手动测试步骤

### 步骤1：打开浏览器控制台
1. 按F12打开开发者工具
2. 切换到Console标签
3. 清空之前的日志

### 步骤2：打开竞品分析页面
1. 选择一个商品
2. 打开竞品分析模块
3. 观察控制台日志

### 步骤3：检查日志
查找以下关键日志：
- `[CompetitorAnalysis] 组件挂载`
- `[CompetitorAnalysis] 触发初始推荐`
- `[CompetitorAnalysis] recommendationTrigger 从 0 变为 1`
- `[RecommendationSelector] 开始加载推荐`
- `[RecommendationSelector] 推荐响应`
- `[CompetitorAnalysis] AI模型已自动选择`
- `[CompetitorAnalysis] Prompt已自动选择`

### 步骤4：检查网络请求
1. 切换到Network标签
2. 查找 `/api/recommend/rank` 请求（应该有2个）
3. 检查请求参数和响应内容
4. 查找 `/api/admin/prompts` 请求

### 步骤5：检查页面显示
1. 查看推荐状态框
2. 确认是黄色（等待）还是绿色（成功）
3. 检查推荐触发次数
4. 如果是绿色，确认模型和Prompt信息显示正确

## API测试

### 测试模型推荐
```bash
curl -X POST http://localhost:3000/api/recommend/rank \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "task->model",
    "task": {
      "taskType": "competitor-analysis",
      "contentType": "text",
      "jsonRequirement": true
    },
    "context": {
      "channel": "web"
    }
  }'
```

### 测试Prompt推荐
```bash
curl -X POST http://localhost:3000/api/recommend/rank \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "task->prompt",
    "task": {
      "taskType": "competitor-analysis",
      "contentType": "text"
    },
    "context": {
      "channel": "web"
    }
  }'
```

## 可能的原因和解决方案

### 原因1：推荐API返回空结果
**解决**：检查数据库中是否有模型和Prompt数据

### 原因2：RecommendationSelector组件有bug
**解决**：检查组件代码，特别是useEffect依赖项

### 原因3：网络请求失败
**解决**：检查网络连接，查看Network面板

### 原因4：React状态更新问题
**解决**：检查是否有其他代码覆盖了状态

### 原因5：组件被隐藏导致不渲染
**解决**：确认使用 `className="hidden"` 而不是条件渲染

## 下一步行动

如果问题仍然存在，请：

1. **截图控制台日志**：包含所有 `[CompetitorAnalysis]` 和 `[RecommendationSelector]` 日志
2. **截图Network面板**：显示所有 `/api/recommend/` 请求
3. **截图页面状态**：显示推荐状态框的内容
4. **提供具体信息**：
   - 推荐触发次数是多少？
   - 是否看到"推荐中..."的loading状态？
   - 控制台是否有错误？
   - Network请求状态码是什么？

有了这些信息，我们就能精确定位问题所在！
