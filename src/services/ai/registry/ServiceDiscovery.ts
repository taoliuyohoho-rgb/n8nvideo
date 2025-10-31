/**
 * AI服务发现器
 * 
 * 智能选择最适合的AI服务，支持降级和容错
 */

import { AIServiceRegistry, AIServiceDefinition, ServiceCriteria, getAIServiceRegistry } from './AIServiceRegistry'

export interface DiscoveryOptions {
  enableFallback?: boolean
  maxFallbackAttempts?: number
  healthCheckTimeout?: number
  excludeServices?: string[]
}

export interface DiscoveryResult {
  service: AIServiceDefinition
  isFallback: boolean
  fallbackReason?: string
  discoveryTime: number
}

export class ServiceDiscovery {
  private registry: AIServiceRegistry
  private logger = console // 后续可以替换为统一的logger
  private healthCheckCache = new Map<string, { isHealthy: boolean; lastCheck: Date }>()
  private readonly HEALTH_CHECK_CACHE_TTL = 30000 // 30秒

  constructor(registry: AIServiceRegistry) {
    this.registry = registry
  }

  /**
   * 查找最佳服务
   * 集成现有推荐系统，根据业务模块推荐最佳模型
   */
  async findBestService(
    criteria: ServiceCriteria, 
    options: DiscoveryOptions = {}
  ): Promise<DiscoveryResult> {
    const startTime = Date.now()
    const {
      enableFallback = true,
      maxFallbackAttempts = 3,
      healthCheckTimeout = 5000,
      excludeServices = []
    } = options

    try {
      // 1. 使用现有推荐系统推荐模型
      const recommendedService = await this.recommendServiceByBusinessModule(criteria)
      
      if (!recommendedService) {
        throw new Error(`没有找到符合条件的AI服务 (category: ${criteria.category})`)
      }

      // 2. 检查服务健康状态
      const isHealthy = await this.healthCheck(recommendedService, healthCheckTimeout)
      
      if (!isHealthy && enableFallback) {
        // 3. 如果推荐的服务不健康，尝试降级
        this.logger.warn(`推荐服务健康检查失败: ${recommendedService.id}，尝试降级`)
        
        let fallbackService: AIServiceDefinition | null = null
        let fallbackReason: string | undefined

        // 获取其他可用服务
        const allServices = this.registry.discover(criteria)
        const otherServices = allServices.filter(service => 
          service.id !== recommendedService.id && 
          !excludeServices.includes(service.id)
        )

        for (let i = 0; i < Math.min(otherServices.length, maxFallbackAttempts); i++) {
          const service = otherServices[i]
          const isServiceHealthy = await this.healthCheck(service, healthCheckTimeout)
          
          if (isServiceHealthy) {
            fallbackService = service
            fallbackReason = `推荐服务 ${recommendedService.id} 不健康，使用降级服务 ${service.id}`
            break
          }
        }

        if (!fallbackService) {
          throw new Error('所有可用服务都不可用')
        }

        const discoveryTime = Date.now() - startTime
        this.logger.info(`服务发现完成: ${fallbackService.id} (降级) - ${discoveryTime}ms`)

        return {
          service: fallbackService,
          isFallback: true,
          fallbackReason,
          discoveryTime
        }
      }

      if (!isHealthy) {
        throw new Error(`推荐服务不可用: ${recommendedService.id}`)
      }

      const discoveryTime = Date.now() - startTime
      this.logger.info(`服务发现完成: ${recommendedService.id} (推荐) - ${discoveryTime}ms`)

      return {
        service: recommendedService,
        isFallback: false,
        discoveryTime
      }

    } catch (error) {
      const discoveryTime = Date.now() - startTime
      this.logger.error(`服务发现失败: ${error instanceof Error ? error.message : '未知错误'} - ${discoveryTime}ms`)
      throw error
    }
  }

