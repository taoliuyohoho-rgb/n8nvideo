/**
 * 预估模型 (Estimation Model) - 常量配置
 */

import { ExploreConfig, ScoringWeights } from './types';

// ========== 默认值 ==========

export const DEFAULT_TOP_K = 5;
export const DEFAULT_MAX_LATENCY_MS = 6000;
export const DEFAULT_EXPLORE_ENABLED = true;
export const DEFAULT_STRATEGY_VERSION = 'v1';
export const DEFAULT_WEIGHTS_VERSION = 'w1';
export const DEFAULT_FEEDBACK_SOURCE = 'auto';

// ========== 时间预算（毫秒） ==========

export const RANK_TOTAL_BUDGET_MS = 150;
export const COARSE_RANKING_BUDGET_MS = 50;
export const FINE_RANKING_BUDGET_MS = 80;

// ========== Provider 延迟与错误阈值 ==========

export const PROVIDER_TIMEOUT_P95_HARD = 8000;     // ms
export const PROVIDER_TIMEOUT_P95_SOFT = 6000;     // ms
export const PROVIDER_ERROR_RATE_THRESHOLD = 0.10; // 10%
export const PROVIDER_RATE_LIMIT_THRESHOLD = 0.05; // 5%

// ========== 质量与业务阈值 ==========

export const REJECTION_RATE_THRESHOLD = 0.20;      // 20%
export const EDIT_DISTANCE_TARGET = 0.30;
export const EDIT_DISTANCE_ALERT = 0.50;
export const STRUCTURED_RATE_THRESHOLD = 0.90;     // 90%

// ========== 成本与探索 ==========

export const COST_OVERRUN_MULTIPLIER = 1.5;        // 实际/预期 > 1.5 触发
export const EXPLORE_SHARE_MAX = 0.20;             // 20%
export const EXPLORE_SHARE_TARGET = 0.10;          // 10%
export const FALLBACK_RATE_THRESHOLD = 0.15;       // 15%

// ========== 熔断与恢复 ==========

export const CIRCUIT_BREAKER_DURATION_MS = 10 * 60 * 1000;      // 10分钟
export const CIRCUIT_BREAKER_SEVERE_DURATION_MS = 30 * 60 * 1000; // 30分钟
export const CIRCUIT_BREAKER_WINDOW_COUNT = 2;     // 连续2个窗口
export const CIRCUIT_BREAKER_HALF_OPEN_RATIO = 0.10; // 半开恢复10%流量

// ========== LKG 缓存 ==========

export const LKG_CACHE_TTL_MS = 30 * 60 * 1000;    // 30分钟
export const LKG_CACHE_TTL_MIN_MS = 5 * 60 * 1000; // 5分钟（最小）

// ========== 探索配置 ==========

export const DEFAULT_EXPLORE_CONFIG: ExploreConfig = {
  epsilon: 0.10,
  method: 'epsilon_greedy',
  minQualityFloor: 0.60,
  budgetCap: 100,  // USD/day per segment
};

export const EXPLORE_EPSILON_MIN = 0.05;
export const EXPLORE_EPSILON_MAX = 0.20;
export const NEW_MODEL_RAMP_UP_STEPS = [0.01, 0.02, 0.05]; // 1% → 2% → 5%

// ========== 评分权重（v1 线性，可配置） ==========

export const DEFAULT_COARSE_WEIGHTS: ScoringWeights = {
  langMatch: 1.0,
  categoryMatch: 0.8,
  styleMatch: 0.6,
  windowFit: 0.5,
  jsonSupport: 0.4,
  priceTier: 0.3,
  historicalQuality: 0.7,
};

export const DEFAULT_FINE_WEIGHTS: ScoringWeights = {
  ...DEFAULT_COARSE_WEIGHTS,
  segmentQuality: 1.0,
  segmentLatency: 0.6,
  segmentCost: 0.5,
  recentStability: 0.8,
};

// ========== 特征组 ==========

export const FEATURE_GROUP_MINIMAL = 'ranking_minimal';
export const FEATURE_GROUP_FULL = 'ranking_full';
export const FEATURE_GROUP_GENERATION = 'generation_quality';

// ========== 最小样本数 ==========

export const MIN_SAMPLE_SHORT_WINDOW = 50;
export const MIN_SAMPLE_LONG_WINDOW = 200;

// ========== Segment Key 默认格式 ==========

export const SEGMENT_KEY_SEPARATOR = '|';
export const SEGMENT_KEY_DEFAULT = 'default';

/**
 * 构造 segmentKey
 */
export function buildSegmentKey(category?: string, region?: string, channel?: string): string {
  const parts = [
    category || SEGMENT_KEY_DEFAULT,
    region || SEGMENT_KEY_DEFAULT,
    channel || SEGMENT_KEY_DEFAULT,
  ];
  return parts.join(SEGMENT_KEY_SEPARATOR);
}

// ========== 枚举白名单 ==========

export const VALID_ENTITY_TYPES = ['product', 'style', 'video', 'model', 'prompt_template'];
export const VALID_PLATFORMS = ['tiktok', 'facebook', 'youtube', 'douyin', 'xiaohongshu', 'instagram'];
export const VALID_TONES = ['playful', 'youthful', 'neutral', 'serious', 'luxury', 'casual'];
export const VALID_SAFETY_LEVELS = ['low', 'medium', 'high'];
export const VALID_PRICE_TIERS = ['low', 'mid', 'high'];
export const VALID_LENGTH_HINTS = ['short', 'medium', 'long'];
export const VALID_FEEDBACK_SOURCES = ['human', 'auto', 'system'];














