import { NextRequest, NextResponse } from 'next/server'
import { withTraceId } from '@/src/middleware/traceId'
import { taskService } from '@/src/services/task/TaskService'
import { createApiLogger } from '@/src/services/logger/Logger'

/**
 * 获取任务详情 API
 * GET /api/tasks/[id]
 */
async function getHandler(
  request: NextRequest,
  traceId: string,
  context: { params: { id: string } }
) {
  const log = createApiLogger(traceId, 'task-query')
  const taskId = context.params.id

  try {
    log.info('Fetching task', { taskId })

    const task = await taskService.getTask(taskId)

    if (!task) {
      log.warn('Task not found', { taskId })
      return NextResponse.json(
        { success: false, error: 'Task not found', traceId },
        { status: 404 }
      )
    }

    log.info('Task fetched successfully', { taskId, status: task.status })

    const response = NextResponse.json({
      success: true,
      data: task,
      traceId,
    })

    response.headers.set('x-trace-id', traceId)
    return response
  } catch (error) {
    log.error('Failed to fetch task', error, { taskId })

    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch task',
        traceId,
      },
      { status: 500 }
    )

    response.headers.set('x-trace-id', traceId)
    return response
  }
}

/**
 * 取消任务 API
 * DELETE /api/tasks/[id]
 */
async function deleteHandler(
  request: NextRequest,
  traceId: string,
  context: { params: { id: string } }
) {
  const log = createApiLogger(traceId, 'task-cancel')
  const taskId = context.params.id

  try {
    log.info('Canceling task', { taskId })

    const task = await taskService.cancelTask(taskId)

    if (!task) {
      log.warn('Task not found', { taskId })
      return NextResponse.json(
        { success: false, error: 'Task not found', traceId },
        { status: 404 }
      )
    }

    log.info('Task canceled successfully', { taskId })

    const response = NextResponse.json({
      success: true,
      data: task,
      traceId,
    })

    response.headers.set('x-trace-id', traceId)
    return response
  } catch (error) {
    log.error('Failed to cancel task', error, { taskId })

    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel task',
        traceId,
      },
      { status: 500 }
    )

    response.headers.set('x-trace-id', traceId)
    return response
  }
}

// 包装处理器以支持动态路由参数
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return withTraceId((req, traceId) => getHandler(req, traceId, context))(request)
}

/**
 * 更新任务 API
 * PATCH /api/tasks/[id]
 */
async function updateHandler(
  request: NextRequest,
  traceId: string,
  context: { params: { id: string } }
) {
  const log = createApiLogger(traceId, 'task-update')
  const taskId = context.params.id

  try {
    const body = await request.json()
    
    log.info('Updating task', { taskId, update: body })

    const task = await taskService.updateTask(taskId, {
      status: body.status,
      progress: body.progress,
      result: body.result,
      error: body.error,
      workerName: body.workerName,
      startedAt: body.startedAt ? new Date(body.startedAt) : undefined,
      completedAt: body.completedAt ? new Date(body.completedAt) : undefined,
    })

    if (!task) {
      log.warn('Task not found', { taskId })
      return NextResponse.json(
        { success: false, error: 'Task not found', traceId },
        { status: 404 }
      )
    }

    log.info('Task updated successfully', { taskId, status: task.status })

    const response = NextResponse.json({
      success: true,
      data: task,
      traceId,
    })

    response.headers.set('x-trace-id', traceId)
    return response
  } catch (error) {
    log.error('Failed to update task', error, { taskId })

    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update task',
        traceId,
      },
      { status: 500 }
    )

    response.headers.set('x-trace-id', traceId)
    return response
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return withTraceId((req, traceId) => updateHandler(req, traceId, context))(request)
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return withTraceId((req, traceId) => deleteHandler(req, traceId, context))(request)
}




