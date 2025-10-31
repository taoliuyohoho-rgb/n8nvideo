import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { HierarchicalRankingService } from '@/src/services/ranking/HierarchicalRankingService'

// 初始化服务
const rankingService = new HierarchicalRankingService({
  global: {
    id: 'global',
    level: 'global',
    levelId: 'global',
    name: '全局配置',
    coarseRanking: {
      maxCandidates: 100,
      minScore: 0.3,
      weightFactors: {
        relevance: 0.4,
        quality: 0.3,
        diversity: 0.2,
        recency: 0.1
      }
    },
    fineRanking: {
      maxResults: 20,
      minScore: 0.6,
      weightFactors: {
        userPreference: 0.3,
        businessValue: 0.3,
        technicalQuality: 0.2,
        marketTrend: 0.2
      }
    },
    inheritance: {
      fromGlobal: false,
      fromCategory: false,
      fromProduct: false,
      customOverrides: []
    }
  },
  categories: {},
  products: {},
  templates: {}
}, {})

// 应用建议
export async function POST(request: NextRequest) {
  try {
    const { level, levelId, config } = await request.json()

    if (!level || !levelId || !config) {
      return NextResponse.json(
        { error: 'Level, levelId and config are required' },
        { status: 400 }
      )
    }

    // 应用配置
    await rankingService.updateConfig(level, levelId, config)

    // 记录配置变更
    const changeRecord = {
      id: `change_${Date.now()}`,
      timestamp: new Date(),
      level,
      levelId,
      changeType: 'suggestion_applied',
      description: `应用了AI建议的配置优化`,
      config,
      status: 'applied'
    }

    // 这里应该保存变更记录到数据库
    console.log('Configuration change applied:', changeRecord)

    return NextResponse.json({
      success: true,
      message: 'Suggestion applied successfully',
      data: {
        changeId: changeRecord.id,
        timestamp: changeRecord.timestamp
      }
    })

  } catch (error) {
    console.error('Failed to apply suggestion:', error)
    return NextResponse.json(
      { 
        error: 'Failed to apply suggestion',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
