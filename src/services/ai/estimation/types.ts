/**
 * 预估模型 (Estimation Model) - 类型定义
 * 给定任务A与环境C，选出最合适的候选B
 */

// ========== 基础类型 ==========

export type EntityType = 'product' | 'style' | 'video' | 'model' | 'prompt_template';
export type Platform = 'tiktok' | 'facebook' | 'youtube' | 'douyin' | 'xiaohongshu' | 'instagram';
export type Tone = 'playful' | 'youthful' | 'neutral' | 'serious' | 'luxury' | 'casual';
export type SafetyLevel = 'low' | 'medium' | 'high';
export type PriceTier = 'low' | 'mid' | 'high';
export type LengthHint = 'short' | 'medium' | 'long';
export type FeedbackSource = 'human' | 'auto' | 'system';

export interface SubjectRef {
  entityType: EntityType;
  entityId: string;
}

// ========== Rank 请求/响应 ==========

export interface TaskInput {
  subjectRef?: SubjectRef;
  category?: string;
  style?: string;
  styleTags?: string[];
  lang: string;                  // required
  structure?: string;
  lengthHint?: LengthHint;
  sensitive?: boolean;
  priceTier?: PriceTier;
  audience?: string;
}

export interface ContextInput {
  festival?: string;
  region?: string;
  channel?: string;
  audience?: string;
  budgetTier?: PriceTier;
  maxLatencyMs?: number;
  concurrencyLevel?: number;
  regulatoryFlags?: string[];
}

export interface Constraints {
  maxCostUSD?: number;
  maxLatencyMs?: number;         // default 6000
  allowProviders?: string[];
  denyProviders?: string[];
  requireJsonMode?: boolean;
  minSafetyLevel?: SafetyLevel;
}

export interface RankOptions {
  topK?: number;                 // default 5
  explore?: boolean;             // default true
  strategyVersion?: string | null;
  requestId?: string;            // 幂等key
}

export interface RankRequest {
  task: TaskInput;
  context?: ContextInput;
  constraints?: Constraints;
  options?: RankOptions;
}

export interface CandidateItem {
  modelId: string;
  provider: string;
  modelName?: string;
  coarseScore?: number;
  fineScore?: number;
  reason?: Record<string, unknown>;
  filtered?: boolean;
  filterReason?: string;
  expectedCost?: number;
  expectedLatency?: number;
}

export interface RankResponse {
  decisionId: string;
  candidateSetId: string;
  strategyVersion: string;
  weightsVersion: string;
  chosen: CandidateItem;
  candidates: CandidateItem[];
  fallbackUsed?: boolean;
  warnings?: string[];
  timings?: {
    coarseMs: number;
    fineMs: number;
    totalMs: number;
  };
}

// ========== Feedback 请求 ==========

export interface AutoEval {
  structuredRate?: number;
  toxicityFlag?: boolean;
  styleConsistency?: number;
  factualProbeScore?: number;
}

export interface FeedbackRequest {
  decisionId: string;                            // required
  qualityScore?: number;                         // 0..1
  editDistance?: number;                         // 0..1
  rejected?: boolean;
  conversion?: boolean | number;
  latencyMs?: number;
  costActual?: number;
  tokensInput?: number;
  tokensOutput?: number;
  autoEval?: AutoEval;
  reviewTags?: string[];
  notes?: string;
  feedbackSource?: FeedbackSource;               // default: auto
}

// ========== 内部类型 ==========

export interface ModelRecord {
  id: string;
  provider: string;
  modelName: string;
  version?: string | null;
  langs: string[];
  maxContext: number;
  pricePer1kTokens: number;
  rateLimit?: number | null;
  toolUseSupport: boolean;
  jsonModeSupport: boolean;
  status: string;
  staticCapability?: Record<string, unknown>;
  dynamicMetrics?: Record<string, unknown>;
}

export interface FeatureSnapshot {
  [key: string]: unknown;
}

export interface FilterResult {
  passed: boolean;
  reason?: string;
}

export interface ScoringWeights {
  [featureName: string]: number;
}

export interface ExploreConfig {
  epsilon: number;              // 0.05–0.2
  method: 'epsilon_greedy' | 'thompson';
  minQualityFloor?: number;
  budgetCap?: number;
}

export interface SegmentMetrics {
  segmentKey: string;
  qualityScore?: number;
  editRate?: number;
  rejectionRate?: number;
  avgCost?: number;
  avgLatency?: number;
  sampleCount: number;
}

export interface CircuitBreakerState {
  provider: string;
  modelId?: string;
  breakUntil: Date;
  reason: string;
}

export interface LKGCache {
  segmentKey: string;
  modelId: string;
  expiresAt: Date;
}

// ========== 错误类型 ==========

export interface EstimationError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}














