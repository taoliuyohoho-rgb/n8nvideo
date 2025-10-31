// Recommendation constants and segment templates

import type { RecommendationScenario } from './types';

export const DEFAULT_M_COARSE = 10;
export const DEFAULT_K_FINE = 5;  // 精排Top K，用于人设/脚本推荐
export const DEFAULT_EPSILON = 0.10; // keep >= 0.05
export const MIN_EPSILON = 0.05;

export const QUALITY_FLOOR_REJECT = 0.20;
export const QUALITY_FLOOR_STRUCT = 0.90;
export const COST_OVERRUN_MULTIPLIER = 1.50;
export const LATENCY_SOFT_MS = 6000;
export const LATENCY_HARD_MS = 8000;

export const SCENARIO_SEGMENT_TEMPLATES: Record<RecommendationScenario, string> = {
  'product->persona': 'category|subcategory|region|channel',
  'product->script': 'category|subcategory|region|channel|tone',
  'product->content-elements': 'category|region|channel|elementType',
  'task->model': 'taskType|contentType|language|jsonRequirement|budgetTier',
  'task->prompt': 'taskType|domain|format|language',
  'video-script': 'taskType|contentType|language|jsonRequirement',
};

export function buildSegmentKey(template: string, vars: Record<string, unknown>): string {
  const parts = template.split('|').map((k) => String(vars[k] ?? 'default'));
  return parts.join('|');
}
