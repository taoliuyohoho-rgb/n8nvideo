/**
 * 视频生成流程相关类型定义
 * 基于单文件示例重构，与现有系统深度集成
 */

// 商品信息
export interface Product {
  id: string
  name: string
  description: string | null
  category: string
  subcategory?: string | null
  images?: string[]
  sellingPoints?: string[]
  painPoints?: string[]
  sellingPointsTop5?: string[]
  painPointsTop5?: string[]
  targetCountries: string[]
  targetAudience: string[]
  metadata?: any
}

// 商品分析结果
export interface ProductAnalysis {
  id?: string
  productId?: string
  description: string
  category: string
  targetCountries: string[]
  sellingPoints: string[]
  painPoints: string[]
  targetAudience: string
}

// 人设信息
export interface Persona {
  id: string
  coreIdentity: {
    name: string
    age: number
    gender: string
    location: string
    occupation: string
  }
  look: {
    generalAppearance: string
    hair: string
    clothingAesthetic: string
    signatureDetails: string
  }
  vibe: {
    traits?: string[]
    demeanor: string
    communicationStyle: string
  }
  context: {
    hobbies: string
    values: string
    frustrations: string
    homeEnvironment: string
  }
  why: string
}

// 视频脚本
export interface VideoScript {
  id: string
  productId: string
  personaId?: string
  angle: string
  content: string
  // ✅ 完整的脚本数据字段
  lines?: {
    open: string
    main: string
    close: string
  }
  shots?: Array<{
    second: number
    camera: string
    action: string
    visibility: string
    audio: string
  }>
  technical?: {
    orientation: string
    filmingMethod: string
    dominantHand: string
    location: string
    audioEnv: string
  }
  durationSec?: number
  energy?: string
  // 兼容旧格式（用于旧组件）
  structure: {
    hook: string
    problem: string
    solution: string
    benefits: string[]
    callToAction: string
  }
  style: {
    tone: string
    length: number
    format: string
  }
}

// 视频任务
export type VideoJobStatus = 'pending' | 'processing' | 'completed' | 'failed'
export interface VideoJob {
  id: string
  productId: string
  scriptId: string
  status: VideoJobStatus
  progress: number
  parameters: {
    duration: number
    resolution: '720p' | '1080p' | '4k'
    style: string
    voice: string
    backgroundMusic: boolean
    subtitles: boolean
  }
  result?: {
    url: string
    thumbnail?: string
    sizeMB?: number
  }
  error?: string
}

export interface VideoResult {
  job: VideoJob
}

// 工作流步骤
export type VideoGenerationStep = 'product' | 'analysis' | 'persona' | 'script' | 'video'

// 工作流状态
export interface VideoGenerationState {
  currentStep: VideoGenerationStep
  product?: Product
  analysis?: ProductAnalysis
  persona?: Persona
  script?: VideoScript
  videoJob?: VideoJob
  loading: boolean
  error?: string
}

// 工作流Props
export interface VideoGenerationWorkflowProps {
  initialProductId?: string
  onComplete?: (result: VideoResult) => void
  onError?: (error: string) => void
  className?: string
}

// Context类型
export interface VideoGenerationContextType {
  state: VideoGenerationState
  dispatch: React.Dispatch<VideoGenerationAction>
  goToStep: (step: VideoGenerationStep) => void
  canGoToStep: (step: VideoGenerationStep) => boolean
  goToNextStep: () => void
  goToPreviousStep: () => void
  resetWorkflow: () => void
}

// Action类型
export type VideoGenerationAction =
  | { type: 'SET_STEP'; payload: VideoGenerationStep }
  | { type: 'SET_PRODUCT'; payload: Product }
  | { type: 'SET_ANALYSIS'; payload: ProductAnalysis }
  | { type: 'SET_PERSONA'; payload: Persona }
  | { type: 'SET_SCRIPT'; payload: VideoScript }
  | { type: 'SET_VIDEO_JOB'; payload: VideoJob }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET' }

// 组件Props类型
export interface ProductSelectorProps {
  onProductSelected: (product: Product) => void
  disabled?: boolean
  className?: string
}

export interface ProductAnalysisProps {
  product: Product
  onAnalysisComplete: (analysis: ProductAnalysis) => void
  disabled?: boolean
  className?: string
}

export interface PersonaSelectorProps {
  product: Product
  analysis?: ProductAnalysis
  onPersonaSelected: (persona: Persona) => void
  disabled?: boolean
  className?: string
}

export interface ScriptGeneratorProps {
  product: Product
  analysis?: ProductAnalysis
  persona?: Persona
  onScriptGenerated: (script: VideoScript) => void
  disabled?: boolean
  className?: string
  initialScript?: VideoScript  // 🔄 用于恢复已生成的脚本
}

export interface VideoGeneratorProps {
  product: Product
  script: VideoScript
  persona?: Persona
  onVideoJobCreated: (jobId: string) => void
  disabled?: boolean
  className?: string
}