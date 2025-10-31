# 脚本生成缓存问题修复

## 🐛 问题描述

用户反馈：多次生成的脚本**完全一模一样**，包括镜头分解(shots)的所有细节。

## 🔍 问题分析

### 排查过程

1. **排除兜底逻辑**
   - ✅ 控制台没有"AI返回的shots为空"警告
   - ✅ AI确实返回了完整的shots数据

2. **排除本地缓存**
   - ✅ 清除了 localStorage
   - ✅ 刷新页面后问题仍然存在

3. **发现根本原因：推荐系统缓存**
   - ❌ **推荐引擎缓存了Prompt模板和AI模型的推荐结果**
   - ❌ **缓存时间：1分钟**
   - ❌ **缓存Key不包含随机因子**

### 技术原理

在 `/src/services/recommendation/recommend.ts` 中：

```typescript
export async function recommendRank(req: RecommendRankRequest): Promise<RecommendRankResponse> {
  const startedAt = Date.now();
  
  // 构建缓存Key
  const cacheKey = `decision:${req.scenario}:${stableStringify({
    task: {
      taskType: req.task.taskType,
      language: req.task.language,
      contentType: req.task.contentType,
      jsonRequirement: req.task.jsonRequirement,
      budgetTier: req.task.budgetTier,
      category: req.task.category,  // ⚠️ 只包含类目，不包含商品ID或随机因子
    },
    context: req.context,
    constraints: req.constraints
  })}`

  // 1) 尝试从缓存读取
  const cached = decisionCache.get(cacheKey) as RecommendRankResponse | undefined;
  if (cached) {
    return cached;  // ⚠️ 直接返回缓存的推荐结果
  }
  
  // ... 实际推荐逻辑
  
  // 存入缓存（1分钟）
  decisionCache.set(cacheKey, result, 1 * 60 * 1000); // ⚠️ 缓存1分钟
  return result;
}
```

### 问题流程

```
第1次生成脚本：
1. 推荐Prompt模板 → 返回"3C-Script-FeatureDemo-15s" (存入缓存1分钟)
2. 推荐AI模型 → 返回"doubao/ep-20250101..." (存入缓存1分钟)
3. 使用该Prompt + 该模型 生成脚本A

第2次生成脚本（1分钟内）：
1. 推荐Prompt模板 → 🔴 命中缓存，返回"3C-Script-FeatureDemo-15s"
2. 推荐AI模型 → 🔴 命中缓存，返回"doubao/ep-20250101..."
3. 使用相同Prompt + 相同模型 生成脚本B
   
结果：
- ❌ Prompt基础内容完全相同
- ❌ AI模型相同
- ❌ 虽然末尾加了随机种子，但影响有限
- ❌ AI输出非常相似甚至一致
```

## 🛠️ 解决方案

### 方案1：禁用脚本生成场景的推荐缓存（✅ 已实施）

#### 1.1 添加 `bypassCache` 选项

**文件**: `/src/services/recommendation/types.ts`

```typescript
export interface RecommendOptions {
  requestId?: string;
  strategyVersion?: string | null;
  bypassCache?: boolean; // 🎲 跳过推荐缓存，用于需要多样性的场景
}
```

#### 1.2 修改推荐引擎逻辑

**文件**: `/src/services/recommendation/recommend.ts`

```typescript
// 读取缓存时检查是否禁用
if (!req.options?.bypassCache) {
  const cached = decisionCache.get(cacheKey) as RecommendRankResponse | undefined;
  if (cached) {
    return cached;
  }
}

// ... 推荐逻辑 ...

// 写入缓存时检查是否禁用
if (!req.options?.bypassCache) {
  decisionCache.set(cacheKey, result, 1 * 60 * 1000);
}
```

#### 1.3 在脚本生成API中启用

**文件**: `/app/api/script/generate/route.ts`

