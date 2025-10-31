# TypeScript 错误修复计划

## 当前状态分析

经过初步修复，发现以下主要问题：

### 1. 类型冲突问题
- 多个模块导出了相同的类型名称（User, AIConfig, Prompt 等）
- 需要统一类型定义或使用别名

### 2. 渐进式修复策略

#### 阶段1：解决编译错误（当前）
- 暂时将严格的 `any` 检查降级为警告
- 修复基本的类型导入和导出问题
- 确保项目可以正常编译

#### 阶段2：逐步替换 any 类型
- 优先修复高频使用的 `any` 类型
- 为 API 响应定义具体类型
- 为组件 Props 定义类型

#### 阶段3：类型安全优化
- 启用严格的类型检查
- 添加运行时类型验证
- 完善错误处理类型

## 立即可执行的修复

### 1. 修复类型冲突
```typescript
// 使用别名避免冲突
export type { User as AdminUser } from './admin'
export type { AIConfig as AdminAIConfig } from './admin'
```

### 2. 创建通用类型定义
```typescript
// 为 API 响应创建通用类型
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}
```

### 3. 逐步替换 any
```typescript
// 替换前
const data = response.data as any

// 替换后
interface ResponseData {
  id: string
  name: string
  // ... 其他属性
}
const data: ResponseData = response.data
```

## 禁用 any 的影响分析

### 短期影响（1-2周）
- 开发速度可能下降 20-30%
- 需要更多时间定义类型
- 学习成本增加

### 长期收益（1个月后）
- Bug 减少 50-70%
- 代码可维护性大幅提升
- IDE 支持更好
- 团队协作更顺畅

### 建议的平衡方案
1. 新代码严格禁用 `any`
2. 现有代码逐步迁移
3. 关键模块优先修复
4. 非关键模块可以暂时使用 `unknown` 替代 `any`
