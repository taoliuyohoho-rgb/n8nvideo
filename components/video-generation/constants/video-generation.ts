/**
 * 视频生成流程常量定义
 * 基于单文件示例重构，与现有系统深度集成
 */

import type { VideoGenerationStep } from '../types/video-generation'

// 默认视频参数
export const DEFAULT_VIDEO_PARAMS = {
  duration: 30,
  resolution: '1080p' as const,
  style: 'modern',
  voice: 'natural',
  backgroundMusic: true,
  subtitles: false,
}

// 默认脚本参数
export const DEFAULT_SCRIPT_PARAMS = {
  tone: 'professional',
  length: 30,
  format: 'explainer',
  includeHook: true,
  includeCTA: true,
}

// 验证规则
export const VALIDATION_RULES = {
  video: {
    duration: { min: 15, max: 300 },
    resolution: { allowed: ['720p', '1080p', '4k'] as const },
  },
}

// 工作流步骤定义
export const VIDEO_GENERATION_STEPS: VideoGenerationStep[] = [
  'product',
  'analysis', 
  'persona',
  'script',
  'video'
]

// 步骤标签
export const STEP_LABELS: Record<VideoGenerationStep, string> = {
  product: '选择商品',
  analysis: '商品信息',
  persona: '人设画像',
  script: '脚本生成',
  video: '视频生成',
}

// 步骤描述
export const STEP_DESCRIPTIONS: Record<VideoGenerationStep, string> = {
  product: '输入商品名称自动搜索',
  analysis: '展示商品信息和AI分析结果',
  persona: '推荐或生成人设',
  script: 'AI生成视频脚本',
  video: '生成最终视频',
}

// 步骤配置
export const STEP_CONFIG: Record<VideoGenerationStep, { color: string }> = {
  product: { color: 'blue' },
  analysis: { color: 'purple' },
  persona: { color: 'indigo' },
  script: { color: 'green' },
  video: { color: 'orange' },
}

// 推荐场景映射
export const RECOMMENDATION_SCENARIOS = {
  persona: 'task->model' as const, // 人设推荐使用模型推荐
  script: 'task->prompt' as const, // 脚本推荐使用prompt推荐
  video: 'product->style' as const, // 视频推荐使用风格推荐
}

// 权限资源映射
export const PERMISSION_RESOURCES = {
  product: 'PRODUCTS',
  persona: 'PERSONAS', 
  script: 'SCRIPTS',
  video: 'VIDEOS',
} as const

// 权限操作映射
export const PERMISSION_ACTIONS = {
  read: 'READ',
  create: 'CREATE',
  update: 'UPDATE',
  delete: 'DELETE',
} as const