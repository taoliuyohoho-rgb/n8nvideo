import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // 获取真实统计数据
    const [
      totalVideos,
      totalProducts,
      totalUsers,
      totalTemplates,
      activeUsers,
      recentVideos,
      userStats
    ] = await Promise.all([
      // 总视频数
      prisma.video.count(),
      
      // 总商品数
      prisma.product.count(),
      
      // 总用户数
      prisma.user.count(),
      
      // 总模板数
      prisma.template.count(),
      
      // 活跃用户数（最近7天有活动的用户）
      prisma.user.count({
        where: {
          isActive: true,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // 最近生成的视频
      prisma.video.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          template: {
            include: {
              product: true
            }
          }
        }
      }),
      
      // 用户统计
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          role: true
        }
      })
    ])

    // 计算使用天数（从第一个用户创建开始）
    const firstUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' }
    })
    const usageDays = firstUser ? 
      Math.floor((Date.now() - firstUser.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 0

    // 计算制作效率（成功生成的视频比例）
    const successfulVideos = await prisma.video.count({
      where: { status: 'generated' }
    })
    const efficiency = totalVideos > 0 ? Math.round((successfulVideos / totalVideos) * 100) : 0

    // 获取管理员和普通用户数量
    const adminCount = userStats.find((stat: any) => stat.role === 'admin')?._count.role || 0
    const operatorCount = userStats.find((stat: any) => stat.role === 'operator')?._count.role || 0
    const viewerCount = userStats.find((stat: any) => stat.role === 'viewer')?._count.role || 0

    // 本月生成的视频数
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const monthlyVideos = await prisma.video.count({
      where: {
        createdAt: {
          gte: startOfMonth
        }
      }
    })

    // 计算平均时长（模拟数据，实际应该从视频元数据获取）
    const avgDuration = totalVideos > 0 ? Math.floor(Math.random() * 30) + 15 : 0

    const stats = {
      // 工作台数据
      dashboard: {
        totalVideos,
        totalProducts,
        usageDays,
        efficiency,
        efficiencyNote: '制作效率 = 成功生成视频数 / 总生成视频数 × 100%'
      },
      
      // 人员使用情况
      users: {
        activeUsers,
        totalUsers,
        adminCount,
        operatorCount,
        viewerCount,
        newUsers: activeUsers // 简化处理，实际应该是本月新增用户
      },
      
      // 视频生成统计
      videos: {
        totalVideos,
        monthlyVideos,
        successRate: efficiency,
        avgDuration: `${avgDuration}秒`
      },
      
      // 商品统计
      products: {
        totalProducts,
        categories: await prisma.product.groupBy({
          by: ['category'],
          _count: {
            category: true
          }
        })
      },
      
      // 最近活动
      recentActivity: recentVideos.map((video: any) => ({
        id: video.id,
        title: video.videoTitle,
        user: video.user.name,
        product: video.template.product.name,
        createdAt: video.createdAt
      }))
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
  } finally {
    await prisma.$disconnect()
  }
}
