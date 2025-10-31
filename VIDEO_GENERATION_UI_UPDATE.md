# 视频生成UI和逻辑更新

## 更新日期
2025-10-30

## 问题描述
用户反馈视频生成页面的推荐逻辑不清晰：
- 当前显示"推荐视频风格"，但实际应该推荐的是"模型和Prompt模板"
- UI流程不够清晰，应该是：推荐配置 -> 生成Prompt -> 生成视频

## 解决方案

### 1. 新增API端点
创建了 `/app/api/video/generate-prompt/route.ts`
- **功能**：简化的视频Prompt生成API，不依赖Template
- **输入**：产品信息（名称、卖点、目标市场等）
- **输出**：
  - 生成的Prompt文本
  - 推荐的模型信息
  - 推荐的Prompt模板信息
- **流程**：
  1. 调用推荐引擎推荐Prompt模板（task->prompt）
  2. 调用推荐引擎推荐生成模型（task->model）
  3. 使用推荐的Prompt模板和产品信息生成最终Prompt
  4. 返回结果和推荐信息

### 2. 更新视频生成组件
修改了 `/components/video-generation/VideoGenerator.tsx`

#### 修改前
- 步骤1：推荐视频风格（product->style）
- 步骤2：推荐生成模型（task->model）
- 左侧：直接生成视频
- 右侧：显示/隐藏Prompt

#### 修改后
- **AI推荐配置**：
  - 一键推荐模型和Prompt模板
  - 自动生成Prompt
  - 显示推荐结果（模型名称、Prompt模板名称）
  
- **生成的Prompt**（条件显示）：
  - 显示生成的Prompt文本
  - 可编辑
  - 可复制
  - 使用等宽字体便于阅读
  
- **生成视频**（条件显示）：
  - 使用生成的Prompt创建视频
  - 只在Prompt生成后显示

#### UI改进
1. **更清晰的流程**：一步接一步的卡片式设计
2. **状态提示**：每个步骤都有明确的完成状态提示
3. **条件显示**：后续步骤只在前置步骤完成后显示
4. **推荐透明**：明确显示推荐的模型和Prompt模板名称

### 3. 技术实现细节

#### 状态管理
```typescript
const [videoPrompt, setVideoPrompt] = useState('')
const [recommendedModel, setRecommendedModel] = useState<...>(null)
const [recommendedPromptTemplate, setRecommendedPromptTemplate] = useState<...>(null)
const [promptGenerated, setPromptGenerated] = useState(false)
const [isRecommending, setIsRecommending] = useState(false)
```

#### 推荐流程
```typescript
handleAutoRecommend() {
  1. 调用 /api/video/generate-prompt
  2. 设置推荐的模型和Prompt模板
  3. 设置生成的Prompt
  4. 标记Prompt已生成
}
```

#### API调用
```javascript
POST /api/video/generate-prompt
{
  productId: string,
  productName: string,
  sellingPoints: string[] | string,
  targetCountry: string,
  targetAudience: string,
  category: string
}

Response:
{
  success: true,
  prompt: string,
  recommendations: {
    model: { id, title, provider },
    promptTemplate: { id, title }
  },
  metadata: { latencyMs, promptTemplateUsed }
}
```

## 文件修改清单
- ✅ 新增：`/app/api/video/generate-prompt/route.ts`
- ✅ 修改：`/components/video-generation/VideoGenerator.tsx`

## 验收标准
- [x] 移除"推荐视频风格"相关UI
- [x] 添加"AI推荐配置"，显示推荐的模型和Prompt模板
- [x] 生成Prompt功能，并自动在推荐后生成
- [x] Prompt可复制、可编辑
- [x] 生成视频按钮只在Prompt生成后显示
- [x] UI流程清晰：推荐配置 -> 查看/编辑Prompt -> 生成视频
- [x] 无TypeScript类型错误
- [x] 清理未使用的导入和变量

## 使用说明

### 用户操作流程
1. 在视频生成页面，选择商品后进入视频生成步骤
2. 点击"自动推荐并生成Prompt"按钮
3. 系统自动：
   - 推荐最佳模型
   - 推荐最佳Prompt模板
   - 生成视频Prompt
4. 查看推荐结果和生成的Prompt
5. 可选：编辑Prompt文本
6. 点击"复制Prompt"按钮复制到其他平台使用
7. 或点击"开始生成视频"按钮在系统中生成视频

### 后端集成
新API使用了现有的推荐引擎：
- `recommendRank()` 用于推荐模型和Prompt模板
- `aiExecutor` 用于执行AI生成
- `prisma.promptTemplate` 用于获取Prompt模板内容

## 注意事项
1. API依赖推荐引擎正常工作
2. 如果推荐引擎暂不可用，会使用默认的Prompt生成逻辑
3. Prompt模板使用变量替换（如 {{productName}}, {{sellingPoints}} 等）
4. 支持中文和多语言

## 后续优化建议
1. 添加Prompt历史记录
2. 支持多个Prompt变体生成
3. 添加Prompt质量评分
4. 支持Prompt模板收藏
5. 添加更多的视频生成参数配置

