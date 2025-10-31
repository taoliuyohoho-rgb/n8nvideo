import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { withTraceId } from '@/src/middleware/traceId';
import { taskService } from '@/src/services/task/TaskService';
import { createApiLogger } from '@/src/services/logger/Logger';

/**
 * Admin 任务列表查询 API
 * GET /api/admin/tasks?type=video_generation&status=pending&limit=50
 */
async function handler(request: NextRequest, traceId: string) {
  const log = createApiLogger(traceId, 'admin-task-list');

  try {
    const { searchParams } = new URL(request.url);

    // 解析查询参数
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status') || undefined;
    const ownerId = searchParams.get('ownerId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    log.info('Querying tasks for admin', { type, status, ownerId, limit, offset });

    const tasks = await taskService.queryTasks({
      type: type as any,
      status: status as any,
      ownerId,
      limit,
      offset,
    });

    log.info('Tasks queried successfully for admin', { count: tasks.length });

    const response = NextResponse.json({
      success: true,
      data: tasks, // Admin 版本直接返回 tasks 数组，与 useAdminData 期望的格式一致
      traceId,
    });

    response.headers.set('x-trace-id', traceId);
    return response;
  } catch (error) {
    log.error('Failed to query tasks for admin', error);

    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query tasks',
        traceId,
      },
      { status: 500 }
    );

    response.headers.set('x-trace-id', traceId);
    return response;
  }
}

export const GET = withTraceId(handler);
