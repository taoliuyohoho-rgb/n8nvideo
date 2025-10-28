// DeepSeek AI service (OpenAI-compatible)
export default class DeepseekAIService {
  private apiKey: string
  private baseUrl: string = 'https://api.deepseek.com/v1'
  private defaultModel: string = 'deepseek-vl'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateText(prompt: string, options: { model?: string; maxTokens?: number; temperature?: number } = {}): Promise<string> {
    const body = {
      model: options.model || this.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 1500
    }
    const resp = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    })
    if (!resp.ok) {
      const t = await resp.text().catch(() => '')
      throw new Error(`DeepSeek HTTP ${resp.status}: ${t}`)
    }
    const json = await resp.json()
    return json?.choices?.[0]?.message?.content || ''
  }
}


