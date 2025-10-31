/**
 * AI服务注册表
 * 
 * 管理所有AI服务的注册、发现和状态更新
 */

export type ServiceStatus = 'active' | 'inactive' | 'quota_exceeded' | 'error'

export interface ModelCapabilities {
  jsonMode: boolean
  vision: boolean
  search: boolean
  videoGeneration: boolean
  asr?: boolean
  videoUnderstanding?: boolean
}

export interface AIServiceDefinition {
  id: string
  name: string
  category: 'text' | 'vision' | 'video' | 'multimodal'
  capabilities: ModelCapabilities
  provider: string
  model: string
  status: ServiceStatus
  performance: {
    avgLatency: number
    successRate: number
    costPer1kTokens: number
  }
  health: {
    lastCheck: Date
    isHealthy: boolean
    errorRate: number
  }
  registeredAt: Date
  lastUpdated: Date
}

export interface ServiceCriteria {
  category: 'text' | 'vision' | 'video' | 'multimodal'
  capabilities?: Partial<ModelCapabilities>
  constraints?: {
    maxLatency?: number
    maxCost?: number
    preferredProviders?: string[]
    excludeProviders?: string[]
  }
  context?: {
    region?: string
    budgetTier?: 'low' | 'mid' | 'high'
    urgency?: 'low' | 'medium' | 'high'
  }
}

export class AIServiceRegistry {
  private services = new Map<string, AIServiceDefinition>()
  private logger = console
  private initialized = false

  /**
   * 初始化服务注册表（从配置文件自动注册）
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // 从 verified-models.json 加载已验证的模型
      const verifiedModels = this.loadVerifiedModels()
      
      // 为每个已验证的模型创建服务
      for (const model of verifiedModels) {
        const service = this.createServiceFromModel(model)
        if (service) {
          this.services.set(service.id, service)
        }
      }

      this.initialized = true
      this.logger.info(`AI服务注册表已初始化，注册了 ${this.services.size} 个服务`)
    } catch (error) {
      this.logger.error('初始化AI服务注册表失败:', error)
      throw error
    }
  }

  /**
   * 注册AI服务
   */
  register(service: Omit<AIServiceDefinition, 'registeredAt' | 'lastUpdated'>): void {
    const now = new Date()
    const serviceWithTimestamps: AIServiceDefinition = {
      ...service,
      registeredAt: now,
      lastUpdated: now
    }

    this.services.set(service.id, serviceWithTimestamps)
    this.logger.info(`AI服务已注册: ${service.id} (${service.provider}/${service.model})`)
  }

  /**
   * 发现符合条件的服务
   */
  discover(criteria: ServiceCriteria): AIServiceDefinition[] {
    const allServices = Array.from(this.services.values())
    
    return allServices
      .filter(service => this.matchesCriteria(service, criteria))
      .filter(service => service.status === 'active')
      .sort((a, b) => this.calculateScore(b, criteria) - this.calculateScore(a, criteria))
  }

  /**
   * 获取指定ID的服务
   */
  getService(id: string): AIServiceDefinition | null {
    return this.services.get(id) || null
  }

  /**
   * 更新服务状态
   */
  updateStatus(serviceId: string, status: ServiceStatus): void {
    const service = this.services.get(serviceId)
    if (service) {
      service.status = status
      service.lastUpdated = new Date()
      this.logger.info(`AI服务状态已更新: ${serviceId} -> ${status}`)
    } else {
      this.logger.warn(`尝试更新不存在的服务状态: ${serviceId}`)
    }
  }

  /**
   * 更新服务健康状态
   */
  updateHealth(serviceId: string, health: { isHealthy: boolean; errorRate: number }): void {
    const service = this.services.get(serviceId)
    if (service) {
      service.health = {
        ...service.health,
        ...health,
        lastCheck: new Date()
      }
      service.lastUpdated = new Date()
    }
  }

  /**
   * 更新服务性能指标
   */
  updatePerformance(serviceId: string, performance: Partial<AIServiceDefinition['performance']>): void {
    const service = this.services.get(serviceId)
    if (service) {
      service.performance = {
        ...service.performance,
        ...performance
      }
      service.lastUpdated = new Date()
    }
  }

