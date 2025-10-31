// Lightweight AI execution orchestrator with queue, rate limit, retries and circuit breaker
// Reusable across API routes. Designed for server runtime.

import fs from 'fs'
import path from 'path'
import { API_CONSTANTS, AI_CONSTANTS } from '@/src/core/constants/AppConstants'

// 手动加载环境变量
if (process.env.NODE_ENV !== 'production') {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8')
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim()
          if (!process.env[key]) {
            process.env[key] = value
          }
        }
      })
    }
  } catch (error) {
    console.warn('Failed to load .env.local:', error)
  }
}

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
  private readonly maxConcurrency = API_CONSTANTS.MAX_CONCURRENCY
  private readonly paceMs = API_CONSTANTS.AI_PACE_MS
  private readonly maxRetries = API_CONSTANTS.DEFAULT_RETRIES
  private readonly baseBackoffMs = API_CONSTANTS.BASE_BACKOFF_MS
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
      } catch (err: unknown) {
        attempt++
        const status = (err as { status?: number })?.status
        // 429 配额超限：更新provider状态并抛出特定错误
        if (status === 429) {
          await this.handleQuotaExceeded(provider, err)
          const quotaError = new Error(`模型 ${provider} 余额不足，请检查账户配额或充值后重试`)
          quotaError.name = 'QuotaExceededError'
          ;(quotaError as { status: number }).status = 429
          throw quotaError
        }

        // 401/403 一般为Key问题，直接抛出
        if (status === 401 || status === 403) throw err

        // 其它错误：计入断路器并重试
        circuit.failureCount++
        if (attempt > this.maxRetries) {
          circuit.openUntil = Date.now() + Math.min(API_CONSTANTS.MAX_BACKOFF_MS, this.baseBackoffMs * (2 ** circuit.failureCount))
          throw err
        }
        const backoff = this.baseBackoffMs * Math.pow(2, attempt - 1) + Math.floor(Math.random() * API_CONSTANTS.RANDOM_JITTER_MS)
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
        // 默认使用 DeepSeek（当前可用且无配额问题）
        return this.callDeepseek(prompt)
    }
  }

  private async callGemini(prompt: string, useSearch: boolean, images?: string[]): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

    // 使用可用的 Gemini 模型，优先使用环境变量配置
    const modelId = process.env.GEMINI_MODEL_ID || 'gemini-2.0-flash-exp'

    // Build content parts: text + optional image hints
    const parts: Array<{ text: string; inlineData?: { mimeType: string; data: string } }> = [{ text: prompt }]
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

    const body: Record<string, unknown> = {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: AI_CONSTANTS.CONSERVATIVE_TEMPERATURE,
        maxOutputTokens: AI_CONSTANTS.MAX_OUTPUT_TOKENS,
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
      console.error('Gemini API错误:', { status: resp.status, text, endpoint, body })
      const e = new Error(`Gemini HTTP ${resp.status}: ${text}`) as Error & { status: number }
      e.status = resp.status
      const ra = resp.headers.get('retry-after')
      if (ra) {
        const n = parseInt(ra, 10)
        if (!Number.isNaN(n)) e.retryAfter = n * 1000
      }
      throw e
    }
    const json = await resp.json()
    console.log('Gemini API响应:', JSON.stringify(json, null, 2))
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
      body: JSON.stringify({ model: process.env.DOUBAO_MODEL_ID || 'doubao-seed-1-6-lite-251015', messages: [{ role: 'user', content: prompt }], temperature: AI_CONSTANTS.DEFAULT_TEMPERATURE })
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
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], temperature: AI_CONSTANTS.DEFAULT_TEMPERATURE, max_tokens: AI_CONSTANTS.DEFAULT_MAX_TOKENS })
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
        temperature: AI_CONSTANTS.DEFAULT_TEMPERATURE, 
        max_tokens: AI_CONSTANTS.DEFAULT_MAX_TOKENS,
        response_format: { type: 'json_object' }
      })
    })
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      const e = new Error(`OpenAI HTTP ${resp.status}: ${text}`) as Error & { status: number }
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
      body: JSON.stringify({ model: process.env.CLAUDE_MODEL_ID || 'claude-3-sonnet-20240229', messages: [{ role: 'user', content: prompt }], temperature: AI_CONSTANTS.DEFAULT_TEMPERATURE, max_tokens: AI_CONSTANTS.DEFAULT_MAX_TOKENS })
    })
    const json = await resp.json()
    return json?.content?.[0]?.text || ''
  }

  // ---- Quota Management ----
  private async handleQuotaExceeded(provider: Provider, error: unknown): Promise<void> {
    try {
      // 更新verified-models.json中对应provider的状态
      await this.updateProviderStatus(provider, 'quota_exceeded', (error as Error).message)
      
      // 更新数据库中的模型状态
      await this.updateModelStatus(provider, 'quota_exceeded')
      
      console.log(`Provider ${provider} marked as quota exceeded`)
    } catch (updateError) {
      console.error(`Failed to update quota status for ${provider}:`, updateError)
    }
  }

  private async updateProviderStatus(provider: string, status: string, reason?: string): Promise<void> {
    try {
      const file = path.join(process.cwd(), 'verified-models.json')
      if (!fs.existsSync(file)) return
      
      const raw = fs.readFileSync(file, 'utf8')
      const list = JSON.parse(raw)
      
      // Provider映射：将内部provider名称映射到verified-models.json中的provider名称
      const providerMap: Record<string, string> = {
        'gemini': 'Google',
        'doubao': '字节跳动',
        'openai': 'OpenAI',
        'deepseek': 'DeepSeek',
        'claude': 'Anthropic',
      }
      
      const targetProvider = providerMap[provider.toLowerCase()] || provider
      
      if (Array.isArray(list)) {
        const updated = list.map(model => {
          if (model?.provider === targetProvider) {
            return {
              ...model,
              status,
              quotaError: reason,
              lastQuotaCheck: new Date().toISOString()
            }
          }
          return model
        })
        
        fs.writeFileSync(file, JSON.stringify(updated, null, 2))
        console.log(`Updated provider status: ${targetProvider} -> ${status}`)
      }
    } catch (error) {
      console.error(`Failed to update provider status:`, error)
    }
  }

  private async updateModelStatus(provider: string, status: string): Promise<void> {
    try {
      const { prisma } = await import('@/lib/prisma')
      await prisma.estimationModel.updateMany({
        where: { 
          provider: provider.toLowerCase(),
          status: 'active'
        },
        data: { 
          status,
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error(`Failed to update model status:`, error)
    }
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
    const ok = models.some((m: Record<string, unknown>) => m.provider === need && m.status === 'verified')
    if (!ok) throw new Error(`没有已验证的${need} Key`)
  }
}

// singleton across hot reloads
const g = global as { __AI_EXECUTOR__?: AiExecutor }
if (!g.__AI_EXECUTOR__) {
  g.__AI_EXECUTOR__ = new AiExecutor()
}
export const aiExecutor: AiExecutor = g.__AI_EXECUTOR__


