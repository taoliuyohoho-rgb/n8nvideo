# 视频生成状态持久化功能

## 📋 问题描述

用户反馈：脚本生成后，切换到其他页面（如"视频生成"），再回来查看时，之前生成的脚本丢失了。

## 🎯 解决方案

在视频生成工作流中添加了**状态持久化功能**，所有生成的数据（商品、分析、人设、脚本、视频任务）都会自动保存到浏览器本地存储（localStorage）。

## ✨ 功能特性

### 1. 自动保存
- ✅ **实时保存**：每次状态变化（选择商品、生成脚本等）都会自动保存
- ✅ **完整数据**：保存所有工作流数据（product、analysis、persona、script、videoJob）
- ✅ **当前步骤**：记住用户停留的步骤

### 2. 自动恢复
- ✅ **刷新页面**：刷新浏览器后自动恢复之前的状态
- ✅ **切换页面**：在不同页面间切换不会丢失数据
- ✅ **关闭浏览器**：关闭浏览器后再打开，数据仍然保留

### 3. 数据清理
- ✅ **手动重置**：用户点击"重新开始"按钮时自动清除本地数据
- ✅ **智能验证**：加载时验证数据结构，损坏的数据会被忽略

## 🔧 技术实现

### 修改文件
- `/components/video-generation/VideoGenerationWorkflow.tsx`

### 关键代码

#### 1. localStorage 操作函数

```typescript
// LocalStorage Key
const STORAGE_KEY = 'video-generation-state'

// 从 localStorage 加载状态
function loadStateFromStorage(): VideoGenerationState | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    
    const parsed = JSON.parse(stored)
    // 验证数据结构有效性
    if (parsed && typeof parsed === 'object' && 'currentStep' in parsed) {
      console.log('📦 从本地恢复视频生成状态:', parsed.currentStep)
      return parsed
    }
  } catch (error) {
    console.warn('⚠️ 加载本地状态失败:', error)
  }
  
  return null
}

// 保存状态到 localStorage
function saveStateToStorage(state: VideoGenerationState) {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    console.log('💾 已保存视频生成状态:', state.currentStep)
  } catch (error) {
    console.warn('⚠️ 保存本地状态失败:', error)
  }
}

// 清除 localStorage
function clearStateFromStorage() {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(STORAGE_KEY)
    console.log('🗑️ 已清除本地状态')
  } catch (error) {
    console.warn('⚠️ 清除本地状态失败:', error)
  }
}
```

#### 2. 初始化时加载

```typescript
// 初始状态（优先从本地恢复）
const getInitialState = (): VideoGenerationState => {
  const savedState = loadStateFromStorage()
  if (savedState) {
    return savedState
  }
  
  return {
    currentStep: 'product',
    loading: false,
  }
}

// 在 Provider 中使用
function VideoGenerationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, getInitialState)
  // ...
}
```

#### 3. 自动保存

```typescript
// 在 Provider 中监听状态变化
function VideoGenerationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, getInitialState)

  // 💾 自动保存状态到 localStorage
  useEffect(() => {
    saveStateToStorage(state)
  }, [state])
  
  // ...
}
```

#### 4. 重置时清理

```typescript
const resetWorkflow = useCallback(() => {
  clearStateFromStorage() // 🗑️ 清除本地存储
  dispatch({ type: 'RESET' })
}, [dispatch])
```

## 📊 数据结构

保存到 localStorage 的数据结构：

```typescript
interface VideoGenerationState {
  currentStep: 'product' | 'analysis' | 'persona' | 'script' | 'video'
  product?: Product          // 选中的商品
  analysis?: ProductAnalysis // 商品分析结果
  persona?: Persona          // 选中的人设
  script?: VideoScript       // 生成的脚本（包含完整内容）
  videoJob?: VideoJob        // 视频生成任务
  loading: boolean
  error?: string
}
```

## 🎯 使用场景

### 场景 1：正常工作流程
```
1. 用户选择商品 → 自动保存
2. 用户生成脚本 → 自动保存
3. 用户切换到其他页面 → 数据已保存
4. 用户返回 → 自动恢复，脚本仍在
```

### 场景 2：意外中断
```
1. 用户正在生成脚本 → 自动保存
2. 浏览器意外关闭 → 数据已在本地
3. 用户重新打开页面 → 自动恢复，继续工作
```

### 场景 3：手动重置
```
1. 用户完成一个视频 → 所有数据都在
2. 用户点击"重新开始" → 清除所有数据
3. 从头开始新的工作流 → 干净的初始状态
```

## 🔍 调试信息

在浏览器控制台可以看到以下日志：

```
📦 从本地恢复视频生成状态: script
💾 已保存视频生成状态: script
🗑️ 已清除本地状态
```

## 🎨 用户体验改进

### 改进前
- ❌ 切换页面后数据丢失
- ❌ 刷新页面后需要重新操作
- ❌ 浏览器关闭后数据永久丢失
- ❌ 用户体验差，工作效率低

### 改进后
- ✅ 数据永久保存，随时可恢复
- ✅ 自由切换页面，不担心丢失
- ✅ 意外中断也能快速恢复
- ✅ 用户体验流畅，工作效率高

## 🛡️ 安全性

- ✅ **仅本地存储**：数据保存在用户浏览器本地，不上传服务器
- ✅ **SSR 兼容**：服务端渲染时不访问 localStorage，避免错误
- ✅ **容错处理**：解析失败时优雅降级，不影响使用
- ✅ **数据验证**：加载前验证数据结构，防止损坏数据导致错误

## 📝 注意事项

1. **浏览器限制**：localStorage 通常有 5-10MB 的存储限制
2. **隐私模式**：在隐私/无痕模式下，关闭浏览器会清除所有本地数据
3. **跨设备**：数据保存在本地，不同设备/浏览器之间不会同步
4. **清理缓存**：清除浏览器缓存时会删除保存的数据

## 🚀 未来优化方向

1. **云端同步**：将状态同步到服务器，支持跨设备访问
2. **历史记录**：保存多个历史状态，支持撤销/重做
3. **自动清理**：定期清理过期的本地数据
4. **压缩存储**：对大数据进行压缩，节省存储空间
5. **加密保护**：对敏感数据进行加密存储

## 📊 相关文档

- [视频生成工作流](/docs/features/VIDEO_GENERATION_WORKFLOW.md)
- [状态管理架构](/docs/architecture/STATE_MANAGEMENT.md)
- [用户体验优化](/docs/ux/USER_EXPERIENCE_IMPROVEMENTS.md)

