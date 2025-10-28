import { NextRequest, NextResponse } from 'next/server'
import { recommendRank } from '@/src/services/recommendation/recommend'

function badRequest(message: string) {
  return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message } }, { status: 400 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body || typeof body !== 'object') return badRequest('Invalid JSON body')
    const { scenario, task, context, constraints, options } = body || {}

    if (!scenario) return badRequest('scenario is required')
    if (!task) return badRequest('task is required')

    const result = await recommendRank({ scenario, task, context, constraints, options })

    return NextResponse.json({ success: true, ...result })
  } catch (err: any) {
    console.error('[API]/recommend/rank error:', err)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: err?.message || 'Unknown error' } },
      { status: 500 }
    )
  }
}
