import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/users/usage-stats
 * 获取组织内用户的使用情况统计
 * 
 * 功能：
 * - 统计每个用户的视频生成数、商品数等使用情况
 * - 支持按用户名筛选
 * - 管理员只能看到自己组织的数据，超管可以看到所有数据
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: 实际项目中应该从 session/token 获取当前用户
    // 这里从 localStorage 获取用户信息（前端会通过 header 传递）
    const userHeader = request.headers.get('x-user-info')
    let currentUser: { id: string; role: string; organizationId?: string | null } | null = null
    
    if (userHeader) {
      try {
        currentUser = JSON.parse(userHeader)
      } catch (e) {
        console.error('解析用户信息失败:', e)
      }
    }

    // 如果没有用户信息，返回错误
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      )
    }

    // 检查权限：只有 admin 和 super_admin 可以访问
    if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      )
    }

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const nameFilter = searchParams.get('name') || ''

    // 构建查询条件
    const whereCondition: {
      isActive: boolean
      organizationId?: string | null
      name?: { contains: string; mode: 'insensitive' }
    } = {
      isActive: true,
    }

    // 如果是普通管理员，只能查看自己组织的用户
    if (currentUser.role === 'admin' && currentUser.organizationId) {
      whereCondition.organizationId = currentUser.organizationId
    }

    // 添加名称筛选
    if (nameFilter) {
      whereCondition.name = {
        contains: nameFilter,
        mode: 'insensitive' as const,
      }
    }

    // 获取用户列表及其使用统计
    const users = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            videos: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // 获取每个用户的详细统计
    const usageStats = await Promise.all(
      users.map(async (user) => {
        // 获取用户创建的视频数（使用 Video 表）
        const videoCount = await prisma.video.count({
          where: { userId: user.id },
        })

        // 获取用户创建的视频任务数（使用 VideoJob 表）
        const videoJobCount = await prisma.videoJob.count({
          where: { createdBy: user.id },
        })

        // 获取用户创建的人设数
        const personaCount = await prisma.persona.count({
          where: { createdBy: user.id },
        })

        // 获取用户创建的脚本数
        const scriptCount = await prisma.script.count({
          where: { createdBy: user.id },
        })

        // 获取用户上传的商品数
        const productCount = await prisma.product.count({
          where: {
            sourceUserId: user.id,
            isUserGenerated: true,
          },
        })

        // 获取最近活跃时间（最近创建视频的时间）
        const lastVideo = await prisma.video.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        })

        const lastVideoJob = await prisma.videoJob.findFirst({
          where: { createdBy: user.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        })

        // 取两个时间中较新的一个
        const lastActivity = [lastVideo?.createdAt, lastVideoJob?.createdAt]
          .filter(Boolean)
          .sort((a, b) => {
            if (!a) return 1
            if (!b) return -1
            return new Date(b).getTime() - new Date(a).getTime()
          })[0]

        return {
          id: user.id,
          email: user.email,
          name: user.name || '未设置',
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization?.name || '未分配',
          videoCount: videoCount + videoJobCount, // 合并两个视频相关的统计
          personaCount,
          scriptCount,
          productCount,
          totalActions: videoCount + videoJobCount + personaCount + scriptCount + productCount,
          lastActivity: lastActivity ? lastActivity.toISOString() : null,
          createdAt: user.createdAt.toISOString(),
        }
      })
    )

    // 按总操作数排序
    usageStats.sort((a, b) => b.totalActions - a.totalActions)

    // 计算汇总统计
    const summary = {
      totalUsers: usageStats.length,
      totalVideos: usageStats.reduce((sum, user) => sum + user.videoCount, 0),
      totalPersonas: usageStats.reduce((sum, user) => sum + user.personaCount, 0),
      totalScripts: usageStats.reduce((sum, user) => sum + user.scriptCount, 0),
      totalProducts: usageStats.reduce((sum, user) => sum + user.productCount, 0),
      activeUsers: usageStats.filter(user => user.totalActions > 0).length,
    }

    return NextResponse.json({
      success: true,
      data: {
        users: usageStats,
        summary,
      },
    })
  } catch (error) {
    console.error('获取用户使用统计失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '获取用户使用统计失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

