# PromptsTab 组件重构 PRD

## 1. 项目背景

### 1.1 现状问题
- `PromptsTab.tsx` 文件过大（523行），违反单一职责原则
- 组件职责混杂：提示词管理、规则管理、AI反推、搜索筛选等
- 状态管理复杂，8个useState状态相互依赖
- 可维护性差，测试困难，扩展性不足
- 存在顽固的TypeScript类型错误

### 1.2 重构目标
- 提高代码可维护性和可读性
- 遵循单一职责原则，组件职责清晰
- 解决TypeScript类型错误问题
- 保持业务逻辑不变，不影响其他模块调用
- 提升代码复用性和测试覆盖

## 2. 功能需求

### 2.1 核心功能保持
- 提示词CRUD操作（创建、读取、更新、删除）
- 搜索和筛选功能
- 规则管理集成
- AI反推功能
- 编辑弹窗管理
- 空状态展示

### 2.2 接口保持不变
- `PromptsTab` 组件props接口完全不变
- 所有对外暴露的功能保持一致
- 不影响父组件的调用方式

## 3. 技术方案

### 3.1 组件拆分架构

```
PromptsTab/
├── index.tsx                    // 主容器组件，保持原有接口
├── components/
│   ├── SearchAndFilter.tsx     // 搜索筛选区域（通用组件）
│   ├── PromptList.tsx          // 提示词列表（专用组件）
│   ├── PromptCard.tsx          // 单个提示词卡片（专用组件）
│   ├── PromptEditModal.tsx     // 编辑/新建弹窗（专用组件）
│   ├── AIReverseModal.tsx      // AI反推弹窗（专用组件）
│   └── EmptyState.tsx          // 空状态（通用组件）
├── hooks/
│   ├── usePromptSearch.ts      // 搜索和筛选逻辑
│   ├── usePromptActions.ts     // CRUD操作
│   └── usePromptModals.ts      // 弹窗状态管理
└── types/
    └── index.ts                // 相关类型定义
```

### 3.2 组件职责划分

#### 3.2.1 主容器组件 (index.tsx)
- 保持原有接口不变
- 协调子组件之间的数据流
- 管理全局状态

#### 3.2.2 搜索筛选组件 (SearchAndFilter.tsx)
- 搜索输入框
- 业务模块筛选
- 操作按钮（AI反推、手动新建）

#### 3.2.3 提示词列表组件 (PromptList.tsx)
- 提示词列表展示
- 列表操作（编辑、复制、删除）
- 空状态展示

#### 3.2.4 提示词卡片组件 (PromptCard.tsx)
- 单个提示词信息展示
- 操作按钮
- 状态标识

#### 3.2.5 编辑弹窗组件 (PromptEditModal.tsx)
- 提示词编辑表单
- 表单验证
- 保存/取消操作

#### 3.2.6 AI反推弹窗组件 (AIReverseModal.tsx)
- AI反推功能集成
- 业务模块选择
- 成功回调处理

#### 3.2.7 空状态组件 (EmptyState.tsx)
- 无数据状态展示
- 操作引导

### 3.3 状态管理优化

#### 3.3.1 使用useReducer替代多个useState
```typescript
interface PromptsState {
  searchTerm: string
  selectedModule: string
  editingPrompt: CompatiblePrompt | null
  saving: boolean
  showAIReverseEngineer: boolean
  selectedBusinessModule: string
}

type PromptsAction = 
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_SELECTED_MODULE'; payload: string }
  | { type: 'SET_EDITING_PROMPT'; payload: CompatiblePrompt | null }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_SHOW_AI_REVERSE'; payload: boolean }
  | { type: 'SET_SELECTED_BUSINESS_MODULE'; payload: string }
```

#### 3.3.2 自定义Hooks
- `usePromptSearch`: 搜索和筛选逻辑
- `usePromptActions`: CRUD操作
- `usePromptModals`: 弹窗状态管理

### 3.4 TypeScript类型优化

#### 3.4.1 解决顽固类型错误
- 严格类型定义，避免`any`类型
- 使用类型守卫和联合类型
- 完善接口定义和类型约束

#### 3.4.2 类型定义集中管理
- 在`types/`目录下统一管理
- 导出清晰的类型接口
- 避免类型重复定义

### 3.5 性能优化

#### 3.5.1 组件memo优化
- 对纯展示组件使用`React.memo`
- 对列表项组件使用`React.memo`
- 优化不必要的重渲染

#### 3.5.2 回调函数优化
- 使用`useCallback`优化事件处理函数
- 避免在render中创建新函数

## 4. 实施计划

### 4.1 第一阶段：类型定义和基础结构
- 创建类型定义文件
- 建立组件目录结构
- 定义接口和类型

### 4.2 第二阶段：组件拆分
- 拆分搜索筛选组件
- 拆分提示词列表组件
- 拆分提示词卡片组件

### 4.3 第三阶段：弹窗组件
- 拆分编辑弹窗组件
- 拆分AI反推弹窗组件
- 拆分空状态组件

### 4.4 第四阶段：状态管理优化
- 实现useReducer状态管理
- 创建自定义Hooks
- 优化组件间数据流

### 4.5 第五阶段：性能优化和测试
- 添加memo优化
- 完善类型定义
- 确保测试覆盖

## 5. 技术要求

### 5.1 TypeScript严格模式
- 禁止使用`any`类型
- 所有函数参数和返回值必须有明确类型
- 使用类型守卫进行类型检查
- 完善接口定义和类型约束

### 5.2 代码规范
- 遵循项目现有代码风格
- 使用ESLint和Prettier
- 添加必要的注释和文档

### 5.3 性能要求
- 组件渲染性能优化
- 避免不必要的重渲染
- 合理使用memo和useCallback

### 5.4 测试要求
- 保持现有测试用例
- 新增组件单元测试
- 确保功能完整性

## 6. 验收标准

### 6.1 功能验收
- 所有现有功能正常工作
- 接口调用方式不变
- 业务逻辑保持一致

### 6.2 代码质量验收
- TypeScript编译无错误
- ESLint检查通过
- 组件职责单一清晰
- 代码可读性和可维护性提升

### 6.3 性能验收
- 组件渲染性能不降低
- 内存使用合理
- 用户体验流畅

## 7. 风险评估

### 7.1 技术风险
- 组件拆分可能影响现有功能
- 状态管理重构可能引入bug
- TypeScript类型错误修复可能影响其他模块

### 7.2 缓解措施
- 分阶段实施，每阶段完成后进行测试
- 保持原有接口不变，降低影响范围
- 充分测试，确保功能完整性

## 8. 后续优化

### 8.1 短期优化
- 完善组件文档
- 增加单元测试覆盖
- 优化性能瓶颈

### 8.2 长期优化
- 考虑引入状态管理库
- 实现组件懒加载
- 优化用户体验

---

**文档版本**: v1.0  
**创建时间**: 2024-12-19  
**负责人**: 开发团队  
**审核状态**: 待审核
