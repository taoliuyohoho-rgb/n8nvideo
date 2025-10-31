# 进度API 404错误修复

## 问题描述
在视频生成流程中，`ScriptGenerator` 组件尝试访问不存在的进度API：
```
GET http://localhost:3000/api/progress/update?id=script_1761819494096 404 (Not Found)
```

## 根本原因
`ScriptGenerator` 组件实现了实时进度轮询功能，每500ms调用 `/api/progress/update` API来获取脚本生成进度，但该API从未实现。

## 解决方案
将实时进度轮询改为本地模拟进度：

### 修改前（问题代码）
```typescript
// 启动进度轮询
const progressInterval = setInterval(async () => {
  try {
    const response = await fetch(`/api/progress/update?id=${progressId}`)
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.data) {
        updateProgressFromData(data.data)
      }
    }
  } catch (error) {
    console.warn('Progress fetch failed:', error)
  }
}, 500) // 每500ms检查一次进度
```

### 修改后（本地模拟）
```typescript
// 模拟进度步骤
const simulateProgress = () => {
  const steps = ['recommend', 'template', 'generate', 'evaluate', 'complete']
  let currentStep = 0
  
  const progressInterval = setInterval(() => {
    if (currentStep < steps.length) {
      setProgressSteps(prev => prev.map(step => {
        if (step.id === steps[currentStep]) {
          return { ...step, status: 'active' as const, progress: 50 }
        }
        if (steps.indexOf(step.id) < currentStep) {
          return { ...step, status: 'completed' as const, progress: 100 }
        }
        return step
      }))
      currentStep++
    } else {
      clearInterval(progressInterval)
    }
  }, 1000)
  
  return progressInterval
}

const progressInterval = simulateProgress()
```

## 修改内容

### 文件：`components/video-generation/ScriptGenerator.tsx`

1. ✅ **移除API轮询**：删除了每500ms轮询 `/api/progress/update` 的代码
2. ✅ **本地进度模拟**：添加 `simulateProgress()` 函数在本地更新进度状态
3. ✅ **移除依赖**：将 `generateScript` 的 `enableProgress: true` 改为 `false`
4. ✅ **清理代码**：删除不再使用的 `updateProgressFromData()` 函数

## 影响范围
- 仅影响脚本生成组件的进度显示
- 不影响核心功能（脚本仍然正常生成）
- 进度条仍然显示，但使用本地模拟而非服务器推送

## 优点
1. ✅ 消除404错误
2. ✅ 减少网络请求（不再每500ms轮询）
3. ✅ 简化架构（无需维护进度API）
4. ✅ 保持用户体验（进度条仍然显示）

## 后续优化建议
如果需要精确的服务器端进度反馈，可以考虑：
1. 使用Server-Sent Events (SSE) 推送进度
2. 使用WebSocket实时通信
3. 创建基于Redis的进度存储API

## 测试验证
- [x] 脚本生成功能正常
- [x] 不再出现404错误
- [x] 进度条正常显示
- [x] 无TypeScript错误
- [x] 无Linter错误

## 修改日期
2025-10-30

