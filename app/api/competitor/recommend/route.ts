import { NextRequest, NextResponse } from 'next/server'
import { unifiedCompetitorService } from '@/src/services/competitor/UnifiedCompetitorService'

/**
 * 竞品分析推荐API
 * 只返回推荐的模型和Prompt候选项，不执行AI
 */
export async function POST(request: NextRequest) {
  try {
    const { productId, input, images, isUrl } = await request.json()

    if (!input && (!images || images.length === 0)) {
      return NextResponse.json(
        { success: false, error: '请提供竞品信息' },
        { status: 400 }
      )
    }

    if (!productId) {
      return NextResponse.json(
        { success: false, error: '请先选择商品' },
        { status: 400 }
      )
    }

    // 只获取推荐，不执行
    const recommendations = await unifiedCompetitorService.getRecommendations({
      productId,
      input,
      images,
      isUrl
    })

    return NextResponse.json({
      success: true,
      data: recommendations
    })
  } catch (error) {
    console.error('获取推荐失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取推荐失败'
      },
      { status: 500 }
    )
  }
}

