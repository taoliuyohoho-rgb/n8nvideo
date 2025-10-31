/**
 * 通用API调用器
 * 
 * 作为路由器，将调用分发到具体的provider实现
 */

import { ConfigLoader, getConfigLoader } from '../config/ConfigLoader'

export interface CallOptions {
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  images?: string[]
  useSearch?: boolean
  idempotencyKey?: string
}

export interface APIResponse {
  text: string
  tokens?: {
    input: number
    output: number
    total: number
  }
  cost?: number
  metadata?: Record<string, any>
}

export class UniversalAPICaller {
  private configLoader = getConfigLoader()

  /**
   * 通用调用接口
   */
  async call(
    provider: string, 
    model: string, 
    prompt: string, 
    options: CallOptions = {}
  ): Promise<APIResponse> {
    const config = await this.configLoader.loadConfig()
    const providerConfig = config.providers[provider]
    
    if (!providerConfig) {
      throw new Error(`Provider ${provider} 未配置`)
    }

    // 路由到具体的provider实现
    switch (provider) {
      case 'gemini':
        return this.callGemini(providerConfig, model, prompt, options)
      case 'openai':
        return this.callOpenAI(providerConfig, model, prompt, options)
      case 'deepseek':
        return this.callDeepSeek(providerConfig, model, prompt, options)
      case 'doubao':
        return this.callDoubao(providerConfig, model, prompt, options)
      case 'anthropic':
        return this.callAnthropic(providerConfig, model, prompt, options)
      default:
        throw new Error(`不支持的provider: ${provider}`)
    }
  }

  /**
   * 调用Gemini API
   */
  private async callGemini(
    config: any, 
    model: string, 
    prompt: string, 
    options: CallOptions
  ): Promise<APIResponse> {
    const endpoint = `${config.baseUrl}/v1beta/models/${encodeURIComponent(model)}:generateContent`
    
    // 构建请求内容
    const parts: any[] = [{ text: prompt }]
    if (options.images && options.images.length > 0) {
      for (const img of options.images) {
        if (img.startsWith('data:')) {
          const m = img.match(/^data:([^;]+);base64,(.*)$/)
          if (m) {
            parts.push({ inline_data: { mime_type: m[1], data: m[2] } })
          }
        } else if (img.startsWith('http')) {
          parts.push({ text: `图片URL: ${img}` })
        }
      }
    }

    const body: any = {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: options.temperature || 0.3,
        maxOutputTokens: options.maxTokens || 1000,
        response_mime_type: options.useSearch ? undefined : 'application/json'
      }
    }

    if (options.useSearch) {
      body.tools = [{ googleSearch: {} }]
    }

    const response = await this.executeRequest(endpoint, {
      'Content-Type': 'application/json',
      'x-goog-api-key': config.apiKey
    }, body)

    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    return {
      text,
      tokens: this.estimateTokens(prompt, text),
      cost: this.calculateCost('gemini', text.length),
      metadata: { provider: 'gemini', model }
    }
  }

  /**
   * 调用OpenAI API
   */
  private async callOpenAI(
    config: any, 
    model: string, 
    prompt: string, 
    options: CallOptions
  ): Promise<APIResponse> {
    const endpoint = `${config.baseUrl}/v1/chat/completions`

    const body = {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 1000,
      response_format: options.useSearch ? undefined : { type: 'json_object' }
    }

    const response = await this.executeRequest(endpoint, {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    }, body)

    const text = response?.choices?.[0]?.message?.content || ''
    const usage = response?.usage
    
    return {
      text,
      tokens: usage ? {
        input: usage.prompt_tokens || 0,
        output: usage.completion_tokens || 0,
        total: usage.total_tokens || 0
      } : this.estimateTokens(prompt, text),
      cost: this.calculateCost('openai', text.length),
      metadata: { provider: 'openai', model }
    }
  }

  /**
   * 调用DeepSeek API
   */
  private async callDeepSeek(
    config: any, 
    model: string, 
    prompt: string, 
    options: CallOptions
  ): Promise<APIResponse> {
    const endpoint = `${config.baseUrl}/v1/chat/completions`

    const body = {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 1000
    }

    const response = await this.executeRequest(endpoint, {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    }, body)

    const text = response?.choices?.[0]?.message?.content || ''
    
    return {
      text,
      tokens: this.estimateTokens(prompt, text),
      cost: this.calculateCost('deepseek', text.length),
      metadata: { provider: 'deepseek', model }
    }
  }

  /**
   * 调用豆包 API
   */
  private async callDoubao(
    config: any, 
    model: string, 
    prompt: string, 
    options: CallOptions
  ): Promise<APIResponse> {
    const endpoint = `${config.baseUrl}/chat/completions`

    const body = {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 1000
    }

    const response = await this.executeRequest(endpoint, {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    }, body)

    const text = response?.choices?.[0]?.message?.content || ''
    
    return {
      text,
      tokens: this.estimateTokens(prompt, text),
      cost: this.calculateCost('doubao', text.length),
      metadata: { provider: 'doubao', model }
    }
  }

  /**
   * 调用Anthropic API
   */
  private async callAnthropic(
    config: any, 
    model: string, 
    prompt: string, 
    options: CallOptions
  ): Promise<APIResponse> {
    const endpoint = `${config.baseUrl}/v1/messages`

    const body = {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 1000
    }

    const response = await this.executeRequest(endpoint, {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01'
    }, body)

    const text = response?.content?.[0]?.text || ''
    
    return {
      text,
      tokens: this.estimateTokens(prompt, text),
      cost: this.calculateCost('anthropic', text.length),
      metadata: { provider: 'anthropic', model }
    }
  }

  /**
   * 执行HTTP请求
   */
  private async executeRequest(
    endpoint: string, 
    headers: Record<string, string>, 
    body: any
  ): Promise<any> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`API调用失败: ${response.status} - ${errorText}`)
    }

    return await response.json()
  }

  /**
   * 估算token数量
   */
  private estimateTokens(input: string, output: string): { input: number; output: number; total: number } {
    const inputTokens = Math.ceil(input.length / 4)
    const outputTokens = Math.ceil(output.length / 4)
    return {
      input: inputTokens,
      output: outputTokens,
      total: inputTokens + outputTokens
    }
  }

  /**
   * 计算成本
   */
  private calculateCost(provider: string, outputLength: number): number {
    const costPer1kTokens: Record<string, number> = {
      gemini: 0.0001,
      openai: 0.0006,
      deepseek: 0.0002,
      doubao: 0.0008,
      anthropic: 0.003
    }

    const cost = costPer1kTokens[provider] || 0.001
    return (outputLength / 1000) * cost
  }
}

// 单例实例
let apiCallerInstance: UniversalAPICaller | null = null

export function getUniversalAPICaller(): UniversalAPICaller {
  if (!apiCallerInstance) {
    apiCallerInstance = new UniversalAPICaller()
  }
  return apiCallerInstance
}

export function resetUniversalAPICaller(): void {
  apiCallerInstance = null
}