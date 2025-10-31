import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTraceId } from '@/src/middleware/traceId'
import { createApiLogger } from '@/src/services/logger/Logger'


/**
 * 视频任务状态查询 API
 * 获取视频生成任务的状态和结果
 */
async function handler(request: NextRequest, traceId: string, context?: any) {
  const log = createApiLogger(traceId, 'video-jobs-status')

  try {
    const jobId = context?.params?.id

    if (!jobId) {
      log.warn('Missing jobId')
      return NextResponse.json(
        { success: false, error: '任务ID必填', traceId },
        { status: 400 }
      )
    }

    log.info('Getting video job status', { jobId })

    // 1. 获取视频任务信息
    const videoJob = await prisma.videoJob.findUnique({
      where: { id: jobId },
      include: {
        product: {
          select: {
            id: true,
            name: true
          }
        },
        script: {
          select: {
            id: true,
            angle: true,
            energy: true,
            durationSec: true
          }
        }
      }
    })

    if (!videoJob) {
      log.warn('Video job not found', { jobId })
      return NextResponse.json(
        { success: false, error: '视频任务不存在', traceId },
        { status: 404 }
      )
    }

    // 2. 构建响应数据
    const response = {
      success: true,
      job: {
        id: videoJob.id,
        status: videoJob.status,
        progress: videoJob.progress,
        errorCode: videoJob.errorCode,
        errorMessage: videoJob.errorMessage,
        provider: videoJob.provider,
        model: videoJob.model,
        params: videoJob.params,
        result: videoJob.result,
        cost: videoJob.cost,
        createdAt: videoJob.createdAt,
        updatedAt: videoJob.updatedAt,
        product: videoJob.product,
        script: videoJob.script
      }
    }

    log.info('Video job status retrieved', { 
      jobId,
      status: videoJob.status,
      progress: videoJob.progress
    })

    return NextResponse.json(response)

  } catch (error) {
    log.error('Failed to get video job status', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取任务状态失败',
        traceId
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  return withTraceId((req: NextRequest, traceId: string) => handler(req, traceId, context))(request)
}