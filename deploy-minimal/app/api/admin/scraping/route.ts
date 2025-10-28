import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PainPointService } from '@/src/services/painpoint/PainPointService'

const prisma = new PrismaClient()
const painPointService = new PainPointService()

// 创建评论爬取任务并合并痛点到商品
export async function POST(request: NextRequest) {
  try {
    const {
      productId,
      platform,
      keywords,
      maxComments = 100,
      dateRange,
      filters
    } = await request.json()

    // 验证必填字段
    if (!productId || !platform) {
      return NextResponse.json(
        { success: false, error: '产品ID和平台是必填项' },
        { status: 400 }
      )
    }

    // 检查产品是否存在
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: '产品不存在' },
        { status: 404 }
      )
    }

    // 创建爬取任务
    const task = await prisma.commentScrapingTask.create({
      data: {
        productId,
        platform,
        keywords,
        maxComments,
        dateRange,
        filters: filters ? JSON.stringify(filters) : null,
        status: 'running',
        startedAt: new Date()
      }
    })

    // 异步执行爬取和痛点分析
    processScrapingTask(task.id, productId, platform, keywords || product.name, maxComments)
      .then(() => console.log(`痛点分析任务完成: ${task.id}`))
      .catch(error => console.error(`痛点分析任务失败: ${task.id}`, error))

    return NextResponse.json({
      success: true,
      data: {
        taskId: task.id,
        productId,
        platform,
        status: 'running'
      },
      message: '痛点分析任务已启动，完成后会自动更新到商品信息中'
    })
  } catch (error) {
    console.error('创建爬取任务失败:', error)
    return NextResponse.json(
      { success: false, error: '创建爬取任务失败' },
      { status: 500 }
    )
  }
}

// 异步处理爬取任务
async function processScrapingTask(
  taskId: string,
  productId: string,
  platform: string,
  keywords: string,
  maxComments: number
) {
  try {
    // 模拟爬取评论（实际项目中这里会调用真实的爬虫服务）
    await new Promise(resolve => setTimeout(resolve, 3000)) // 模拟爬取延迟
    
    const mockComments = generateMockComments(keywords, maxComments)
    
    // 从评论中提取痛点
    const extractedPainPoints = painPointService.extractPainPointsFromComments(mockComments)
    
    // 合并痛点到商品（自动去重和AI优化）
    const finalPainPoints = await painPointService.mergePainPoints(
      productId,
      extractedPainPoints,
      platform
    )
    
    // 更新任务状态
    await prisma.commentScrapingTask.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        progress: 100,
        scraped: mockComments.length,
        totalFound: mockComments.length,
        completedAt: new Date()
      }
    })
    
    // 创建详细分析记录（可选，用于历史追溯）
    await prisma.productPainPoint.create({
      data: {
        productId,
        platform,
        productName: keywords,
        painPoints: JSON.stringify(extractedPainPoints),
        severity: 'medium',
        frequency: extractedPainPoints.length,
        sentiment: 'negative',
        aiAnalysis: JSON.stringify({
          summary: `分析了${mockComments.length}条评论，提取了${extractedPainPoints.length}个痛点，最终筛选出${finalPainPoints.length}个核心痛点`,
          date: new Date().toISOString()
        })
      }
    })
    
    console.log(`✅ 痛点分析完成: 产品 ${productId}, 平台 ${platform}, 合并后痛点数 ${finalPainPoints.length}`)
  } catch (error) {
    console.error('处理爬取任务失败:', error)
    // 更新任务状态为失败
    await prisma.commentScrapingTask.update({
      where: { id: taskId },
      data: {
        status: 'failed',
        errorLog: error instanceof Error ? error.message : '未知错误',
        completedAt: new Date()
      }
    })
  }
}

// 生成模拟评论数据
function generateMockComments(keywords: string, count: number): string[] {
  const negativePhrases = [
    '电池续航太短了',
    '音质不够清晰',
    '连接经常断开',
    '充电速度很慢',
    '做工感觉不太好',
    '价格偏贵',
    '操作不够简单',
    '说明书看不懂',
    '客服响应慢',
    '包装有损坏',
    '功能不如描述的多',
    '噪音有点大',
    '材质感觉廉价',
    '按钮不灵敏',
    '屏幕容易刮花',
    '重量太重了',
    '尺寸有点大',
    '颜色和图片不一样',
    '气味有点刺鼻',
    '发货太慢了'
  ]
  
  const positivePhrases = [
    '整体还不错',
    '性价比可以',
    '外观挺好看的',
    '功能基本够用',
    '卖家服务态度好'
  ]
  
  const comments: string[] = []
  
  for (let i = 0; i < count; i++) {
    const isNegative = Math.random() > 0.3 // 70%负面评论
    const phrases = isNegative ? negativePhrases : positivePhrases
    const phrase = phrases[Math.floor(Math.random() * phrases.length)]
    
    comments.push(`${keywords} ${phrase}，${isNegative ? '有待改进' : '推荐购买'}。`)
  }
  
  return comments
}

// 获取爬取任务列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const platform = searchParams.get('platform')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {}
    if (productId) where.productId = productId
    if (platform) where.platform = platform
    if (status) where.status = status

    const [tasks, total] = await Promise.all([
      prisma.commentScrapingTask.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.commentScrapingTask.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取爬取任务失败:', error)
    return NextResponse.json(
      { success: false, error: '获取爬取任务失败' },
      { status: 500 }
    )
  }
}
