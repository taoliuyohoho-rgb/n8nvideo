/**
 * AI服务适配器
 * 
 * 提供统一的AI服务调用接口，屏蔽不同provider的差异
 */

import { AIServiceDefinition } from '../registry/AIServiceRegistry'
import { UniversalAPICaller, getUniversalAPICaller, CallOptions, APIResponse } from './UniversalAPICaller'

export interface AIResponse {
  success: boolean
  data?: string
  error?: string
  service: AIServiceDefinition
  latency: number
  tokens?: {
    input: number
    output: number
    total: number
  }
  cost?: number
  metadata?: Record<string, any>
}

export class AIServiceAdapter {
  private service: AIServiceDefinition
  private apiCaller: UniversalAPICaller
  private logger = console

  constructor(service: AIServiceDefinition) {
    this.service = service
    this.apiCaller = getUniversalAPICaller()
  }

  /**
   * 统一调用接口
   */
  async call(prompt: string, options: CallOptions = {}): Promise<AIResponse> {
    const startTime = Date.now()
    
    try {
      this.logger.info(`调用AI服务: ${this.service.id} (${this.service.provider}/${this.service.model})`)
      
      // 使用通用API调用器
      const result: APIResponse = await this.apiCaller.call(
        this.service.provider,
        this.service.model,
        prompt,
        options
      )

      const latency = Date.now() - startTime
      
      // 记录成功调用
      this.recordSuccess(latency, result.tokens, result.cost)

      return {
        success: true,
        data: result.text,
        service: this.service,
        latency,
        tokens: result.tokens,
        cost: result.cost,
        metadata: {
          provider: this.service.provider,
          model: this.service.model,
          capabilities: this.service.capabilities,
          ...result.metadata
        }
      }

    } catch (error) {
      const latency = Date.now() - startTime
      
      // 记录失败调用
      this.recordError(error, latency)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        service: this.service,
        latency,
        metadata: {
          provider: this.service.provider,
          model: this.service.model,
          errorType: error instanceof Error ? error.constructor.name : 'UnknownError'
        }
      }
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      // 发送一个简单的健康检查请求
      const response = await this.call('Hello', { maxTokens: 1 })
      return response.success
    } catch {
      return false
    }
  }

  /**
   * 获取服务信息
   */
  getServiceInfo(): AIServiceDefinition {
    return this.service
  }

  /**
   * 记录成功调用
   */
  private recordSuccess(
    latency: number, 
    tokens?: { input: number; output: number; total: number },
    cost?: number
  ): void {
    // 更新服务性能指标
    const registry = getAIServiceRegistry()
    
    // 计算新的平均延迟
    const currentLatency = this.service.performance.avgLatency
    const newLatency = (currentLatency + latency) / 2
    
    // 计算新的成功率
    const currentSuccessRate = this.service.performance.successRate
    const newSuccessRate = Math.min(1, currentSuccessRate + 0.01) // 成功调用增加成功率
    
    registry.updatePerformance(this.service.id, {
      avgLatency: newLatency,
      successRate: newSuccessRate
    })

    this.logger.info(`AI服务调用成功: ${this.service.id} - ${latency}ms${tokens ? ` (${tokens.total} tokens)` : ''}${cost ? ` ($${cost.toFixed(4)})` : ''}`)
  }

  /**
   * 记录失败调用
   */
  private recordError(error: unknown, latency: number): void {
    // 更新服务健康状态
    const registry = getAIServiceRegistry()
    
    // 计算新的错误率
    const currentErrorRate = this.service.health.errorRate
    const newErrorRate = Math.min(1, currentErrorRate + 0.1) // 失败调用增加错误率
    
    registry.updateHealth(this.service.id, {
      isHealthy: newErrorRate < 0.5, // 错误率超过50%认为不健康
      errorRate: newErrorRate
    })

    this.logger.error(`AI服务调用失败: ${this.service.id} - ${error instanceof Error ? error.message : '未知错误'} - ${latency}ms`)
  }
}

// 导入注册表（避免循环依赖）
import { getAIServiceRegistry } from '../registry/AIServiceRegistry'
