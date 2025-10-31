import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取历史记录
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') // video, product, etc.

    const where: Record<string, unknown> = {}
    if (type) {
      where.type = type
    }

    // 获取历史记录 - 使用Video模型
    const [history, total] = await Promise.all([
      prisma.video.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          template: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.video.count({ where })
    ])

    // 将后端数据映射为前端 HistoryItem 结构
    const mapStatus = (s: string): 'success' | 'error' | 'pending' => {
      const v = (s || '').toLowerCase()
      if (['generated', 'succeeded', 'success', 'completed', 'done'].includes(v)) return 'success'
      if (['failed', 'error'].includes(v)) return 'error'
      if (['queued', 'running', 'processing', 'pending'].includes(v)) return 'pending'
      return 'pending'
    }

    const formattedHistory = history.map(item => ({
      id: item.id,
      type: 'video' as const,
      action: item.videoTitle || `视频生成 - ${item.template?.name || '未知模板'}`,
      description: `使用模板：${item.template?.name || '未知模板'}`,
      timestamp: item.createdAt.toISOString(),
      user: item.user?.name || '未知用户',
      status: mapStatus(item.status)
    }))

    return NextResponse.json({
      success: true,
      data: formattedHistory,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('获取历史记录失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '获取历史记录失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
