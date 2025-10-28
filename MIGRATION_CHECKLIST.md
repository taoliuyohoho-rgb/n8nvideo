# 🚀 架构重构迁移清单

## ✅ 已完成的工作

### 1. 数据库层
- [x] 添加 `Task` 模型（统一任务表）
- [x] 添加 `TaskLog` 模型（任务日志表）
- [x] 添加索引优化查询性能

### 2. 服务层
- [x] 创建 `TaskService`（任务管理服务）
- [x] 创建 `Logger`（结构化日志工具）
- [x] 创建 `withTraceId` 中间件（链路追踪）

### 3. API 层
- [x] 重构 `/api/ai/video/generate` - 落库并返回 taskId
- [x] 新增 `GET /api/tasks` - 任务列表查询
- [x] 新增 `GET /api/tasks/[id]` - 任务详情查询
- [x] 新增 `DELETE /api/tasks/[id]` - 取消任务
- [x] 新增 `GET /api/tasks/[id]/logs` - 任务日志查询

### 4. Worker 层
- [x] 创建 `video-worker.ts`（视频生成 Worker）
- [x] 集成 `p-queue`（并发控制）
- [x] 实现优雅关闭机制
- [x] 实现自动重试机制

### 5. 前端页面
- [x] 新增 `/admin/tasks` 任务监控页面
- [ ] **待完成**: 重构 `/dashboard` 页面（移除业务逻辑）
- [ ] **待完成**: 重构 `/admin` 页面（移除业务逻辑）

### 6. 配置与文档
- [x] 更新 `package.json`（添加 worker 脚本和依赖）
- [x] 编写 `ARCHITECTURE_REFACTORING_GUIDE.md`
- [x] 编写本迁移清单

---

## 📋 迁移步骤（按顺序执行）

### Step 1: 安装依赖
```bash
cd /Users/liutao/cursor/n8nvideo
npm install
```

**新增依赖**:
- `p-queue@^8.0.1`
- `concurrently@^8.2.0`

### Step 2: 数据库迁移
```bash
# 生成 Prisma Client
npm run db:generate

# 推送数据库结构变更（开发环境）
npm run db:push

# 或者使用 migration（生产环境推荐）
# npm run db:migrate
```

**验证**:
```bash
# 检查数据库是否成功创建 tasks 和 task_logs 表
sqlite3 prisma/dev.db ".tables"
# 应该看到: tasks  task_logs
```

### Step 3: 启动服务测试

**终端 1 - 启动 Next.js 服务**:
```bash
npm run dev
```

**终端 2 - 启动 Video Worker**:
```bash
npm run worker:video
```

**验证**:
- Next.js 应该在 http://localhost:3000 启动
- Worker 应该输出: `Video worker started and listening for tasks`

### Step 4: 功能测试

#### 测试 1: 创建视频生成任务
```bash
curl -X POST http://localhost:3000/api/ai/video/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "测试视频生成",
    "duration": 10,
    "resolution": "720p",
    "userId": "test-user"
  }'
```

**预期输出**:
```json
{
  "success": true,
  "data": {
    "taskId": "clxxxx...",
    "status": "pending",
    "traceId": "uuid-..."
  }
}
```

**注意**: 复制返回的 `taskId` 用于下一步测试

#### 测试 2: 查询任务状态
```bash
# 替换 {taskId} 为上一步返回的 taskId
curl http://localhost:3000/api/tasks/{taskId}
```

**预期**: 
- 初始状态: `status: "pending"`
- Worker 开始处理后: `status: "running"`, `progress: 0~100`
- 完成后: `status: "succeeded"`, `result: {...}`

#### 测试 3: 访问任务监控面板
在浏览器打开:
```
http://localhost:3000/admin/tasks
```

**功能验证**:
- [x] 能看到刚才创建的任务
- [x] 任务状态实时更新
- [x] 点击「查看」能看到任务详情和日志
- [x] 筛选器能正常工作
- [x] 自动刷新功能正常

---

## ⚠️ 待完成的工作

### 1. 前端页面重构（高优先级）

#### 任务 1: 重构 `/dashboard` 页面

**文件**: `app/dashboard/page.tsx`

**需要移除的业务逻辑**:
1. **竞品分析逻辑** (`handleCompetitorAnalysis` 函数，行 729-761)
   - 应改为调用 `/api/competitor/analyze` API
   - 改为异步任务模式（创建任务 -> 轮询状态）

2. **风格匹配逻辑** (`handleStyleMatching` 函数，行 763-785)
   - 应改为调用 `/api/ai/match-style` API
   - 改为异步任务模式

3. **Prompt 生成逻辑** (`handleGeneratePrompt` 函数，行 787-810)
   - 已经调用了 API，但需要改为任务模式
   - 生成 Prompt 可能耗时较长，应该异步处理

**重构模板**:
```typescript
const handleGenerateVideo = async () => {
  setLoading(true)
  try {
    // 1. 创建任务
    const response = await fetch('/api/ai/video/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, duration, resolution }),
    })
    const result = await response.json()
    
    if (result.success) {
      const taskId = result.data.taskId
      setCurrentTaskId(taskId)
      
      // 2. 轮询任务状态
      const pollInterval = setInterval(async () => {
        const taskResponse = await fetch(`/api/tasks/${taskId}`)
        const taskResult = await taskResponse.json()
        
        if (taskResult.success) {
          const task = taskResult.data
          setProgress(task.progress)
          
          if (task.status === 'succeeded') {
            clearInterval(pollInterval)
            setResult(task.result)
            setLoading(false)
          } else if (task.status === 'failed') {
            clearInterval(pollInterval)
            setError(task.error)
            setLoading(false)
          }
        }
      }, 2000) // 每 2 秒查询一次
    }
  } catch (error) {
    console.error('Failed:', error)
    setLoading(false)
  }
}
```

