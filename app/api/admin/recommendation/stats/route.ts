import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/recommendation/stats - 获取推荐系统统计数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenario = searchParams.get('scenario');
    const days = parseInt(searchParams.get('days') || '7');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 构建查询条件
    const where: any = {
      createdAt: {
        gte: startDate
      }
    };

    // 获取决策总数
    const totalDecisions = await prisma.recommendationDecision.count({ where });

    // 按场景分组统计
    const decisionsByScenario = await prisma.$queryRaw<Array<{ scenario: string; count: number }>>`
      SELECT 
        rcs."targetType" as scenario,
        COUNT(*) as count
      FROM reco_decisions rd
      JOIN reco_candidate_sets rcs ON rd."candidateSetId" = rcs.id
      WHERE rd."createdAt" >= ${startDate}
      GROUP BY rcs."targetType"
    `;

    // 获取反馈数据
    const totalFeedback = await prisma.recommendationOutcome.count({
      where: {
        decision: {
          createdAt: {
            gte: startDate
          }
        }
      }
    });

    // 平均质量分
    const avgQuality = await prisma.recommendationOutcome.aggregate({
      where: {
        decision: {
          createdAt: {
            gte: startDate
          }
        },
        qualityScore: {
          not: null
        }
      },
      _avg: {
        qualityScore: true
      }
    });

    // 平均延迟
    const avgLatency = await prisma.recommendationOutcome.aggregate({
      where: {
        decision: {
          createdAt: {
            gte: startDate
          }
        },
        latencyMs: {
          not: null
        }
      },
      _avg: {
        latencyMs: true
      }
    });

    // 平均成本
    const avgCost = await prisma.recommendationOutcome.aggregate({
      where: {
        decision: {
          createdAt: {
            gte: startDate
          }
        },
        costActual: {
          not: null
        }
      },
      _avg: {
        costActual: true
      }
    });

    // 最近的决策记录
    const recentDecisions = await prisma.recommendationDecision.findMany({
      where,
      include: {
        candidateSet: true,
        outcomes: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalDecisions: Number(totalDecisions),
          totalFeedback: Number(totalFeedback),
          feedbackRate: totalDecisions > 0 ? (Number(totalFeedback) / Number(totalDecisions) * 100).toFixed(2) : 0,
          avgQualityScore: Number(avgQuality._avg.qualityScore) || 0,
          avgLatencyMs: Number(avgLatency._avg.latencyMs) || 0,
          avgCostUSD: Number(avgCost._avg.costActual) || 0
        },
        byScenario: (decisionsByScenario || []).map(item => ({
          scenario: item.scenario,
          count: Number(item.count)
        })),
        recentDecisions: (recentDecisions || []).map(d => ({
          id: d.id,
          scenario: d.candidateSet?.targetType || 'unknown',
          chosenId: d.chosenTargetId,
          createdAt: d.createdAt.toISOString(),
          hasFeedback: !!d.outcomes,
          qualityScore: d.outcomes?.qualityScore || null
        }))
      }
    });
  } catch (error: any) {
    console.error('获取推荐统计失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

