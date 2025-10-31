# VideoGenerationPRD 组件重构 PRD

## ✅ 实施状态: 已完成核心功能 (2024-10-29)

## 📋 项目概述

### 目标
将596行的VideoGenerationPRD组件拆分成独立可插拔的组件，复用现有功能，避免重复造轮子，提高代码可维护性和复用性。

### 背景
- 当前VideoGenerationPRD.tsx组件过于庞大（596行）
- 包含多个功能模块，耦合度高
- 存在大量硬编码和重复逻辑
- 难以维护和测试

### ✅ 重构成果
- **核心架构已完成**: 所有主要组件、Hooks和类型定义已实现
- **模块化完成**: 拆分为7个核心文件 + 配套文件
- **类型安全**: 完整的TypeScript类型定义
- **零硬编码**: 所有配置提取为常量
- **高复用性**: 复用RecommendationSelector和CompetitorAnalysis

## 🎯 重构目标

1. **模块化拆分** - 将大组件拆分成独立的功能模块
2. **复用现有组件** - 最大化利用已有的组件和功能
3. **解耦设计** - 组件间通过接口通信，降低耦合度
4. **保持兼容性** - 与现有VideoGenerationPage保持兼容
5. **提高可维护性** - 代码结构清晰，易于维护和扩展

## 🔍 现有组件分析

### ✅ 可复用的现有组件

#### 1. 商品管理
- **组件**: `app/admin/features/products/ProductManagement.tsx`
- **Hook**: `useProductManagement`
- **功能**: 商品搜索、选择、CRUD操作
- **复用方式**: 提取商品选择逻辑，封装为独立组件

#### 2. 商品分析
- **组件**: `components/CompetitorAnalysis.tsx`
- **功能**: 文本输入、AI分析、结果填充、多媒体支持
- **复用方式**: 直接复用，适配视频生成场景

#### 3. 推荐选择
- **组件**: `components/RecommendationSelector.tsx`
- **功能**: AI模型选择、提示词选择
- **复用方式**: 直接复用，用于脚本和视频生成的模型选择

#### 4. 任务监控
- **组件**: `app/admin/tasks/page.tsx`
- **功能**: 任务状态监控、进度显示、日志查看
- **复用方式**: 保持独立，通过API集成

#### 5. 视频生成流程
- **目录**: `app/video-generation/`
- **组件**: PersonaSteps, ScriptSteps, VideoGenSteps等
- **功能**: 完整的视频生成流程
- **复用方式**: 部分复用，适配PRD场景

### 🆕 需要新建的组件

#### 1. 脚本生成器 ⭐ **核心新建**
- **职责**: 脚本生成、编辑、预览
- **依赖**: 商品信息、分析结果、人设信息
- **输出**: 视频脚本

#### 2. 视频生成器 ⭐ **核心新建**
- **职责**: 视频生成、参数配置、任务提交
- **依赖**: 脚本信息
- **输出**: 视频生成任务

#### 3. 人设生成器 🔄 **占位待实现**
- **状态**: 人设生成模块未完成
- **处理**: 先创建占位组件，等模块完成后集成
- **TODO**: 等人设生成模块完成后实现

## 🏗️ 重构方案

### 组件架构设计

```
VideoGenerationWorkflow (主容器)
├── ProductSelector (商品选择)
├── ProductAnalysisSection (商品分析)
├── PersonaGenerator (人设生成 - 占位)
├── ScriptGenerator (脚本生成 - 新建)
├── VideoGenerator (视频生成 - 新建)
└── VideoJobMonitor (任务监控 - 独立)
```

### 详细组件设计

#### 1. 主容器组件 - VideoGenerationWorkflow
```typescript
interface VideoGenerationWorkflowProps {
  initialProductId?: string;
  onComplete?: (result: VideoGenerationResult) => void;
  className?: string;
}

// 职责：
// - 流程编排和状态管理
// - 组件间通信协调
// - 错误处理和用户反馈
// - 与现有VideoGenerationPage兼容
```

#### 2. 商品选择组件 - ProductSelector
```typescript
interface ProductSelectorProps {
  onProductSelected: (product: Product) => void;
  initialProductId?: string;
  disabled?: boolean;
}

// 职责：
// - 复用ProductManagement的商品选择逻辑
// - 商品搜索和筛选
// - 商品详情加载
// - 与现有商品库集成
```

