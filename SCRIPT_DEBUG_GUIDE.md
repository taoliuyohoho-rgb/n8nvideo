# 脚本生成调试指南

## 问题：生成的脚本完全一模一样

如果你遇到**每次生成的脚本完全相同，一个字都没变**的情况，请按照以下步骤排查。

---

## 🔍 第一步：重启开发服务器

**重要！** Next.js的API路由修改后需要**重启服务器**才能生效。

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
npm run dev
```

---

## 🔍 第二步：检查浏览器Console

1. 打开浏览器开发者工具 (F12)
2. 切换到 **Console** 标签
3. 清空之前的日志
4. 生成一次脚本

### 如果看到这些警告：

```
⚠️⚠️⚠️ 脚本生成警告 ⚠️⚠️⚠️
   ⚠️ AI返回的shots为空，使用兜底逻辑生成shots（这不应该成为常态）
⚠️⚠️⚠️ 这说明AI输出有问题，触发了兜底逻辑 ⚠️⚠️⚠️
```

**说明：** 触发了兜底逻辑，AI没有正确返回数据。

**解决方法：**
1. 检查AI服务配置（环境变量）
2. 查看服务端日志找出AI调用失败的原因
3. 检查prompt是否太复杂

### 如果没有看到警告：

说明AI正常返回了数据，但输出确定性太强。继续下一步。

---

## 🔍 第三步：查看服务端日志

在运行 `npm run dev` 的终端窗口中查找：

### 1. 查找随机seed日志
```
Calling AI with prompt { randomSeed: 'abc123', promptLength: 1234, ... }
```

如果**每次randomSeed都不同**，说明prompt确实在变化。

### 2. 查找AI原始返回日志
```
AI raw response { 
  hasShots: true, 
  shotsCount: 3, 
  shotsPreview: '{"second":0,"camera":"特写",...', 
  linesPreview: 'open: 别再错过这款产品...' 
}
```

**对比两次生成的日志：**
- 如果 `shotsPreview` 和 `linesPreview` **完全相同** → AI输出确定性问题
- 如果 `shotsCount: 0` 或 `hasShots: false` → 触发了兜底逻辑

---

## 🔍 第四步：使用测试脚本

运行自动化测试脚本，一次性对比两次生成：

```bash
node scripts/test-script-generation.js
```

**注意：** 需要确保：
1. 开发服务器正在运行 (`npm run dev`)
2. 数据库中存在测试用的商品和人设数据

---

## 💡 可能的原因和解决方案

### 原因1：触发了兜底逻辑（AI返回数据不符合Schema）

**症状：**
- 浏览器Console有警告信息
- 服务端日志显示 `hasShots: false` 或 `shotsCount: 0`

**解决方案：**
1. 检查AI服务是否正常（DOUBAO_API_KEY, DEEPSEEK_API_KEY等）
2. 简化prompt模板，降低复杂度
3. 放宽JSON Schema的验证规则

### 原因2：AI输出确定性太强

**症状：**
- 没有警告信息
- AI原始返回数据每次都相同
- randomSeed每次都不同（说明prompt在变）

**解决方案：**
1. **增加temperature** (已在代码中设置为0.7，但可能还不够)
2. **在prompt中加入更多随机元素** (当前代码已加入randomSeed)
3. **改用不同的AI模型**

### 原因3：缓存问题

**症状：**
- 代码修改后没有生效
- randomSeed每次都相同

**解决方案：**
1. **完全重启开发服务器** (Ctrl+C 然后 npm run dev)
2. **清除浏览器缓存** (Ctrl+Shift+Del)
3. **检查是否有代理或CDN缓存**

---

## 📊 最新代码修改

### 已添加的诊断功能：

✅ **随机seed注入**
```typescript
const randomSeed = Math.random().toString(36).substring(7)
const promptWithSeed = `${promptText}\n\n[Generation ID: ${randomSeed}]`
```
- 让每次prompt都不同
- 可以在服务端日志中看到randomSeed

✅ **兜底逻辑警告**
```typescript
if (data.warnings && data.warnings.length > 0) {
  console.warn('⚠️⚠️⚠️ 脚本生成警告 ⚠️⚠️⚠️')
  // ...
}
```
- 前端Console会显示明显的警告
- 说明触发了兜底逻辑

✅ **AI原始数据日志**
```typescript
log.info('AI raw response', { 
  hasShots: !!aiResult.data?.shots,
  shotsCount: ...,
  shotsPreview: ...,
  linesPreview: ...
})
```
- 服务端日志显示AI返回的原始数据
- 可以对比两次返回是否相同

---

## 🎯 快速排查清单

- [ ] 已重启开发服务器
- [ ] 浏览器Console清空并重新测试
- [ ] 检查是否有 "⚠️⚠️⚠️ 脚本生成警告"
- [ ] 服务端日志中 `randomSeed` 每次都不同
- [ ] 服务端日志中 `hasShots: true` 且 `shotsCount > 0`
- [ ] 对比两次 `shotsPreview` 和 `linesPreview` 是否相同

---

## 🆘 仍然无法解决？

如果以上步骤都检查过了，还是生成完全相同的脚本，请提供：

1. **浏览器Console的完整截图**
2. **服务端日志中的以下部分：**
   - `Calling AI with prompt { randomSeed: ..., ... }`
   - `AI raw response { ... }`
3. **两次生成的完整脚本JSON**
4. **AI服务配置**（不要包含API Key）

这样可以更准确地诊断问题。

