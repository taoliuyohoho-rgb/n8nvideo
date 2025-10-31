import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

/**
 * TraceId 中间件
 * 为每个请求生成唯一的 traceId，用于追踪请求链路
 */

export function withTraceId(handler: (req: NextRequest, traceId: string, context?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    // 从请求头获取或生成新的 traceId
    const traceId = req.headers.get('x-trace-id') || randomUUID()

    try {
      // 执行实际的处理器
      const response = await handler(req, traceId, context)

      // 在响应头中返回 traceId
      response.headers.set('x-trace-id', traceId)

      return response
    } catch (error) {
      // 即使出错也要返回 traceId
      const errorResponse = NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error',
          traceId,
        },
        { status: 500 }
      )

      errorResponse.headers.set('x-trace-id', traceId)
      return errorResponse
    }
  }
}

/**
 * 从 NextRequest 中提取 traceId
 */
export function getTraceId(req: NextRequest): string {
  return req.headers.get('x-trace-id') || randomUUID()
}




