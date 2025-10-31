# 人设多对多关系迁移完成

## 背景

原有的人设（Persona）与类目（Category）和商品（Product）是**一对一**或**多对一**关系：
- 一个人设只能关联一个类目（必需）
- 一个人设只能关联一个商品（可选）

但业务需求是**多对多**关系：
- 一个人设可以适用于多个类目和商品
- 一个类目/商品可以有多个人设

## 实现方案

### 1. 数据库 Schema 变更

#### 新增中间表
```prisma
// 人设-商品 多对多关系表
model PersonaProduct {
  id         String   @id @default(cuid())
  personaId  String
  productId  String
  isPrimary  Boolean  @default(false) // 是否为主商品
  createdAt  DateTime @default(now())
  
  persona    Persona  @relation(fields: [personaId], references: [id], onDelete: Cascade)
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@unique([personaId, productId])
  @@index([personaId])
  @@index([productId])
  @@map("persona_products")
}

// 人设-类目 多对多关系表
model PersonaCategory {
  id         String   @id @default(cuid())
  personaId  String
  categoryId String
  isPrimary  Boolean  @default(false) // 是否为主类目
  createdAt  DateTime @default(now())
  
  persona    Persona  @relation(fields: [personaId], references: [id], onDelete: Cascade)
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  @@unique([personaId, categoryId])
  @@index([personaId])
  @@index([categoryId])
  @@map("persona_categories")
}
```

#### 保留单选字段（向后兼容）
```prisma
model Persona {
  // 保留单选字段（向后兼容旧数据和脚本生成）
  categoryId        String   @default("default-category") // 主类目ID
  productId         String?  // 主商品ID
  
  // 单选关系（向后兼容）
  product           Product?  @relation("PersonaPrimaryProduct", fields: [productId], references: [id], onDelete: Cascade)
  category          Category  @relation("PersonaPrimaryCategory", fields: [categoryId], references: [id])
  
  // 多对多关系
  personaProducts   PersonaProduct[]  // 人设关联的多个商品
  personaCategories PersonaCategory[] // 人设关联的多个类目
}
```

**设计思路**：
- 保留 `categoryId`/`productId` 单选字段作为"主类目/主商品"
- 脚本生成、视频任务等依赖单选字段的功能**无需改动**
- 新增多对多关系表存储额外的关联

### 2. 后端 API 更新

#### 创建人设 (`POST /api/persona/save`)
```typescript
const persona = await prisma.persona.create({
  data: {
    name,
    description,
    // 主类目和主商品（兼容旧数据和脚本生成）
    categoryId: finalCategoryIds[0] || 'default-category',
    productId: finalProductIds[0] || null,
    // ... 其他字段 ...
    // 多对多关系
    personaCategories: {
      create: finalCategoryIds.map((catId, index) => ({
        categoryId: catId,
        isPrimary: index === 0 // 第一个为主类目
      }))
    },
    personaProducts: finalProductIds.length > 0 ? {
      create: finalProductIds.map((prodId, index) => ({
        productId: prodId,
        isPrimary: index === 0 // 第一个为主商品
      }))
    } : undefined
  }
})
```

#### 更新人设 (`PUT /api/admin/personas/[id]`)
```typescript
const persona = await prisma.persona.update({
  where: { id },
  data: {
    // ... 基本字段 ...
    // 多对多关系：先删除旧关系，再创建新关系
    personaCategories: {
      deleteMany: {}, // 删除所有旧类目关系
      create: finalCategoryIds.map((catId, index) => ({
        categoryId: catId,
        isPrimary: index === 0
      }))
    },
    personaProducts: {
      deleteMany: {}, // 删除所有旧商品关系
      create: finalProductIds.length > 0 ? finalProductIds.map((prodId, index) => ({
        productId: prodId,
        isPrimary: index === 0
      })) : []
    }
  },
  include: {
    // 返回关联数据
    personaCategories: {
      include: {
        category: { select: { id: true, name: true } }
      }
    },
    personaProducts: {
      include: {
        product: { select: { id: true, name: true } }
      }
    }
  }
})
```

#### 获取人设列表 (`GET /api/admin/personas`)
```typescript
const personas = await prisma.persona.findMany({
  include: {
    // 单选关系（兼容）
    product: { select: { id: true, name: true, category: true } },
    category: { select: { id: true, name: true } },
    // 多对多关系
    personaCategories: {
      include: {
        category: { select: { id: true, name: true } }
      }
    },
    personaProducts: {
      include: {
        product: { select: { id: true, name: true } }
      }
    }
  }
})
```

