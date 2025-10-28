import { NextRequest, NextResponse } from 'next/server'
import { TuningAnalyticsService } from '@/src/services/analytics/TuningAnalyticsService'

const analyticsService = new TuningAnalyticsService({})

// 获取分析数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const level = searchParams.get('level')
    const levelId = searchParams.get('levelId')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    const timeRange = {
      start: new Date(startDate),
      end: new Date(endDate)
    }

    const analyticsData = await analyticsService.getAnalyticsData(
      timeRange,
      level || undefined,
      levelId || undefined
    )

    return NextResponse.json({
      success: true,
      data: analyticsData
    })

  } catch (error) {
    console.error('Failed to get analytics data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// 生成调参建议
export async function POST(request: NextRequest) {
  try {
    const { timeRange, level, levelId } = await request.json()

    if (!timeRange || !timeRange.start || !timeRange.end) {
      return NextResponse.json(
        { error: 'Time range is required' },
        { status: 400 }
      )
    }

    // 获取分析数据
    const analyticsData = await analyticsService.getAnalyticsData(
      {
        start: new Date(timeRange.start),
        end: new Date(timeRange.end)
      },
      level,
      levelId
    )

    // 生成建议
    const suggestions = await analyticsService.generateTuningSuggestions(analyticsData)

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        analyticsData
      }
    })

  } catch (error) {
    console.error('Failed to generate suggestions:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
