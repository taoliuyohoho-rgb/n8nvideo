# Prompt 模块清理总结

## 执行时间
2025-10-30

## 问题描述
Prompt 管理的业务模块过多且存在冗余，需要清理和统一。

## 清理内容

### 1. 统一 persona 模块 ✅
**问题**：`persona-generation` 和 `persona.generate` 重复
**解决**：统一使用 `persona.generate`

**修改文件**：
- `app/api/admin/prompts/init-defaults/route.ts` - 保留 `persona.generate` 模块
- `src/services/recommendation/adapters/taskToPromptAdapter.ts` - 添加向后兼容映射
- `types/prompt-rule.ts` - 移除 `persona-generation`
- `app/admin/components/PersonaFormModalV2.tsx` - 更新为 `persona.generate`
- `app/api/persona/recommend/route.ts` - 更新为 `persona.generate` (3处)
- `components/video-generation/PersonaSelector.tsx` - 更新为 `persona.generate`

### 2. 移除 style-matching 模块 ✅
**问题**：`style-matching` 模块仅在一处使用且功能不完整
**解决**：移除该模块，相关功能合并到 `video-generation`

**修改文件**：
- `app/api/admin/prompts/init-defaults/route.ts` - 删除 5个 style-matching 模板
- `src/services/recommendation/adapters/taskToPromptAdapter.ts` - 添加向后兼容映射到 `video-generation`
- `types/prompt-rule.ts` - 移除 `style-matching`
- `app/admin/components/PromptRuleManager.tsx` - 移除标签定义

**注意**：`app/api/tasks/ai/match-style/route.ts` 保留以向后兼容，但建议后续迁移到新接口。

### 3. 清理 product-competitor 模块 ✅
**问题**：`product-competitor` 与 `competitor-analysis` 功能重复
**解决**：删除 `product-competitor`，统一使用 `competitor-analysis`

**说明**：
- `competitor-analysis` - 竞品分析（分析竞品的卖点、痛点等），在 `/api/competitor/*` 多处使用
- `product-analysis` - 商品分析（分析自己的商品），保留用于内部服务
- `product-competitor` - 删除（未找到实际使用的 API）

**修改文件**：
- `app/api/admin/prompts/init-defaults/route.ts` - 删除 5个 product-competitor 模板
- `src/services/recommendation/adapters/taskToPromptAdapter.ts` - 添加向后兼容映射到 `competitor-analysis`
- `types/prompt-rule.ts` - 移除 `product-competitor`
- `app/admin/components/PromptRuleManager.tsx` - 移除标签定义

### 4. 新增 video-generation 模块 ✅
**问题**：缺少视频生成的 Prompt 模块
**解决**：添加 `video-generation` 模块（视频生成的最后一步）

**业务场景**：
根据前面几步的人设、脚本、商品基本信息、以及会用到的模型来生成一个视频的 prompt，用户可以复制了手动去生成，或者直接连接 API 生成。

**新增模板**（5个）：
1. `视频Prompt生成-标准模板` - 综合商品、脚本、人设生成完整 Prompt
2. `视频Prompt生成-视觉强化版` - 强调光影、色彩、质感的高端视觉效果
3. `视频Prompt生成-简洁版` - 50-100字快速生成测试版本
4. `视频Prompt生成-场景化` - 构建真实使用场景的代入感
5. `视频Prompt生成-多模型适配` - 针对 Sora/Runway/Pika 等不同模型优化

**支持变量**：
- `productName` - 商品名称
- `category` - 商品类目
- `sellingPoints` - 商品卖点
- `targetAudience` - 目标受众
- `scriptContent` - 脚本内容
- `personaInfo` - 人设信息
- `templateName` - 选用的模板/风格
- `usageScenarios` - 使用场景
- `targetModel` - 目标生成模型

**修改文件**：
- `app/api/admin/prompts/init-defaults/route.ts` - 新增 5个 video-generation 模板
- `src/services/recommendation/adapters/taskToPromptAdapter.ts` - 添加模块支持
- `types/prompt-rule.ts` - 添加类型定义
- `app/admin/components/PromptRuleManager.tsx` - 添加标签定义

## 最终业务模块清单

清理后保留的 5 个核心业务模块：

| 业务模块 | 说明 | 模板数量 | 使用场景 |
|---------|------|---------|---------|
| `product-analysis` | 商品分析 | 5 | 分析自己的商品（卖点、痛点、受众等） |
| `competitor-analysis` | 竞品分析 | 5 | 分析竞品信息（对比、提取、洞察） |
| `persona.generate` | 人设生成 | 5 | 生成用户画像（基础信息、行为、心理等） |
| `video-script` | 脚本生成 | 5 | 生成视频脚本（标准、TikTok、故事化等） |
| `video-generation` | 视频Prompt生成 | 5 | 生成视频AI的Prompt（标准、视觉强化、场景化等） |

**总计**：5个业务模块，25个模板