#### 3. 商品分析组件 - ProductAnalysisSection
```typescript
interface ProductAnalysisSectionProps {
  product: Product;
  onAnalysisComplete: (analysis: ProductAnalysis) => void;
  disabled?: boolean;
}

// 职责：
// - 复用CompetitorAnalysis的输入和分析逻辑
// - 文本输入和多媒体支持
// - AI分析结果处理
// - 分析结果展示和编辑
```

#### 4. 人设生成组件 - PersonaGenerator 🔄 **占位**
```typescript
interface PersonaGeneratorProps {
  product: Product;
  analysis: ProductAnalysis;
  onPersonaGenerated: (persona: Persona) => void;
  disabled?: boolean;
}

// 职责：
// - 占位组件，等人设生成模块完成后实现
// - 人设生成和选择
// - 人设信息展示
// - TODO: 集成人设生成模块
```

#### 5. 脚本生成组件 - ScriptGenerator ⭐ **新建**
```typescript
interface ScriptGeneratorProps {
  product: Product;
  analysis: ProductAnalysis;
  persona?: Persona;
  onScriptGenerated: (script: VideoScript) => void;
  disabled?: boolean;
}

// 职责：
// - 脚本生成和编辑
// - 脚本预览和验证
// - 脚本参数配置
// - 与AI服务集成
```

#### 6. 视频生成组件 - VideoGenerator ⭐ **新建**
```typescript
interface VideoGeneratorProps {
  product: Product;
  script: VideoScript;
  onVideoJobCreated: (jobId: string) => void;
  disabled?: boolean;
}

// 职责：
// - 视频生成参数配置
// - 视频生成任务提交
// - 生成参数验证
// - 与视频生成服务集成
```

#### 7. 任务监控组件 - VideoJobMonitor
```typescript
interface VideoJobMonitorProps {
  jobId: string;
  onJobComplete: (result: VideoResult) => void;
  onJobError?: (error: string) => void;
}

// 职责：
// - 任务状态监控（独立组件）
// - 进度显示和状态更新
// - 结果展示和下载
// - 错误处理和重试
```

### 状态管理策略

#### Context + useReducer 模式
```typescript
interface VideoGenerationState {
  currentStep: 'product' | 'analysis' | 'persona' | 'script' | 'video' | 'monitor';
  product: Product | null;
  analysis: ProductAnalysis | null;
  persona: Persona | null;
  script: VideoScript | null;
  videoJob: VideoJob | null;
  error: string | null;
  loading: boolean;
}

type VideoGenerationAction = 
  | { type: 'SET_PRODUCT'; payload: Product }
  | { type: 'SET_ANALYSIS'; payload: ProductAnalysis }
  | { type: 'SET_PERSONA'; payload: Persona }
  | { type: 'SET_SCRIPT'; payload: VideoScript }
  | { type: 'SET_VIDEO_JOB'; payload: VideoJob }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'GO_TO_STEP'; payload: VideoGenerationStep };
```

#### 组件通信策略
```typescript
// 通过 Context 和回调函数实现组件间通信
const VideoGenerationContext = createContext<{
  state: VideoGenerationState;
  dispatch: Dispatch<VideoGenerationAction>;
  goToStep: (step: VideoGenerationStep) => void;
  canGoToStep: (step: VideoGenerationStep) => boolean;
}>();
```

### API调用策略

#### 统一API客户端
```typescript
// 使用统一的API客户端，避免硬编码
import { productService, adminService } from '@/src/core/api';

// 所有API调用都通过服务层
const product = await productService.getProduct(productId);
const analysis = await adminService.createAnalysis(analysisData);
const script = await adminService.generateScript(scriptData);
const videoJob = await adminService.createVideoJob(videoData);
```

#### 错误处理策略
```typescript
// 统一的错误处理
const handleApiError = (error: any, context: string) => {
  console.error(`${context} failed:`, error);
  dispatch({ type: 'SET_ERROR', payload: `${context}失败: ${error.message}` });
};
```

## 📁 文件结构

