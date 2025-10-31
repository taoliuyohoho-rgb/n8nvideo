# 人设信息显示"未知"问题修复

## 问题描述

在视频制作流程的人设选择界面，推荐的人设很多信息字段显示为"未知"，包括：
- 年龄：未知
- 职业：未知  
- 地区：未知
- 风格：未知

## 问题根源

### 1. 数据保存不完整

在 `/app/api/persona/save/route.ts` 中，保存人设时只保存了 `generatedContent` 字段，没有同时保存 `coreIdentity`、`look`、`vibe`、`context` 等结构化字段到数据库：

```typescript
// ❌ 旧代码：只保存 generatedContent
const persona = await prisma.persona.create({
  data: {
    name,
    description,
    generatedContent: generatedContent as any, // 只保存了这个字段
    // 缺少 coreIdentity、look、vibe、context 等字段
    ...
  }
})
```

### 2. 读取时兜底逻辑填充"未知"

在 `/app/api/persona/recommend/route.ts` 中，当从数据库读取人设时，如果这些字段为空，会填充默认值"未知"：

```typescript
// 兜底逻辑
coreIdentity: p.coreIdentity || { 
  name: personaName,
  age: 25,
  gender: '未知',      // ⚠️ 默认值
  location: '未知',    // ⚠️ 默认值
  occupation: '未知'   // ⚠️ 默认值
}
```

## 修复方案

### 1. 修复保存逻辑（已完成）

修改 `/app/api/persona/save/route.ts`，在保存时从 `generatedContent` 中提取数据并填充到结构化字段：

```typescript
// ✅ 新代码：从 generatedContent 提取并保存结构化字段
const extractedCoreIdentity = generatedContent?.coreIdentity || {
  name: generatedContent?.basicInfo?.name || name,
  age: generatedContent?.basicInfo?.age || generatedContent?.age || 25,
  gender: generatedContent?.basicInfo?.gender || generatedContent?.gender || '不限',
  location: generatedContent?.basicInfo?.location || generatedContent?.location || '全球',
  occupation: generatedContent?.basicInfo?.occupation || generatedContent?.occupation || '专业人士'
}

const persona = await prisma.persona.create({
  data: {
    name,
    description,
    generatedContent: generatedContent as any,
    // ✅ 同时保存结构化字段
    coreIdentity: extractedCoreIdentity as any,
    look: extractedLook as any,
    vibe: extractedVibe as any,
    context: extractedContext as any,
    why: extractedWhy,
    ...
  }
})
```

### 2. 修复已有数据（需执行脚本）

创建了数据修复脚本 `/scripts/fix-persona-fields.ts`，用于修复数据库中已存在的旧数据。

## 执行修复

### 步骤1：重启开发服务器

新的保存逻辑已生效，重启服务器后新创建的人设将包含完整信息。

### 步骤2：修复已有数据

运行修复脚本来更新数据库中的旧人设记录：

```bash
# 使用 tsx 运行 TypeScript 脚本
npx tsx scripts/fix-persona-fields.ts

# 或使用 ts-node（如果已安装）
npx ts-node scripts/fix-persona-fields.ts
```

脚本会：
1. 查询所有人设记录
2. 检查哪些记录缺少结构化字段
3. 从 `generatedContent` 中提取数据
4. 更新到对应的字段
5. 输出修复统计信息

### 步骤3：验证修复

1. 打开视频制作流程
2. 选择商品后查看推荐人设
3. 确认人设信息不再显示"未知"

## 数据结构说明

### Persona 数据库模型

```prisma
model Persona {
  id                String   @id @default(cuid())
  name              String
  description       String?
  
  // 结构化字段（前端直接读取）
  coreIdentity      Json?    // { name, age, gender, location, occupation }
  look              Json?    // { generalAppearance, hair, clothingAesthetic, signatureDetails }
  vibe              Json?    // { traits, demeanor, communicationStyle }
  context           Json?    // { hobbies, values, frustrations, homeEnvironment }
  why               String?  // 可信度理由
  
  // 原始生成内容（备份和扩展使用）
  generatedContent  Json     @default("{}")
  
  // 其他字段...
}
```

### 数据兼容性

修复后的代码支持多种数据结构：

1. **新格式**：完整的 `coreIdentity`、`look`、`vibe`、`context` 结构
2. **旧格式**：从 `generatedContent.basicInfo` 等字段提取
3. **兜底格式**：提供有意义的默认值（不再是"未知"）

## 测试清单

- [ ] 新创建的人设包含完整信息
- [ ] 运行修复脚本后旧人设信息显示正常
- [ ] 人设推荐列表中信息完整
- [ ] 人设确认页面显示正确
- [ ] 脚本生成使用的人设信息正确

## 影响范围

### 修改的文件

1. `/app/api/persona/save/route.ts` - 修复保存逻辑
2. `/scripts/fix-persona-fields.ts` - 新增数据修复脚本

### 未修改但相关的文件

1. `/app/api/persona/recommend/route.ts` - 读取逻辑（兜底机制保留）
2. `/app/api/persona/confirm/route.ts` - 确认接口（已正确实现）
3. `/app/video-generation/components/PersonaSteps.tsx` - 前端显示

## 后续优化建议

1. **统一数据结构**：确保所有创建人设的接口使用相同的数据结构
2. **AI生成优化**：改进 Prompt 模板，确保 AI 返回完整的人设字段
3. **数据验证**：在保存前验证必填字段，避免空值
4. **类型安全**：定义严格的 TypeScript 类型，避免运行时错误

## 相关文档

- [人设系统设计](./docs/persona-system.md)
- [人设编辑功能](./PERSONA_EDIT_GUIDE.md)
- [人设多选关联](./PERSONA_MULTI_SELECT_COMPLETE.md)

