# 架构重构文档与迁移指南

## 📋 重构概述

本次重构旨在解决以下痛点：
1. **前后端逻辑混乱**：前端页面包含大量业务逻辑，不符合前后端分离原则
2. **任务管理机制缺失**：视频生成等长耗时任务未持久化，缺乏统一的异步任务队列
3. **调试困难**：缺乏结构化日志和请求链路追踪，bug 排查耗时长
4. **可维护性差**：代码散乱，缺乏统一的服务层抽象

## 🎯 重构目标

1. ✅ **前后端职责分离**：前端只负责展示和请求，后端（API 目录）负责所有 AI 调用和业务逻辑
2. ✅ **统一任务队列**：引入通用任务表 + 异步 worker + 状态查询 + 结构化日志/traceId
3. ✅ **可观测性提升**：traceId 链路追踪 + 结构化日志 + 任务监控面板
4. ✅ **代码规范化**：服务层抽象 + 中间件模式 + 统一错误处理

---

## 🏗️ 新架构设计

### 1. 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                         前端 (Frontend)                       │
│  - app/dashboard/page.tsx (用户工作台)                        │
│  - app/admin/page.tsx (管理后台)                              │
│  - app/admin/tasks/page.tsx (任务监控)                        │
│  职责: 展示、表单、发起 HTTP 请求                              │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP API
┌────────────────────▼────────────────────────────────────────┐
│                     后端 API 层 (Backend API)                 │
│  - app/api/ai/video/generate/route.ts (视频生成 API)          │
│  - app/api/tasks/[id]/route.ts (任务查询 API)                 │
│  - app/api/tasks/route.ts (任务列表 API)                       │
│  职责: 请求校验、调用服务层、返回响应                          │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                      服务层 (Service Layer)                   │
│  - src/services/task/TaskService.ts (任务管理服务)            │
│  - src/services/logger/Logger.ts (日志服务)                   │
│  - src/services/ai/* (AI 服务)                                │
│  - src/services/video/* (视频服务)                            │
│  职责: 业务逻辑、数据库操作、外部 API 调用                     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  异步 Worker (Background Worker)              │
│  - workers/video-worker.ts (视频生成 Worker)                  │
│  职责: 轮询任务表、消费任务、执行长耗时操作                     │
└─────────────────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    数据库 (Database - Prisma)                 │
│  - Task 表 (统一任务队列)                                      │
│  - TaskLog 表 (任务日志)                                       │
│  - 其他业务表 (Product, Style, Video, etc.)                   │
└─────────────────────────────────────────────────────────────┘
```

### 2. 核心组件说明

#### 2.1 统一任务表 (`Task` 模型)

**表结构**：
- `id`: 任务唯一标识
- `type`: 任务类型（video_generation, competitor_analysis, etc.）
- `status`: 任务状态（pending, running, succeeded, failed, canceled）
- `priority`: 优先级（数字越大优先级越高）
- `payload`: 任务输入参数（JSON）
- `result`: 任务执行结果（JSON）
- `error`: 错误信息
- `progress`: 进度百分比（0-100）
- `traceId`: 链路追踪 ID
- `dedupeKey`: 幂等键（防止重复提交）
- `ownerId`: 任务所有者（用户 ID）
- `workerName`: 执行该任务的 worker 名称
- `retryCount` / `maxRetries`: 重试机制
- `createdAt` / `startedAt` / `completedAt`: 时间戳

**核心特性**：
- ✅ 支持优先级队列
- ✅ 支持定时任务（`scheduledAt`）
- ✅ 支持幂等性（`dedupeKey`）
- ✅ 自动重试机制
- ✅ 链路追踪（`traceId`）

#### 2.2 任务服务 (`TaskService`)

**核心方法**：
```typescript
// 创建任务
createTask(input: CreateTaskInput): Promise<Task>

// 幂等创建（如果已存在则返回现有任务）
findOrCreateTask(input: CreateTaskInput): Promise<Task>

// 查询任务
getTask(taskId: string): Promise<Task | null>
queryTasks(options: TaskQueryOptions): Promise<Task[]>

// 更新任务状态
startTask(taskId: string, workerName: string): Promise<Task>
completeTask(taskId: string, result: any): Promise<Task>
failTask(taskId: string, error: string): Promise<Task>
cancelTask(taskId: string): Promise<Task>

// 任务日志
addTaskLog(taskId: string, level: string, message: string, data?: any)
getTaskLogs(taskId: string, limit: number): Promise<TaskLog[]>

// Worker 消费
getPendingTasks(types?: TaskType[], limit: number): Promise<Task[]>
```

#### 2.3 TraceId 中间件

**功能**：
- 为每个请求生成或提取 `traceId`
- 在响应头中返回 `x-trace-id`
- 统一错误处理

**使用方式**：
```typescript
import { withTraceId } from '@/src/middleware/traceId'

async function handler(request: NextRequest, traceId: string) {
  const log = createApiLogger(traceId, 'module-name')
  // ... 业务逻辑
}

export const POST = withTraceId(handler)
```

#### 2.4 结构化日志 (`Logger`)

**功能**：
- 统一日志格式（JSON 输出）
- 支持上下文传递（traceId, module, userId, etc.）
- 支持日志级别（debug, info, warn, error）
- 支持性能测量（`measureTime`）

**使用方式**：
```typescript
import { createApiLogger } from '@/src/services/logger/Logger'

const log = createApiLogger(traceId, 'video-generation')

log.info('Creating task', { payload })
log.error('Task failed', error, { taskId })

// 测量执行时间
const result = await log.measureTime(
  'Video generation',
  () => generateVideo(prompt)
)
```

#### 2.5 异步 Worker

**功能**：
- 轮询任务表获取待处理任务
- 使用 `p-queue` 控制并发
- 支持优雅关闭
- 自动重试失败任务

**启动方式**：
```bash
# 启动视频生成 worker
npm run worker:video

# 启动所有 workers
npm run worker:all
```

---

## 🚀 迁移步骤

### 1. 数据库迁移

```bash
# 1. 生成 Prisma Client
npm run db:generate

# 2. 推送数据库结构变更
npm run db:push

# 或者使用 migration（生产环境推荐）
npm run db:migrate
```

### 2. 安装依赖

```bash
npm install
```

新增依赖：
- `p-queue@^8.0.1`：任务队列
- `concurrently@^8.2.0`：并行运行多个 worker

### 3. 启动服务

**开发环境**：
```bash
# 终端 1：启动 Next.js 服务
npm run dev

# 终端 2：启动 Worker
npm run worker:video
```

**生产环境**：
```bash
# 构建
npm run build

# 启动 Web 服务和 Worker
npm run start &
npm run worker:all &
```

### 4. 测试新架构

#### 4.1 测试视频生成 API

```bash
curl -X POST http://localhost:3000/api/ai/video/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A product demo video for an induction cooker",
    "duration": 10,
    "resolution": "720p",
    "userId": "test-user"
  }'
```

**预期响应**：
```json
{
  "success": true,
  "data": {
    "taskId": "clxxxx",
    "status": "pending",
    "traceId": "uuid-xxx"
  }
}
```

#### 4.2 查询任务状态

```bash
curl http://localhost:3000/api/tasks/{taskId}
```

**预期响应**：
```json
{
  "success": true,
  "data": {
    "id": "clxxxx",
    "type": "video_generation",
    "status": "running",
    "progress": 40,
    "payload": { ... },
    "result": null,
    "error": null,
    ...
  }
}
```

#### 4.3 查询任务列表

```bash
curl "http://localhost:3000/api/tasks?type=video_generation&status=pending&limit=10"
```

#### 4.4 访问任务监控面板

打开浏览器访问：
```
http://localhost:3000/admin/tasks
```

功能：
- 查看所有任务列表
- 按类型和状态筛选
- 查看任务详情和日志
- 取消任务
- 自动刷新

---

## 📝 前端页面重构指南

### 重构原则

**Before (错误)**：
```tsx
// ❌ 前端页面中直接包含业务逻辑
const handleGenerateVideo = () => {
  const result = calculateScore(data) // 业务逻辑
  const prompt = generatePrompt(result) // AI 逻辑
  // ...
}
```

**After (正确)**：
```tsx
// ✅ 前端只负责展示和请求
const handleGenerateVideo = async () => {
  setLoading(true)
  try {
    const response = await fetch('/api/ai/video/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, duration, resolution }),
    })
    const result = await response.json()
    
    if (result.success) {
      setTaskId(result.data.taskId)
      // 轮询任务状态
      pollTaskStatus(result.data.taskId)
    }
  } catch (error) {
    console.error('Failed to generate video:', error)
  } finally {
    setLoading(false)
  }
}

// 轮询任务状态
const pollTaskStatus = async (taskId: string) => {
  const interval = setInterval(async () => {
    const response = await fetch(`/api/tasks/${taskId}`)
    const result = await response.json()
    
    if (result.success) {
      const task = result.data
      setProgress(task.progress)
      
      if (task.status === 'succeeded') {
        clearInterval(interval)
        setVideoResult(task.result)
      } else if (task.status === 'failed') {
        clearInterval(interval)
        setError(task.error)
      }
    }
  }, 2000) // 每 2 秒查询一次
}
```

### 需要重构的页面

1. **app/dashboard/page.tsx**
   - 移除 `handleCompetitorAnalysis` 中的 AI 分析逻辑
   - 移除 `handleStyleMatching` 中的风格匹配逻辑
   - 移除 `handleGeneratePrompt` 中的 Prompt 生成逻辑
   - 改为调用对应的 API 接口

2. **app/admin/page.tsx**
   - 移除竞品批量分析的本地逻辑
   - 移除评论爬取的处理逻辑
   - 改为调用任务 API，并在任务监控页面查看进度

---

## 🛠️ 开发规范

### 1. API 路由开发规范

**标准模板**：
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withTraceId } from '@/src/middleware/traceId'
import { createApiLogger } from '@/src/services/logger/Logger'

async function handler(request: NextRequest, traceId: string) {
  const log = createApiLogger(traceId, 'module-name')

  try {
    // 1. 解析请求参数
    const body = await request.json()
    const { param1, param2 } = body

    // 2. 参数校验
    if (!param1) {
      log.warn('Missing required parameter', { param1 })
      return NextResponse.json(
        { success: false, error: 'param1 is required', traceId },
        { status: 400 }
      )
    }

    // 3. 调用服务层
    log.info('Processing request', { param1, param2 })
    const result = await someService.process(param1, param2)

    // 4. 返回响应
    log.info('Request completed', { result })
    const response = NextResponse.json({
      success: true,
      data: result,
      traceId,
    })
    response.headers.set('x-trace-id', traceId)
    return response
  } catch (error) {
    // 5. 错误处理
    log.error('Request failed', error)
    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal error',
        traceId,
      },
      { status: 500 }
    )
    response.headers.set('x-trace-id', traceId)
    return response
  }
}

export const POST = withTraceId(handler)
```

### 2. 服务层开发规范

**职责**：
- 业务逻辑封装
- 数据库操作
- 外部 API 调用
- 不直接处理 HTTP 请求

**示例**：
```typescript
export class VideoService {
  async generateVideo(input: VideoGenerationInput): Promise<VideoResult> {
    // 1. 数据验证
    // 2. 调用外部 AI 服务
    // 3. 数据库操作
    // 4. 返回结果
  }
}
```

### 3. 日志规范

**关键路径必须记录**：
- API 请求开始/结束
- 任务创建/开始/完成/失败
- 外部 API 调用开始/结束
- 重要业务逻辑判断

**日志格式**：
```typescript
log.info('Operation description', { key1: value1, key2: value2 })
log.error('Error description', error, { context1, context2 })
```

### 4. 错误处理规范

**统一错误格式**：
```typescript
{
  success: false,
  error: "Human-readable error message",
  traceId: "uuid-xxx", // 便于排查
  code?: "ERROR_CODE" // 可选：错误码
}
```

---

## 📊 监控与调试

### 1. 链路追踪

**场景**：用户报告视频生成失败

**排查步骤**：
1. 前端获取响应中的 `traceId`
2. 在服务端日志中搜索该 `traceId`
3. 查看完整的请求链路和错误信息

**日志示例**：
```json
{"timestamp":"2025-01-15T10:30:00Z","level":"info","message":"Creating task","traceId":"abc-123","module":"video-generation","payload":{...}}
{"timestamp":"2025-01-15T10:30:01Z","level":"error","message":"AI service failed","traceId":"abc-123","module":"video-generation","error":"Connection timeout"}
```

### 2. 任务监控

访问 `/admin/tasks` 查看：
- 所有任务的实时状态
- 失败任务的错误信息
- 任务执行日志

### 3. 性能监控

使用 `logger.measureTime` 测量关键操作耗时：
```typescript
const result = await log.measureTime(
  'Video generation',
  () => videoService.generate(prompt)
)
```

日志输出：
```json
{"timestamp":"...","level":"info","message":"Video generation started",...}
{"timestamp":"...","level":"info","message":"Video generation completed","durationMs":15230,...}
```

---

## 🔧 故障排查

### 常见问题

#### 1. Worker 没有消费任务

**症状**：任务创建成功，但一直停留在 `pending` 状态

**排查**：
1. 检查 Worker 是否启动：`ps aux | grep worker`
2. 检查 Worker 日志是否有错误
3. 检查任务表是否有 `pending` 状态的任务：
   ```sql
   SELECT * FROM tasks WHERE status = 'pending' ORDER BY createdAt DESC LIMIT 10;
   ```

#### 2. 任务一直失败并重试

**症状**：任务 `retryCount` 持续增加，但总是失败

**排查**：
1. 访问 `/admin/tasks` 查看任务详情
2. 查看任务的 `error` 字段
3. 查看任务日志（`TaskLog` 表）
4. 检查外部服务是否正常

#### 3. TraceId 未传递

**症状**：响应头中没有 `x-trace-id`

**排查**：
1. 检查 API 路由是否使用 `withTraceId` 包装
2. 检查是否正确设置响应头：
   ```typescript
   response.headers.set('x-trace-id', traceId)
   ```

---

## 📚 后续优化建议

### 短期（1-2周）
1. ✅ 完成前端页面重构（移除业务逻辑）
2. ✅ 集成真实的视频生成服务（Doubao Seedance / Sora / Veo）
3. ✅ 添加 WebSocket 支持（实时推送任务状态，替代轮询）

### 中期（1-2月）
1. 迁移到 Redis + BullMQ（生产级任务队列）
2. 增加任务优先级调度策略
3. 实现分布式 Worker（多台服务器）
4. 增加监控告警（任务堆积、失败率过高）

### 长期（3-6月）
1. 引入 OpenTelemetry（分布式追踪）
2. 集成 APM 工具（如 Datadog / New Relic）
3. 实现智能重试策略（指数退避）
4. 增加任务编排功能（DAG 工作流）

---

## 📞 支持与反馈

如有问题，请查看：
1. 本文档的「故障排查」章节
2. 任务监控面板：`/admin/tasks`
3. 服务端日志（搜索 `traceId`）

---

**重构完成时间**: 2025-01-15
**版本**: v1.0
**维护者**: AI Assistant




