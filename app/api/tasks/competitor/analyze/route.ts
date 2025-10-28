import { NextRequest, NextResponse } from 'next/server'
import { withTraceId } from '@/src/middleware/traceId'
import { taskService } from '@/src/services/task/TaskService'
import { createApiLogger } from '@/src/services/logger/Logger'

async function handler(request: NextRequest, traceId: string) {
  const log = createApiLogger(traceId, 'tasks-competitor-analysis')
  try {
    const body = await request.json()
    const { url, urls, userId, metadata } = body

    if (!url && (!urls || !Array.isArray(urls) || urls.length === 0)) {
      return NextResponse.json({ success: false, error: 'url 或 urls 必填', traceId }, { status: 400 })
    }

    const task = await taskService.createTask({
      type: 'competitor_analysis',
      payload: { url, urls },
      ownerId: userId,
      metadata,
      traceId,
    })

    return NextResponse.json({ success: true, data: { taskId: task.id, status: task.status, traceId } })
  } catch (err) {
    log.error('Failed to create competitor analysis task', err)
    return NextResponse.json({ success: false, error: '任务创建失败', traceId }, { status: 500 })
  }
}

export const POST = withTraceId(handler)



