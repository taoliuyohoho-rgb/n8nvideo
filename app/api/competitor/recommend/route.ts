import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getScenarioCapabilities, createCompetitorAnalysisService } from '@/src/services/analysis'
import { recommendRank } from '@/src/services/recommendation/recommend'

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

    // 获取竞品分析场景的能力描述
    const capabilities = getScenarioCapabilities('competitor-analysis')
    
    // 获取模型推荐
    const modelRecommendation = await recommendRank({
      scenario: 'task->model',
      task: {
        taskType: 'competitor-analysis',
        contentType: images && images.length > 0 ? 'multimodal' : 'text',
        language: 'zh',
        jsonRequirement: true,
        budgetTier: 'mid'
      },
      context: {
        channel: 'web'
      }
    })

    // 获取Prompt推荐
    const promptRecommendation = await recommendRank({
      scenario: 'task->prompt',
      task: {
        taskType: 'competitor-analysis',
        contentType: images && images.length > 0 ? 'multimodal' : 'text',
        language: 'zh',
        jsonRequirement: true,
        budgetTier: 'mid'
      },
      context: {
        channel: 'web'
      }
    })

    const recommendations = {
      capabilities,
      models: modelRecommendation.chosen ? {
        id: modelRecommendation.chosen.id,
        name: modelRecommendation.chosen.name,
        summary: modelRecommendation.chosen.summary,
        reason: modelRecommendation.chosen.reason
      } : null,
      prompts: promptRecommendation.chosen ? {
        id: promptRecommendation.chosen.id,
        name: promptRecommendation.chosen.name,
        summary: promptRecommendation.chosen.summary,
        reason: promptRecommendation.chosen.reason
      } : null,
      inputTypes: capabilities.inputTypes,
      analysisEngines: capabilities.analysisEngines,
      outputFormats: capabilities.outputFormats
    }

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

