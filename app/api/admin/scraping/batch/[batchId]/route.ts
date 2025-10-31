import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { ScrapingService } from '@/src/services/scraping/ScrapingService'
import { withTraceId } from '@/src/middleware/traceId'

const scrapingService = new ScrapingService()

/**
 * 获取批量任务状态
 */
export const GET = withTraceId(async (request: NextRequest, traceId: string, { params }: { params: { batchId: string } }) => {
  try {
    const { batchId } = params

    if (!batchId) {
      return NextResponse.json(
        { 
          success: false, 
          error: '缺少 batchId 参数',
          traceId 
        },
        { status: 400 }
      )
    }

    // 获取任务状态
    const status = await scrapingService.getBatchStatus(batchId)

    return NextResponse.json({
      success: true,
      data: status,
      traceId
    })

  } catch (error: any) {
    console.error('获取批量任务状态失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || '服务器错误',
        traceId 
      },
      { status: 500 }
    )
  }
})
