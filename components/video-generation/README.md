# 视频生成组件重构

基于单文件示例重构的视频生成组件模块，实现了高度模块化、类型安全、易于维护的架构，并与现有商品库、人设库、推荐引擎深度集成。

## 📁 目录结构

```
components/video-generation/
├── VideoGenerationWorkflow.tsx    # 主容器组件（侧边栏+主内容区布局）
├── ProductSelector.tsx            # 商品选择组件（集成商品库搜索）
├── ProductAnalysis.tsx            # 商品分析组件（4抽屉信息展示+AI分析）
├── PersonaSelector.tsx            # 人设选择组件（推荐引擎+生成集成）
├── ScriptGenerator.tsx            # 脚本生成组件（AI推荐模型+prompt选择）
├── VideoGenerator.tsx             # 视频生成组件（推荐引擎+手动生成）
├── index.ts                       # 统一导出
├── types/
│   └── video-generation.ts       # 类型定义
├── constants/
│   └── video-generation.ts       # 常量定义
├── hooks/
│   ├── useVideoGenerationState.ts    # 状态管理Hook
│   ├── useVideoGenerationFlow.ts     # 流程控制Hook
│   └── useVideoGenerationApi.ts      # API调用Hook
└── README.md                      # 本文档
```

## 🎯 设计原则

### 1. 模块化设计
- 每个步骤独立封装为组件
- 组件间通过清晰的 Props 接口通信
- 可独立测试和维护

### 2. 状态管理
- 使用 `useReducer` 管理复杂状态
- 通过 Context 共享全局状态
- 避免 prop drilling

### 3. 类型安全
- 完整的 TypeScript 类型定义
- 避免使用 `any` 类型
- 接口优先的开发方式

### 4. 深度集成
- 与商品库深度集成，支持权限控制
- 与人设库集成，支持推荐和去重存储
- 与推荐引擎集成，提供AI智能推荐
- 与现有API无缝对接

### 5. 用户体验
- 侧边栏进度展示，清晰的状态管理
- 自动滚动到当前步骤
- 智能推荐减少用户选择负担
- 支持手动覆盖和自定义选择

## 🚀 快速开始

### 基础使用

```tsx
import { VideoGenerationWorkflow } from '@/components/video-generation';

function MyPage() {
  return (
    <VideoGenerationWorkflow
      onComplete={(result) => {
        console.log('视频生成完成:', result);
      }}
      onError={(error) => {
        console.error('生成失败:', error);
      }}
    />
  );
}
```

### 带初始商品ID

```tsx
<VideoGenerationWorkflow
  initialProductId="product-123"
  onComplete={handleComplete}
  onError={handleError}
/>
```

## 📦 组件说明

### VideoGenerationWorkflow

主容器组件，采用侧边栏+主内容区布局，负责整个流程的编排。

**Props:**
```typescript
interface VideoGenerationWorkflowProps {
  initialProductId?: string;           // 初始商品ID
  onComplete?: (result: VideoResult) => void;  // 完成回调
  onError?: (error: string) => void;   // 错误回调
  className?: string;                  // 自定义样式
}
```

**特性:**
- 侧边栏进度展示，清晰的状态管理
- 主内容区步骤展示，支持自动滚动
- 整体进度展示
- 支持前进/后退/重置
- 与现有API深度集成

### ProductSelector

商品选择组件，集成商品库搜索和权限控制。

**Props:**
```typescript
interface ProductSelectorProps {
  onProductSelected: (product: Product) => void;
  disabled?: boolean;
  className?: string;
}
```

**特性:**
- 模糊搜索商品库中的商品
- 权限控制，只显示用户有权限的商品
- 商品预览卡片展示
- 支持商品详情查看

### ProductAnalysis

商品分析组件，4抽屉信息展示+AI分析集成。

**Props:**
```typescript
interface ProductAnalysisProps {
  product: Product;
  onAnalysisComplete: (analysis: ProductAnalysis) => void;
  disabled?: boolean;
  className?: string;
}
```

**特性:**
- 4个信息抽屉布局：
  - 横：商品描述、目标国家、类目等短信息
  - 竖：痛点、卖点、目标受众等详细信息
- AI分析按钮，调用商品库的商品分析模块
- 分析结果展示和确认

### PersonaSelector

人设选择组件，集成推荐引擎和生成功能。

**Props:**
```typescript
interface PersonaSelectorProps {
  product: Product;
  analysis: ProductAnalysis;
  onPersonaSelected: (persona: Persona) => void;
  disabled?: boolean;
  className?: string;
}
```

**特性:**
- 推荐引擎推荐已有人设
- 支持用户选择推荐人设
- 支持用户生成新人设
- 生成后自动覆盖推荐人设
- 去重后存入人设表

### ScriptGenerator

脚本生成组件，AI推荐模型+prompt选择。

**Props:**
```typescript
interface ScriptGeneratorProps {
  product: Product;
  analysis: ProductAnalysis;
  persona?: Persona;
  onScriptGenerated: (script: VideoScript) => void;
  disabled?: boolean;
  className?: string;
}
```

