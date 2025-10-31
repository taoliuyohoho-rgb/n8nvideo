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
import { buildVideoPrompt } from '@/src/services/ai/video/VideoPromptBuilder'
import { prisma } from '@/lib/prisma'

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

    const { prompt, duration, resolution, seconds, size, scriptId, scriptData } = task.payload

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
            lengthHint: (duration ?? seconds) && (duration ?? seconds) <= 10 ? 'short' : (duration ?? seconds) && (duration ?? seconds) <= 30 ? 'medium' : 'long',
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

    // 准备 prompt/duration/resolution（兼容旧入参 seconds/size）
    let finalPrompt: string | undefined = prompt
    const finalDuration: number = typeof duration === 'number' ? duration : (typeof seconds === 'number' ? seconds : 15)
    const finalResolution: string = typeof resolution === 'string' ? resolution : (typeof size === 'string' ? size : '720x1280')

    if (!finalPrompt) {
      // 兜底从脚本与人设构建视频 Prompt
      try {
        let productName = 'Product'
        let targetCountries: string[] = []
        let scriptSnapshot = scriptData
        let personaSnapshot: any = null

        if (!scriptSnapshot && scriptId) {
          const dbScript = await prisma.script.findUnique({
            where: { id: scriptId },
            include: { product: true, persona: true },
          })
          if (dbScript) {
            productName = dbScript.product?.name || productName
            // 兼容老字段 targetCountries(String?) 与新字段 country(String[])
            const tc = dbScript.product?.targetCountries
            const countryArr = Array.isArray((dbScript as any).product?.country) ? (dbScript as any).product?.country as string[] : []
            const parsedTc = typeof tc === 'string' ? safeParseStringArray(tc) : []
            targetCountries = countryArr.length > 0 ? countryArr : parsedTc

            scriptSnapshot = scriptSnapshot || {
              angle: dbScript.angle,
              energy: dbScript.energy,
              durationSec: typeof dbScript.durationSec === 'number' ? dbScript.durationSec : finalDuration,
              lines: dbScript.lines as any,
              shots: dbScript.shots as any,
              technical: dbScript.technical as any,
            }

            if (dbScript.persona) {
              const ci = coerceObj(dbScript.persona.coreIdentity)
              personaSnapshot = {
                id: dbScript.persona.id,
                name: ci && typeof ci === 'object' ? (ci as any).name : undefined,
                coreIdentity: ci,
                look: coerceObj(dbScript.persona.look),
                vibe: coerceObj(dbScript.persona.vibe),
                context: coerceObj(dbScript.persona.context),
              }
            }
          }
        }

        if (!scriptSnapshot) {
          throw new Error('Missing script data to build video prompt')
        }

        // Try pick a 3C video-prompt template by script angle (best-effort)
        let templateContent: string | undefined
        try {
          const angleText = String((scriptSnapshot as any).angle || '').toLowerCase()
          let tplName: string | undefined
          if (angleText.includes('unboxing') || angleText.includes('开箱')) tplName = '3C-UGC-Unboxing-15s'
          else if (angleText.includes('feature') || angleText.includes('功能')) tplName = '3C-UGC-FeatureDemo-15s'
          else if (angleText.includes('benchmark') || angleText.includes('性能') || angleText.includes('速度')) tplName = '3C-UGC-PerformanceBenchmark-15s'
          else if (angleText.includes('solution') || angleText.includes('痛点')) tplName = '3C-UGC-ProblemSolution-15s'
          else if (angleText.includes('pov') || angleText.includes('教程') || angleText.includes('setup')) tplName = '3C-UGC-CreatorPOV-Setup-15s'

          if (tplName) {
            const tpl = await prisma.promptTemplate.findFirst({ where: { businessModule: 'video-prompt', name: tplName, isActive: true } })
            if (tpl?.content) templateContent = tpl.content as string
          }
        } catch {}

        const built = buildVideoPrompt({
          providerName: chosenProvider,
          productName,
          targetCountries,
          script: scriptSnapshot,
          persona: personaSnapshot,
          templateContent,
        })
        finalPrompt = built.prompt
        await taskService.addTaskLog(taskId, 'info', 'Prompt built from script/persona', { languages: built.languages })
      } catch (e) {
        taskLog.warn('Failed to build prompt from script/persona, falling back to generic prompt', { error: e instanceof Error ? e.message : String(e) })
        finalPrompt = `Create a ${finalDuration}s vertical product video. Keep camera smooth, ensure clear product visibility and safe caption areas.`
      }
    }

    // 调用统一的 Provider 接口
    await taskService.updateTask(taskId, { progress: 0 })
    const result = await providerImpl.generate({
      prompt: finalPrompt!,
      duration: finalDuration,
      resolution: finalResolution,
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



function safeParseStringArray(input: any): string[] {
  if (!input) return []
  if (Array.isArray(input)) return input.filter((x) => typeof x === 'string') as string[]
  if (typeof input === 'string') {
    // Try JSON array
    const s = input.trim()
    if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('"') && s.endsWith('"'))) {
      try {
        const val = JSON.parse(s)
        return Array.isArray(val) ? val.filter((x) => typeof x === 'string') : []
      } catch {}
    }
    // Fallback: comma-separated
    return s.split(',').map((x) => x.trim()).filter(Boolean)
  }
  return []
}

function coerceObj<T = any>(val: any): T | null {
  if (!val) return null
  if (typeof val === 'object') return val as T
  if (typeof val === 'string') {
    try {
      const obj = JSON.parse(val)
      return typeof obj === 'object' && obj ? (obj as T) : null
    } catch {
      return null
    }
  }
  return null
}
