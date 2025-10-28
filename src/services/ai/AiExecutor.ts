// Lightweight AI execution orchestrator with queue, rate limit, retries and circuit breaker
// Reusable across API routes. Designed for server runtime.

import fs from 'fs'
import path from 'path'

type Provider = 'gemini' | 'doubao' | 'openai' | 'deepseek' | 'claude'

export interface ExecuteParams {
  provider: Provider
  prompt: string
  useSearch: boolean
  images?: string[] // dataURL or http(s) URLs; dataURL will be sent as inline_data
}

interface CircuitState {
  failureCount: number
  openUntil: number // epoch ms; 0 means closed
}

export class AiExecutor {
  private queue: Array<() => Promise<void>> = []
  private active = 0
  private readonly maxConcurrency = 1
  private readonly paceMs = 2000
  private readonly maxRetries = 2
  private readonly baseBackoffMs = 800
  private circuits: Record<Provider, CircuitState> = {
    gemini: { failureCount: 0, openUntil: 0 },
    doubao: { failureCount: 0, openUntil: 0 },
    openai: { failureCount: 0, openUntil: 0 },
    deepseek: { failureCount: 0, openUntil: 0 },
    claude: { failureCount: 0, openUntil: 0 },
  }

  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (err) {
          reject(err)
        }
      })
      this.drain()
    })
  }

  private drain(): void {
    if (this.active >= this.maxConcurrency) return
    const next = this.queue.shift()
    if (!next) return
    this.active++
    next()
      .catch(() => {})
      .finally(() => {
        this.active--
        setTimeout(() => this.drain(), this.paceMs)
      })
  }

  async execute({ provider, prompt, useSearch, images }: ExecuteParams): Promise<string> {
    const now = Date.now()
    const circuit = this.circuits[provider]
    if (circuit && circuit.openUntil > now) {
      throw new Error(`${provider} 暂时不可用（断路器打开），请稍后再试`)
    }

    // Only allow verified models
    this.assertVerified(provider)

    let attempt = 0
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const text = await this.callProvider(provider, prompt, useSearch, images)
        // reset circuit
        circuit.failureCount = 0
        circuit.openUntil = 0
        return text
      } catch (err: any) {
        attempt++
        const status = err?.status
        // 429 不计入断路器，只做退避重试
        if (status === 429) {
          const retryMs = typeof err?.retryAfter === 'number' ? err.retryAfter : (this.baseBackoffMs * Math.pow(2, attempt - 1))
          await new Promise(res => setTimeout(res, retryMs + Math.floor(Math.random() * 300)))
          if (attempt > this.maxRetries) throw err
          continue
        }

        // 401/403 一般为Key问题，直接抛出
        if (status === 401 || status === 403) throw err

        // 其它错误：计入断路器并重试
        circuit.failureCount++
        if (attempt > this.maxRetries) {
          circuit.openUntil = Date.now() + Math.min(60000, this.baseBackoffMs * (2 ** circuit.failureCount))
          throw err
        }
        const backoff = this.baseBackoffMs * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 300)
        await new Promise(res => setTimeout(res, backoff))
      }
    }
  }

  // ---- Provider calls ----
  private async callProvider(provider: Provider, prompt: string, useSearch: boolean, images?: string[]): Promise<string> {
    switch (provider) {
      case 'gemini':
        return this.callGemini(prompt, useSearch, images)
      case 'doubao':
        return this.callDoubao(prompt)
      case 'deepseek':
        return this.callDeepseek(prompt)
      case 'openai':
        return this.callOpenAI(prompt)
      case 'claude':
        return this.callClaude(prompt)
      default:
        return this.callGemini(prompt, useSearch, images)
    }
  }

  private async callGemini(prompt: string, useSearch: boolean, images?: string[]): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

    // Default to 2.5 flash per latest docs; allow override via env
    const modelId = process.env.GEMINI_MODEL_ID || 'gemini-2.5-flash'

    // Build content parts: text + optional image hints
    const parts: any[] = [{ text: prompt }]
    if (Array.isArray(images)) {
      for (const img of images) {
        if (typeof img !== 'string') continue
        if (img.startsWith('data:')) {
          const m = img.match(/^data:([^;]+);base64,(.*)$/)
          if (m) parts.push({ inline_data: { mime_type: m[1], data: m[2] } })
        } else if (/^https?:\/\//i.test(img)) {
          parts.push({ text: `图片URL: ${img}` })
        }
      }
    }

    const body: any = {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 800,
        // Google Gemini REST API expects underscore form
        response_mime_type: 'application/json'
      }
    }
    if (useSearch) body.tools = [{ googleSearch: {} }]

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent`
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body)
    })
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      const e: any = new Error(`Gemini HTTP ${resp.status}: ${text}`)
      e.status = resp.status
      const ra = resp.headers.get('retry-after')
      if (ra) {
        const n = parseInt(ra, 10)
        if (!Number.isNaN(n)) e.retryAfter = n * 1000
      }
      throw e
    }
    const json = await resp.json()
    return json?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }

  private async callDoubao(prompt: string): Promise<string> {
    const apiKey = process.env.DOUBAO_API_KEY
    if (!apiKey) throw new Error('DOUBAO_API_KEY not configured')
    const base = (process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3').replace(/\/+$/, '')
    const endpoint = `${base}/chat/completions`
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: process.env.DOUBAO_MODEL_ID || 'doubao-seed-1-6-lite-251015', messages: [{ role: 'user', content: prompt }], temperature: 0.3 })
    })
    const json = await resp.json()
    return json?.choices?.[0]?.message?.content || ''
  }

  private async callDeepseek(prompt: string): Promise<string> {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured')
    const base = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '')
    const endpoint = `${base}/v1/chat/completions`
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: 1000 })
    })
    const json = await resp.json()
    return json?.choices?.[0]?.message?.content || ''
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured')
    const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com').replace(/\/+$/, '')
    const endpoint = `${base}/v1/chat/completions`
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ 
        model: process.env.OPENAI_MODEL_ID || 'gpt-4o-mini', 
        messages: [{ role: 'user', content: prompt }], 
        temperature: 0.3, 
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      })
    })
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      const e: any = new Error(`OpenAI HTTP ${resp.status}: ${text}`)
      e.status = resp.status
      throw e
    }
    const json = await resp.json()
    return json?.choices?.[0]?.message?.content || ''
  }

  private async callClaude(prompt: string): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')
    const base = (process.env.CLAUDE_BASE_URL || 'https://api.anthropic.com').replace(/\/+$/, '')
    const endpoint = `${base}/v1/messages`
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.CLAUDE_MODEL_ID || 'claude-3-sonnet-20240229', messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: 1000 })
    })
    const json = await resp.json()
    return json?.content?.[0]?.text || ''
  }

  // ---- Verification ----
  private assertVerified(provider: Provider): void {
    const file = path.join(process.cwd(), 'verified-models.json')
    if (!fs.existsSync(file)) throw new Error('未找到 verified-models.json，请先在AI配置中验证模型')
    const raw = fs.readFileSync(file, 'utf8')
    const models = JSON.parse(raw)
    if (!Array.isArray(models)) throw new Error('verified-models.json 格式错误')
    const providerMap: Record<Provider, string> = {
      gemini: 'Google',
      doubao: '字节跳动',
      openai: 'OpenAI',
      deepseek: 'DeepSeek',
      claude: 'Anthropic',
    }
    const need = providerMap[provider]
    const ok = models.some((m: any) => m.provider === need && m.status === 'verified')
    if (!ok) throw new Error(`没有已验证的${need} Key`)
  }
}

// singleton across hot reloads
const g = global as any
if (!g.__AI_EXECUTOR__) {
  g.__AI_EXECUTOR__ = new AiExecutor()
}
export const aiExecutor: AiExecutor = g.__AI_EXECUTOR__


