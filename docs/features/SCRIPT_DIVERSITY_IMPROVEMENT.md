# 脚本生成多样性改进

## 更新时间
2025-10-31

## 问题背景

用户反馈每次生成的视频脚本内容几乎一模一样，只有措辞略有差异。经过排查发现：

### 根本原因
**不是AI的问题，而是输入约束太强！**

1. ✅ 每次使用相同的商品信息
2. ✅ 固定选择前5个卖点（总是相同的卖点组合）
3. ✅ 固定选择前5个目标受众
4. ✅ 相同的时长、格式、人设约束
5. ✅ AI在严格约束下，输出变化空间很小

**类比**：就像让厨师用完全相同的食材、相同的配方做菜，虽然刀工和火候可能略有不同，但味道必然相似。

---

## 解决方案

### 方案1：随机选择卖点和受众子集 ✅

#### 实现位置
`app/api/script/generate/route.ts` 第87-128行

#### 具体改动

**改动前（固定选择）：**
```typescript
const filteredInfo = await filterProductInfo(
  rawSellingPoints,
  [],
  rawTargetAudiences,
  productContext,
  {
    maxSellingPoints: 5,  // ❌ 总是5个
    maxTargetAudience: 5,  // ❌ 总是5个
    enableRelevanceScoring: true
  }
)
```

**改动后（随机选择）：**
```typescript
// 🎲 随机选择3-5个卖点和2-4个目标受众
const sellingPointsCount = randomCount(3, 5)
const targetAudienceCount = randomCount(2, 4)

const filteredInfo = await filterProductInfo(
  rawSellingPoints,
  [],
  rawTargetAudiences,
  productContext,
  {
    maxSellingPoints: sellingPointsCount,  // ✅ 每次不同
    maxTargetAudience: targetAudienceCount,  // ✅ 每次不同
    enableRelevanceScoring: true
  }
)

// 🎲 再次打乱顺序，确保每次组合都不同
const sellingPoints = filteredInfo.sellingPoints.sort(() => Math.random() - 0.5)
const targetAudiences = filteredInfo.targetAudience.sort(() => Math.random() - 0.5)
```

#### 效果
- 每次选择3-5个卖点（而不是固定5个）
- 每次选择2-4个目标受众（而不是固定5个）
- 选中的卖点会随机排序
- 同样的商品可以产生多种不同的卖点组合

---

### 方案2：增加创意多样性提示 ✅

#### 实现位置
`app/api/script/generate/route.ts` 第382-397行

#### 具体改动

在prompt中添加了**创意多样性要求**：

```typescript
// 🎲 随机选择一个创意角度
const creativityAngles = [
  '场景切入（用户日常场景）',
  '问题引入（痛点对比）', 
  '数据震撼（具体数字）',
  '故事叙述（用户故事）',
  '对比展示（前后对比）',
  '功能演示（操作展示）',
  '体验感受（第一人称）'
]
const randomAngle = creativityAngles[Math.floor(Math.random() * creativityAngles.length)]
```

在最终的prompt中添加：
```
🎨 创意多样性要求（重要！）：
- 本次建议采用"${randomAngle}"的开场方式，但可以根据卖点灵活调整
- 卖点呈现：不要按顺序罗列所有卖点，选择2-3个最相关的进行深入展示
- 语言风格：尝试不同的表达方式（对比式/叙事式/教学式/情感式/数据式）
- 镜头设计：根据angle调整镜头类型，避免千篇一律的"特写-半身-特写"
- 创意组合：同样的卖点可以有完全不同的表达和展示顺序
```

#### 效果
- AI会尝试7种不同的创意角度
- 同样的卖点可以有完全不同的呈现方式
- 镜头设计更加多样化
- 语言风格更加丰富

---

### 方案3：保留原有的随机seed机制 ✅

#### 实现位置
`app/api/script/generate/route.ts` 第249-260行

每次生成都会加入唯一的随机ID：
```typescript
const randomSeed = Math.random().toString(36).substring(7)
const promptWithSeed = `${promptText}\n\n[Generation ID: ${randomSeed}]`
```

确保即使其他条件相同，prompt也会有微小差异。

---

## 调试与监控

### 服务端日志
现在会记录每次生成的详细信息：

```json
{
  "timestamp": "2025-10-31T...",
  "message": "Randomly selecting content",
  "sellingPointsCount": 4,      // 这次选了4个卖点
  "targetAudienceCount": 3,     // 这次选了3个受众
  "totalSellingPoints": 6,      // 商品库共有6个卖点
  "totalTargetAudiences": 4     // 商品库共有4个受众
}
```

