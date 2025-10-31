import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // 返回模拟的真实统计数据
    const stats = {
      dashboard: {
        totalVideos: 6,
        totalProducts: 15,
        usageDays: 1,
        efficiency: 100,
        efficiencyNote: '制作效率 = 成功生成视频数 / 总生成视频数 × 100%'
      },
      users: {
        activeUsers: 1,
        totalUsers: 1,
        adminCount: 1,
        operatorCount: 0,
        viewerCount: 0,
        newUsers: 1
      },
      videos: {
        totalVideos: 6,
        monthlyVideos: 6,
        successRate: 100,
        avgDuration: '25秒'
      },
      products: {
        totalProducts: 15,
        categories: [
          { category: '3C', _count: { category: 6 } },
          { category: '美妆', _count: { category: 9 } }
        ]
      },
      recentActivity: [
        {
          id: 'video-1',
          title: '电磁炉推广视频1',
          user: '管理员',
          product: '电磁炉',
          createdAt: new Date().toISOString()
        },
        {
          id: 'video-2',
          title: '手持风扇推广视频1',
          user: '管理员',
          product: '手持风扇',
          createdAt: new Date().toISOString()
        }
      ]
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('获取统计数据失败:', error)
    return NextResponse.json(
      { success: false, error: '获取统计数据失败' },
      { status: 500 }
    )
  }
}
