# TypeScript 错误修复指南

## 🎯 目标
提供完整的 TypeScript 错误诊断、修复和预防策略，确保项目类型安全。

## 📋 常见错误类型及修复

### 1. `as any` 类型断言错误

#### 问题描述
```typescript
// ❌ 错误：使用 any 类型
const status = searchParams.get('status') as any
```

#### 修复方法
```typescript
// ✅ 正确：定义具体类型
type MappingStatus = 'pending' | 'confirmed' | 'rejected'
const status = searchParams.get('status') as MappingStatus

// ✅ 更好：使用类型守卫
function isValidStatus(status: string): status is MappingStatus {
  return ['pending', 'confirmed', 'rejected'].includes(status)
}

if (isValidStatus(status)) {
  // 这里 status 被推断为 MappingStatus 类型
  const mapping = await prisma.productMapping.update({
    where: { id },
    data: { status } // 不需要 as any
  })
}
```

### 2. 缺失类型定义错误

#### 问题描述
```typescript
// ❌ 错误：接口属性缺失
interface Style {
  name: string
  description: string
  // 缺少 templatePerformance 属性
}

// 使用时出错
const style: Style = {
  name: 'test',
  description: 'test',
  templatePerformance: 0.8 // Property 'templatePerformance' does not exist
}
```

#### 修复方法
```typescript
// ✅ 正确：完整接口定义
interface Style {
  name: string
  description: string
  templatePerformance?: number // 可选属性
}
```

### 3. 类型转换错误

#### 问题描述
```typescript
// ❌ 错误：类型不匹配
const product = {
  sellingPoints: "point1, point2" // 字符串
}

// API 期望数组类型
const apiData = {
  sellingPoints: product.sellingPoints // 类型不匹配
}
```

#### 修复方法
```typescript
// ✅ 正确：显式类型转换
const product = {
  sellingPoints: "point1, point2".split(',').map(s => s.trim())
}

// 或者使用类型安全的转换函数
function parseSellingPoints(input: string | string[]): string[] {
  if (Array.isArray(input)) return input
  return input.split(',').map(s => s.trim()).filter(s => s)
}
```

### 4. 可选属性访问错误

#### 问题描述
```typescript
// ❌ 错误：可能为 undefined
const name = product.name.toUpperCase() // 如果 name 为 null
```

#### 修复方法
```typescript
// ✅ 正确：空值检查
const name = product.name?.toUpperCase() ?? ''

// 或者使用类型守卫
if (product.name) {
  const name = product.name.toUpperCase()
}
```

### 5. 导入错误

#### 问题描述
```typescript
// ❌ 错误：缺失导入
import { FileText, Video } from 'lucide-react' // 如果这些图标不存在
```

#### 修复方法
```typescript
// ✅ 正确：检查可用图标
import { 
  FileText, 
  Video, 
  // 其他需要的图标
} from 'lucide-react'

// 或者使用动态导入
const { FileText } = await import('lucide-react')
```

## 🛠️ 修复工具和命令

### 1. 类型检查命令
```bash
# 检查所有 TypeScript 错误
npm run type-check

# 实时类型检查
npm run type-check:watch

# 构建时检查
npm run build
```

### 2. ESLint 检查
```bash
# 检查代码规范
npm run lint

# 自动修复可修复的问题
npm run lint -- --fix
```

### 3. 类型生成
```bash
# 生成 Prisma 类型
npm run db:generate

# 同步数据库类型
npm run db:push
```

## 🔧 开发流程优化

### 1. 类型优先开发
```typescript
// 1. 先定义类型
interface ProductFormData {
  name: string
  sellingPoints: string[]
  targetCountries: string[]
}

// 2. 再实现功能
function createProduct(data: ProductFormData): Promise<Product> {
  // 实现逻辑
}

// 3. 最后添加业务逻辑
```

### 2. 使用类型定义文件
```typescript
// types/index.ts
export type MappingStatus = 'pending' | 'confirmed' | 'rejected'
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// 在组件中使用
import { MappingStatus, ApiResponse } from '@/types'
```

### 3. 类型守卫函数
```typescript
// 类型安全的验证
function isValidUserRole(role: string): role is UserRole {
  return ['admin', 'viewer', 'editor'].includes(role)
}

// 使用类型守卫
if (isValidUserRole(userRole)) {
  // userRole 被推断为 UserRole 类型
  handleUserRole(userRole)
}
```

## 📊 质量检查清单

### 提交前检查
- [ ] `npm run type-check` 无错误
- [ ] `npm run lint` 通过
- [ ] 所有 `as any` 已替换
- [ ] 新增类型已添加到 `types/` 目录
- [ ] 表单数据转换正确
- [ ] 可选属性正确处理

### 代码审查要点
- [ ] 类型定义完整且准确
- [ ] 避免使用 `any` 类型
- [ ] 类型转换安全可靠
- [ ] 错误处理类型安全
- [ ] 接口设计合理

## 🚀 最佳实践

### 1. 类型定义策略
- 集中管理：在 `types/` 目录统一管理
- 分层设计：基础类型、业务类型、API 类型分离
- 版本控制：类型变更需同步更新文档

### 2. 错误处理策略
- 类型安全：使用类型守卫而非类型断言
- 防御性编程：处理所有可能的类型情况
- 错误边界：在组件边界处理类型错误

### 3. 性能优化
- 类型导入：使用 `type` 导入减少运行时开销
- 类型缓存：避免重复类型计算
- 类型推断：充分利用 TypeScript 类型推断

## 📚 相关资源

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [TypeScript 严格模式](https://www.typescriptlang.org/tsconfig#strict)
- [ESLint TypeScript 规则](https://typescript-eslint.io/rules/)
- [Prisma 类型生成](https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-generation)
