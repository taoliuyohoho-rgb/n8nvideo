import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { withTraceId } from '@/src/middleware/traceId'
import { createApiLogger } from '@/src/services/logger/Logger'

const prisma = new PrismaClient()

/**
 * 视频任务结果下载 API
 * 获取视频生成结果，支持直接下载或返回文件URL
 */
async function handler(request: NextRequest, traceId: string, context?: any) {
  const log = createApiLogger(traceId, 'video-jobs-result')

  try {
    const jobId = context?.params?.id

    if (!jobId) {
      log.warn('Missing jobId')
      return NextResponse.json(
        { success: false, error: '任务ID必填', traceId },
        { status: 400 }
      )
    }

    log.info('Getting video job result', { jobId })

    // 1. 获取视频任务信息
    const videoJob = await prisma.videoJob.findUnique({
      where: { id: jobId }
    })

    if (!videoJob) {
      log.warn('Video job not found', { jobId })
      return NextResponse.json(
        { success: false, error: '视频任务不存在', traceId },
        { status: 404 }
      )
    }

    // 2. 检查任务状态
    if (videoJob.status !== 'succeeded') {
      log.warn('Video job not completed', { jobId, status: videoJob.status })
      return NextResponse.json(
        { success: false, error: '视频任务未完成', traceId },
        { status: 400 }
      )
    }

    // 3. 检查是否有结果
    if (!videoJob.result) {
      log.warn('Video job has no result', { jobId })
      return NextResponse.json(
        { success: false, error: '视频任务无结果', traceId },
        { status: 404 }
      )
    }

    const result = videoJob.result as any

    // 4. 检查请求类型
    const acceptHeader = request.headers.get('Accept')
    const download = request.nextUrl.searchParams.get('download') === 'true'

    if (download || acceptHeader?.includes('video/mp4')) {
      // 直接返回视频文件
      try {
        const videoResponse = await fetch(result.fileUrl)
        if (!videoResponse.ok) {
          throw new Error('Failed to fetch video file')
        }

        const videoBuffer = await videoResponse.arrayBuffer()
        
        return new NextResponse(videoBuffer, {
          headers: {
            'Content-Type': 'video/mp4',
            'Content-Disposition': `attachment; filename="video_${jobId}.mp4"`,
            'Content-Length': videoBuffer.byteLength.toString()
          }
        })
      } catch (error) {
        log.error('Failed to fetch video file', { jobId, error })
        return NextResponse.json(
          { success: false, error: '视频文件获取失败', traceId },
          { status: 500 }
        )
      }
    } else {
      // 返回文件URL
      return NextResponse.json({
        success: true,
        fileUrl: result.fileUrl,
        thumbnailUrl: result.thumbnailUrl,
        provider: videoJob.provider,
        model: videoJob.model,
        cost: videoJob.cost,
        createdAt: videoJob.createdAt
      })
    }

  } catch (error) {
    log.error('Failed to get video job result', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取视频结果失败',
        traceId
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  return withTraceId((req: NextRequest, traceId: string) => handler(req, traceId, context))(request)
}