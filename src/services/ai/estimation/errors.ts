/**
 * 预估模型 (Estimation Model) - 错误码与异常
 */

export class EstimationErrorClass extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'EstimationError';
  }
}

// ========== Rank 错误 ==========

export const RANK_BAD_REQUEST = (message: string, details?: Record<string, unknown>) =>
  new EstimationErrorClass('RANK_BAD_REQUEST', message, 400, details);

export const RANK_STORE_ERROR = (message: string, details?: Record<string, unknown>) =>
  new EstimationErrorClass('RANK_STORE_ERROR', message, 503, details);

export const RANK_TIMEOUT = (message: string, details?: Record<string, unknown>) =>
  new EstimationErrorClass('RANK_TIMEOUT', message, 504, details);

export const RANK_NO_CANDIDATE = (message: string, details?: Record<string, unknown>) =>
  new EstimationErrorClass('RANK_NO_CANDIDATE', message, 200, details);

export const RANK_EXPLORE_FORCED_OFF = (message: string, details?: Record<string, unknown>) =>
  new EstimationErrorClass('RANK_EXPLORE_FORCED_OFF', message, 200, details);

// ========== Generate 错误 ==========

export const GEN_PROVIDER_TIMEOUT = (message: string, details?: Record<string, unknown>) =>
  new EstimationErrorClass('GEN_PROVIDER_TIMEOUT', message, 504, details);

export const GEN_PROVIDER_ERROR = (message: string, details?: Record<string, unknown>) =>
  new EstimationErrorClass('GEN_PROVIDER_ERROR', message, 502, details);

export const GEN_RATE_LIMITED = (message: string, details?: Record<string, unknown>) =>
  new EstimationErrorClass('GEN_RATE_LIMITED', message, 429, details);

export const GEN_COST_BUDGET_EXCEEDED = (message: string, details?: Record<string, unknown>) =>
  new EstimationErrorClass('GEN_COST_BUDGET_EXCEEDED', message, 409, details);

export const GEN_FORMAT_INVALID = (message: string, details?: Record<string, unknown>) =>
  new EstimationErrorClass('GEN_FORMAT_INVALID', message, 422, details);

export const GEN_FALLBACK_USED = (message: string, details?: Record<string, unknown>) =>
  new EstimationErrorClass('GEN_FALLBACK_USED', message, 200, details);

// ========== Feedback 错误 ==========

export const FBK_BAD_REQUEST = (message: string, details?: Record<string, unknown>) =>
  new EstimationErrorClass('FBK_BAD_REQUEST', message, 400, details);

export const FBK_STORE_ERROR = (message: string, details?: Record<string, unknown>) =>
  new EstimationErrorClass('FBK_STORE_ERROR', message, 503, details);

export const FBK_OUTLIER_DROPPED = (message: string, details?: Record<string, unknown>) =>
  new EstimationErrorClass('FBK_OUTLIER_DROPPED', message, 200, details);

export const FBK_DUPLICATE = (message: string, details?: Record<string, unknown>) =>
  new EstimationErrorClass('FBK_DUPLICATE', message, 200, details);

// ========== Common 错误 ==========

export const COMMON_UNAUTHORIZED = (message: string, details?: Record<string, unknown>) =>
  new EstimationErrorClass('COMMON_UNAUTHORIZED', message, 401, details);

export const COMMON_FORBIDDEN = (message: string, details?: Record<string, unknown>) =>
  new EstimationErrorClass('COMMON_FORBIDDEN', message, 403, details);

export const COMMON_INTERNAL = (message: string, details?: Record<string, unknown>) =>
  new EstimationErrorClass('COMMON_INTERNAL', message, 500, details);

export const COMMON_UNAVAILABLE = (message: string, details?: Record<string, unknown>) =>
  new EstimationErrorClass('COMMON_UNAVAILABLE', message, 503, details);

/**
 * 统一错误响应格式化
 */
export function formatErrorResponse(error: EstimationErrorClass) {
  return {
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
    },
  };
}

/**
 * 判断是否为软错误（200状态但带警告）
 */
export function isSoftError(error: EstimationErrorClass): boolean {
  return error.statusCode === 200;
}