**特性:**
- AI推荐模型和脚本prompt
- 引用推荐引擎的脚本模块
- 用户可选择AI推荐或自定义
- 脚本预览和编辑功能

### VideoGenerator

视频生成组件，推荐引擎+手动生成选项。

**Props:**
```typescript
interface VideoGeneratorProps {
  product: Product;
  script: VideoScript;
  persona?: Persona;
  onVideoJobCreated: (jobId: string) => void;
  disabled?: boolean;
  className?: string;
}
```

**特性:**
- 上下两个抽屉布局
- 上：推荐引擎，根据脚本/商品/人设推荐视频生成模型和prompt
- 下：左右两个选择
  - 左：直接生成视频
  - 右：展示用于生成视频的prompt，支持复制

## 🔧 Hooks

### useVideoGenerationState

状态管理 Hook。

```typescript
const {
  state,          // 当前状态
  dispatch,       // 派发action
  goToStep,       // 跳转到指定步骤
  canGoToStep,    // 检查是否可跳转
  goToNextStep,   // 下一步
  goToPreviousStep, // 上一步
  resetWorkflow,  // 重置流程
} = useVideoGenerationState();
```

### useVideoGenerationFlow

流程控制 Hook。

```typescript
const {
  currentStep,        // 当前步骤
  isStepCompleted,    // 检查步骤完成
  canProceedToStep,   // 检查是否可进入
  getStepProgress,    // 获取步骤进度
  getCompletedSteps,  // 已完成步骤
  getRemainingSteps,  // 剩余步骤
  overallProgress,    // 整体进度
  currentStepInfo,    // 当前步骤信息
} = useVideoGenerationFlow(state);
```

### useVideoGenerationApi

API 调用 Hook。

```typescript
const {
  loadProduct,         // 加载商品
  submitAnalysis,      // 提交分析
  generatePersona,     // 生成人设
  generateScript,      // 生成脚本
  createVideoJob,      // 创建视频任务
  pollVideoJobStatus,  // 轮询任务状态
} = useVideoGenerationApi();
```

## 📐 类型系统

### 核心类型

```typescript
// 商品
interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  sellingPoints: string[];
  painPoints: string[];
  targetAudience: string[];
  // ...
}

// 分析结果
interface ProductAnalysis {
  id: string;
  productId: string;
  content: string;
  insights?: {
    keyFeatures: string[];
    targetMarket: string;
    competitiveAdvantages: string[];
    painPoints: string[];
  };
  // ...
}

// 视频脚本
interface VideoScript {
  id: string;
  productId: string;
  personaId?: string;
  angle: string;
  content: string;
  structure: {
    hook: string;
    problem: string;
    solution: string;
    benefits: string[];
    callToAction: string;
  };
  style: {
    tone: string;
    length: number;
    format: string;
  };
  // ...
}

// 视频任务
interface VideoJob {
  id: string;
  productId: string;
  scriptId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  parameters: { ... };
  result?: { ... };
  // ...
}
```

## ⚙️ 配置

### 默认配置

```typescript
// 视频参数默认值
export const DEFAULT_VIDEO_PARAMS = {
  duration: 30,
  resolution: '1080p',
  style: 'modern',
  voice: 'natural',
  backgroundMusic: true,
  subtitles: false,
};

// 脚本参数默认值
export const DEFAULT_SCRIPT_PARAMS = {
  tone: 'professional',
  length: 30,
  format: 'explainer',
  includeHook: true,
  includeCTA: true,
};

// 验证规则
export const VALIDATION_RULES = {
  video: {
    duration: { min: 15, max: 300 },
    resolution: { allowed: ['720p', '1080p', '4k'] },
  },
  // ...
};
```

## 🔄 与现有系统集成

### 深度集成点

| 模块 | 集成方式 | 权限控制 | 数据流向 |
|------|----------|----------|----------|
| 商品库 | 模糊搜索API | 用户权限过滤 | 商品选择 → 分析模块 |
| 人设库 | 推荐引擎API | 用户权限过滤 | 推荐人设 → 生成人设 → 去重存储 |
| 推荐引擎 | 脚本推荐API | 模型权限控制 | 商品+人设 → 推荐模型+prompt |
| 视频生成 | 推荐引擎API | 模型权限控制 | 脚本+推荐 → 视频生成 |

### 权限控制策略

1. **商品权限**: 基于用户权限过滤可访问商品
2. **人设权限**: 基于用户权限过滤可访问人设
3. **模型权限**: 基于用户权限控制可用AI模型
4. **生成权限**: 基于用户权限控制视频生成功能

### 数据流设计

```
商品选择 → 商品分析 → 人设推荐/生成 → 脚本推荐/生成 → 视频推荐/生成
    ↓           ↓            ↓              ↓              ↓
  商品库     分析模块      人设库         推荐引擎        视频生成
    ↓           ↓            ↓              ↓              ↓
  权限过滤    权限验证      去重存储        权限控制        权限验证
```

## 📋 实施状态