  /**
   * 使用现有推荐系统根据业务模块推荐服务
   */
  private async recommendServiceByBusinessModule(criteria: ServiceCriteria): Promise<AIServiceDefinition | null> {
    try {
      // 导入推荐系统
      const { recommendRank } = await import('../../recommendation/recommend')
      
      // 构建推荐请求
      const recommendRequest = {
        scenario: 'task->model' as const,
        task: {
          taskType: this.mapCategoryToTaskType(criteria.category),
          language: 'zh',
          jsonRequirement: criteria.capabilities?.jsonMode || false,
          budgetTier: criteria.context?.budgetTier || 'mid'
        },
        context: {
          region: criteria.context?.region || 'CN',
          channel: 'web',
          budgetTier: criteria.context?.budgetTier || 'mid'
        },
        constraints: {
          requireJsonMode: criteria.capabilities?.jsonMode || false,
          maxCostUSD: criteria.constraints?.maxCost,
          allowProviders: criteria.constraints?.preferredProviders,
          denyProviders: criteria.constraints?.excludeProviders
        }
      }

      this.logger.info('调用推荐系统:', JSON.stringify(recommendRequest, null, 2))

      // 调用推荐系统
      const recommendation = await recommendRank(recommendRequest)
      
      this.logger.info('推荐系统返回:', JSON.stringify(recommendation, null, 2))
      
      if (!recommendation.chosen) {
        this.logger.warn('推荐系统没有返回选择的服务')
        return null
      }

      // 根据推荐结果找到对应的服务
      const allServices = this.registry.getAllServices()
      
      // 解析推荐结果中的provider和model
      const chosenName = recommendation.chosen.name || recommendation.chosen.title
      if (!chosenName) {
        this.logger.warn('推荐结果中没有找到服务名称')
        return null
      }
      const [provider, model] = chosenName.split('/')
      
      this.logger.info(`解析推荐结果: provider=${provider}, model=${model}`)
      
      const recommendedService = allServices.find(service => 
        service.provider === provider &&
        service.model === model
      )

      if (recommendedService) {
        this.logger.info(`推荐系统推荐: ${recommendedService.id} (${recommendation.chosen.fineScore?.toFixed(2)}分)`)
      } else {
        this.logger.warn(`推荐系统推荐的服务 ${provider}/${model} 在注册表中未找到`)
        this.logger.info('可用服务:', allServices.map(s => `${s.provider}/${s.model}`))
      }

      return recommendedService || null

    } catch (error) {
      this.logger.warn('推荐系统调用失败，使用默认选择逻辑:', error)
      
      // 降级到简单的服务发现
      const services = this.registry.discover(criteria)
      return services.length > 0 ? services[0] : null
    }
  }

  /**
   * 将服务类别映射到任务类型
   */
  private mapCategoryToTaskType(category: string): string {
    const categoryMap: Record<string, string> = {
      'text': 'product-analysis',
      'vision': 'vision',
      'video': 'video-script',
      'multimodal': 'ai-reverse-engineer'
    }
    return categoryMap[category] || 'product-analysis'
  }

  /**
   * 获取降级服务列表
   */
  async getFallbackServices(
    primaryService: AIServiceDefinition, 
    criteria: ServiceCriteria
  ): Promise<AIServiceDefinition[]> {
    const allServices = this.registry.discover(criteria)
    return allServices.filter(service => service.id !== primaryService.id)
  }

  /**
   * 健康检查
   */
  async healthCheck(service: AIServiceDefinition, timeout: number = 5000): Promise<boolean> {
    const cacheKey = service.id
    const cached = this.healthCheckCache.get(cacheKey)
    
    // 检查缓存
    if (cached && Date.now() - cached.lastCheck.getTime() < this.HEALTH_CHECK_CACHE_TTL) {
      return cached.isHealthy
    }

    try {
      // 执行健康检查
      const isHealthy = await this.performHealthCheck(service, timeout)
      
      // 更新缓存
      this.healthCheckCache.set(cacheKey, {
        isHealthy,
        lastCheck: new Date()
      })

      // 更新服务健康状态
      this.registry.updateHealth(service.id, { isHealthy, errorRate: isHealthy ? 0 : 1 })

      return isHealthy

    } catch (error) {
      this.logger.warn(`健康检查异常: ${service.id} - ${error instanceof Error ? error.message : '未知错误'}`)
      
      // 更新缓存（失败）
      this.healthCheckCache.set(cacheKey, {
        isHealthy: false,
        lastCheck: new Date()
      })

      return false
    }
  }

