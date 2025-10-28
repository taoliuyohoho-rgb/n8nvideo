export interface VideoGenerationParams {
  prompt: string
  duration: number
  resolution: string
  modelName?: string
  traceId?: string
  idempotencyKey?: string
}

export interface VideoGenerationResult {
  provider: string
  modelName?: string
  videoId: string
  videoUrl: string
  duration: number
  resolution: string
  generatedAt: string
  raw?: unknown
}

export interface ProviderConfig {
  apiKey?: string
  baseUrl?: string
  defaultModel?: string
  [key: string]: unknown
}

export interface VideoGenerationProvider {
  readonly name: string
  isConfigured(): boolean
  generate(params: VideoGenerationParams): Promise<VideoGenerationResult>
}


