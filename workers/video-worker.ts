#!/usr/bin/env tsx

/**
 * 视频生成 Worker
 * 消费视频生成任务队列，执行实际的视频生成逻辑
 */

import PQueue from 'p-queue'
import { taskService } from '../src/services/task/TaskService'
import { logger } from '../src/services/logger/Logger'
import { rank } from '@/src/services/ai/estimation/rank'
import { videoProviderRegistry } from '@/src/services/ai/video/VideoProviderRegistry'
import { SoraProvider } from '@/src/services/ai/video/providers/SoraProvider'
import { loadVideoGenerationConfig } from '@/src/services/ai/video/loadConfig'

const WORKER_NAME = 'video-worker-1'
const POLL_INTERVAL = 5000 // 5 seconds
const CONCURRENCY = 2 // 同时处理2个任务

// 创建队列
const queue = new PQueue({ concurrency: CONCURRENCY })

const log = logger.withContext({ worker: WORKER_NAME })

/**
 * 处理单个视频生成任务
 */
async function processVideoTask(taskId: string) {
  const taskLog = log.withContext({ taskId })

  try {
    // 获取任务详情
    const task = await taskService.getTask(taskId)
    if (!task) {
      taskLog.warn('Task not found')
      return
    }

    taskLog.info('Processing video generation task', {
      payload: task.payload,
    })

    // 标记任务开始执行
    await taskService.startTask(taskId, WORKER_NAME)
    await taskService.addTaskLog(taskId, 'info', 'Task started by worker', {
      workerName: WORKER_NAME,
    })

    const { prompt, duration, resolution } = task.payload

    // ========== 实际视频生成逻辑 ==========
    // 通过推荐/排序引擎选择视频生成模型（可被环境变量覆盖）
    let chosenProvider: string | undefined = process.env.VIDEO_PROVIDER || undefined
    let chosenModelName: string | undefined = process.env.VIDEO_MODEL_NAME || undefined
    let decisionId: string | undefined

    if (!chosenProvider || !chosenModelName) {
      try {
        const rankResp = await rank({
          task: {
            lang: 'en',
            category: undefined,
            style: undefined,
            lengthHint: duration && duration <= 10 ? 'short' : duration && duration <= 30 ? 'medium' : 'long',
          },
          context: { channel: 'general' },
          // 这里不强制 provider，交给模型池与规则决定；如需只允许视频生成类模型，可在 filters 中实现
          options: { topK: 1, explore: false },
        })
        chosenProvider = rankResp.chosen.provider
        chosenModelName = rankResp.chosen.modelName || undefined
        decisionId = rankResp.decisionId
        taskLog.info('Rank engine selected video model', { provider: chosenProvider, modelName: chosenModelName, decisionId })
      } catch (e) {
        taskLog.warn('Rank engine selection failed, no provider selected', { error: e instanceof Error ? e.message : String(e) })
      }
    }

    // 若无选择结果，则提示未配置，避免使用写死默认
    if (!chosenProvider) {
      throw new Error('No video generation provider configured or selected. Set VIDEO_PROVIDER/VIDEO_MODEL_NAME, or ensure estimation models include video-capable providers.')
    }

    // 注册可用的视频供应商实现（按需扩展），优先使用 Admin 配置
    const videoCfg = loadVideoGenerationConfig()
    videoProviderRegistry.register(new SoraProvider({
      apiKey: videoCfg.apiKey || process.env.SORA_API_KEY,
      baseUrl: videoCfg.baseUrl || process.env.SORA_BASE_URL,
      defaultModel: videoCfg.modelName || process.env.SORA_MODEL,
    }))

    const providerImpl = videoProviderRegistry.get(chosenProvider)
    if (!providerImpl || !providerImpl.isConfigured()) {
      throw new Error(`Video provider '${chosenProvider}' not available or not configured`)
    }

    // 调用统一的 Provider 接口
    await taskService.updateTask(taskId, { progress: 0 })
    const result = await providerImpl.generate({
      prompt,
      duration,
      resolution,
      modelName: chosenModelName,
      traceId: decisionId,
    })

    await taskService.updateTask(taskId, { progress: 100 })
    await taskService.completeTask(taskId, result)
    await taskService.addTaskLog(taskId, 'info', 'Task completed successfully', { result })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    taskLog.error('Task processing failed', error, { taskId })

    // 标记任务失败（会自动重试）
    await taskService.failTask(taskId, errorMessage)
  }
}

/**
 * 轮询待处理任务
 */
async function pollTasks() {
  try {
    log.debug('Polling for pending tasks')

    // 获取待处理的视频生成任务
    const tasks = await taskService.getPendingTasks(['video_generation'], 10)

    if (tasks.length === 0) {
      log.debug('No pending tasks found')
      return
    }

    log.info(`Found ${tasks.length} pending tasks`)

    // 将任务加入队列
    for (const task of tasks) {
      queue.add(() => processVideoTask(task.id))
      log.info('Task added to queue', { taskId: task.id })
    }
  } catch (error) {
    log.error('Failed to poll tasks', error)
  }
}

/**
 * 优雅关闭
 */
async function gracefulShutdown(signal: string) {
  log.info(`Received ${signal}, shutting down gracefully...`)

  // 停止轮询
  clearInterval(pollInterval)

  // 等待队列中的任务完成
  log.info(`Waiting for ${queue.size} tasks to complete...`)
  await queue.onIdle()

  log.info('All tasks completed, exiting')
  process.exit(0)
}

// 启动 Worker
log.info('Video worker starting', {
  workerName: WORKER_NAME,
  concurrency: CONCURRENCY,
  pollInterval: POLL_INTERVAL,
})

// 定期轮询任务
const pollInterval = setInterval(pollTasks, POLL_INTERVAL)

// 立即执行一次
pollTasks()

// 监听终止信号
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

// 防止进程退出
process.stdin.resume()

log.info('Video worker started and listening for tasks')


