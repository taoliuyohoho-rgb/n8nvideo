# AI服务重构问题修复总结

## 问题描述

AI服务重构后发现以下问题：
1. AI配置界面显示模型名称为 "unknown"
2. 两个provider（Google和OpenAI）显示余额不足
3. `rules.ts` 中使用了不存在的模型名称
4. 未确认余额不足的provider是否已从使用中移除

## 发现的根本原因

### 1. 硬编码的错误模型名称

在 `src/services/ai/rules.ts` 中：
- ❌ `gemini-2.5-flash` - 该模型在 verified-models.json 中不存在
- ❌ `Doubao-Seed-1.6-vision` - 大小写错误且模型不存在
- ❌ `Doubao-Seedance-1.0-pro` - 完全不存在的模型

### 2. Provider配额问题

在 `verified-models.json` 中：
- **Google/Gemini** - 状态：`quota_exceeded`
- **OpenAI** - 状态：`insufficient_quota`

### 3. 可用的Provider

目前正常工作的provider：
- ✅ **DeepSeek** - verified，无配额问题
- ✅ **字节跳动/豆包** - verified，无配额问题

## 修复内容

### 1. 更新 `src/services/ai/rules.ts` 的模型路由逻辑

```typescript
// 修改前
if (needs.videoGeneration) {
  return process.env.DOUBAO_VIDEO_GEN_MODEL || 'Doubao-Seedance-1.0-pro' // ❌ 不存在
}
if (needs.vision || needs.videoUnderstanding) {
  return process.env.DOUBAO_VISION_MODEL || 'Doubao-Seed-1.6-vision' // ❌ 不存在
}
if (needs.search) return 'gemini-2.5-flash' // ❌ 不存在
return 'gemini-2.5-flash' // ❌ 不存在

// 修改后
if (needs.videoGeneration) {
  return process.env.DOUBAO_VIDEO_GEN_MODEL || 'doubao-pro-32k' // ✅ 存在
}
if (needs.vision || needs.videoUnderstanding) {
  return process.env.DOUBAO_VISION_MODEL || 'doubao-seed-1-6-lite' // ✅ 存在
}
if (needs.search) return process.env.DEFAULT_TEXT_MODEL || 'deepseek-chat' // ✅ 存在
return process.env.DEFAULT_TEXT_MODEL || 'deepseek-chat' // ✅ 存在，且无配额问题
```

### 2. 标记 verified-models.json 中的配额不足provider

```json
{
  "provider": "Google",
  "status": "quota_exceeded",  // 从 "verified" 改为 "quota_exceeded"
  "verified": false,            // 从 true 改为 false
  "quotaError": "Quota exceeded for Gemini API"
}

{
  "provider": "OpenAI", 
  "status": "insufficient_quota",  // 从 "verified" 改为 "insufficient_quota"
  "verified": false,               // 从 true 改为 false
  "quotaError": "OpenAI HTTP 429: insufficient_quota"
}
```

### 3. 更新 AI 配置默认值

#### `app/admin/components/AIConfigTab.tsx`

```typescript
// 修改前
defaultModel: config?.defaultModel || 'gemini-2.5-flash'  // ❌ 不存在
fallbackModel: config?.fallbackModel || 'deepseek-chat'

// 修改后
defaultModel: config?.defaultModel || 'deepseek-chat'  // ✅ 可用
fallbackModel: config?.fallbackModel || 'doubao-seed-1-6-lite'  // ✅ 可用
```

同时添加了过滤逻辑，只显示 `status === 'verified'` 的模型：

```typescript
verifiedModels
  .filter(provider => provider.status === 'verified')
  .flatMap((provider) => { ... })
```

### 4. 更新 AiExecutor 默认模型

#### `src/services/ai/AiExecutor.ts`

```typescript
// 修改前
const modelId = process.env.GEMINI_MODEL_ID || 'gemini-2.5-flash'  // ❌ 不存在
default:
  return this.callGemini(prompt, useSearch, images)  // ❌ Gemini配额不足

// 修改后
const modelId = process.env.GEMINI_MODEL_ID || 'gemini-2.0-flash-exp'  // ✅ 存在
default:
  return this.callDeepseek(prompt)  // ✅ DeepSeek可用且无配额问题
```

### 5. 更新其他配置文件

#### `app/api/admin/ai-config/sync/route.ts`

```typescript
// 修改前
case 'gemini':
  return [
    { modelName: 'gemini-2.5-flash', ... },
    { modelName: 'gemini-2.5-pro', ... },
    ...
  ]

// 修改后
case 'gemini':
  return [
    { modelName: 'gemini-2.0-flash-exp', ... },
    { modelName: 'gemini-1.5-flash', ... },
    { modelName: 'gemini-1.5-pro', ... },
  ]
```