```
components/video-generation/
├── VideoGenerationWorkflow.tsx          # 主容器组件
├── ProductSelector.tsx                   # 商品选择（复用现有）
├── ProductAnalysisSection.tsx           # 商品分析（复用现有）
├── PersonaGenerator.tsx                 # 人设生成（占位待实现）
├── ScriptGenerator.tsx                  # 脚本生成（新建）
├── VideoGenerator.tsx                   # 视频生成（新建）
├── VideoJobMonitor.tsx                  # 任务监控（独立）
├── hooks/
│   ├── useVideoGenerationState.ts       # 状态管理Hook
│   ├── useVideoGenerationFlow.ts        # 流程控制Hook
│   └── useVideoGenerationApi.ts         # API调用Hook
├── types/
│   └── video-generation.ts              # 类型定义
└── constants/
    └── video-generation.ts              # 常量定义
```

## 🎨 UI/UX 设计原则

### 布局设计
1. **瀑布流布局** - 垂直排列，完成一步展开下一步
2. **卡片式设计** - 每个步骤独立卡片，状态清晰
3. **进度指示器** - 顶部显示整体进度
4. **响应式设计** - 适配不同屏幕尺寸

### 交互设计
1. **状态反馈** - 加载、成功、错误状态明确
2. **可回退** - 用户可以修改之前步骤的结果
3. **自动滚动** - 完成步骤后自动滚动到下一步
4. **键盘支持** - 支持键盘导航和快捷键

### 视觉设计
1. **一致性** - 与现有设计系统保持一致
2. **可访问性** - 支持屏幕阅读器和键盘导航
3. **加载状态** - 清晰的加载和进度指示
4. **错误处理** - 友好的错误提示和恢复建议

## 🔄 迁移策略

### 第一阶段：基础架构搭建
1. 创建新的组件结构和类型定义
2. 实现状态管理和Context
3. 创建基础Hook和工具函数
4. 保持原有组件不变

### 第二阶段：组件实现
1. 实现ProductSelector（复用现有）
2. 实现ProductAnalysisSection（复用现有）
3. 实现PersonaGenerator（占位组件）
4. 实现ScriptGenerator（新建）
5. 实现VideoGenerator（新建）

### 第三阶段：集成测试
1. 集成所有组件到主容器
2. 测试完整流程
3. 修复bug和优化性能
4. 与现有VideoGenerationPage对比测试

### 第四阶段：替换和清理
1. 替换原有VideoGenerationPRD组件
2. 更新相关引用
3. 清理旧代码
4. 更新文档

## 📊 验收标准

### 功能验收
- [ ] 所有原有功能正常工作
- [ ] 组件间通信正常
- [ ] 错误处理完善
- [ ] 与现有系统兼容

### 性能验收
- [ ] 组件加载时间 < 2秒
- [ ] 内存使用合理
- [ ] 无内存泄漏
- [ ] 响应式性能良好

### 代码质量验收
- [ ] TypeScript类型安全
- [ ] ESLint检查通过
- [ ] 组件职责单一
- [ ] 代码复用率高

### 用户体验验收
- [ ] 界面友好直观
- [ ] 操作流程顺畅
- [ ] 错误提示清晰
- [ ] 加载状态明确

## 🚀 后续优化

### 短期优化
1. 完善人设生成组件集成
2. 优化API调用性能
3. 增强错误处理
4. 添加单元测试

### 长期优化
1. 支持更多视频格式
2. 添加批量处理功能
3. 集成更多AI模型
4. 支持自定义模板

## 📝 待办事项

### 高优先级
- [ ] 实现ScriptGenerator组件
- [ ] 实现VideoGenerator组件
- [ ] 创建状态管理Hook
- [ ] 集成现有组件

### 中优先级
- [ ] 完善错误处理
- [ ] 添加单元测试
- [ ] 优化性能
- [ ] 完善文档

### 低优先级
- [ ] 人设生成模块集成（等待模块完成）
- [ ] 高级功能扩展
- [ ] 国际化支持
- [ ] 主题定制

---

**创建时间**: 2024-01-XX  
**最后更新**: 2024-01-XX  
**负责人**: 开发团队  
**状态**: 待确认
