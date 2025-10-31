# Prompt 模板详情查看功能

## 功能概述

为推荐的 Prompt 模板添加了点击查看详情的功能,用户可以在视频脚本生成页面查看推荐 Prompt 的完整内容、变量说明、输入输出要求等详细信息。

## 实现的功能

### 1. API 接口
- **路径**: `GET /api/prompt-template/[id]`
- **功能**: 获取指定 Prompt 模板的完整信息
- **返回数据**:
  - 基本信息(名称、业务模块、状态)
  - Prompt 内容
  - 变量说明
  - 输入/输出要求
  - 性能指标(成功率、使用次数等)
  - 创建/更新时间

### 2. 详情弹窗组件

在以下组件中添加了 `PromptDetailDialog` 组件:
- `components/RecommendationSelectorV2.tsx`
- `components/RecommendationSelector.tsx`

#### 弹窗展示内容:
1. **基本信息**
   - 模板名称
   - 业务模块
   - 性能评分
   - 成功率
   - 使用次数
   - 启用状态

2. **Prompt 详情**
   - 完整的 Prompt 内容(支持长文本滚动)
   - 变量说明
   - 输入要求
   - 输出要求
   - 输出规则

3. **时间信息**
   - 创建时间
   - 更新时间

### 3. 用户交互

#### 触发位置:
1. **推荐列表中**: 每个 Prompt 推荐项右侧显示"查看详情"按钮
2. **当前选择**: 已选中的 Prompt 旁边也有"查看详情"按钮
3. **自行选择弹窗**: 在候选列表中每个 Prompt 项都有"查看详情"按钮

#### 操作流程:
1. 点击"查看详情"按钮
2. 系统自动调用 API 加载 Prompt 详情
3. 弹窗展示完整的 Prompt 信息
4. 用户可以滚动查看所有内容
5. 点击弹窗外部或关闭按钮关闭弹窗

## 技术实现

### 文件修改:

#### 1. 新增文件
- `app/api/prompt-template/[id]/route.ts` - Prompt 详情 API

#### 2. 修改文件
- `components/RecommendationSelectorV2.tsx`
  - 添加 `PromptDetailDialog` 组件
  - 在推荐列表中添加查看详情按钮
  - 只在 `scenario === 'task->prompt'` 时显示

- `components/RecommendationSelector.tsx`
  - 添加 `PromptDetailDialog` 组件
  - 替换原有的嵌套 Popover 方案
  - 在当前选择和候选列表中添加查看详情按钮

### 类型定义:

```typescript
interface PromptTemplateDetail {
  id: string
  name: string
  businessModule: string
  content: string
  variables?: string
  description?: string
  performance?: number
  usageCount?: number
  successRate?: number
  isActive: boolean
  isDefault: boolean
  inputRequirements?: string
  outputRequirements?: string
  outputRules?: string
  createdAt: string
  updatedAt: string
}
```

## UI 设计

### 样式特点:
- 使用 shadcn/ui 的 Dialog 组件实现弹窗
- 最大宽度 3xl,最大高度 80vh,超出部分可滚动
- 不同类型信息使用不同背景色区分:
  - 描述: 蓝色背景
  - Prompt 内容: 灰色背景
  - 变量: 紫色背景
  - 输入要求: 绿色背景
  - 输出要求: 黄色背景
  - 输出规则: 橙色背景

### 按钮样式:
- 小尺寸按钮(`h-6 px-2 text-xs`)
- Ghost 变体,不会抢占视觉焦点
- 眼睛图标 + "查看详情"文字

## 使用场景

### 视频脚本生成流程:
1. 用户在"4. 脚本生成"步骤
2. AI 推荐最佳 Prompt 模板
3. 用户想了解 Prompt 的具体内容
4. 点击"查看详情"按钮
5. 查看完整的 Prompt 内容和说明
6. 决定是否使用该 Prompt 或选择其他备选项

## 优势

1. **透明度**: 用户可以清楚看到 AI 推荐的 Prompt 是什么
2. **可控性**: 用户可以根据 Prompt 内容决定是否使用
3. **学习性**: 用户可以学习优秀 Prompt 的写法
4. **调试性**: 方便排查生成问题时 Prompt 是否合适

## 测试要点

### 功能测试:
- [ ] API 能正确返回 Prompt 详情
- [ ] 详情弹窗能正确显示所有信息
- [ ] 点击不同 Prompt 能显示对应的详情
- [ ] 弹窗关闭功能正常
- [ ] 长文本能正常滚动

### 边界测试:
- [ ] Prompt 不存在时的错误处理
- [ ] 网络错误时的提示
- [ ] 空字段的处理(如 variables、description 为空)
- [ ] 超长 Prompt 内容的显示

### UI 测试:
- [ ] 不同屏幕尺寸下的显示效果
- [ ] 按钮位置不影响其他交互
- [ ] 弹窗层级正确(不被其他元素遮挡)

## 后续优化

### 可能的改进方向:
1. 添加复制 Prompt 内容的功能
2. 支持编辑 Prompt(管理员权限)
3. 显示 Prompt 的历史版本
4. 添加 Prompt 的使用统计图表
5. 支持 Prompt 的收藏和标记
6. 提供 Prompt 的效果对比

## 相关文档

- [推荐系统文档](./docs/technical/recommendation-system.md)
- [视频生成流程](./docs/features/video-generation.md)
- [Prompt 管理](./docs/features/prompt-management.md)

---

**实现日期**: 2025-10-30  
**实现人**: AI Assistant  
**版本**: v1.0

