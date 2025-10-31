/**
 * 预估模型 (Estimation Model) - 探索策略
 * 在Top-2/3内做小流量探索（ε-greedy）
 */

import type { ModelRecord, ExploreConfig } from './types';
import { DEFAULT_EXPLORE_CONFIG, EXPLORE_EPSILON_MIN, EXPLORE_EPSILON_MAX } from './constants';

/**
 * ε-greedy 探索：在Top-K内按概率选择非Top-1
 */
export function epsilonGreedyExplore(
  rankedModels: Array<{ model: ModelRecord; fineScore: number }>,
  config: ExploreConfig = DEFAULT_EXPLORE_CONFIG
): { chosen: { model: ModelRecord; fineScore: number }; explore: boolean } {
  if (rankedModels.length === 0) {
    throw new Error('No models to explore');
  }

  const epsilon = Math.max(EXPLORE_EPSILON_MIN, Math.min(config.epsilon, EXPLORE_EPSILON_MAX));

  // ε概率探索
  if (Math.random() < epsilon && rankedModels.length > 1) {
    // 从Top-2/3随机选一个（不包括Top-1）
    const exploreRange = Math.min(rankedModels.length, 3);
    const exploreIndex = 1 + Math.floor(Math.random() * (exploreRange - 1));
    return {
      chosen: rankedModels[exploreIndex],
      explore: true,
    };
  }

  // (1-ε)概率选Top-1
  return {
    chosen: rankedModels[0],
    explore: false,
  };
}

/**
 * 检查是否应强制关闭探索（质量/预算保护）
 */
export function shouldForceOffExplore(
  segmentMetrics?: { qualityScore?: number; rejectionRate?: number },
  config: ExploreConfig = DEFAULT_EXPLORE_CONFIG
): boolean {
  // 质量门槛
  if (config.minQualityFloor && segmentMetrics?.qualityScore !== undefined) {
    if (segmentMetrics.qualityScore < config.minQualityFloor) {
      return true;
    }
  }

  // 拒稿率过高
  if (segmentMetrics?.rejectionRate !== undefined && segmentMetrics.rejectionRate > 0.20) {
    return true;
  }

  // 预算保护（需要全局预算统计，这里简化跳过）
  // if (config.budgetCap && currentDailyCost > config.budgetCap) return true;

  return false;
}

/**
 * 自适应调整epsilon（质量好→降低探索，质量差→增加探索）
 */
export function adaptEpsilon(
  currentEpsilon: number,
  segmentMetrics?: { qualityScore?: number; editRate?: number }
): number {
  let newEpsilon = currentEpsilon;

  if (segmentMetrics?.qualityScore !== undefined) {
    // 质量高（>0.8）→降低epsilon
    if (segmentMetrics.qualityScore > 0.8) {
      newEpsilon = Math.max(EXPLORE_EPSILON_MIN, newEpsilon * 0.9);
    }
    // 质量低（<0.6）→增加epsilon
    else if (segmentMetrics.qualityScore < 0.6) {
      newEpsilon = Math.min(EXPLORE_EPSILON_MAX, newEpsilon * 1.1);
    }
  }

  return newEpsilon;
}














