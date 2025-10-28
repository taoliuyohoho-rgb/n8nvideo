/**
 * 预估模型 (Estimation Model) - 精排
 * 基于段位指标与更丰富特征的精细排序
 */

import { PrismaClient } from '@prisma/client';
import { ModelRecord, TaskInput, ContextInput, SegmentMetrics, ScoringWeights } from './types';
import { DEFAULT_FINE_WEIGHTS, buildSegmentKey } from './constants';

const prisma = new PrismaClient();

/**
 * 获取段位指标（24小时内）
 */
async function getSegmentMetrics(
  modelId: string,
  segmentKey: string
): Promise<SegmentMetrics | null> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const metrics = await prisma.entityMetricsDaily.findFirst({
    where: {
      entityIndexId: modelId, // 注意：这里需要模型作为entity
      segmentKey,
      date: { gte: yesterday },
    },
    orderBy: { date: 'desc' },
  });

  if (!metrics) return null;

  return {
    segmentKey,
    qualityScore: metrics.qualityScore ?? undefined,
    editRate: metrics.editRate ?? undefined,
    rejectionRate: metrics.rejectionRate ?? undefined,
    avgCost: metrics.cost ?? undefined,
    avgLatency: metrics.latency ?? undefined,
    sampleCount: metrics.sampleCount,
  };
}

/**
 * 计算精排特征向量
 */
function computeFineFeatureVector(
  model: ModelRecord,
  task: TaskInput,
  coarseFeatures: Record<string, number>,
  segmentMetrics?: SegmentMetrics
): Record<string, number> {
  const features = { ...coarseFeatures };

  // 1. 段位质量得分
  if (segmentMetrics?.qualityScore !== undefined) {
    features.segmentQuality = segmentMetrics.qualityScore;
  } else {
    features.segmentQuality = 0.7; // 默认
  }

  // 2. 段位延迟（归一化：faster is better）
  if (segmentMetrics?.avgLatency !== undefined) {
    const latencyRange = { min: 1000, max: 10000 }; // ms
    features.segmentLatency = 1 - normalize(segmentMetrics.avgLatency, latencyRange.min, latencyRange.max);
  } else {
    features.segmentLatency = 0.5;
  }

  // 3. 段位成本（归一化：cheaper is better）
  if (segmentMetrics?.avgCost !== undefined) {
    const costRange = { min: 0.001, max: 0.5 };
    features.segmentCost = 1 - normalize(segmentMetrics.avgCost, costRange.min, costRange.max);
  } else {
    features.segmentCost = 0.5;
  }

  // 4. 稳定性（从dynamicMetrics取）
  if (model.dynamicMetrics?.stabilityScore) {
    features.recentStability = model.dynamicMetrics.stabilityScore as number;
  } else {
    features.recentStability = 0.8; // 默认
  }

  return features;
}

function normalize(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function linearScore(features: Record<string, number>, weights: ScoringWeights): number {
  let score = 0;
  for (const key of Object.keys(weights)) {
    const w = weights[key] ?? 0;
    const v = features[key] ?? 0;
    score += w * v;
  }
  
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  return totalWeight > 0 ? score / totalWeight : 0;
}

/**
 * 精排：在粗排结果基础上，加入段位指标重排
 */
export async function fineRank(
  coarseResults: Array<{ model: ModelRecord; score: number; features: Record<string, number> }>,
  task: TaskInput,
  context?: ContextInput,
  weights: ScoringWeights = DEFAULT_FINE_WEIGHTS
): Promise<Array<{ model: ModelRecord; coarseScore: number; fineScore: number; features: Record<string, number> }>> {
  const segmentKey = buildSegmentKey(task.category, context?.region, context?.channel);

  const fineScoredPromises = coarseResults.map(async ({ model, score: coarseScore, features: coarseFeatures }) => {
    // 获取段位指标（暂时用模型ID，实际需entity_index映射）
    const segmentMetrics = await getSegmentMetrics(model.id, segmentKey);
    
    const fineFeatures = computeFineFeatureVector(model, task, coarseFeatures, segmentMetrics);
    const fineScore = linearScore(fineFeatures, weights);

    return {
      model,
      coarseScore,
      fineScore,
      features: fineFeatures,
    };
  });

  const fineScored = await Promise.all(fineScoredPromises);

  // 按精排分数降序
  fineScored.sort((a, b) => b.fineScore - a.fineScore);

  return fineScored;
}














