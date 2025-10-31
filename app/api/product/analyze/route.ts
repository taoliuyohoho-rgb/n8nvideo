import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTraceId } from '@/src/middleware/traceId'
import { createApiLogger } from '@/src/services/logger/Logger'


/**
 * 商品分析 API
 * 将用户提供的商品分析添加到备选池
 */
async function handler(request: NextRequest, traceId: string) {
  const log = createApiLogger(traceId, 'product-analyze')

  try {
    const body = await request.json()
    const { productId, analysisText } = body

    // 校验输入
    if (!productId) {
      log.warn('Missing productId')
      return NextResponse.json(
        { success: false, error: '商品ID必填', traceId },
        { status: 400 }
      )
    }

    if (!analysisText || typeof analysisText !== 'string' || analysisText.trim().length === 0) {
      log.warn('Missing or invalid analysisText')
      return NextResponse.json(
        { success: false, error: '分析内容必填', traceId },
        { status: 400 }
      )
    }

    log.info('Adding product analysis', { productId })

    // 1. 验证商品存在
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      log.warn('Product not found', { productId })
      return NextResponse.json(
        { success: false, error: '商品不存在', traceId },
        { status: 404 }
      )
    }

    // 2. 创建分析候选记录
    const analysisCandidate = await prisma.analysisCandidate.create({
      data: {
        productId,
        content: analysisText.trim(),
        source: 'user',
        adopted: false
      }
    })

    log.info('Product analysis added successfully', { 
      candidateId: analysisCandidate.id,
      productId
    })

    return NextResponse.json({
      success: true,
      candidateId: analysisCandidate.id
    })

  } catch (error) {
    log.error('Failed to add product analysis', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '添加分析失败',
        traceId
      },
      { status: 500 }
    )
  }
}

export const POST = withTraceId(handler)