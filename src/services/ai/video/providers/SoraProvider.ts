import type { ProviderConfig, VideoGenerationParams, VideoGenerationProvider, VideoGenerationResult } from '../VideoGenerationProvider'

export class SoraProvider implements VideoGenerationProvider {
  public readonly name = 'sora'
  private readonly config: ProviderConfig

  constructor(config?: ProviderConfig) {
    this.config = {
      apiKey: process.env.SORA_API_KEY,
      baseUrl: process.env.SORA_BASE_URL,
      defaultModel: process.env.SORA_MODEL,
      ...(config || {}),
    }
  }

  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.baseUrl)
  }

  async generate(params: VideoGenerationParams): Promise<VideoGenerationResult> {
    if (!this.isConfigured()) {
      throw new Error('Sora provider not configured: SORA_API_KEY/SORA_BASE_URL required')
    }

    const model = params.modelName || (this.config.defaultModel as string)
    if (!model) throw new Error('Sora model is not specified')

    const startResp = await fetch(`${this.config.baseUrl}/v1/videos/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: params.prompt,
        duration: params.duration,
        resolution: params.resolution,
        idempotencyKey: params.idempotencyKey,
      }),
    })

    if (!startResp.ok) {
      const text = await startResp.text()
      throw new Error(`Sora start failed: ${startResp.status} ${startResp.statusText} ${text}`)
    }

    const startJson: any = await startResp.json()
    const generationId = startJson.id || startJson.task_id || `gen_${Date.now()}`

    for (;;) {
      const statusResp = await fetch(`${this.config.baseUrl}/v1/videos/generations/${generationId}`, {
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
      })
      if (!statusResp.ok) {
        const text = await statusResp.text()
        throw new Error(`Sora status failed: ${statusResp.status} ${statusResp.statusText} ${text}`)
      }
      const statusJson: any = await statusResp.json()
      const state = statusJson.status || statusJson.state
      const url = statusJson.video_url || statusJson.url
      if (state === 'succeeded' && url) {
        return {
          provider: this.name,
          modelName: model,
          videoId: generationId,
          videoUrl: url,
          duration: params.duration,
          resolution: params.resolution,
          generatedAt: new Date().toISOString(),
          raw: statusJson,
        }
      }
      if (state === 'failed' || state === 'canceled') {
        throw new Error(`Sora generation ${state}`)
      }
      await new Promise(r => setTimeout(r, 2000))
    }
  }
}


