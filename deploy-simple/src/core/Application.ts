import { PluginManager } from './plugins/PluginManager'
import { EventBus } from './events/EventBus'
import { ConfigManager, ConfigFactory } from './config/ConfigManager'
import { Service } from './types'
import { VideoService } from '../services/video/VideoService'
import { SoraVideoGenerator } from '../plugins/video/SoraVideoGenerator'
import { GeminiAIService } from '../plugins/ai/GeminiAIService'

export class Application {
  private pluginManager: PluginManager
  private eventBus: EventBus
  private configManager: ConfigManager
  private services: Map<string, Service> = new Map()

  constructor() {
    // 初始化核心组件
    this.pluginManager = new PluginManager()
    this.eventBus = new EventBus()
    this.configManager = new ConfigManager(ConfigFactory.createFromEnv())
    
    // 设置事件总线中间件
    this.setupEventBusMiddleware()
    
    // 注册核心服务
    this.registerCoreServices()
    
    // 注册插件
    this.registerPlugins()
  }

  private setupEventBusMiddleware(): void {
    // 添加日志中间件
    this.eventBus.addMiddleware({
      beforePublish: async (event) => {
        console.log(`Publishing event: ${event.type}`)
      },
      afterPublish: async (event) => {
        console.log(`Event ${event.type} published successfully`)
      }
    })
  }

  private registerCoreServices(): void {
    // 注册视频服务
    const videoService = new VideoService(this.eventBus, this.pluginManager)
    this.services.set('video-service', videoService)
  }

  private async registerPlugins(): Promise<void> {
    try {
      // 注册Sora视频生成插件
      const soraConfig = this.configManager.get('ai')
      const soraPlugin = new SoraVideoGenerator({
        apiKey: soraConfig.apiKey,
        model: soraConfig.model,
        baseUrl: soraConfig.baseUrl
      })
      await this.pluginManager.registerPlugin(soraPlugin)

      // 注册Gemini AI服务插件
      const geminiConfig = this.configManager.get('ai')
      const geminiPlugin = new GeminiAIService({
        apiKey: geminiConfig.apiKey,
        model: geminiConfig.model,
        baseUrl: geminiConfig.baseUrl
      })
      await this.pluginManager.registerPlugin(geminiPlugin)

      console.log('All plugins registered successfully')
    } catch (error) {
      console.error('Failed to register plugins:', error)
      throw error
    }
  }

  async start(): Promise<void> {
    try {
      console.log('Starting application...')
      
      // 检查所有服务的健康状态
      await this.healthCheck()
      
      console.log('Application started successfully')
    } catch (error) {
      console.error('Failed to start application:', error)
      throw error
    }
  }

  async stop(): Promise<void> {
    try {
      console.log('Stopping application...')
      
      // 停止所有服务
      for (const service of Array.from(this.services.values())) {
        // 这里可以添加服务停止逻辑
      }
      
      console.log('Application stopped successfully')
    } catch (error) {
      console.error('Failed to stop application:', error)
      throw error
    }
  }

  async healthCheck(): Promise<void> {
    const healthStatuses = await Promise.all(
      Array.from(this.services.values()).map(service => service.health())
    )

    const unhealthyServices = healthStatuses.filter(status => status.status !== 'healthy')
    
    if (unhealthyServices.length > 0) {
      throw new Error(`Unhealthy services: ${unhealthyServices.map(s => s.status).join(', ')}`)
    }
  }

  getService<T extends Service>(name: string): T | undefined {
    return this.services.get(name) as T | undefined
  }

  getPluginManager(): PluginManager {
    return this.pluginManager
  }

  getEventBus(): EventBus {
    return this.eventBus
  }

  getConfigManager(): ConfigManager {
    return this.configManager
  }

  // 扩展方法：注册新服务
  registerService(name: string, service: Service): void {
    this.services.set(name, service)
  }

  // 扩展方法：注册新插件
  async registerPlugin(plugin: any): Promise<void> {
    await this.pluginManager.registerPlugin(plugin)
  }

  // 扩展方法：获取所有服务
  getAllServices(): Service[] {
    return Array.from(this.services.values())
  }

  // 扩展方法：获取所有插件
  getAllPlugins() {
    return this.pluginManager.getAllPlugins()
  }
}