### 3. 前端适配

#### 数据加载（兼容新旧格式）
```typescript
// 从多对多关系表中提取ID（新格式）
const personaCategories = editingPersona.personaCategories as Array<{ categoryId: string }> | undefined
const personaProducts = editingPersona.personaProducts as Array<{ productId: string }> | undefined

const loadedCategoryIds = personaCategories && personaCategories.length > 0
  ? personaCategories.map(pc => pc.categoryId)  // 新格式
  : (categoryIds && categoryIds.length > 0
    ? categoryIds                                // 旧格式（数组）
    : (categoryId ? [categoryId] : []))          // 兜底（单选）
```

#### 数据提交（前端无需改动）
前端已经在使用 `categoryIds` 和 `productIds` 数组，无需修改。

## 数据库迁移

### 迁移文件
`prisma/migrations/20251031_add_persona_many_to_many/migration.sql`

### 执行命令
```bash
npx prisma migrate resolve --applied 20251031_add_persona_many_to_many
npx prisma db push
npx prisma generate
```

### 数据迁移策略

**旧数据自动兼容**：
- 旧人设的 `categoryId`/`productId` 字段继续有效
- 首次编辑时，会自动创建对应的多对多关系记录
- 不需要手动迁移旧数据

## 兼容性保证

### ✅ 完全兼容的模块
1. **脚本生成（Script）**：继续读取 `persona.categoryId` 和 `persona.productId`
2. **视频任务（VideoJob）**：通过 Script 间接使用，无影响
3. **旧版人设 API**：`POST /api/admin/personas`（旧格式）继续可用

### ✅ 已升级的模块
1. **人设创建**：`POST /api/persona/save`
2. **人设更新**：`PUT /api/admin/personas/[id]`
3. **人设列表**：`GET /api/admin/personas`
4. **人设表单**：`PersonaFormModalV2.tsx`

## 测试方法

### 1. 测试多对多关系
1. 打开人设管理页面
2. 创建新人设，选择多个类目或商品
3. 保存后刷新，检查是否正确保存
4. 编辑人设，修改类目/商品选择
5. 保存后再次检查

### 2. 测试向后兼容
1. 查看旧人设数据是否正常显示
2. 编辑旧人设，修改后保存
3. 检查 `categoryId`/`productId` 是否保持为第一个选项

### 3. 测试脚本生成
1. 使用关联了多个商品的人设生成脚本
2. 检查脚本是否使用主商品（第一个）信息

## 关键设计决策

### Q: 为什么保留单选字段？
**A**: 向后兼容 + 性能优化
- 脚本生成只需要一个"主商品"，不需要遍历多对多表
- 避免破坏性变更，旧代码无需改动
- 数据库查询更简单（不需要 JOIN）

### Q: 如何确定"主商品/主类目"？
**A**: 取数组第一个元素
- `categoryId = categoryIds[0]`
- `productId = productIds[0]`
- 中间表中 `isPrimary = (index === 0)`

### Q: 前端如何兼容新旧格式？
**A**: 优先级递减
1. 先尝试从 `personaCategories` 提取（新格式）
2. 再尝试从 `categoryIds` 数组提取（旧格式）
3. 最后兜底使用单选字段 `categoryId`

## 相关文件

### 数据库
- `prisma/schema.prisma` - Schema 定义
- `prisma/migrations/20251031_add_persona_many_to_many/migration.sql` - 迁移 SQL

### 后端 API
- `app/api/persona/save/route.ts` - 创建人设
- `app/api/admin/personas/[id]/route.ts` - 更新/删除人设
- `app/api/admin/personas/route.ts` - 获取人设列表

### 前端
- `app/admin/components/PersonaFormModalV2.tsx` - 人设表单
- `app/admin/features/personas/PersonaManagement.tsx` - 人设管理

## 后续扩展

### 可能的增强
1. **权重/优先级**：在中间表添加 `weight` 字段，控制商品/类目的优先级
2. **生效时间**：添加 `validFrom`/`validTo` 字段，支持时间范围内的关联
3. **关联原因**：添加 `reason` 字段，记录为什么关联此商品/类目
4. **批量操作**：提供批量添加/删除关联的 API

### 数据分析可能性
- 分析哪些商品共享同一人设（相似商品）
- 统计每个类目下的人设数量
- 追踪人设与商品关联的变化历史

---

**完成时间**: 2025-10-31  
**迁移状态**: ✅ 完成并测试通过

