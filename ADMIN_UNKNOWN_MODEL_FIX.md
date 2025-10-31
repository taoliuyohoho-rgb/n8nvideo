# 管理页面"Unknown"模型名称修复

## 问题
管理页面（/admin）的"已验证模型"部分显示所有模型名称为 "Unknown"。

## 根本原因

`useAdminData` hook 中的数据处理逻辑有误。它尝试将 API 返回的已分组数据重新分组，导致数据结构错误。

### 原来的错误逻辑
```typescript
// ❌ 错误：尝试将已分组的数据重新分组
result.data.forEach((model: any) => {
  const provider = model.provider || 'Unknown'
  if (!modelsByProvider[provider]) {
    modelsByProvider[provider] = {
      provider,
      status: model.status || 'unverified',
      models: [],
      verified: model.verified || false
    }
  }
  
  modelsByProvider[provider].models.push({
    modelName: model.id || model.name || 'Unknown',  // ❌ model.id 不存在
    name: model.name || model.id || 'Unknown',
    ...
  })
})
```

### API 返回的实际数据格式
```json
[
  {
    "provider": "Google",
    "status": "verified",
    "models": [
      {
        "modelName": "gemini-2.0-flash-exp",
        "name": "Gemini 2.0 Flash (Experimental)",
        "langs": ["zh", "en"],
        ...
      }
    ],
    "verified": true,
    "quotaError": "..."
  }
]
```

API 已经返回了按 provider 分组的数据，不需要再次分组！

## 修复

### 修改 `app/admin/hooks/useAdminData.ts`

```typescript
// ✅ 正确：直接使用 API 返回的数据
const fetchVerifiedModels = async () => {
  try {
    const response = await fetch('/api/admin/verified-models')
    const result = await response.json()
    if (result.success) {
      // API 已经返回按 provider 分组的格式，直接使用
      setVerifiedModels(result.data || [])
    } else {
      console.error('获取已验证模型失败:', result.error)
    }
  } catch (error) {
    console.error('获取已验证模型失败:', error)
  }
}
```

## 验证步骤

1. **重启开发服务器**（重要！）
```bash
# 停止当前服务器（Ctrl+C）
# 然后重新启动
npm run dev
```

2. **清除浏览器缓存并刷新**
- 按 Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows/Linux)
- 或者打开开发者工具，右键刷新按钮，选择"清空缓存并硬性重新加载"

3. **访问管理页面**
```
http://localhost:3000/admin
```

4. **检查"已验证模型"部分**
应该看到：
- ✅ Google - Gemini 2.0 Flash (Experimental)
- ✅ Google - Gemini 1.5 Pro
- ✅ Google - Gemini 1.5 Flash
- ✅ OpenAI - GPT-4o Mini
- ✅ OpenAI - GPT-4o
- ✅ DeepSeek - DeepSeek Chat
- ✅ DeepSeek - DeepSeek Reasoner
- ✅ 字节跳动 - 豆包 Seed 1.6 Lite
- ✅ 字节跳动 - 豆包 Pro 32K

5. **检查浏览器控制台**
如果仍然显示 "Unknown"，打开浏览器控制台（F12），检查：
- 是否有 JavaScript 错误
- Network 标签页中 `/api/admin/verified-models` 请求的响应内容

## 相关文件

- `app/admin/hooks/useAdminData.ts` - 数据加载逻辑（已修复）
- `app/admin/components/AIConfigTab.tsx` - 显示逻辑（正常）
- `app/api/admin/verified-models/route.ts` - API 端点（正常）
- `verified-models.json` - 数据源（正常）

## 注意事项

如果修改了 `verified-models.json`，API 会根据环境变量自动同步 `verified` 状态。也就是说：
- 如果有 `GEMINI_API_KEY`，Google 的 `verified` 会自动设为 `true`
- 如果有 `OPENAI_API_KEY`，OpenAI 的 `verified` 会自动设为 `true`
- 如果有 `DEEPSEEK_API_KEY`，DeepSeek 的 `verified` 会自动设为 `true`
- 如果有 `DOUBAO_API_KEY`，字节跳动的 `verified` 会自动设为 `true`

这个自动同步逻辑在 `app/api/admin/verified-models/route.ts` 的第67-86行。