  /**
   * 获取所有可用服务
   */
  getAvailableServices(): AIServiceDefinition[] {
    return Array.from(this.services.values()).filter(service => service.status === 'active')
  }

  /**
   * 获取所有服务（包括不可用的）
   */
  getAllServices(): AIServiceDefinition[] {
    return Array.from(this.services.values())
  }

  /**
   * 移除服务
   */
  unregister(serviceId: string): boolean {
    const existed = this.services.delete(serviceId)
    if (existed) {
      this.logger.info(`AI服务已移除: ${serviceId}`)
    }
    return existed
  }

  /**
   * 清空所有服务
   */
  clear(): void {
    this.services.clear()
    this.logger.info('所有AI服务已清空')
  }

  /**
   * 获取服务统计信息
   */
  getStats(): {
    total: number
    active: number
    inactive: number
    quotaExceeded: number
    error: number
  } {
    const services = Array.from(this.services.values())
    return {
      total: services.length,
      active: services.filter(s => s.status === 'active').length,
      inactive: services.filter(s => s.status === 'inactive').length,
      quotaExceeded: services.filter(s => s.status === 'quota_exceeded').length,
      error: services.filter(s => s.status === 'error').length
    }
  }

  /**
   * 检查服务是否匹配条件
   */
  private matchesCriteria(service: AIServiceDefinition, criteria: ServiceCriteria): boolean {
    // 检查类别
    if (service.category !== criteria.category) {
      return false
    }

    // 检查能力要求
    if (criteria.capabilities) {
      for (const [key, required] of Object.entries(criteria.capabilities)) {
        if (required !== undefined && service.capabilities[key as keyof ModelCapabilities] !== required) {
          return false
        }
      }
    }

    // 检查约束条件
    if (criteria.constraints) {
      const { maxLatency, maxCost, preferredProviders, excludeProviders } = criteria.constraints

      if (maxLatency && service.performance.avgLatency > maxLatency) {
        return false
      }

      if (maxCost && service.performance.costPer1kTokens > maxCost) {
        return false
      }

      if (preferredProviders && !preferredProviders.includes(service.provider)) {
        return false
      }

      if (excludeProviders && excludeProviders.includes(service.provider)) {
        return false
      }
    }

    return true
  }

  /**
   * 计算服务评分（用于排序）
   */
  private calculateScore(service: AIServiceDefinition, criteria: ServiceCriteria): number {
    let score = 0

    // 基础分数：成功率
    score += service.performance.successRate * 100

    // 性能分数：延迟越低分数越高
    const maxLatency = criteria.constraints?.maxLatency || 10000
    const latencyScore = Math.max(0, (maxLatency - service.performance.avgLatency) / maxLatency * 50)
    score += latencyScore

    // 成本分数：成本越低分数越高
    const maxCost = criteria.constraints?.maxCost || 0.01
    const costScore = Math.max(0, (maxCost - service.performance.costPer1kTokens) / maxCost * 30)
    score += costScore

    // 健康分数
    if (service.health.isHealthy) {
      score += 20
    }

    // 错误率分数：错误率越低分数越高
    const errorScore = Math.max(0, (1 - service.health.errorRate) * 20)
    score += errorScore

    // 上下文匹配分数
    if (criteria.context) {
      // 可以根据region、budgetTier等调整分数
      if (criteria.context.budgetTier === 'low' && service.performance.costPer1kTokens < 0.001) {
        score += 10
      }
      if (criteria.context.urgency === 'high' && service.performance.avgLatency < 2000) {
        score += 10
      }
    }

    return score
  }

  /**
   * 从 verified-models.json 加载已验证的模型
   */
  private loadVerifiedModels(): any[] {
    try {
      const fs = require('fs')
      const path = require('path')
      
      const filePath = path.join(process.cwd(), 'verified-models.json')
      if (!fs.existsSync(filePath)) {
        this.logger.warn('verified-models.json 不存在')
        return []
      }

      const data = fs.readFileSync(filePath, 'utf8')
      const models = JSON.parse(data)
      
      if (!Array.isArray(models)) {
        this.logger.warn('verified-models.json 格式错误')
        return []
      }

      return models.filter(m => m.status === 'verified')
    } catch (error) {
      this.logger.error('加载 verified-models.json 失败:', error)
      return []
    }
  }

