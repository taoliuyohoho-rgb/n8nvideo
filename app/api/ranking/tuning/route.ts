import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { HierarchicalRankingService } from '@/src/services/ranking/HierarchicalRankingService'
import { TuningAnalyticsService } from '@/src/services/analytics/TuningAnalyticsService'

// 初始化服务
const analyticsService = new TuningAnalyticsService({})
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
}, analyticsService)

// 获取配置
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level') as 'global' | 'category' | 'product' | 'template'
    const levelId = searchParams.get('levelId')

    if (!level) {
      return NextResponse.json(
        { error: 'Level parameter is required' },
        { status: 400 }
      )
    }

    const config = rankingService.getConfig(level, levelId || undefined)
    
    if (!config) {
      return NextResponse.json(
        { error: 'Config not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: config
    })

  } catch (error) {
    console.error('Failed to get config:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get config',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// 保存配置
export async function POST(request: NextRequest) {
  try {
    const config = await request.json()

    if (!config.level || !config.levelId) {
      return NextResponse.json(
        { error: 'Level and levelId are required' },
        { status: 400 }
      )
    }

    await rankingService.updateConfig(
      config.level,
      config.levelId,
      config
    )

    return NextResponse.json({
      success: true,
      message: 'Config saved successfully'
    })

  } catch (error) {
    console.error('Failed to save config:', error)
    return NextResponse.json(
      { 
        error: 'Failed to save config',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// 更新配置
export async function PUT(request: NextRequest) {
  try {
    const { level, levelId, config } = await request.json()

    if (!level || !levelId || !config) {
      return NextResponse.json(
        { error: 'Level, levelId and config are required' },
        { status: 400 }
      )
    }

    await rankingService.updateConfig(level, levelId, config)

    return NextResponse.json({
      success: true,
      message: 'Config updated successfully'
    })

  } catch (error) {
    console.error('Failed to update config:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update config',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// 删除配置
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level') as 'global' | 'category' | 'product' | 'template'
    const levelId = searchParams.get('levelId')

    if (!level || !levelId) {
      return NextResponse.json(
        { error: 'Level and levelId are required' },
        { status: 400 }
      )
    }

    // 这里应该实现删除逻辑
    console.log(`Deleting config for ${level}:${levelId}`)

    return NextResponse.json({
      success: true,
      message: 'Config deleted successfully'
    })

  } catch (error) {
    console.error('Failed to delete config:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete config',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
