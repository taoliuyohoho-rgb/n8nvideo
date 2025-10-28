# 竞品分析组件更新说明

## 更新时间
2025-10-27

## 更新内容

### 1. **URL自动抓取功能** ✅

#### 新增API
- **路径**: `/app/api/competitor/fetch-url/route.ts`
- **功能**: 自动抓取竞品页面URL的内容
- **返回内容**:
  - 页面标题 (title)
  - Meta描述 (description)
  - 关键文本信息（前500字，keyInfo）
  - 页面图片URL（最多5张，images）
- **特性**:
  - 10秒超时保护
  - 自动处理相对路径URL
  - 过滤小图标和跟踪像素
  - 完善的错误处理

#### 使用方式
1. 用户在文本框输入URL
2. 点击输入框外（失焦触发 `onBlur`）
3. 系统检测到URL格式，自动调用抓取API
4. 抓取成功后，自动填充内容并显示提取的图片
5. 抓取失败则显示红色错误提示

### 2. **智能推荐触发机制** ✅

#### 原理
- `RecommendationSelector` 组件新增 `triggerRefresh` prop
- 在 `useEffect` 依赖项中添加 `triggerRefresh`
- 当 `triggerRefresh` 值变化时，自动重新调用推荐API

#### 触发时机
1. **URL抓取成功后**: `setRecommendationTrigger(prev => prev + 1)`
2. **用户直接输入文本后**: 失焦时如果不是URL，也触发推荐刷新

#### 上下文传递
推荐系统会根据竞品信息动态调整：
- `contentType`: 有图片时为 `'vision'`，无图片时为 `'text'`
- `context.hasCompetitorData`: 标记是否已有竞品数据

### 3. **UI优化** ✅

#### 简化输入
- **之前**: 2个输入框（文本框 + 图片URL输入框）
- **现在**: 1个输入框（文本框，图片通过粘贴/拖拽添加）
- **好处**: 信息密度更高，操作更简洁

#### 新增提示
- 当没有竞品信息时，显示黄色提示框："💡 提示：输入竞品信息后，系统将自动推荐最适合的AI模型"
- 抓取中显示加载状态：蓝色旋转图标 + "正在抓取URL内容..."
- 抓取失败显示红色错误信息：⚠️ URL抓取失败: xxx

#### 图片管理
- 粘贴的图片显示为缩略图（20x20px）
- 鼠标悬浮显示删除按钮
- 支持多张图片展示

### 4. **修复的Bug** ✅

#### Prisma模型名称错误
**错误**:
```typescript
prisma.estimation_models.findMany()
prisma.reco_candidate_sets.create()
prisma.reco_candidates.createMany()
prisma.reco_decisions.create()
```

**修复**:
```typescript
prisma.estimationModel.findMany()
prisma.recommendationCandidateSet.create()
prisma.recommendationCandidate.createMany()
prisma.recommendationDecision.create()
```

## 完整工作流程

```
用户操作                                    系统响应
   │
   ├─ 输入URL                              
   │                                      
   ├─ 失焦（点击空白处）                   
   │  └─> 检测到URL格式                   ─> 调用 /api/competitor/fetch-url
   │                                          │
   │                                          ├─ 抓取成功
   │                                          │  ├─ 自动填充标题、描述、关键信息
   │                                          │  ├─ 显示提取的图片
   │                                          │  └─ setRecommendationTrigger(+1) ─┐
   │                                          │                                    │
   │                                          └─ 抓取失败                          │
   │                                             └─ 显示错误提示                   │
   │                                                                              │
   ├─ 或直接输入文本 + 失焦                                                       │
   │  └─> 非URL格式                         ─> setRecommendationTrigger(+1) ─┐  │
   │                                                                           │  │
   │                                                                           ↓  ↓
   │                                          RecommendationSelector 检测到 triggerRefresh 变化
   │                                                         │
   │                                                         ├─ 调用 /api/recommend/rank
   │                                                         │  └─ scenario: task->model
   │                                                         │     task: { 
   │                                                         │       taskType: 'competitor-analysis',
   │                                                         │       contentType: 有图片?'vision':'text',
   │                                                         │       jsonRequirement: true
   │                                                         │     }
   │                                                         │
   │                                                         ├─ 调用 /api/recommend/rank  
   │                                                         │  └─ scenario: task->prompt
   │                                                         │     task: {
   │                                                         │       taskType: 'product-competitor',
   │                                                         │       contentType: 有图片?'vision':'text'
   │                                                         │     }
   │                                                         │
   │                                                         └─ 显示推荐结果
   │                                                            ├─ AI模型: openai/gpt-4o (Top1)
   │                                                            └─ Prompt: 竞品分析模板01 (Top1)
   │
   ├─ 点击"开始分析"
   │  └─> 调用 /api/competitor/analyze
   │      ├─ 使用推荐的AI模型
   │      ├─ 使用推荐的Prompt模板
   │      └─ 提交分析任务
```

## API测试结果

### 1. 推荐API测试
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
    "context": {"channel": "web"},
    "constraints": {
      "requireJsonMode": true,
      "maxLatencyMs": 10000
    }
  }'

# 响应: ✅ { "chosen": { "title": "openai/gpt-4o", ... } }
```

### 2. URL抓取API测试
```bash
curl -X POST http://localhost:3000/api/competitor/fetch-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.example.com"}'

# 响应: ✅
# {
#   "success": true,
#   "data": {
#     "title": "Example Domain",
#     "description": "",
#     "keyInfo": "Example Domain This domain is...",
#     "images": []
#   }
# }
```

## 涉及的文件

### 新增文件
- `/app/api/competitor/fetch-url/route.ts` - URL抓取API

### 修改文件
- `/components/CompetitorAnalysis.tsx` - 竞品分析组件
  - 添加 URL抓取逻辑
  - 添加推荐触发机制
  - 简化UI（去掉图片URL输入框）
  
- `/components/RecommendationSelector.tsx` - 推荐选择器组件
  - 添加 `triggerRefresh` prop
  - 扩展 `useEffect` 依赖项
  - 添加详细的调试日志

- `/src/services/recommendation/scorers/taskToModel.ts` - AI模型评分器
  - 修复 Prisma 模型名称：`estimation_models` → `estimationModel`

- `/src/services/recommendation/recommend.ts` - 推荐核心逻辑
  - 修复 Prisma 模型名称：
    - `reco_candidate_sets` → `recommendationCandidateSet`
    - `reco_candidates` → `recommendationCandidate`
    - `reco_decisions` → `recommendationDecision`

## 下一步建议

1. **增强URL抓取能力**:
   - 支持更多内容提取（如价格、评分、评论等）
   - 添加反爬虫机制绕过
   - 支持JavaScript渲染的页面

2. **优化推荐算法**:
   - 根据竞品内容的复杂度智能调整模型选择
   - 根据竞品语言自动选择多语言模型

3. **用户体验**:
   - 添加"查看推荐理由"功能
   - 添加历史推荐记录
   - 支持批量URL输入

## 测试清单

- [x] URL抓取功能正常
- [x] 推荐API返回正确结果
- [x] 失焦触发推荐刷新
- [x] UI简化（去掉图片URL输入框）
- [x] 图片粘贴/拖拽功能
- [ ] 端到端集成测试（需在真实环境验证）
- [ ] 错误边界测试（无效URL、网络超时等）


