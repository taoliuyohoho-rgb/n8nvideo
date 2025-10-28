import { NextRequest, NextResponse } from 'next/server'
import { unifiedCompetitorService } from '@/src/services/competitor/UnifiedCompetitorService'

/**
 * 统一竞品解析API
 * 支持：文本 | 图片 | 链接，自动识别并解析
 * 通过推荐引擎动态选择AI模型和Prompt
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

    // 调用统一竞品分析服务
    const result = await unifiedCompetitorService.analyzeCompetitor(
      {
        productId,
        input,
        images,
        isUrl
      },
      returnCandidates || false, // 是否返回候选项
      chosenModelId, // 用户选择的模型ID
      chosenPromptId // 用户选择的Prompt ID
    )

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        message: `已使用 ${result.aiModelUsed} 和 ${result.promptUsed} 模板解析`
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