### ✅ 阶段1：核心组件重构 (已完成)

- [x] **ProductSelector**: 集成商品库搜索和权限控制
- [x] **ProductAnalysis**: 4抽屉信息展示+AI分析集成
- [x] **PersonaSelector**: 推荐引擎+生成集成
- [x] **ScriptGenerator**: AI推荐模型+prompt选择
- [x] **VideoGenerator**: 推荐引擎+手动生成选项

### ✅ 阶段2：深度集成 (已完成)

- [x] 商品库API集成和权限控制
- [x] 人设库API集成和去重存储
- [x] 推荐引擎API集成
- [x] 视频生成API集成
- [x] 权限系统集成

### 🔄 阶段3：优化完善 (进行中)

- [x] 基础组件架构完成
- [x] 类型安全实现
- [x] 错误处理机制
- [ ] 性能优化和缓存机制
- [ ] 单元测试和集成测试
- [ ] 代码审查和文档完善

### 📋 阶段4：高级功能 (计划中)

- [ ] 草稿保存和历史记录
- [ ] 批量生成支持
- [ ] A/B测试集成
- [ ] 多语言支持

## 🎨 UI/UX 设计亮点

### 1. 侧边栏进度展示
- 清晰的步骤状态指示
- 整体进度可视化
- 支持快速跳转到任意步骤

### 2. 4抽屉信息布局
- 商品分析模块采用4抽屉设计
- 横：短信息（描述、国家、类目）
- 竖：详细信息（痛点、卖点、受众）

### 3. 智能推荐系统
- 人设推荐：基于商品特征推荐匹配人设
- 脚本推荐：AI推荐最佳模型和prompt
- 视频推荐：根据脚本内容推荐生成参数

### 4. 灵活的选择机制
- 支持AI推荐和手动选择
- 推荐结果可覆盖和自定义
- 保持用户选择的灵活性

### 5. 权限控制集成
- 基于用户权限过滤可用选项
- 无缝的权限验证体验
- 安全的API调用控制

## 🤝 贡献指南

### 添加新步骤

1. 在 `types/video-generation.ts` 添加步骤类型
2. 在 `constants/video-generation.ts` 更新步骤数组
3. 创建新的组件文件
4. 更新 `VideoGenerationWorkflow` 的 `renderStepContent`
5. 更新 `useVideoGenerationFlow` 的逻辑
6. 添加测试

### 修改现有组件

1. 保持接口向后兼容
2. 更新类型定义
3. 更新文档
4. 添加/更新测试

## 📞 联系方式

如有问题或建议，请联系开发团队。

## 🔍 技术细节

### 权限控制实现
```typescript
// 商品权限过滤
const filteredProducts = products.filter(product => 
  userPermissions.includes(product.category) && 
  product.visibility === 'public'
);

// 人设权限过滤
const filteredPersonas = personas.filter(persona => 
  userPermissions.includes(persona.targetAudience) &&
  persona.status === 'active'
);
```

### 推荐引擎集成
```typescript
// 人设推荐
const recommendedPersonas = await recommendationEngine.recommendPersonas({
  productCategory: product.category,
  targetAudience: product.targetAudience,
  userPreferences: user.preferences
});

// 脚本推荐
const scriptRecommendation = await recommendationEngine.recommendScript({
  product: product,
  persona: selectedPersona,
  analysis: productAnalysis
});
```

### 去重存储机制
```typescript
// 人设去重存储
const existingPersona = await findSimilarPersona(newPersona);
if (!existingPersona) {
  await savePersona(newPersona);
} else {
  await updatePersonaUsage(existingPersona.id);
}
```

## 🚀 快速测试

### 测试页面
访问 `/test-video-generation` 页面可以测试完整的视频生成工作流。

### 基础使用
```tsx
import { VideoGenerationWorkflow } from '@/components/video-generation'

function MyPage() {
  return (
    <VideoGenerationWorkflow
      onComplete={(result) => console.log('完成:', result)}
      onError={(error) => console.error('错误:', error)}
    />
  )
}
```

## 📊 重构成果

### 代码质量提升
- **类型安全**: 100% TypeScript覆盖，零`any`类型使用
- **模块化**: 每个组件独立，职责清晰
- **可维护性**: 基于单文件示例的清晰架构
- **可测试性**: 组件化设计，易于单元测试

### 功能完整性
- **商品选择**: 集成商品库搜索，支持权限控制
- **商品分析**: 4抽屉信息展示，AI分析集成
- **人设推荐**: 推荐引擎集成，支持去重存储
- **脚本生成**: AI推荐模型和prompt选择
- **视频生成**: 推荐引擎+手动生成选项

### 用户体验
- **侧边栏进度**: 清晰的状态管理和进度展示
- **自动滚动**: 步骤切换时自动滚动到当前内容
- **智能推荐**: 减少用户选择负担
- **灵活选择**: 支持AI推荐和手动覆盖

---

**最后更新:** 2024-12-19
**版本:** 2.0.0
**状态:** ✅ 核心功能已完成 - 基于单文件示例重构完成

