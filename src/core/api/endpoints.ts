/**
 * API端点常量
 * 统一管理所有API路径，避免硬编码
 */

export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    GOOGLE: '/api/auth/google',
    GOOGLE_CALLBACK: '/api/auth/google/callback',
  },

  // 商品相关
  PRODUCTS: {
    LIST: '/api/products',
    CREATE: '/api/products',
    UPDATE: (id: string) => `/api/products/${id}`,
    DELETE: (id: string) => `/api/products/${id}`,
    UNIFIED_ANALYZE: '/api/product/unified-analyze',
  },

  // 竞品分析
  COMPETITOR: {
    ANALYZE: '/api/competitor/analyze',
    PARSE: '/api/competitor/parse',
    BATCH: '/api/competitor/batch',
    RECOMMEND: '/api/competitor/recommend',
  },

  // 推荐系统
  RECOMMEND: {
    RANK: '/api/recommend/rank',
    FEEDBACK: '/api/recommend/feedback',
  },

  // AI相关
  AI: {
    DOUBAO: '/api/ai/doubao',
    GENERATE_PROMPT: '/api/ai/generate-prompt',
    AUTO_SELECT: {
      RANK: '/api/ai/auto-select/rank',
      MODELS: '/api/ai/auto-select/models',
      FEEDBACK: '/api/ai/auto-select/feedback',
    },
  },

  // 管理员相关
  ADMIN: {
    PROMPTS: {
      LIST: '/api/admin/prompts',
      CREATE: '/api/admin/prompts',
      UPDATE: (id: string) => `/api/admin/prompts/${id}`,
      DELETE: (id: string) => `/api/admin/prompts/${id}`,
      REWRITE: '/api/admin/prompts/rewrite',
      GENERATE: '/api/admin/prompts/generate',
      CLEANUP: '/api/admin/prompts/cleanup-unused-modules',
      INIT_DEFAULTS: '/api/admin/prompts/init-defaults',
    },
    PROMPT_RULES: {
      LIST: '/api/admin/prompt-rules',
      CREATE: '/api/admin/prompt-rules',
      UPDATE: (id: string) => `/api/admin/prompt-rules/${id}`,
      DELETE: (id: string) => `/api/admin/prompt-rules/${id}`,
      VALIDATE: '/api/admin/prompt-rules/validate',
      INIT_DEFAULTS: '/api/admin/prompt-rules/init-defaults',
    },
    PERSONAS: {
      LIST: '/api/admin/personas',
      CREATE: '/api/admin/personas',
      UPDATE: (id: string) => `/api/admin/personas/${id}`,
      DELETE: (id: string) => `/api/admin/personas/${id}`,
    },
    AI_CONFIG: {
      TEST: '/api/admin/ai-config/test',
      SYNC: '/api/admin/ai-config/sync',
    },
    PROVIDERS: {
      VERIFY: '/api/admin/providers/verify',
    },
    RECOMMENDATION: {
      SETTINGS: '/api/admin/recommendation/settings',
      STATS: '/api/admin/recommendation/stats',
    },
    ESTIMATION: {
      SEGMENT_METRICS: '/api/admin/estimation/segment-metrics',
      DECISION_STATS: '/api/admin/estimation/decision-stats',
    },
    INIT: {
      REAL_DATA: '/api/admin/init-real-data',
      DB: '/api/admin/init-db',
    },
  },

  // 任务相关
  TASKS: {
    LIST: '/api/tasks',
    CREATE: '/api/tasks',
    UPDATE: (id: string) => `/api/tasks/${id}`,
    DELETE: (id: string) => `/api/tasks/${id}`,
  },

  // 脚本生成
  SCRIPT: {
    GENERATE: '/api/script/generate',
  },

  // 人设生成
  PERSONA: {
    GENERATE: '/api/persona/generate',
  },

  // 视频相关
  VIDEO: {
    ANALYZE: '/api/video/analyze',
    GENERATE: '/api/video-gen',
  },

  // 样式相关
  STYLES: {
    LIST: '/api/styles',
    CREATE: '/api/styles',
    UPDATE: (id: string) => `/api/styles/${id}`,
    DELETE: (id: string) => `/api/styles/${id}`,
  },

  // 排名相关
  RANKING: {
    RANK: '/api/ranking',
    AI_TUNING: '/api/ranking/ai-tuning',
  },

  // 参考视频
  REFERENCE: {
    LIST: '/api/reference',
  },

  // 仪表板
  DASHBOARD: {
    STATS: '/api/dashboard',
  },

  // 健康检查
  HEALTH: '/api/health',
} as const

// 类型定义
export type ApiEndpoints = typeof API_ENDPOINTS
export type EndpointPath = string | ((id: string) => string)