**删除的模块**：
- ❌ `persona-generation` - 重复，统一为 `persona.generate`
- ❌ `product-competitor` - 未使用，统一到 `competitor-analysis`
- ❌ `style-matching` - 未使用，功能合并到 `video-generation`

## 向后兼容

为了不影响现有功能，在推荐适配器中添加了模块映射：

```typescript
// 统一业务模块名称（向后兼容）
let normalizedModule = businessModule
if (businessModule === 'persona-generation') {
  normalizedModule = 'persona.generate'
}
if (businessModule === 'product-competitor') {
  normalizedModule = 'competitor-analysis'
}
if (businessModule === 'style-matching') {
  normalizedModule = 'video-generation'
}
```

这样即使旧代码仍使用废弃的模块名，也会自动映射到新的模块。

## 验收清单

- [x] 更新 `init-defaults` API 删除废弃模块，添加新模块
- [x] 更新推荐适配器支持的模块列表，添加向后兼容映射
- [x] 更新类型定义文件
- [x] 更新前端组件中的模块引用
- [x] 更新 API 路由中的模块引用
- [x] 所有文件 Lint 检查通过
- [x] 创建清理总结文档
- [x] **更新 Prompt 管理界面的模块选择器**
  - 修改为使用固定的支持模块列表（而非从数据动态提取）
  - 添加中文标签映射，提升用户体验
  - 涉及文件：
    - `app/admin/components/PromptsTab/index.tsx`
    - `app/admin/components/PromptsTab/components/SearchAndFilter.tsx`
    - `app/admin/components/PromptsTab/components/PromptEditModal.tsx`
    - `app/admin/components/PromptsTab/components/AIReverseModal.tsx`

## 测试建议

1. **模板初始化测试**
   ```bash
   POST /api/admin/prompts/init-defaults
   ```
   预期：成功初始化 25 个模板，覆盖 5 个业务模块

2. **Persona 生成测试**
   - 测试 `/api/persona/generate` 接口
   - 验证推荐引擎返回 `persona.generate` 模板

3. **竞品分析测试**
   - 测试 `/api/competitor/analyze` 接口
   - 验证使用 `competitor-analysis` 模块

4. **视频生成测试**
   - 测试新的 `video-generation` 模块
   - 验证 Prompt 模板变量替换正确

5. **向后兼容测试**
   - 使用旧的模块名调用推荐引擎
   - 验证自动映射到新模块名

## 前端界面更新（2025-10-30 补充）

### 问题
用户反馈 Prompt 管理界面的业务模块下拉列表仍显示旧的废弃模块名称。

### 原因
前端组件使用 `Array.from(new Set(prompts.map(p => p.businessModule)))` 从现有数据动态提取模块列表，导致：
1. 数据库中的旧模块仍会显示
2. 新增的 `video-generation` 模块不会出现（如果数据库中没有该模块的模板）

### 解决方案
将业务模块列表改为**固定的支持列表**，确保与类型定义一致：

```typescript
const businessModules: string[] = [
  'product-analysis',
  'competitor-analysis',
  'persona.generate',
  'video-script',
  'video-generation',
  'ai-reverse-engineer'
]
```

同时添加中文标签映射，提升用户体验：

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

### 修改的文件
1. **app/admin/components/PromptsTab/index.tsx**
   - 将动态提取改为固定列表
   - 新建提示词的默认模块改为 `video-generation`

2. **app/admin/components/PromptsTab/components/SearchAndFilter.tsx**
   - 添加模块中文标签映射
   - 下拉列表显示中文名称

3. **app/admin/components/PromptsTab/components/PromptEditModal.tsx**
   - 添加模块中文标签映射
   - 编辑界面显示中文名称

4. **app/admin/components/PromptsTab/components/AIReverseModal.tsx**
   - 添加模块中文标签映射
   - AI反推界面显示中文名称

## 后续优化建议

1. **初始化模板数据**
   - 调用 `POST /api/admin/prompts/init-defaults` 初始化新模板
   - 确保 `video-generation` 模块的 5 个模板已创建

2. **数据库清理（可选）**
   - 清理数据库中废弃模块的旧模板数据
   - SQL: `DELETE FROM PromptTemplate WHERE businessModule IN ('persona-generation', 'product-competitor', 'style-matching')`
   - 更新已有的排名记录中的模块引用

3. **废弃 `/api/tasks/ai/match-style` 接口（可选）**
   - 该接口使用的 `style_parsing` 任务类型已不再需要
   - 建议迁移到新的 `video-generation` 流程

4. **完善 video-generation 模板**
   - 根据实际使用反馈优化 Prompt 模板
   - 添加更多针对特定场景的变体

5. **文档更新**
   - 更新业务文档中的模块说明
   - 添加 video-generation 模块的使用示例

## 影响范围评估

**低风险**：
- 所有修改都添加了向后兼容映射
- 核心业务流程未改动
- Lint 检查全部通过

**需要观察**：
- 推荐引擎的模块映射是否正常工作
- 旧模板数据是否需要迁移
- 前端界面显示是否需要调整

## 联系人

如有问题，请联系：开发团队

