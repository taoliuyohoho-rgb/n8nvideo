import { PluginConfig } from '../types'

export interface AppConfig {
  database: DatabaseConfig
  redis: RedisConfig
  ai: AIConfig
  storage: StorageConfig
  monitoring: MonitoringConfig
  features: FeatureFlags
}

export interface DatabaseConfig {
  url: string
  host?: string
  port?: number
  username?: string
  password?: string
  database?: string
  ssl?: boolean
}

export interface RedisConfig {
  url: string
  host?: string
  port?: number
  password?: string
  db?: number
}

export interface AIConfig {
  provider: string
  apiKey: string
  model: string
  baseUrl?: string
}

export interface StorageConfig {
  provider: string
  bucket: string
  region?: string
  accessKey?: string
  secretKey?: string
}

export interface MonitoringConfig {
  enabled: boolean
  metrics: boolean
  logging: boolean
  tracing: boolean
}

export interface FeatureFlags {
  [key: string]: boolean
}

export class ConfigManager {
  private config: AppConfig

  constructor(config: AppConfig) {
    this.config = config
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key]
  }

  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.config[key] = value
  }

  getFeatureFlag(name: string): boolean {
    return this.config.features[name] || false
  }

  setFeatureFlag(name: string, enabled: boolean): void {
    this.config.features[name] = enabled
  }

  getPluginConfig(pluginName: string): PluginConfig | undefined {
    // 从配置中获取插件配置
    const configValue = this.config[pluginName as keyof AppConfig]
    if (configValue && typeof configValue === 'object' && 'enabled' in configValue && 'settings' in configValue) {
      return configValue as unknown as PluginConfig
    }
    return undefined
  }

  setPluginConfig(pluginName: string, config: PluginConfig): void {
    // 设置插件配置
    this.config[pluginName as keyof AppConfig] = config as any
  }

  getAllConfig(): AppConfig {
    return { ...this.config }
  }

  updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  // 环境相关配置
  isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development'
  }

  isProduction(): boolean {
    return process.env.NODE_ENV === 'production'
  }

  isTest(): boolean {
    return process.env.NODE_ENV === 'test'
  }
}

// 配置工厂
export class ConfigFactory {
  static createFromEnv(): AppConfig {
    return {
      database: {
        url: process.env.DATABASE_URL || 'file:./dev.db'
      },
      redis: {
        url: process.env.REDIS_URL || ''
      },
      ai: {
        provider: process.env.AI_PROVIDER || 'gemini',
        apiKey: process.env.AI_API_KEY || '',
        model: process.env.AI_MODEL || 'gemini-1.5-pro',
        baseUrl: process.env.AI_BASE_URL
      },
      storage: {
        provider: process.env.STORAGE_PROVIDER || 'local',
        bucket: process.env.STORAGE_BUCKET || 'uploads',
        region: process.env.STORAGE_REGION,
        accessKey: process.env.STORAGE_ACCESS_KEY,
        secretKey: process.env.STORAGE_SECRET_KEY
      },
      monitoring: {
        enabled: process.env.MONITORING_ENABLED === 'true',
        metrics: process.env.METRICS_ENABLED === 'true',
        logging: process.env.LOGGING_ENABLED === 'true',
        tracing: process.env.TRACING_ENABLED === 'true'
      },
      features: {
        'video-generation': process.env.FEATURE_VIDEO_GENERATION === 'true',
        'ai-analysis': process.env.FEATURE_AI_ANALYSIS === 'true',
        'advanced-analytics': process.env.FEATURE_ADVANCED_ANALYTICS === 'true',
        'multi-tenant': process.env.FEATURE_MULTI_TENANT === 'true'
      }
    }
  }

  static createDefault(): AppConfig {
    return {
      database: {
        url: 'file:./dev.db'
      },
      redis: {
        url: ''
      },
      ai: {
        provider: 'gemini',
        apiKey: '',
        model: 'gemini-1.5-pro'
      },
      storage: {
        provider: 'local',
        bucket: 'uploads'
      },
      monitoring: {
        enabled: true,
        metrics: true,
        logging: true,
        tracing: false
      },
      features: {
        'video-generation': true,
        'ai-analysis': true,
        'advanced-analytics': false,
        'multi-tenant': false
      }
    }
  }
}
