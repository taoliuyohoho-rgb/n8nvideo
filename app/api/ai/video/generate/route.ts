import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { withTraceId } from '@/src/middleware/traceId'
import { taskService } from '@/src/services/task/TaskService'
import { createApiLogger } from '@/src/services/logger/Logger'

/**
 * 视频生成 API
 * 接收视频生成请求，创建异步任务并返回 taskId
 */
async function handler(request: NextRequest, traceId: string) {
  const log = createApiLogger(traceId, 'video-generation')

  try {
    const body = await request.json()
    const { prompt, duration = 10, resolution = '720p', userId, metadata } = body

    // 校验必填参数
    if (!prompt) {
      log.warn('Missing required parameter: prompt')
      return NextResponse.json(
        { success: false, error: 'prompt 必填', traceId },
        { status: 400 }
      )
    }

    log.info('Creating video generation task', { prompt, duration, resolution })

    // 创建任务（落库）
    const task = await taskService.createTask({
      type: 'video_generation',
      payload: {
        prompt,
        duration,
        resolution,
      },
      traceId,
      ownerId: userId,
      metadata: metadata || {},
      priority: 0, // 默认优先级
    })

    log.info('Video generation task created', { taskId: task.id })

    // 返回 taskId 和状态
    const response = NextResponse.json({
      success: true,
      data: {
        taskId: task.id,
        status: task.status,
        traceId,
      },
    })

    response.headers.set('x-trace-id', traceId)
    return response
  } catch (error) {
    log.error('Failed to create video generation task', error)
    
    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '生成失败',
        traceId,
      },
      { status: 500 }
    )

    response.headers.set('x-trace-id', traceId)
    return response
  }
}

export const POST = withTraceId(handler)