  /**
   * 从模型配置创建服务定义
   */
  private createServiceFromModel(model: any): AIServiceDefinition | null {
    try {
      // Provider映射
      const providerMap: Record<string, string> = {
        'Google': 'gemini',
        'OpenAI': 'openai',
        'DeepSeek': 'deepseek',
        '字节跳动': 'doubao',
        'Anthropic': 'anthropic'
      }

      const provider = providerMap[model.provider] || model.provider.toLowerCase()
      const modelName = model.modelName || model.name || model.id
      
      // 检查是否有对应的API Key
      const hasApiKey = this.checkApiKey(provider)
      if (!hasApiKey) {
        this.logger.warn(`Provider ${provider} 未配置API Key，跳过注册`)
        return null
      }

      // 创建服务定义
      const service: AIServiceDefinition = {
        id: `${provider}-${model.id}`,
        name: modelName,
        category: 'text', // 默认为文本服务
        capabilities: {
          jsonMode: true,
          vision: false,
          search: provider === 'gemini',
          videoGeneration: false
        },
        provider,
        model: model.id,
        status: 'active',
        performance: {
          avgLatency: this.getDefaultLatency(provider),
          successRate: 0.95,
          costPer1kTokens: this.getDefaultCost(provider)
        },
        health: {
          lastCheck: new Date(),
          isHealthy: true,
          errorRate: 0.05
        },
        registeredAt: new Date(),
        lastUpdated: new Date()
      }

      return service
    } catch (error) {
      this.logger.error(`创建服务失败 (${model.id}):`, error)
      return null
    }
  }

  /**
   * 检查API Key是否存在
   */
  private checkApiKey(provider: string): boolean {
    // 手动加载环境变量文件
    const envVars = this.loadEnvVars()
    
    const keyMap: Record<string, string> = {
      gemini: 'GEMINI_API_KEY',
      openai: 'OPENAI_API_KEY',
      deepseek: 'DEEPSEEK_API_KEY',
      doubao: 'DOUBAO_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY'
    }

    const envKey = keyMap[provider]
    return envKey ? !!envVars[envKey] : false
  }

  /**
   * 手动加载环境变量文件
   */
  private loadEnvVars(): Record<string, string> {
    const envVars: Record<string, string> = {}
    
    // 尝试加载 .env.local
    try {
      const fs = require('fs')
      const path = require('path')
      const envLocalPath = path.join(process.cwd(), '.env.local')
      if (fs.existsSync(envLocalPath)) {
        const envContent = fs.readFileSync(envLocalPath, 'utf8')
        const lines = envContent.split('\n')
        
        for (const line of lines) {
          const trimmedLine = line.trim()
          if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=')
            if (key && valueParts.length > 0) {
              let value = valueParts.join('=')
              // 移除引号
              if ((value.startsWith('"') && value.endsWith('"')) || 
                  (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1)
              }
              envVars[key.trim()] = value
            }
          }
        }
      }
    } catch (error) {
      this.logger.warn('加载 .env.local 失败:', error)
    }
    
    return envVars
  }

  /**
   * 获取默认延迟
   */
  private getDefaultLatency(provider: string): number {
    const latencies: Record<string, number> = {
      gemini: 1200,
      openai: 1500,
      deepseek: 2000,
      doubao: 1800,
      anthropic: 1600
    }
    return latencies[provider] || 2000
  }

  /**
   * 获取默认成本
   */
  private getDefaultCost(provider: string): number {
    const costs: Record<string, number> = {
      gemini: 0.0001,
      openai: 0.0006,
      deepseek: 0.0002,
      doubao: 0.0008,
      anthropic: 0.003
    }
    return costs[provider] || 0.001
  }
}

// 单例实例
let registryInstance: AIServiceRegistry | null = null

export function getAIServiceRegistry(): AIServiceRegistry {
  if (!registryInstance) {
    registryInstance = new AIServiceRegistry()
  }
  return registryInstance
}

export function resetAIServiceRegistry(): void {
  registryInstance = null
}
