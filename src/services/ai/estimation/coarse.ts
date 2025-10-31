/**
 * 预估模型 (Estimation Model) - 粗排
 * 轻量打分，保留Top-M候选
 */

import type { ModelRecord, TaskInput, FeatureSnapshot, ScoringWeights } from './types';
import { DEFAULT_COARSE_WEIGHTS } from './constants';

/**
 * 归一化函数
 */
function normalize(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * 计算特征向量
 */
function computeFeatureVector(
  model: ModelRecord,
  task: TaskInput,
  taskFeatures?: FeatureSnapshot
): Record<string, number> {
  const features: Record<string, number> = {};

  // 1. 语言匹配（完全匹配=1，部分支持=0.5，不支持=0）
  features.langMatch = model.langs.includes(task.lang) ? 1.0 : 0.0;

  // 2. 类目匹配（需要taskFeatures）
  if (taskFeatures?.category && task.category) {
    features.categoryMatch = taskFeatures.category === task.category ? 1.0 : 0.5;
  } else {
    features.categoryMatch = 0.5;
  }

  // 3. 风格匹配（简化：检查styleTags）
  if (task.styleTags && task.styleTags.length > 0 && model.staticCapability?.strengthTags) {
    const modelTags = model.staticCapability.strengthTags as string[];
    const overlap = task.styleTags.filter(t => modelTags.includes(t)).length;
    features.styleMatch = overlap / task.styleTags.length;
  } else {
    features.styleMatch = 0.5;
  }

  // 4. 窗口适配（context足够大=1）
  const estimatedTokens = 2000; // 简化估算
  features.windowFit = model.maxContext >= estimatedTokens ? 1.0 : 0.5;

  // 5. JSON支持
  features.jsonSupport = model.jsonModeSupport ? 1.0 : 0.0;

  // 6. 价格层级（归一化：cheaper is better）
  const priceRange = { min: 0.001, max: 0.1 }; // $/1k tokens
  features.priceTier = 1 - normalize(model.pricePer1kTokens, priceRange.min, priceRange.max);

  // 7. 历史质量（从dynamicMetrics取）
  if (model.dynamicMetrics?.qualityScore) {
    features.historicalQuality = model.dynamicMetrics.qualityScore as number;
  } else {
    features.historicalQuality = 0.7; // 默认中等
  }

  return features;
}

/**
 * 线性评分
 */
function linearScore(features: Record<string, number>, weights: ScoringWeights): number {
  let score = 0;
  for (const key of Object.keys(weights)) {
    const w = weights[key] ?? 0;
    const v = features[key] ?? 0;
    score += w * v;
  }
  
  // 归一化到0-1（假设权重和约为5）
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  return totalWeight > 0 ? score / totalWeight : 0;
}

/**
 * 粗排：对候选模型打分并排序
 */
export function coarseRank(
  models: ModelRecord[],
  task: TaskInput,
  taskFeatures?: FeatureSnapshot,
  weights: ScoringWeights = DEFAULT_COARSE_WEIGHTS,
  topK: number = 8
): Array<{ model: ModelRecord; score: number; features: Record<string, number> }> {
  const scored = models.map(model => {
    const features = computeFeatureVector(model, task, taskFeatures);
    const score = linearScore(features, weights);
    return { model, score, features };
  });

  // 按分数降序排序
  scored.sort((a, b) => b.score - a.score);

  // 返回Top-K
  return scored.slice(0, topK);
}














