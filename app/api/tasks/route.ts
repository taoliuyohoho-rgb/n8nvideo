import { NextRequest, NextResponse } from 'next/server'
import { withTraceId } from '@/src/middleware/traceId'
import { taskService } from '@/src/services/task/TaskService'
import { createApiLogger } from '@/src/services/logger/Logger'

/**
 * 任务列表查询 API
 * GET /api/tasks?type=video_generation&status=pending&limit=50
 */
async function handler(request: NextRequest, traceId: string) {
  const log = createApiLogger(traceId, 'task-list')

  try {
    const { searchParams } = new URL(request.url)

    // 解析查询参数
    const type = searchParams.get('type') || undefined
    const status = searchParams.get('status') || undefined
    const ownerId = searchParams.get('ownerId') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    log.info('Querying tasks', { type, status, ownerId, limit, offset })

    const tasks = await taskService.queryTasks({
      type: type as any,
      status: status as any,
      ownerId,
      limit,
      offset,
    })

    log.info('Tasks queried successfully', { count: tasks.length })

    const response = NextResponse.json({
      success: true,
      data: {
        tasks,
        count: tasks.length,
        offset,
        limit,
      },
      traceId,
    })

    response.headers.set('x-trace-id', traceId)
    return response
  } catch (error) {
    log.error('Failed to query tasks', error)

    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query tasks',
        traceId,
      },
      { status: 500 }
    )

    response.headers.set('x-trace-id', traceId)
    return response
  }
}

export const GET = withTraceId(handler)

/**
 * 创建新任务 API
 * POST /api/tasks
 */
async function createHandler(request: NextRequest, traceId: string) {
  const log = createApiLogger(traceId, 'task-create')

  try {
    const body = await request.json()
    
    log.info('Creating new task', { body })

    const task = await taskService.createTask({
      type: body.type,
      payload: body.payload,
      priority: body.priority || 0,
      traceId: body.traceId || traceId,
      dedupeKey: body.dedupeKey,
      ownerId: body.ownerId,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      maxRetries: body.maxRetries || 3,
      metadata: body.metadata,
    })

    log.info('Task created successfully', { taskId: task.id })

    const response = NextResponse.json({
      success: true,
      data: { task },
      traceId,
    })

    response.headers.set('x-trace-id', traceId)
    return response
  } catch (error) {
    log.error('Failed to create task', error)

    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create task',
        traceId,
      },
      { status: 500 }
    )

    response.headers.set('x-trace-id', traceId)
    return response
  }
}

export const POST = withTraceId(createHandler)




