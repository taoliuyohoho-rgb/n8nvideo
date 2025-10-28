#!/usr/bin/env tsx

import PQueue from 'p-queue'
import { taskService } from '../src/services/task/TaskService'
import { logger } from '../src/services/logger/Logger'
import { PrismaClient } from '@prisma/client'
import { CompetitorAnalysisService } from '@/src/services/competitor/CompetitorAnalysisService'

const prisma = new PrismaClient()

const WORKER_NAME = 'ai-worker-1'
const POLL_INTERVAL = 5000
const CONCURRENCY = 2

const queue = new PQueue({ concurrency: CONCURRENCY })
const log = logger.withContext({ worker: WORKER_NAME })

const competitorService = new CompetitorAnalysisService({
  supportedPlatforms: ['tiktok', 'youtube', 'instagram', 'facebook'],
  timeout: 60,
  maxRetries: 3,
})

async function processTask(taskId: string) {
  const taskLog = log.withContext({ taskId })
  try {
    const task = await taskService.getTask(taskId)
    if (!task) return

    await taskService.startTask(taskId, WORKER_NAME)

    switch (task.type) {
      case 'style_matching': {
        const { productName, category, targetCountry, sellingPoints, targetAudience } = task.payload || {}

        // 简化：使用数据库模板进行匹配（与现有 match-style 逻辑类似）
        const candidates = await prisma.template.findMany({
          where: { isActive: true },
          take: 30,
        })

        const scored = candidates.map((t: any) => {
          let score = 0
          if (category && t.recommendedCategories?.includes(category)) score += 30
          if (targetCountry && t.targetCountries?.includes(targetCountry)) score += 25
          if (targetAudience && t.tonePool) {
            if (t.tonePool.includes('professional') && String(targetAudience).includes('business')) score += 15
            if (t.tonePool.includes('casual') && String(targetAudience).includes('young')) score += 15
          }
          return { ...t, matchScore: score }
        }).sort((a: any, b: any) => b.matchScore - a.matchScore)

        await taskService.updateTask(taskId, { progress: 100 })
        await taskService.completeTask(taskId, {
          selectedStyle: scored[0] || null,
          candidates: scored.slice(0, 5),
        })
        break
      }
      case 'prompt_generation': {
        const { productName, sellingPoints, marketingInfo, targetCountry, targetAudience, selectedStyleId } = task.payload || {}

        const selectedTemplate = selectedStyleId
          ? await prisma.template.findUnique({ where: { id: selectedStyleId } })
          : null

        const prompt = `Create a ${targetCountry || 'global'} product video for ${productName}. Key selling points: ${sellingPoints}. Audience: ${targetAudience}. Marketing: ${marketingInfo}. Style: ${selectedTemplate?.name || 'default'}.`

        const video = await prisma.video.create({
          data: {
            templateId: selectedStyleId || 'default-template',
            userId: 'demo-user',
            generatedPrompt: prompt,
            promptGenerationAI: selectedTemplate?.promptGenerationAI || 'gemini',
            videoGenerationAI: selectedTemplate?.videoGenerationAI || 'sora',
            status: 'generated',
          },
        })

        await taskService.updateTask(taskId, { progress: 100 })
        await taskService.completeTask(taskId, {
          prompt,
          videoId: video.id,
          templateInfo: selectedTemplate
            ? { name: selectedTemplate.name, description: selectedTemplate.description }
            : null,
        })
        break
      }
      case 'competitor_analysis': {
        const { url, urls } = task.payload || {}
        let result: any
        if (url) {
          result = await competitorService.analyzeCompetitor(url)
        } else if (Array.isArray(urls)) {
          const data = await competitorService.batchAnalyzeCompetitors(urls)
          const comparison = await competitorService.compareCompetitors(data)
          result = { competitors: data, comparison }
        }

        await taskService.updateTask(taskId, { progress: 100 })
        await taskService.completeTask(taskId, result)
        break
      }
      default:
        throw new Error(`Unsupported task type: ${task.type}`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    await taskService.failTask(taskId, errorMessage)
  }
}

async function pollTasks() {
  try {
    const tasks = await taskService.getPendingTasks(['style_matching', 'prompt_generation', 'competitor_analysis'], 10)
    for (const task of tasks) {
      queue.add(() => processTask(task.id))
    }
  } catch (error) {
    log.error('Polling error', error)
  }
}

async function gracefulShutdown(signal: string) {
  log.info(`Received ${signal}, shutting down gracefully...`)
  clearInterval(pollInterval)
  await queue.onIdle()
  process.exit(0)
}

log.info('AI worker starting', { workerName: WORKER_NAME, concurrency: CONCURRENCY, pollInterval: POLL_INTERVAL })
const pollInterval = setInterval(pollTasks, POLL_INTERVAL)
pollTasks()
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.stdin.resume()
log.info('AI worker started and listening for tasks')



