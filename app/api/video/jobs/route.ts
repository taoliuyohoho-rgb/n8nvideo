import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { withTraceId } from '@/src/middleware/traceId'
import { createApiLogger } from '@/src/services/logger/Logger'
import { taskService } from '@/src/services/task/TaskService'

const prisma = new PrismaClient()

/**
 * 视频任务创建 API
 * 创建视频生成任务并返回任务ID
 */
async function handler(request: NextRequest, traceId: string) {
  const log = createApiLogger(traceId, 'video-jobs-create')

  try {
    const body = await request.json()
    const { scriptId, providerPref = [], seconds = 15, size = '720x1280' } = body

    // 校验输入
    if (!scriptId) {
      log.warn('Missing scriptId')
      return NextResponse.json(
        { success: false, error: '脚本ID必填', traceId },
        { status: 400 }
      )
    }

    log.info('Creating video job', { scriptId, providerPref, seconds, size })

    // 1. 验证脚本存在
    const script = await prisma.script.findUnique({
      where: { id: scriptId },
      include: {
        product: true,
        persona: true
      }
    })

    if (!script) {
      log.warn('Script not found', { scriptId })
      return NextResponse.json(
        { success: false, error: '脚本不存在', traceId },
        { status: 404 }
      )
    }

    // 2. 生成幂等键
    const idempotencyKey = request.headers.get('Idempotency-Key') || 
      `video_${scriptId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 3. 检查是否已存在相同任务
    const existingJob = await prisma.videoJob.findUnique({
      where: { idempotencyKey }
    })

    if (existingJob) {
      log.info('Returning existing job', { jobId: existingJob.id })
      return NextResponse.json({
        success: true,
        jobId: existingJob.id,
        status: existingJob.status
      })
    }

    // 4. 创建视频任务记录
    const videoJob = await prisma.videoJob.create({
      data: {
        idempotencyKey,
        productId: script.productId,
        personaId: script.personaId,
        scriptId: script.id,
        provider: providerPref[0] || 'OpenAI', // 默认使用第一个偏好提供商
        model: null, // 由worker决定具体模型
        status: 'queued',
        progress: 0,
        params: {
          seconds,
          size,
          inputReferenceRef: null,
          extras: {
            providerPref,
            scriptVersion: script.version
          }
        },
        createdBy: 'system' // 实际应用中从认证获取
      }
    })

    // 5. 创建异步任务
    const task = await taskService.createTask({
      type: 'video_generation',
      payload: {
        videoJobId: videoJob.id,
        scriptId: script.id,
        provider: videoJob.provider,
        seconds,
        size,
        scriptData: {
          angle: script.angle,
          energy: script.energy,
          lines: script.lines,
          shots: script.shots,
          technical: script.technical
        }
      },
      traceId,
      ownerId: 'system',
      metadata: {
        videoJobId: videoJob.id,
        productId: script.productId,
        personaId: script.personaId
      },
      priority: 0
    })

    // 6. 更新视频任务记录
    await prisma.videoJob.update({
      where: { id: videoJob.id },
      data: {
        status: 'queued',
        progress: 0
      }
    })

    log.info('Video job created successfully', { 
      jobId: videoJob.id,
      taskId: task.id,
      scriptId
    })

    return NextResponse.json({
      success: true,
      jobId: videoJob.id,
      status: 'queued'
    })

  } catch (error) {
    log.error('Failed to create video job', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '视频任务创建失败',
        traceId
      },
      { status: 500 }
    )
  }
}

export const POST = withTraceId(handler)