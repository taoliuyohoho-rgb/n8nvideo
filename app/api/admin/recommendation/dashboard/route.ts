import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


/**
 * 推荐质量看板API
 * 按类目/模型/Prompt维度聚合展示：
 * - 曝光数
 * - 执行数
 * - 改选率（select事件比例）
 * - 平均耗时
 * - 隐式正反馈比例
 * - 平均新增内容数
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scenario = searchParams.get('scenario') || 'task->model'
    const days = parseInt(searchParams.get('days') || '7')
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // 1. 获取决策列表
    const decisions = await prisma.recommendationDecision.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      include: {
        candidateSet: true,
        events: true,
        outcomes: true
      },
      orderBy: { createdAt: 'desc' },
      take: 1000 // 限制最多1000条
    })

    // 2. 聚合统计
    const stats: Record<string, any> = {}
    
    for (const decision of decisions) {
      const key = `${decision.chosenTargetType}:${decision.chosenTargetId}`
      
      if (!stats[key]) {
        stats[key] = {
          targetType: decision.chosenTargetType,
          targetId: decision.chosenTargetId,
          exposeCount: 0,
          executeCount: 0,
          selectCount: 0,
          implicitPositive: 0,
          implicitNegative: 0,
          totalLatency: 0,
          latencyCount: 0,
          totalAdded: 0,
          addedCount: 0,
          exploreCount: 0
        }
      }
      
      const stat = stats[key]
      
      // 统计事件
      for (const event of decision.events) {
        if (event.eventType === 'expose') stat.exposeCount++
        if (event.eventType === 'execute') stat.executeCount++
        if (event.eventType === 'select') stat.selectCount++
        if (event.eventType === 'implicit_positive') stat.implicitPositive++
        if (event.eventType === 'implicit_negative') stat.implicitNegative++
      }
      
      // 统计Outcome
      if (decision.outcomes) {
        const outcome = decision.outcomes
        if (outcome.latencyMs) {
          stat.totalLatency += outcome.latencyMs
          stat.latencyCount++
        }
      }
      
      // 统计探索
      if (decision.exploreFlags) {
        try {
          const flags = JSON.parse(decision.exploreFlags)
          if (flags.explored) stat.exploreCount++
        } catch {}
      }
    }

    // 3. 计算派生指标
    const results = Object.values(stats).map((stat: any) => ({
      ...stat,
      selectRate: stat.exposeCount > 0 ? (stat.selectCount / stat.exposeCount) : 0,
      executeRate: stat.exposeCount > 0 ? (stat.executeCount / stat.exposeCount) : 0,
      avgLatency: stat.latencyCount > 0 ? (stat.totalLatency / stat.latencyCount) : 0,
      implicitScore: (stat.implicitPositive - stat.implicitNegative) / Math.max(1, stat.executeCount),
      exploreRate: stat.executeCount > 0 ? (stat.exploreCount / stat.executeCount) : 0
    }))

    // 4. 排序：按执行数降序
    results.sort((a, b) => b.executeCount - a.executeCount)

    // 5. 汇总统计
    const summary = {
      totalDecisions: decisions.length,
      totalExposes: results.reduce((sum, r) => sum + r.exposeCount, 0),
      totalExecutes: results.reduce((sum, r) => sum + r.executeCount, 0),
      totalSelects: results.reduce((sum, r) => sum + r.selectCount, 0),
      avgSelectRate: results.length > 0 
        ? results.reduce((sum, r) => sum + r.selectRate, 0) / results.length 
        : 0,
      avgLatency: results.filter(r => r.latencyCount > 0).length > 0
        ? results.filter(r => r.latencyCount > 0).reduce((sum, r) => sum + r.avgLatency, 0) / results.filter(r => r.latencyCount > 0).length
        : 0,
      positiveRate: results.reduce((sum, r) => sum + r.implicitPositive, 0) / Math.max(1, results.reduce((sum, r) => sum + r.executeCount, 0)),
      negativeRate: results.reduce((sum, r) => sum + r.implicitNegative, 0) / Math.max(1, results.reduce((sum, r) => sum + r.executeCount, 0))
    }

    return NextResponse.json({
      success: true,
      data: {
        summary,
        items: results.slice(0, 50), // 返回Top50
        timeRange: {
          start: startDate.toISOString(),
          end: new Date().toISOString(),
          days
        }
      }
    })
  } catch (error) {
    console.error('获取推荐看板数据失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取失败'
      },
      { status: 500 }
    )
  }
}

