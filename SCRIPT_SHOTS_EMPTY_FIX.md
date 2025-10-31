# 脚本生成Shots为空问题修复

## 问题描述

在视频脚本生成时，AI返回的`shots`数组为空`[]`，导致生成的video prompt中缺少关键的分镜信息。

**问题表现：**
```
Hook (en-US): No gas? No problem! Our induction cooker saves space & energy!
Main (en-US): 展示电磁炉面板/功能键
Close (en-US): Grab yours—small kitchen game-changer!

Shots:
   ⬆️ 这里为空！

Technical: vertical, split screen or side-by-side comparison, consistent lighting.
```

## 根本原因分析

### 1. **Schema约束不够严格**

在 `/app/api/script/generate/route.ts` 的 `getScriptSchema()` 函数中：

```typescript
// ❌ 旧代码：没有最小数量约束
shots: {
  type: "array",
  items: { ... }
}
```

虽然`shots`在`required`数组中，但**没有设置`minItems`约束**，导致空数组`[]`也符合Schema要求！

### 2. **Prompt约束不够明确**

Prompt中虽然提供了3个shot的示例，但：
- 没有明确说明**必须**包含具体数量的shots
- AI可能理解为"这只是格式示例"
- 没有强调shots不能为空

### 3. **兜底逻辑过于宽松**

虽然有兜底逻辑，但：
- 缺少错误日志，无法及时发现问题
- 没有警告机制，导致问题被隐藏
- 兜底逻辑成为"常态"而非"异常处理"

## 修复方案

### 1. ✅ 强化Schema约束

在 `getScriptSchema()` 中添加 `minItems: 3` 约束：

```typescript
// ✅ 新代码：强制至少3个镜头
shots: {
  type: "array",
  minItems: 3,  // 强制要求至少3个镜头
  items: {
    type: "object",
    properties: {
      second: { type: "number" },
      camera: { type: "string" },
      action: { type: "string" },
      visibility: { type: "string" },
      audio: { type: "string" }
    },
    required: ["second", "camera", "action", "visibility", "audio"]
  }
}
```

### 2. ✅ 明确Prompt要求

在 `buildScriptPrompt()` 的硬性规则中添加：

```typescript
- **shots数组必须包含至少3个镜头**，每个镜头必须有具体的second、camera、action、visibility、audio，不能为空数组。
- shots中的action必须具体描述画面内容，结合产品特性和卖点，不能使用通用模板。
```

### 3. ✅ 优化兜底逻辑

在 `validateAndCleanScript()` 中添加错误日志和警告：

```typescript
if (!shots || shots.length === 0) {
  console.error('❌ AI返回的shots为空，这不应该发生！', { data })
  console.warn('⚠️ 使用兜底逻辑生成shots（这不应该成为常态）')
  // ... 兜底逻辑
} else if (shots.length < 3) {
  console.warn(`⚠️ AI返回的shots数量不足：${shots.length}个（期望至少3个）`)
}
```

## 预期效果

修复后，AI应该会生成完整的shots数组：

```
Shots:
[0-3s] Camera: Close-up. Action: 传统煤气炉特写，火焰跳动. Visibility: 产品不可见. Audio: 环境音
[3-6s] Camera: Medium. Action: 切换到电磁炉，手指轻触面板. Visibility: 产品正面特写. Audio: 旁白开始
[6-9s] Camera: Close-up. Action: 展示功能键特写，屏幕显示温度. Visibility: 产品细节. Audio: 旁白继续
[9-12s] Camera: Wide. Action: 对比画面，两者并列展示. Visibility: 产品全貌对比. Audio: 音乐
[12-15s] Camera: Close-up. Action: 电磁炉logo特写，促销信息. Visibility: 产品logo. Audio: CTA
```

## 测试方法

### 方法1：运行自动化测试

```bash
npx tsx scripts/test-script-generation.ts
```

测试会自动：
1. 查找测试商品和人设
2. 调用脚本生成API
3. 验证shots是否为空
4. 验证shots数量是否符合要求
5. 验证每个shot的必填字段

### 方法2：手动测试

1. 打开视频制作流程
2. 选择商品"电磁炉"
3. 选择一个人设
4. 生成脚本
5. 查看生成的脚本，确认shots不为空

### 方法3：查看日志

如果AI仍然返回空shots，会在控制台看到：

```
❌ AI返回的shots为空，这不应该发生！
⚠️ 使用兜底逻辑生成shots（这不应该成为常态）
```

这样可以及时发现问题，而不是让兜底逻辑悄悄掩盖问题。

## 监控指标

建议监控以下指标：

1. **兜底逻辑触发率** - 应该接近0%
2. **Shots数量分布** - 大部分应该≥3个
3. **AI生成失败率** - 因shots验证失败的比例

如果兜底逻辑频繁触发，说明：
- AI模型能力不足
- Prompt需要进一步优化
- Schema约束可能过于严格

## 后续优化建议

### 1. 根据时长动态生成shots数量

```typescript
const expectedShots = Math.ceil(durationSec / 5)  // 每5秒一个镜头
minItems: Math.max(3, expectedShots)  // 至少3个
```

### 2. 提供更丰富的shot示例

在不同场景下提供不同的shot模板：
- 产品展示型
- 痛点解决型
- 对比演示型
- 使用教程型

### 3. 使用AI自动修复

如果检测到shots为空或不足，可以：
1. 重新调用AI生成
2. 使用更强的提示词
3. 降级到更可靠的模型

## 相关文件

### 修改的文件
- `/app/api/script/generate/route.ts` - 主要修复位置

### 新增的文件
- `/scripts/test-script-generation.ts` - 自动化测试脚本
- `/SCRIPT_SHOTS_EMPTY_FIX.md` - 本文档

### 相关文件
- `/src/services/ai/video/VideoPromptBuilder.ts` - Video prompt构建（有兜底逻辑）
- `/app/api/ai/generate-prompt/route.ts` - 最终prompt生成

## 总结

**问题核心**：AI生成脚本时shots为空，导致视频prompt缺少关键信息

**修复核心**：
1. ✅ Schema约束：添加`minItems: 3`
2. ✅ Prompt约束：明确要求至少3个镜头
3. ✅ 错误监控：添加日志和警告

**设计原则**：
- 兜底逻辑应该是"异常处理"而非"常态"
- 通过日志和监控及时发现问题
- 优先修复根本原因，而不是依赖兜底

---

**修复时间**: 2025-10-31
**修复人**: AI Assistant
**测试状态**: ✅ 待测试（需运行测试脚本验证）

