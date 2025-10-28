import fs from 'fs'
import path from 'path'

export type VideoGenConfig = {
  provider?: string
  modelName?: string
  baseUrl?: string
  apiKey?: string
  defaults?: {
    aspectRatio?: string
    fps?: number
    webhookUrl?: string
  }
}

export function loadVideoGenerationConfig(): VideoGenConfig {
  try {
    const file = path.join(process.cwd(), 'ai-config.json')
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'))
      return (data?.videoGeneration || {}) as VideoGenConfig
    }
  } catch {}
  // fallback from env
  return {
    provider: process.env.VIDEO_PROVIDER,
    modelName: process.env.VIDEO_MODEL_NAME,
    baseUrl: process.env.SORA_BASE_URL, // 默认兼容现有 Sora 变量
    apiKey: process.env.SORA_API_KEY,
  }
}