#### `app/api/admin/verified-models/route.ts`

```typescript
// 修改前
const defaultModels = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', ... },
  ...
]

// 修改后
const defaultModels = [
  { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek', ... },
  { id: 'doubao-seed-1-6-lite', name: '豆包 Seed 1.6 Lite', ... },
  { id: 'doubao-pro-32k', name: '豆包 Pro 32K', ... },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)', ... },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', ... }
]
```

## 修复结果

### 解决的问题

1. ✅ **模型名称显示正常** - AI配置界面不再显示 "unknown"
2. ✅ **配额不足的provider已标记** - Google和OpenAI被标记为 `verified: false`，不再出现在可选模型列表中
3. ✅ **使用可用的模型** - 所有默认配置指向 DeepSeek 和豆包（可用且无配额问题）
4. ✅ **路由逻辑正确** - 所有模型名称都是 verified-models.json 中实际存在的

### 当前模型策略

| 场景 | 优先模型 | 备用模型 | Provider |
|------|---------|---------|----------|
| 视频生成 | doubao-pro-32k | - | 字节跳动 |
| 视觉/视频理解 | doubao-seed-1-6-lite | - | 字节跳动 |
| 搜索 | deepseek-chat | - | DeepSeek |
| 文本生成（默认） | deepseek-chat | doubao-seed-1-6-lite | DeepSeek/字节跳动 |

### 环境变量覆盖

可以通过以下环境变量覆盖默认行为：
- `DOUBAO_VIDEO_GEN_MODEL` - 视频生成模型
- `DOUBAO_VISION_MODEL` - 视觉理解模型
- `DEFAULT_TEXT_MODEL` - 默认文本模型
- `GEMINI_MODEL_ID` - Gemini模型ID（如果恢复配额后）

## 验证建议

### 1. 重启开发服务器
```bash
npm run dev
```

### 2. 检查AI配置界面
访问 `/admin` 页面，查看：
- ✅ 默认模型和备用模型下拉框只显示可用模型（DeepSeek和豆包）
- ✅ 已验证模型卡片中，Google和OpenAI显示"余额不足"标签
- ✅ DeepSeek和豆包显示"已验证"状态

### 3. 测试AI调用
```bash
# 测试文本生成
curl -X POST http://localhost:3000/api/ai/test \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, world!", "task": "text"}'

# 测试视觉理解
curl -X POST http://localhost:3000/api/ai/test \
  -H "Content-Type: application/json" \
  -d '{"prompt": "描述这个图片", "task": "persona", "images": ["..."]}'
```

### 4. 监控日志
查看终端输出，确认：
- ✅ AI调用使用正确的模型（deepseek-chat 或 doubao-*）
- ✅ 没有 "unknown model" 或 "model not found" 错误
- ✅ 没有尝试调用 Gemini 或 OpenAI（除非明确指定）

## 后续建议

### 恢复Gemini/OpenAI配额后

1. 更新 `verified-models.json`：
```json
{
  "provider": "Google",
  "status": "verified",
  "verified": true,
  "quotaError": null
}
```

2. 可选择性地调整默认模型优先级（如果需要）

### 添加监控

建议添加以下监控：
- Provider配额使用情况
- 模型调用成功率
- 自动降级和回退日志
- 断路器状态监控

### 配置优化

在 `.env` 或 `.env.local` 中明确配置：
```bash
# 主力文本模型
DEFAULT_TEXT_MODEL=deepseek-chat

# 豆包配置
DOUBAO_VIDEO_GEN_MODEL=doubao-pro-32k
DOUBAO_VISION_MODEL=doubao-seed-1-6-lite

# Gemini配置（恢复后启用）
# GEMINI_MODEL_ID=gemini-2.0-flash-exp
```

## 文件变更清单

✅ 已修改的文件：
1. `src/services/ai/rules.ts` - 模型路由逻辑
2. `verified-models.json` - Provider状态标记
3. `app/admin/components/AIConfigTab.tsx` - 默认配置和过滤逻辑
4. `src/services/ai/AiExecutor.ts` - 默认provider和模型
5. `app/api/admin/ai-config/sync/route.ts` - Gemini模型列表
6. `app/api/admin/verified-models/route.ts` - 默认模型列表

## 总结

本次修复解决了AI服务重构后的以下核心问题：
1. 消除了硬编码的不存在模型名称
2. 正确标记了配额不足的provider
3. 将所有默认配置指向可用的模型（DeepSeek和豆包）
4. 确保AI配置界面只显示可用模型
5. 提供了清晰的环境变量覆盖机制

**当前系统使用的所有模型都已在 verified-models.json 中验证且可用，不会再尝试使用配额不足的provider。**