#### 任务 2: 重构 `/admin` 页面

**文件**: `app/admin/page.tsx`

**需要移除的业务逻辑**:
1. **竞品批量分析逻辑** (行 128-143)
   - 应改为调用批量任务 API
   - 每个商品创建独立的任务

2. **评论爬取逻辑** (行 136-142)
   - 应改为调用 `/api/admin/scraping/batch` API
   - 改为异步任务模式

**建议**:
- 在 `/admin` 页面添加一个「查看任务」按钮，跳转到 `/admin/tasks`
- 批量操作完成后，提示用户去任务监控页面查看进度

### 2. 集成真实视频生成服务（高优先级）

**文件**: `workers/video-worker.ts`

**当前状态**: 使用模拟数据（行 48-71）

**需要做的**:
1. 选择视频生成服务提供商：
   - Doubao Seedance
   - OpenAI Sora
   - Google Veo
   - 其他

2. 在 `workers/video-worker.ts` 中替换模拟逻辑：
```typescript
// 替换第 48-71 行的模拟代码
import { videoGenerationService } from '@/src/services/video/VideoGenerationService'

const videoResult = await videoGenerationService.generate({
  prompt,
  duration,
  resolution,
  provider: 'doubao-seedance', // 或其他
})
```

3. 创建 `VideoGenerationService`：
```typescript
// src/services/video/VideoGenerationService.ts
export class VideoGenerationService {
  async generate(input: VideoGenerationInput): Promise<VideoResult> {
    // 调用真实的 AI 服务
  }
}
```

### 3. 其他 API 路由迁移到任务模式（中优先级）

**建议迁移的 API**:
1. `/api/competitor/analyze` - 竞品分析（耗时 10-30s）
2. `/api/admin/scraping` - 评论爬取（耗时 1-5min）
3. `/api/styles/parse-video` - 视频解析（耗时 30s-2min）
4. `/api/ai/match-style` - 风格匹配（如果使用复杂 AI 模型）

**迁移步骤**（以竞品分析为例）:
1. 修改 API 路由：
```typescript
// app/api/competitor/analyze/route.ts
export const POST = withTraceId(async (req, traceId) => {
  const body = await req.json()
  
  // 创建任务而不是同步执行
  const task = await taskService.createTask({
    type: 'competitor_analysis',
    payload: body,
    traceId,
  })
  
  return NextResponse.json({
    success: true,
    data: { taskId: task.id, status: task.status },
  })
})
```

2. 创建对应的 Worker:
```bash
# workers/competitor-worker.ts
# 参考 video-worker.ts 的实现
```

3. 更新 `package.json`:
```json
"scripts": {
  "worker:competitor": "tsx workers/competitor-worker.ts",
  "worker:all": "concurrently \"npm run worker:video\" \"npm run worker:competitor\""
}
```

### 4. 添加 WebSocket 支持（低优先级，但强烈推荐）

**目的**: 替代前端轮询，实时推送任务状态

**方案**: 使用 Socket.IO

**实现步骤**:
1. 安装依赖:
```bash
npm install socket.io socket.io-client
```

2. 创建 Socket.IO 服务器:
```typescript
// lib/socket-server.ts
import { Server } from 'socket.io'

export function initSocketServer(httpServer: any) {
  const io = new Server(httpServer, {
    path: '/api/socket',
    cors: { origin: '*' },
  })
  
  io.on('connection', (socket) => {
    socket.on('subscribe_task', (taskId) => {
      socket.join(`task:${taskId}`)
    })
  })
  
  return io
}
```

3. 在 Worker 中推送状态更新:
```typescript
// workers/video-worker.ts
import { getSocketServer } from '@/lib/socket-server'

const io = getSocketServer()
await taskService.updateTask(taskId, { progress: 50 })
io.to(`task:${taskId}`).emit('task_update', { progress: 50 })
```

4. 前端订阅:
```typescript
import { io } from 'socket.io-client'

const socket = io({ path: '/api/socket' })
socket.emit('subscribe_task', taskId)
socket.on('task_update', (data) => {
  setProgress(data.progress)
})
```

---

## 🎯 验收标准

### 核心功能
- [x] 视频生成任务能成功创建并入库
- [x] Worker 能正常消费并处理任务
- [x] 任务状态能正确更新（pending -> running -> succeeded/failed）
- [x] 任务日志能正常记录和查询
- [x] TraceId 能贯穿整个请求链路
- [x] 任务监控页面能正常显示和操作
- [ ] 前端页面不包含业务逻辑（仅展示和请求）
- [ ] 集成真实的视频生成服务

### 性能要求
- Worker 响应时间 < 5s（从任务创建到开始执行）
- 任务查询 API 响应时间 < 100ms
- 支持至少 10 个并发任务

### 可观测性
- 所有关键操作都有日志记录
- 日志格式统一（JSON）
- 每个请求都有唯一的 traceId
- 任务监控页面实时更新（< 5s 延迟）

---

## 📞 问题反馈

如果在迁移过程中遇到问题：
1. 查看 `ARCHITECTURE_REFACTORING_GUIDE.md` 的「故障排查」章节
2. 检查服务端日志（搜索 traceId）
3. 访问 `/admin/tasks` 查看任务详情

---

**最后更新**: 2025-01-15