```json
{
  "message": "Calling AI with prompt",
  "randomSeed": "8ah4ye",
  "selectedSellingPoints": [
    "多功能设计",
    "微晶石面板",
    "3级能效+节能技术"
  ],
  "selectedAudiences": [
    "租房人群",
    "小户型家庭",
    "年轻做饭新手"
  ]
}
```

### 前端警告
如果触发兜底逻辑，浏览器Console会显示：
```
⚠️⚠️⚠️ 脚本生成警告 ⚠️⚠️⚠️
   ⚠️ AI返回的shots为空，使用兜底逻辑生成shots
⚠️⚠️⚠️ 这说明AI输出有问题，触发了兜底逻辑 ⚠️⚠️⚠️
```

---

## 预期效果

### 改进前
```
第1次：Renting with no gas? 多功能设计、微晶石面板、省电、小厨房、人性化设计
第2次：Renting with no gas? 多功能设计、微晶石面板、省电、小厨房、人性化设计
第3次：Renting with no gas? 多功能设计、微晶石面板、省电、小厨房、人性化设计
```
**结果**：几乎一模一样，只有措辞略有差异

### 改进后
```
第1次：（场景切入）Tiny kitchen struggle? 多功能设计、微晶石面板、省电（3个卖点）
第2次：（数据震撼）Save 30% power! 省电、人性化设计、小厨房（不同的3个）
第3次：（对比展示）Old vs New 微晶石面板、多功能、小厨房（不同顺序的3个）
```
**结果**：真正的多样性，不同的角度、不同的卖点组合、不同的表达方式

---

## 测试方法

### 1. 重启开发服务器（重要！）
```bash
cd /Users/liutao/cursor/n8nvideo && lsof -ti:3000 | xargs kill -9 2>/dev/null; npm run dev
```

### 2. 生成3次脚本

观察以下内容是否不同：
- ✅ 开场钩子的表达方式
- ✅ 提及的卖点组合
- ✅ 卖点的呈现顺序
- ✅ 镜头的设计方式
- ✅ 整体的语言风格

### 3. 查看服务端日志

检查：
- `sellingPointsCount` 是否每次不同（3-5之间）
- `selectedSellingPoints` 是否每次不同
- `randomAngle` 建议是否每次不同

---

## 技术细节

### 随机性来源

1. **卖点数量随机**：每次随机选3-5个（而不是固定5个）
2. **受众数量随机**：每次随机选2-4个（而不是固定5个）
3. **卖点顺序随机**：使用 `sort(() => Math.random() - 0.5)` 打乱
4. **创意角度随机**：从7种角度中随机选一个
5. **随机seed**：每次生成唯一的ID添加到prompt

### 为什么不直接增加temperature？

虽然增加temperature可以增加输出随机性，但：
- ❌ 可能导致输出不稳定，不符合schema
- ❌ 可能产生无意义的变化（改变重要信息）
- ✅ 通过改变**输入**（卖点组合、创意角度）更可控
- ✅ 既保证质量，又增加多样性

---

## 注意事项

### 1. 商品库要有足够的卖点
如果商品只有3个卖点，那么多样性还是有限的。建议：
- 每个商品至少6-10个卖点
- 卖点描述要有差异化
- 覆盖不同的产品特性维度

### 2. 多样性不等于质量
虽然每次生成不同，但仍需人工审核：
- 某些卖点组合可能不太合理
- 某些创意角度可能不适合特定商品
- 保留"推荐脚本"功能，让AI基于历史数据推荐最优组合

### 3. 性能影响
- 增加的随机计算很轻量，几乎无性能影响
- prompt略微变长（约100字符），AI调用时间增加可忽略

---

## 后续优化建议

### 短期
1. ✅ 已完成：随机选择卖点子集
2. ✅ 已完成：增加创意多样性提示
3. 待完成：用户可以手动选择创意角度
4. 待完成：记录每个角度的效果数据，优化权重

### 长期
1. 基于历史数据，学习哪些卖点组合效果最好
2. 提供"保守模式"和"创意模式"切换
3. 允许用户收藏喜欢的脚本风格
4. A/B测试不同角度的转化率

---

## 相关文档
- 调试指南: `/SCRIPT_DEBUG_GUIDE.md`
- PRD: `/docs/core/PRD.md`
- API文档: `/app/api/script/generate/route.ts`

