import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { runCompetitorContract } from '@/src/services/ai/contracts'
import { prisma } from '@/lib/prisma'

/**
 * 统一竞品解析API
 * 支持：文本 | 图片 | 链接，自动识别并解析
 * 直接调用 runCompetitorContract（绕过傻逼编排器）
 */
export async function POST(request: NextRequest) {
  try {
    const { productId, input, images, isUrl, returnCandidates, chosenModelId, chosenPromptId } = await request.json()

    if (!input && (!images || images.length === 0)) {
      return NextResponse.json(
        { success: false, error: '请提供竞品信息（文本/图片/链接）' },
        { status: 400 }
      )
    }

    if (!productId) {
      return NextResponse.json(
        { success: false, error: '请先选择商品' },
        { status: 400 }
      )
    }

    // 获取商品信息
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: '商品不存在' },
        { status: 404 }
      )
    }

    // 将base64图片转换为dataURL（runCompetitorContract接受dataURL）
    const imageDataURLs = images ? images
      .filter((val: unknown) => typeof val === 'string' && (val as string).startsWith('data:image'))
      .map((base64: string) => base64)
      : undefined

    // 直接调用 runCompetitorContract
    const startTime = Date.now()
    const analysisResult = await runCompetitorContract({
      input: {
        rawText: input || '',
        images: imageDataURLs
      },
      needs: {
        vision: !!(imageDataURLs && imageDataURLs.length > 0),
        search: false,
      },
      policy: {
        maxConcurrency: 3,
        timeoutMs: 30000,
        allowFallback: false
      },
      customPrompt: undefined,
      context: {
        productName: product.name,
        category: product.category || '',
        painPoints: []
      }
    })

    const processingTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: {
        description: analysisResult.description,
        sellingPoints: analysisResult.sellingPoints,
        painPoints: analysisResult.painPoints || [],
        targetAudience: analysisResult.targetAudience || '',
        processingTime,
        message: `解析完成，提取 ${analysisResult.sellingPoints.length} 个卖点，${analysisResult.painPoints?.length || 0} 个痛点`
      }
    })
  } catch (error) {
    console.error('竞品解析失败:', error)
    
    // 特殊处理链接解析失败
    const errorMessage = error instanceof Error ? error.message : '解析失败'
    const isUrlError = errorMessage.includes('链接解析')
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        suggestion: isUrlError ? '建议复制商品详情文本或截图粘贴' : undefined
      },
      { status: isUrlError ? 400 : 500 }
    )
  }
}

