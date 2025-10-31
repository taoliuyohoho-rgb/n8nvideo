/**
 * 预估模型 (Estimation Model) - 指标聚合
 * 段位指标统计与监控
 */

import { prisma } from '@/lib/prisma';
import type { SegmentMetrics } from './types';


/**
 * 记录决策反馈（用于后续聚合）
 * 实际入库由feedback API完成，这里提供查询聚合
 */

/**
 * 获取段位的最新指标（24h内）
 */
export async function getSegmentMetrics(segmentKey: string): Promise<SegmentMetrics | null> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // 从outcomes表聚合（简化版，生产环境应预聚合）
  const outcomes = await prisma.estimationOutcome.findMany({
    where: {
      decision: {
        segmentKey,
        createdAt: { gte: yesterday },
      },
    },
    include: {
      decision: true,
    },
  });

  if (outcomes.length === 0) return null;

  let totalQuality = 0;
  let totalEditDistance = 0;
  let totalLatency = 0;
  let totalCost = 0;
  let rejectedCount = 0;
  let validCount = 0;

  for (const outcome of outcomes) {
    if (outcome.qualityScore !== null) {
      totalQuality += outcome.qualityScore;
      validCount++;
    }
    if (outcome.editDistance !== null) {
      totalEditDistance += outcome.editDistance;
    }
    if (outcome.latencyMs !== null) {
      totalLatency += outcome.latencyMs;
    }
    if (outcome.costActual !== null) {
      totalCost += outcome.costActual;
    }
    if (outcome.rejected) {
      rejectedCount++;
    }
  }

  const count = outcomes.length;

  return {
    segmentKey,
    qualityScore: validCount > 0 ? totalQuality / validCount : undefined,
    editRate: validCount > 0 ? totalEditDistance / validCount : undefined,
    rejectionRate: rejectedCount / count,
    avgCost: totalCost / count,
    avgLatency: totalLatency / count,
    sampleCount: count,
  };
}

/**
 * 获取模型在特定段位的指标
 */
export async function getModelSegmentMetrics(
  modelId: string,
  segmentKey: string
): Promise<SegmentMetrics | null> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const outcomes = await prisma.estimationOutcome.findMany({
    where: {
      decision: {
        chosenModelId: modelId,
        segmentKey,
        createdAt: { gte: yesterday },
      },
    },
    include: {
      decision: true,
    },
  });

  if (outcomes.length === 0) return null;

  let totalQuality = 0;
  let totalEditDistance = 0;
  let totalLatency = 0;
  let totalCost = 0;
  let rejectedCount = 0;
  let validCount = 0;

  for (const outcome of outcomes) {
    if (outcome.qualityScore !== null) {
      totalQuality += outcome.qualityScore;
      validCount++;
    }
    if (outcome.editDistance !== null) {
      totalEditDistance += outcome.editDistance;
    }
    if (outcome.latencyMs !== null) {
      totalLatency += outcome.latencyMs;
    }
    if (outcome.costActual !== null) {
      totalCost += outcome.costActual;
    }
    if (outcome.rejected) {
      rejectedCount++;
    }
  }

  const count = outcomes.length;

  return {
    segmentKey,
    qualityScore: validCount > 0 ? totalQuality / validCount : undefined,
    editRate: validCount > 0 ? totalEditDistance / validCount : undefined,
    rejectionRate: rejectedCount / count,
    avgCost: totalCost / count,
    avgLatency: totalLatency / count,
    sampleCount: count,
  };
}

/**
 * 获取探索占比（24h内）
 */
export async function getExploreShare(segmentKey?: string): Promise<number> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const where: any = {
    createdAt: { gte: yesterday },
  };

  if (segmentKey) {
    where.segmentKey = segmentKey;
  }

  const total = await prisma.estimationDecision.count({ where });

  if (total === 0) return 0;

  const explored = await prisma.estimationDecision.count({
    where: {
      ...where,
      exploreFlags: { not: null },
    },
  });

  return explored / total;
}

/**
 * 获取回退率（24h内）
 */
export async function getFallbackRate(segmentKey?: string): Promise<number> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const where: any = {
    createdAt: { gte: yesterday },
  };

  if (segmentKey) {
    where.segmentKey = segmentKey;
  }

  const total = await prisma.estimationDecision.count({ where });

  if (total === 0) return 0;

  // 简化：检查exploreFlags中是否含fallback标记（需在rank时写入）
  // 这里暂时返回0，实际需在decision中加字段或从events统计
  return 0;
}

/**
 * 按段位聚合所有指标（看板用）
 */
export async function aggregateBySegment(days: number = 1): Promise<SegmentMetrics[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const decisions = await prisma.estimationDecision.findMany({
    where: {
      createdAt: { gte: since },
      segmentKey: { not: null },
    },
    include: {
      outcomes: true,
    },
  });

  const segmentMap = new Map<string, {
    qualitySum: number;
    editSum: number;
    latencySum: number;
    costSum: number;
    rejectedCount: number;
    totalCount: number;
    validCount: number;
  }>();

  for (const decision of decisions) {
    const key = decision.segmentKey || 'default';
    
    if (!segmentMap.has(key)) {
      segmentMap.set(key, {
        qualitySum: 0,
        editSum: 0,
        latencySum: 0,
        costSum: 0,
        rejectedCount: 0,
        totalCount: 0,
        validCount: 0,
      });
    }

    const seg = segmentMap.get(key)!;
    seg.totalCount++;

    if (decision.outcomes) {
      const outcome = decision.outcomes;
      if (outcome.qualityScore !== null) {
        seg.qualitySum += outcome.qualityScore;
        seg.validCount++;
      }
      if (outcome.editDistance !== null) {
        seg.editSum += outcome.editDistance;
      }
      if (outcome.latencyMs !== null) {
        seg.latencySum += outcome.latencyMs;
      }
      if (outcome.costActual !== null) {
        seg.costSum += outcome.costActual;
      }
      if (outcome.rejected) {
        seg.rejectedCount++;
      }
    }
  }

  const result: SegmentMetrics[] = [];

  segmentMap.forEach((data, key) => {
    result.push({
      segmentKey: key,
      qualityScore: data.validCount > 0 ? data.qualitySum / data.validCount : undefined,
      editRate: data.validCount > 0 ? data.editSum / data.validCount : undefined,
      rejectionRate: data.totalCount > 0 ? data.rejectedCount / data.totalCount : 0,
      avgCost: data.totalCount > 0 ? data.costSum / data.totalCount : 0,
      avgLatency: data.totalCount > 0 ? data.latencySum / data.totalCount : 0,
      sampleCount: data.totalCount,
    });
  })

  return result;
}














