/**
 * 获取决策统计
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // 总决策数
    const total = await prisma.estimationDecision.count();

    // 24小时内决策数
    const last24h = await prisma.estimationDecision.count({
      where: {
        createdAt: { gte: yesterday },
      },
    });

    // 探索决策数
    const exploreCount = await prisma.estimationDecision.count({
      where: {
        createdAt: { gte: yesterday },
        exploreFlags: { not: null },
      },
    });

    // 回退决策数（简化：检查weightsSnapshot中的fallbackUsed）
    const decisions = await prisma.estimationDecision.findMany({
      where: {
        createdAt: { gte: yesterday },
      },
      select: {
        weightsSnapshot: true,
      },
    });

    let fallbackCount = 0;
    for (const decision of decisions) {
      try {
        if (decision.weightsSnapshot) {
          const snapshot = JSON.parse(decision.weightsSnapshot);
          if (snapshot.fallbackUsed) {
            fallbackCount++;
          }
        }
      } catch (e) {
        // ignore parse errors
      }
    }

    return NextResponse.json({
      total,
      last24h,
      exploreCount,
      exploreRate: last24h > 0 ? exploreCount / last24h : 0,
      fallbackCount,
      fallbackRate: last24h > 0 ? fallbackCount / last24h : 0,
    });
  } catch (error) {
    console.error('Decision stats API error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'COMMON_INTERNAL',
          message: 'Failed to fetch decision stats',
          details: {},
        },
      },
      { status: 500 }
    );
  }
}














