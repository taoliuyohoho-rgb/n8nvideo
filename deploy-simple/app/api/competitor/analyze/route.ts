import { NextRequest, NextResponse } from 'next/server'
import { CompetitorAnalysisService } from '@/src/services/competitor/CompetitorAnalysisService'

const competitorService = new CompetitorAnalysisService({
  supportedPlatforms: ['tiktok', 'youtube', 'instagram', 'facebook'],
  timeout: 30,
  maxRetries: 3
})

export async function POST(request: NextRequest) {
  try {
    const { url, urls } = await request.json()

    if (!url && !urls) {
      return NextResponse.json(
        { error: 'URL or URLs are required' },
        { status: 400 }
      )
    }

    let result

    if (url) {
      // 单个URL分析
      result = await competitorService.analyzeCompetitor(url)
    } else if (urls && Array.isArray(urls)) {
      // 批量URL分析
      result = await competitorService.batchAnalyzeCompetitors(urls)
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Competitor analysis failed:', error)
    return NextResponse.json(
      { 
        error: 'Competitor analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const urls = searchParams.get('urls')?.split(',') || []

    if (urls.length === 0) {
      return NextResponse.json(
        { error: 'URLs parameter is required' },
        { status: 400 }
      )
    }

    const results = await competitorService.batchAnalyzeCompetitors(urls)
    
    // 比较竞品
    const comparison = await competitorService.compareCompetitors(results)

    return NextResponse.json({
      success: true,
      data: {
        competitors: results,
        comparison
      }
    })

  } catch (error) {
    console.error('Competitor comparison failed:', error)
    return NextResponse.json(
      { 
        error: 'Competitor comparison failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
