/**
 * 应用常量配置
 * 统一管理所有魔法数字、阈值、配置值
 */

// ==================== API 相关常量 ====================
export const API_CONSTANTS = {
  // 超时设置
  DEFAULT_TIMEOUT: 10000, // 10秒
  AI_REQUEST_TIMEOUT: 30000, // 30秒
  VIDEO_GENERATION_TIMEOUT: 300000, // 5分钟
  
  // 重试设置
  DEFAULT_RETRIES: 2,
  AI_REQUEST_RETRIES: 3,
  MAX_RETRIES: 5,
  
  // 退避延迟
  BASE_BACKOFF_MS: 800,
  MAX_BACKOFF_MS: 10000,
  RANDOM_JITTER_MS: 300,
  
  // 并发控制
  MAX_CONCURRENCY: 3,
  AI_PACE_MS: 500,
  
  // 分页设置
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 10,
} as const

// ==================== AI 模型相关常量 ====================
export const AI_CONSTANTS = {
  // 温度设置
  DEFAULT_TEMPERATURE: 0.3,
  CREATIVE_TEMPERATURE: 0.7,
  CONSERVATIVE_TEMPERATURE: 0.2,
  RANDOM_TEMPERATURE: 0.9,
  
  // Token 限制
  DEFAULT_MAX_TOKENS: 1000,
  SHORT_RESPONSE_TOKENS: 500,
  LONG_RESPONSE_TOKENS: 2000,
  MAX_OUTPUT_TOKENS: 4000,
  
  // 模型配置
  DEFAULT_MODEL_VERSION: 'v1',
  SUPPORTED_LANGUAGES: ['zh', 'en'],
  
  // 重试配置
  CIRCUIT_BREAKER_THRESHOLD: 5,
  CIRCUIT_BREAKER_TIMEOUT: 60000, // 1分钟
} as const

// ==================== 业务逻辑常量 ====================
export const BUSINESS_CONSTANTS = {
  // 推荐系统
  RECOMMENDATION: {
    DEFAULT_TOP_K: 5,
    MAX_TOP_K: 20,
    MIN_SCORE: 0.3,
    HIGH_SCORE: 0.8,
    DIVERSITY_THRESHOLD: 0.5,
    EXPLORATION_RATE: 0.1,
  },
  
  // 排名系统
  RANKING: {
    COARSE_MAX_CANDIDATES: 100,
    COARSE_MIN_SCORE: 0.3,
    FINE_MAX_RESULTS: 20,
    FINE_MIN_SCORE: 0.6,
    DEFAULT_WEIGHTS: {
      RELEVANCE: 0.4,
      QUALITY: 0.3,
      DIVERSITY: 0.2,
      RECENCY: 0.1,
    },
  },
  
  // 商品分析
  PRODUCT_ANALYSIS: {
    MAX_SELLING_POINTS: 5,
    MAX_PAIN_POINTS: 5,
    MAX_TARGET_AUDIENCES: 5,
    MIN_DESCRIPTION_LENGTH: 10,
    MAX_DESCRIPTION_LENGTH: 1000,
  },
  
  // 视频生成
  VIDEO_GENERATION: {
    DEFAULT_DURATION: 30, // 秒
    MAX_DURATION: 60,
    MIN_DURATION: 5,
    DEFAULT_FPS: 24,
    SUPPORTED_RESOLUTIONS: ['720p', '1080p'],
  },
} as const

// ==================== 数据库相关常量 ====================
export const DATABASE_CONSTANTS = {
  // 查询限制
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 1000,
  MIN_LIMIT: 1,
  
  // 缓存设置
  CACHE_TTL: 3600, // 1小时
  SHORT_CACHE_TTL: 300, // 5分钟
  LONG_CACHE_TTL: 86400, // 24小时
  
  // 批量操作
  BATCH_SIZE: 100,
  MAX_BATCH_SIZE: 500,
  BATCH_DELAY_MS: 100,
} as const

// ==================== 文件处理常量 ====================
export const FILE_CONSTANTS = {
  // 文件大小限制
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
  
  // 支持的文件类型
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  SUPPORTED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
  SUPPORTED_DOCUMENT_TYPES: ['application/pdf', 'text/plain'],
  
  // 文件路径
  UPLOAD_DIR: '/uploads',
  TEMP_DIR: '/tmp',
  CACHE_DIR: '/cache',
} as const

// ==================== 用户界面常量 ====================
export const UI_CONSTANTS = {
  // 分页
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // 加载状态
  LOADING_DELAY: 300, // 300ms 后显示加载状态
  DEBOUNCE_DELAY: 500, // 输入防抖延迟
  
  // 动画
  TRANSITION_DURATION: 200,
  FADE_DURATION: 300,
  
  // 响应式断点
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
  },
} as const

// ==================== 错误处理常量 ====================
export const ERROR_CONSTANTS = {
  // HTTP 状态码
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },
  
  // 错误代码
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
  },
  
  // 重试配置
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_BASE: 1000,
  RETRY_DELAY_MAX: 10000,
} as const

// ==================== 导出所有常量 ====================
export const CONSTANTS = {
  API: API_CONSTANTS,
  AI: AI_CONSTANTS,
  BUSINESS: BUSINESS_CONSTANTS,
  DATABASE: DATABASE_CONSTANTS,
  FILE: FILE_CONSTANTS,
  UI: UI_CONSTANTS,
  ERROR: ERROR_CONSTANTS,
} as const

export default CONSTANTS

