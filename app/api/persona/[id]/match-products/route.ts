/**
 * 人设自动匹配商品API
 * POST /api/persona/[id]/match-products
 */

import { NextRequest, NextResponse } from 'next/server'
import { autoMatchAndUpdatePersona } from '@/src/services/persona/personaProductMatcher'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const personaId = params.id

    if (!personaId) {
      return NextResponse.json(
        { error: '缺少人设ID' },
        { status: 400 }
      )
    }

    console.log(`[API] 开始为人设 ${personaId} 自动匹配商品...`)

    // 执行自动匹配
    const result = await autoMatchAndUpdatePersona(personaId)

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || '匹配失败',
          matchedCount: 0
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `成功匹配 ${result.matchedCount} 个商品`,
      matchedCount: result.matchedCount,
      topProduct: result.topProduct ? {
        id: result.topProduct.id,
        name: result.topProduct.name,
        category: result.topProduct.category
      } : null
    })
  } catch (error) {
    console.error('[API] 自动匹配商品失败:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '服务器内部错误',
        matchedCount: 0
      },
      { status: 500 }
    )
  }
}

