import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { recommendRank } from '@/src/services/recommendation/recommend'
import { recordRequest } from '@/src/services/recommendation/metrics'

function badRequest(message: string) {
  return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message } }, { status: 400 })
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json()

    if (!body || typeof body !== 'object') return badRequest('Invalid JSON body')
    const { scenario, task, context, constraints, options } = body || {}

    if (!scenario) return badRequest('scenario is required')
    if (!task) return badRequest('task is required')

    console.log(`[API]/recommend/rank 开始推荐`, { 
      scenario, 
      taskType: task.taskType,
      hasContext: !!context,
      hasConstraints: !!constraints
    });

    const result = await recommendRank({ scenario, task, context, constraints, options })

    const duration = Date.now() - startTime;
    console.log(`[API]/recommend/rank 推荐完成`, { 
      scenario, 
      duration: `${duration}ms`,
      hasResult: !!result.chosen
    });

    return NextResponse.json({ success: true, data: result })
  } catch (err: any) {
    const duration = Date.now() - startTime;
    console.error(`[API]/recommend/rank 推荐失败 (${duration}ms):`, {
      error: err.message,
      stack: err.stack?.split('\n').slice(0, 3).join('\n')
    });
    try {
      const body = await request.json().catch(() => ({} as any));
      const scenario = body?.scenario || 'unknown';
      const msg: string = err?.message || ''
      const fallback = msg.startsWith('RECO_TIMEOUT_') || msg.includes('没有找到适合的推荐结果')
      recordRequest({ scenario, durationMs: duration, success: false, fromCache: false, fallback });
    } catch {}
    
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: err?.message || 'Unknown error' } },
      { status: 500 }
    )
  }
}
