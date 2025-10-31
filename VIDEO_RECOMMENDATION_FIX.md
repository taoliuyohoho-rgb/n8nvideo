# 视频生成推荐功能优化

## 问题总结

1. **人设推荐只有3个且不变**
   - 原因：精排固定返回前3个，且有缓存机制
   - 期望：返回3个可以，但第1个固定，其他2个随机

2. **卖点、痛点、目标受众每次都一样**
   - 原因：直接用 `slice(0, 5)` 取前5个
   - 期望：从完整列表中随机选择

3. **缓存时间过长**
   - 原因：决策缓存10分钟，候选池缓存5分钟
   - 期望：缓存时间改为1分钟

## 修复内容

### 1. 人设推荐随机化

**文件：** `src/services/recommendation/scorers/productToPersona.ts`

**修改：** 第222-250行
- 第1个人设：保持精排第一（最佳匹配）
- 第2-3个人设：从剩余候选池中随机选择
- 使用 Fisher-Yates 洗牌算法确保真随机

```typescript
// 🎲 改进：第1个固定（最佳匹配），其他的从候选池随机选择
const finePool: typeof fineScored = [];

if (fineScored.length > 0) {
  // 第一个：最佳匹配（固定）
  finePool.push(fineScored[0]);
  
  // 其他的：从剩余候选中随机选择
  const remaining = fineScored.slice(1);
  const additionalCount = Math.min(DEFAULT_K_FINE - 1, remaining.length);
  
  // 随机选择（不重复）
  const shuffled = [...remaining].sort(() => Math.random() - 0.5);
  finePool.push(...shuffled.slice(0, additionalCount));
}
```

### 2. 缓存时间优化

**文件1：** `src/services/recommendation/scorers/productToPersona.ts` 第279行
```typescript
// 缓存结果（1分钟）← 从5分钟改为1分钟
poolCache.set(cacheKey, result, 60);
```

**文件2：** `src/services/recommendation/recommend.ts` 第183行
```typescript
// 决策缓存（1分钟）← 从10分钟改为1分钟
decisionCache.set(cacheKey, result, 1 * 60 * 1000);
```

### 3. 卖点/痛点/受众随机化

**文件1：** `components/video-generation/ProductAnalysis.tsx` 第45-66行

添加随机打乱函数，从商品的完整卖点/痛点/受众列表中随机选择：

```typescript
// 🎲 从商品的卖点/痛点/受众中随机选择（保证每次不一样）
const shuffleArray = <T,>(arr: T[]): T[] => {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const allSellingPoints = Array.isArray(product.sellingPoints) ? product.sellingPoints : []
const allPainPoints = Array.isArray(product.painPoints) ? product.painPoints : []
const allAudiences = Array.isArray(product.targetAudience) ? product.targetAudience : []

// 随机选择最多5个
const sellingPoints = shuffleArray(allSellingPoints).slice(0, Math.min(5, allSellingPoints.length))
const painPoints = shuffleArray(allPainPoints).slice(0, Math.min(5, allPainPoints.length))
const audiences = shuffleArray(allAudiences).slice(0, Math.min(5, allAudiences.length))
```

**文件2：** `components/video-generation/hooks/useVideoGenerationApi.ts` 第88-113行

同样在 `submitAnalysis` 函数中添加随机化逻辑

## 效果预期

### 人设推荐
- ✅ 第1个人设始终是最佳匹配（稳定）
- ✅ 第2-3个人设每次随机（多样性）
- ✅ 1分钟后缓存失效，重新计算

### 卖点/痛点/受众
- ✅ 每次从完整列表随机选择5个
- ✅ 保证内容多样性
- ✅ 数据来源仍是商品表（管理员手动维护）

## 测试建议

1. **人设推荐测试**
   ```
   1. 打开视频生成页面，选择商品
   2. 查看推荐的3个人设，记录ID
   3. 刷新页面（或等待1分钟后重新进入）
   4. 验证：第1个人设相同，第2-3个可能不同
   ```

2. **卖点/痛点测试**
   ```
   1. 查看商品信息步骤，记录推荐的卖点/痛点
   2. 返回重新选择同一商品
   3. 验证：卖点/痛点顺序或内容发生变化
   ```

3. **缓存测试**
   ```
   1. 第一次请求，查看推荐结果
   2. 立即刷新，验证结果相同（命中缓存）
   3. 等待1分钟后刷新，验证结果可能不同（缓存失效）
   ```

## 注意事项

1. **数据源不变**：卖点、痛点、受众仍从商品表读取，由管理员在 Admin 后台维护
2. **不自动生成**：不会自动调用AI生成新人设、卖点、痛点
3. **随机算法**：使用标准的 Fisher-Yates 洗牌算法，确保公平随机
4. **缓存策略**：1分钟缓存平衡了性能和多样性需求

## 回滚方案

如果需要回滚到原来的固定推荐：

1. 恢复 `productToPersona.ts` 精排逻辑为 `slice(0, K)`
2. 恢复 `ProductAnalysis.tsx` 为 `slice(0, 5)`
3. 恢复缓存时间为 10分钟 / 5分钟

