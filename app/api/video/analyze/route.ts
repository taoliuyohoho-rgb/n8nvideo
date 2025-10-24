import { NextRequest, NextResponse } from 'next/server'
import { VideoAnalysisService } from '@/src/services/video/VideoAnalysisService'

const videoAnalysisService = new VideoAnalysisService({
  supportedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  maxFileSize: 500, // 500MB
  timeout: 300, // 5分钟
  aiAnalysis: {
    enabled: true,
    provider: 'claude',
    model: 'claude-3-sonnet-20240229'
  }
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const videoUrl = formData.get('url') as string
    const options = JSON.parse(formData.get('options') as string || '{}')

    if (!videoFile && !videoUrl) {
      return NextResponse.json(
        { error: 'Video file or URL is required' },
        { status: 400 }
      )
    }

    const analysis = await videoAnalysisService.analyzeVideo(
      videoFile || videoUrl,
      {
        includeAIAnalysis: true,
        extractFrames: true,
        detectObjects: true,
        extractText: true,
        ...options
      }
    )

    return NextResponse.json({
      success: true,
      data: analysis
    })

  } catch (error) {
    console.error('Video analysis failed:', error)
    return NextResponse.json(
      { 
        error: 'Video analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
