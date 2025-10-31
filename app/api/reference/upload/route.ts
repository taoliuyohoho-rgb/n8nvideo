import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { ReferenceVideoService } from '@/src/services/reference/ReferenceVideoService'

const referenceService = new ReferenceVideoService({
  supportedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  maxFileSize: 500, // 500MB
  storage: {
    type: 'local'
  },
  processing: {
    generateThumbnails: true,
    extractAudio: true,
    analyzeContent: true
  }
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const videoUrl = formData.get('url') as string
    const name = formData.get('name') as string
    const category = formData.get('category') as string
    const tags = JSON.parse(formData.get('tags') as string || '[]')
    const description = formData.get('description') as string
    const uploadedBy = formData.get('uploadedBy') as string || 'anonymous'

    if (!videoFile && !videoUrl) {
      return NextResponse.json(
        { error: 'Video file or URL is required' },
        { status: 400 }
      )
    }

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      )
    }

    const metadata = {
      name,
      category,
      tags,
      description
    }

    let result

    if (videoFile) {
      // 上传文件
      result = await referenceService.uploadReferenceVideo(
        videoFile,
        metadata,
        uploadedBy
      )
    } else if (videoUrl) {
      // 添加URL
      result = await referenceService.addUrlReferenceVideo(
        videoUrl,
        metadata,
        uploadedBy
      )
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Reference video upload failed:', error)
    return NextResponse.json(
      { 
        error: 'Reference video upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const tags = searchParams.get('tags')?.split(',')
    const uploadedBy = searchParams.get('uploadedBy')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const filters = {
      category: category || undefined,
      tags,
      uploadedBy: uploadedBy || undefined,
      limit,
      offset
    }

    const videos = await referenceService.getReferenceVideos(filters)

    return NextResponse.json({
      success: true,
      data: videos
    })

  } catch (error) {
    console.error('Failed to get reference videos:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get reference videos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
