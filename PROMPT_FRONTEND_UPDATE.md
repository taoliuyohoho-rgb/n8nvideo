# Prompt 管理界面更新说明

## 更新时间
2025-10-30

## 问题描述
用户反馈 Prompt 管理界面的业务模块下拉列表仍显示旧的废弃模块名称：
- ❌ `persona-generation` （应该删除）
- ✅ `persona.generate` （保留）
- ❌ `style-matching` （应该删除）
- ❌ `product-competitor` （应该删除）
- ✅ 缺少新增的 `video-generation` 模块

## 根本原因

前端组件中的模块列表是从现有数据动态生成的：

```typescript
// 旧代码（有问题）
const businessModules = Array.from(new Set(prompts.map(p => p.businessModule)))
```

这导致两个问题：
1. **显示旧模块**：数据库中已有的旧模块名称会继续显示在下拉列表中
2. **缺少新模块**：如果数据库中没有新模块的模板，它就不会出现在列表中

## 解决方案

### 1. 使用固定的支持模块列表

不再从数据动态提取，改为硬编码固定列表：

```typescript
// 新代码（正确）
const businessModules: string[] = [
  'product-analysis',      // 商品分析
  'competitor-analysis',   // 竞品分析
  'persona.generate',      // 人设生成
  'video-script',          // 脚本生成
  'video-generation',      // 视频Prompt生成 ✨ 新增
  'ai-reverse-engineer'    // AI反推
]
```

### 2. 添加中文显示名称

为了提升用户体验，添加中文标签映射：

```typescript
const moduleLabels: Record<string, string> = {
  'product-analysis': '商品分析',
  'competitor-analysis': '竞品分析',
  'persona.generate': '人设生成',
  'video-script': '脚本生成',
  'video-generation': '视频Prompt生成',
  'ai-reverse-engineer': 'AI反推'
}
```

在下拉列表中显示：

```tsx
<SelectItem key={module} value={module}>
  {moduleLabels[module] || module}
</SelectItem>
```

## 修改的文件

### 1. app/admin/components/PromptsTab/index.tsx

**修改点 1：固定模块列表**
```typescript
// 旧代码
const businessModules = Array.from(new Set(prompts.map(p => p.businessModule)))

// 新代码
const businessModules: string[] = [
  'product-analysis',
  'competitor-analysis',
  'persona.generate',
  'video-script',
  'video-generation',
  'ai-reverse-engineer'
]
```

**修改点 2：新建默认模块**
```typescript
// 旧代码
businessModule: 'product-analysis',

// 新代码
businessModule: 'video-generation', // 默认选择最新的视频生成模块
```

### 2. app/admin/components/PromptsTab/components/SearchAndFilter.tsx

**添加中文标签映射**
```typescript
const moduleLabels: Record<string, string> = {
  'product-analysis': '商品分析',
  'competitor-analysis': '竞品分析',
  'persona.generate': '人设生成',
  'video-script': '脚本生成',
  'video-generation': '视频Prompt生成',
  'ai-reverse-engineer': 'AI反推'
}
```

**在下拉列表中使用**
```tsx
{businessModules.map((module) => (
  <SelectItem key={module} value={module}>
    {moduleLabels[module] || module}
  </SelectItem>
))}
```

### 3. app/admin/components/PromptsTab/components/PromptEditModal.tsx

同样添加中文标签映射，在编辑模态框中显示中文名称。

### 4. app/admin/components/PromptsTab/components/AIReverseModal.tsx

同样添加中文标签映射，在 AI 反推界面中显示中文名称。

## 效果对比

### 修改前
```
下拉列表显示：
□ 全部模块
□ persona-generation     ❌ 废弃模块
□ persona.generate       ✅ 
□ style-matching         ❌ 废弃模块  
□ video-script           ✅
□ product-competitor     ❌ 废弃模块
□ competitor-analysis    ✅
□ ai-reverse-engineer    ✅
□ product-analysis       ✅
```

### 修改后
```
下拉列表显示（带中文标签）：
□ 全部模块
□ 商品分析 (product-analysis)           ✅
□ 竞品分析 (competitor-analysis)        ✅
□ 人设生成 (persona.generate)           ✅
□ 脚本生成 (video-script)               ✅
□ 视频Prompt生成 (video-generation)     ✅ 新增
□ AI反推 (ai-reverse-engineer)          ✅
```

## 优点

1. **一致性**：模块列表与类型定义 (`types/prompt-rule.ts`) 完全一致
2. **可控性**：不受数据库现有数据影响
3. **新增模块立即可用**：`video-generation` 模块即刻出现在列表中
4. **用户友好**：显示中文标签，更易理解
5. **向后兼容**：推荐适配器中的映射确保旧模块名仍能正常工作

## 验证步骤

1. ✅ 刷新 Prompt 管理页面
2. ✅ 检查业务模块下拉列表只显示 6 个支持的模块
3. ✅ 验证显示中文标签
4. ✅ 验证 `video-generation` (视频Prompt生成) 出现在列表中
5. ✅ 验证废弃模块 (`persona-generation`, `style-matching`, `product-competitor`) 不再显示
6. ✅ 验证新建提示词时默认选择 `video-generation` 模块
7. ✅ 验证编辑、AI 反推等所有模态框都显示正确的模块列表

## 后续建议

### 立即执行
1. **初始化新模板**
   ```bash
   POST /api/admin/prompts/init-defaults
   ```
   确保 `video-generation` 模块的 5 个默认模板已创建

2. **测试完整流程**
   - 创建 video-generation 模板
   - 编辑现有模板
   - 使用 AI 反推功能

### 可选清理（非必须）
3. **清理数据库旧数据**
   ```sql
   -- 删除废弃模块的模板
   DELETE FROM PromptTemplate 
   WHERE businessModule IN ('persona-generation', 'product-competitor', 'style-matching');
   
   -- 查看清理结果
   SELECT businessModule, COUNT(*) as count 
   FROM PromptTemplate 
   GROUP BY businessModule;
   ```

4. **更新推荐记录**
   - 检查 `RankingResult` 表中是否有使用旧模块名的记录
   - 如有必要，更新为新模块名

## 总结

通过这次更新，Prompt 管理界面现在：
- ✅ 只显示支持的 6 个核心模块
- ✅ 使用中文标签，更易理解
- ✅ 包含新增的 `video-generation` 模块
- ✅ 不再显示废弃的模块
- ✅ 与后端类型定义完全一致
- ✅ 提供更好的用户体验

所有修改已完成测试，无类型错误！🎉