  /**
   * 执行实际健康检查
   */
  private async performHealthCheck(service: AIServiceDefinition, timeout: number): Promise<boolean> {
    // 创建超时Promise
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), timeout)
    })

    // 创建健康检查Promise
    const healthCheckPromise = this.doHealthCheck(service)

    try {
      // 等待健康检查完成或超时
      return await Promise.race([healthCheckPromise, timeoutPromise])
    } catch (error) {
      return false
    }
  }

  /**
   * 执行具体的健康检查逻辑
   */
  private async doHealthCheck(service: AIServiceDefinition): Promise<boolean> {
    // 这里可以根据不同的provider实现不同的健康检查逻辑
    // 目前先实现一个简单的检查
    
    switch (service.provider) {
      case 'gemini':
        return await this.checkGeminiHealth(service)
      case 'openai':
        return await this.checkOpenAIHealth(service)
      case 'deepseek':
        return await this.checkDeepSeekHealth(service)
      case 'doubao':
        return await this.checkDoubaoHealth(service)
      default:
        // 默认检查：如果服务状态是active且最近有更新，认为健康
        return service.status === 'active' && 
               Date.now() - service.lastUpdated.getTime() < 300000 // 5分钟内更新过
    }
  }

  /**
   * Gemini健康检查
   */
  private async checkGeminiHealth(service: AIServiceDefinition): Promise<boolean> {
    try {
      // 这里可以调用Gemini的API进行健康检查
      // 目前先返回true，后续可以完善
      return true
    } catch {
      return false
    }
  }

  /**
   * OpenAI健康检查
   */
  private async checkOpenAIHealth(service: AIServiceDefinition): Promise<boolean> {
    try {
      // 这里可以调用OpenAI的API进行健康检查
      // 目前先返回true，后续可以完善
      return true
    } catch {
      return false
    }
  }

  /**
   * DeepSeek健康检查
   */
  private async checkDeepSeekHealth(service: AIServiceDefinition): Promise<boolean> {
    try {
      // 这里可以调用DeepSeek的API进行健康检查
      // 目前先返回true，后续可以完善
      return true
    } catch {
      return false
    }
  }

  /**
   * 豆包健康检查
   */
  private async checkDoubaoHealth(service: AIServiceDefinition): Promise<boolean> {
    try {
      // 这里可以调用豆包的API进行健康检查
      // 目前先返回true，后续可以完善
      return true
    } catch {
      return false
    }
  }

  /**
   * 清除健康检查缓存
   */
  clearHealthCheckCache(): void {
    this.healthCheckCache.clear()
    this.logger.info('健康检查缓存已清除')
  }

  /**
   * 获取健康检查统计
   */
  getHealthCheckStats(): {
    total: number
    healthy: number
    unhealthy: number
    cacheHitRate: number
  } {
    const services = this.registry.getAllServices()
    const cached = Array.from(this.healthCheckCache.values())
    
    return {
      total: services.length,
      healthy: cached.filter(c => c.isHealthy).length,
      unhealthy: cached.filter(c => !c.isHealthy).length,
      cacheHitRate: cached.length / services.length
    }
  }
}

// 单例实例
let discoveryInstance: ServiceDiscovery | null = null

export async function getServiceDiscovery(): Promise<ServiceDiscovery> {
  if (!discoveryInstance) {
    const registry = getAIServiceRegistry()
    await registry.initialize() // 确保registry已初始化
    discoveryInstance = new ServiceDiscovery(registry)
  }
  return discoveryInstance
}

export function resetServiceDiscovery(): void {
  discoveryInstance = null
}

