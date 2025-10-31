import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { ScrapingService } from '@/src/services/scraping/ScrapingService'
import { withTraceId } from '@/src/middleware/traceId'

const scrapingService = new ScrapingService()

/**
 * 创建批量抓取任务
 */
export const POST = withTraceId(async (request: NextRequest, traceId: string) => {
  try {
    const body = await request.json()
    const { urls, productIds, options = {} } = body

    // 验证输入
    if (!urls && !productIds) {
      return NextResponse.json(
        { 
          success: false, 
          error: '必须提供 urls 或 productIds',
          traceId 
        },
        { status: 400 }
      )
    }

    if (urls && !Array.isArray(urls)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'urls 必须是数组',
          traceId 
        },
        { status: 400 }
      )
    }

    if (productIds && !Array.isArray(productIds)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'productIds 必须是数组',
          traceId 
        },
        { status: 400 }
      )
    }

    // 创建批量任务
    const result = await scrapingService.createBatch(urls, productIds, options)

    return NextResponse.json({
      success: true,
      data: result,
      traceId
    })

  } catch (error: any) {
    console.error('创建批量抓取任务失败:', error)
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

/**
 * 获取批量任务状态
 */
export const GET = withTraceId(async (request: NextRequest, traceId: string, { params }: { params: { batchId: string } }) => {
  try {
    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get('batchId')

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