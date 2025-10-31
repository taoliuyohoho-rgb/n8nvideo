/**
 * 视频生成组件统一导出
 * 基于单文件示例重构，与现有系统深度集成
 */

// 主组件
export { VideoGenerationWorkflow, useVideoGenerationContext } from './VideoGenerationWorkflow'

// 子组件
export { ProductSelector } from './ProductSelector'
export { ProductAnalysis } from './ProductAnalysis'
export { PersonaSelector } from './PersonaSelector'
export { ScriptGenerator } from './ScriptGenerator'
export { VideoGenerator } from './VideoGenerator'

// Hooks
export { useVideoGenerationFlow } from './hooks/useVideoGenerationFlow'
export { useVideoGenerationApi } from './hooks/useVideoGenerationApi'

// 类型
export type {
  Product,
  Persona,
  VideoScript,
  VideoJob,
  VideoResult,
  VideoGenerationStep,
  VideoGenerationState,
  VideoGenerationWorkflowProps,
  VideoGenerationContextType,
  VideoGenerationAction,
  ProductSelectorProps,
  PersonaSelectorProps,
  ScriptGeneratorProps,
  VideoGeneratorProps,
} from './types/video-generation'

// 重命名类型导出避免冲突
export type { ProductAnalysis as ProductAnalysisType } from './types/video-generation'
export type { ProductAnalysisProps as ProductAnalysisPropsType } from './types/video-generation'

// 常量
export {
  DEFAULT_VIDEO_PARAMS,
  DEFAULT_SCRIPT_PARAMS,
  VALIDATION_RULES,
  VIDEO_GENERATION_STEPS,
  STEP_LABELS,
  STEP_DESCRIPTIONS,
  STEP_CONFIG,
  RECOMMENDATION_SCENARIOS,
  PERMISSION_RESOURCES,
  PERMISSION_ACTIONS,
} from './constants/video-generation'