/**
 * 商品内容元素推荐 API
 * 从卖点/痛点/目标受众中选择最适合视频的 Top 5
 */

import { NextRequest, NextResponse } from 'next/server'
import { recommendRank } from '@/src/services/recommendation/recommend'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, elementType, elements, category, region, channel } = body

    if (!productId || !elementType || !Array.isArray(elements) || elements.length === 0) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 使用推荐引擎
    const recommendation = await recommendRank({
      scenario: 'product->content-elements',
      task: {
        subjectRef: {
          entityType: 'product',
          entityId: productId
        },
        elementType,
        elements,
        category: category || '未分类'
      },
      context: {
        region: region || 'global',
        channel: channel || 'tiktok'
      }
    })

    // 提取 Top 5
    const topElements = recommendation.topK.map(c => c.title)

    return NextResponse.json({
      success: true,
      data: {
        topElements,
        decisionId: recommendation.decisionId,
        allCandidates: recommendation.topK
      }
    })

  } catch (error) {
    console.error('❌ 内容元素推荐失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '推荐失败' 
      },
      { status: 500 }
    )
  }
}