```typescript
// 推荐Prompt模板（禁用缓存）
const promptRecommendation = await recommendRank({
  scenario: 'task->prompt',
  // ... 其他参数
  options: {
    bypassCache: true  // 🎲 每次都重新推荐，避免缓存导致结果一致
  }
})

// 推荐AI模型（禁用缓存）
const modelRecommendation = await recommendRank({
  scenario: 'task->model',
  // ... 其他参数
  options: {
    bypassCache: true  // 🎲 每次都重新推荐，避免缓存导致结果一致
  }
})
```

### 方案2：清除缓存API（✅ 已实施）

**文件**: `/app/api/recommendation/clear-cache/route.ts`

提供手动清除推荐缓存的API端点：

```typescript
export async function POST() {
  decisionCache.clear()
  poolCache.clear()
  return NextResponse.json({ success: true })
}
```

## ✅ 修复效果

### 修复前
```
生成脚本1:
  - Prompt: "3C-Script-FeatureDemo-15s" (缓存)
  - 模型: "doubao/ep-xxx" (缓存)
  - 结果: 镜头A1, A2, A3

生成脚本2:
  - Prompt: "3C-Script-FeatureDemo-15s" (来自缓存)
  - 模型: "doubao/ep-xxx" (来自缓存)
  - 结果: 镜头A1, A2, A3 (完全相同！)
```

### 修复后
```
生成脚本1:
  - Prompt: "3C-Script-FeatureDemo-15s" (新推荐)
  - 模型: "doubao/ep-xxx" (新推荐)
  - 结果: 镜头A1, A2, A3

生成脚本2:
  - Prompt: "3C-Script-PainPoint-15s" (新推荐，可能不同)
  - 模型: "gemini/pro-002" (新推荐，可能不同)
  - 结果: 镜头B1, B2, B3 (不同！)
```

## 📊 验证方法

### 1. 前端测试

```
1. 打开视频生成页面
2. 选择商品和人设
3. 生成第1次脚本 → 记录shots内容
4. 立即再生成第2次 → 对比shots
5. ✅ 应该有明显差异
```

### 2. 控制台验证

查看服务器日志，应该看到不同的推荐：

```bash
# 第1次
Prompt recommendation received { chosenId: 'prompt-123', ... }
Model recommendation received { chosenId: 'model-456', ... }

# 第2次（如果有差异说明缓存被绕过）
Prompt recommendation received { chosenId: 'prompt-789', ... }  # 可能不同
Model recommendation received { chosenId: 'model-012', ... }   # 可能不同
```

### 3. 诊断脚本

运行诊断脚本对比两次生成：

```bash
node scripts/diagnose-script-diversity.js <productId> <personaId>
```

## 🎯 其他场景的缓存策略

| 场景 | 是否使用缓存 | 原因 |
|------|-------------|------|
| 脚本生成 | ❌ 禁用 | 需要多样性，避免重复内容 |
| 人设推荐 | ✅ 启用 | 历史人设列表相对稳定 |
| 风格匹配 | ✅ 启用 | 风格推荐在短时间内不变 |
| 模型选择（其他） | ✅ 启用 | 模型能力短期内稳定 |
| Prompt选择（其他） | ✅ 启用 | Prompt模板短期内稳定 |

## 🔧 手动清除缓存

如果需要强制刷新所有推荐缓存，可以调用API：

```bash
curl -X POST http://localhost:3000/api/recommendation/clear-cache
```

或在浏览器控制台：

```javascript
fetch('/api/recommendation/clear-cache', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

## 📝 相关文档

- [推荐系统架构](/src/services/recommendation/USAGE.md)
- [脚本生成多样性优化](/docs/features/SCRIPT_DIVERSITY_IMPROVEMENTS.md)
- [视频生成状态持久化](/docs/features/VIDEO_GENERATION_STATE_PERSISTENCE.md)

## 🎓 经验教训

1. **缓存设计需考虑业务场景**：不是所有推荐都应该缓存
2. **缓存Key要包含关键因子**：如果需要多样性，应避免固定缓存
3. **AI生成内容不会完全相同**：如果出现完全相同，一定是系统层面的问题
4. **调试时要深入排查**：从表象到根因，逐步排除可能性
5. **提供调试工具很重要**：诊断脚本和清除缓存API帮助快速定位问题

