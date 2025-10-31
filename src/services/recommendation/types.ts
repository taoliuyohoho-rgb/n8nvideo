// Recommendation module - type definitions

export type RecommendationScenario = 'product->persona' | 'product->script' | 'product->content-elements' | 'task->model' | 'task->prompt' | 'video-script';

export interface SubjectRef {
  entityType: 'product' | 'style' | 'video' | 'model' | 'prompt_template' | 'task';
  entityId?: string; // optional for tasks
}

export interface RecommendTaskInput {
  // generic fields used across scenarios
  subjectRef?: SubjectRef;
  category?: string; // product category
  language?: string; // zh|en|ms|id|th|vi
  channel?: string; // tiktok, facebook, ...
  region?: string; // CN, MY, ...
  // task specific
  taskType?: string; // product-analysis, video-script, ai-reverse-engineer, rewrite, summarize, classify, vision, reasoning
  contentType?: 'text' | 'image' | 'video' | 'multimodal' | 'structured';
  jsonRequirement?: boolean;
  budgetTier?: 'low' | 'mid' | 'high';
  // AI反推相关
  inputType?: 'text' | 'image' | 'video' | 'document';
  exampleType?: 'selling-points' | 'pain-points' | 'target-audience' | 'prompt-script' | 'video';
}

export interface RecommendContextInput {
  festival?: string;
  region?: string;
  channel?: string;
  audience?: string;
  budgetTier?: 'low' | 'mid' | 'high';
}

export interface RecommendConstraints {
  maxCostUSD?: number;
  maxLatencyMs?: number;
  requireJsonMode?: boolean;
  allowProviders?: string[]; // for task->model
  denyProviders?: string[];
}

export interface RecommendOptions {
  requestId?: string;
  strategyVersion?: string | null;
  bypassCache?: boolean; // 跳过推荐缓存，用于需要多样性的场景（如脚本生成）
}

export interface RecommendRankRequest {
  scenario: RecommendationScenario;
  task: RecommendTaskInput;
  context?: RecommendContextInput;
  constraints?: RecommendConstraints;
  options?: RecommendOptions;
}

export interface CandidateItem {
  id: string; // target id (styleId/modelId/promptId)
  type: string; // style|model|prompt
  title?: string;
  // For executable selections, provide a concrete value to use.
  // Example for task->model: "openai/gpt-4o-mini"; for prompts: prompt id or slug
  name?: string;
  summary?: string;
  coarseScore?: number;
  fineScore?: number;
  reason?: Record<string, unknown>;
}

export interface AlternativeBuckets {
  fineTop2?: CandidateItem; // the Top2 item (Top1 is chosen)
  coarseExtras?: CandidateItem[]; // two items from coarse not in fine
  outOfPool?: CandidateItem[]; // two items passing hard constraints not in coarse
}

export interface RecommendRankResponse {
  decisionId: string;
  candidateSetId: string;
  scenario: RecommendationScenario;
  chosen: CandidateItem;
  topK: CandidateItem[]; // K=3
  alternatives: AlternativeBuckets; // for UI 5-item override choices
}

export interface RecommendFeedbackRequest {
  decisionId: string;
  userSelectedId?: string; // if user changed from Top1 to other
  bucket?: 'fine' | 'coarse' | 'oop';
  qualityScore?: number;
  latencyMs?: number;
  costActual?: number;
  notes?: string;
}
