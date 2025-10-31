import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { withTraceId } from '@/src/middleware/traceId'
import { taskService } from '@/src/services/task/TaskService'
import { createApiLogger } from '@/src/services/logger/Logger'

async function handler(request: NextRequest, traceId: string) {
  const log = createApiLogger(traceId, 'tasks-style-matching')
  try {
    const body = await request.json()
    const { productName, category, targetCountry, sellingPoints, targetAudience, userId, metadata } = body

    if (!productName) {
      return NextResponse.json({ success: false, error: 'productName 必填', traceId }, { status: 400 })
    }

    const task = await taskService.createTask({
      type: 'style_parsing',
      payload: { productName, category, targetCountry, sellingPoints, targetAudience },
      ownerId: userId,
      metadata,
      traceId,
    })

    return NextResponse.json({ success: true, data: { taskId: task.id, status: task.status, traceId } })
  } catch (err) {
    log.error('Failed to create style matching task', err)
    return NextResponse.json({ success: false, error: '任务创建失败', traceId }, { status: 500 })
  }
}

export const POST = withTraceId(handler)



