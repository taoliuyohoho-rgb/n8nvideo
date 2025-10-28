import { NextRequest, NextResponse } from 'next/server'
import { RankingService } from '@/src/services/ranking/RankingService'

const rankingService = new RankingService({
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
  }
})

export async function POST(request: NextRequest) {
  try {
    const { 
      candidates, 
      context, 
      userProfile, 
      algorithm = 'hybrid' 
    } = await request.json()

    if (!candidates || !Array.isArray(candidates)) {
      return NextResponse.json(
        { error: 'Candidates array is required' },
        { status: 400 }
      )
    }

    let result

    switch (algorithm) {
      case 'coarse':
        result = await rankingService.coarseRanking(candidates, context)
        break
      case 'fine':
        result = await rankingService.fineRanking(candidates, context, userProfile)
        break
      case 'hybrid':
      default:
        result = await rankingService.hybridRanking(candidates, context, userProfile)
        break
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Ranking failed:', error)
    return NextResponse.json(
      { 
        error: 'Ranking failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
