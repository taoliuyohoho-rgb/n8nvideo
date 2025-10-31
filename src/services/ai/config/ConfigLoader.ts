/**
 * 配置加载器
 * 
 * 动态加载现有配置文件，避免硬编码
 */

import fs from 'fs'
import path from 'path'

// 加载环境变量
try {
  require('dotenv').config({ path: '.env.local' })
  require('dotenv').config({ path: '.env' })
} catch (error) {
  // dotenv 可能没有安装，忽略错误
}

export interface ProviderConfig {
  name: string
  apiKey: string
  baseUrl?: string
  timeout?: number
  maxRetries?: number
  rateLimit?: {
    requestsPerMinute: number
    tokensPerMinute: number
  }
}

export interface BusinessModuleConfig {
  name: string
  preferredModels: string[]
  fallbackModels: string[]
  maxTokens: number
  temperature: number
  timeout: number
}

export interface AIConfig {
  providers: Record<string, ProviderConfig>
  businessModules: Record<string, BusinessModuleConfig>
  defaultSettings: {
    maxTokens: number
    temperature: number
    timeout: number
  }
}

export class ConfigLoader {
  private static instance: ConfigLoader | null = null
  private config: AIConfig | null = null
  private logger = console

  private constructor() {}

  static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader()
    }
    return ConfigLoader.instance
  }

  async loadConfig(): Promise<AIConfig> {
    if (this.config) {
      return this.config
    }

    try {
      this.logger.info('开始加载AI配置...')
      
      // 1. 加载业务模块配置
      const businessModules = await this.loadBusinessModules()
      
      // 2. 加载provider配置
      const providers = await this.loadProviders()
      
      // 3. 加载默认设置
      const defaultSettings = this.loadDefaultSettings()

      this.config = {
        providers,
        businessModules,
        defaultSettings
      }

      this.logger.info(`配置加载完成: ${Object.keys(providers).length}个providers, ${Object.keys(businessModules).length}个业务模块`)
      return this.config
    } catch (error) {
      this.logger.error('配置加载失败:', error)
      throw error
    }
  }

  private async loadBusinessModules(): Promise<Record<string, BusinessModuleConfig>> {
    try {
      // 从ai-config.json加载业务模块
      const configPath = path.join(process.cwd(), 'ai-config.json')
      if (!fs.existsSync(configPath)) {
        this.logger.warn('ai-config.json 不存在，使用默认业务模块配置')
        return this.getDefaultBusinessModules()
      }

      const configData = fs.readFileSync(configPath, 'utf8')
      const aiConfig = JSON.parse(configData)
      
      const businessModules: Record<string, BusinessModuleConfig> = {}
      
      // 为每个业务模块创建配置
      for (const [moduleName, modelPreference] of Object.entries(aiConfig)) {
        businessModules[moduleName] = {
          name: moduleName,
          preferredModels: modelPreference === 'auto' ? [] : [modelPreference as string],
          fallbackModels: [],
          maxTokens: 4000,
          temperature: 0.7,
          timeout: 30000
        }
      }

      return businessModules
    } catch (error) {
      this.logger.error('加载业务模块配置失败:', error)
      return this.getDefaultBusinessModules()
    }
  }

  private async loadProviders(): Promise<Record<string, ProviderConfig>> {
    const providers: Record<string, ProviderConfig> = {}
    
    // 手动加载环境变量文件
    const envVars = this.loadEnvVars()
    
    // 从环境变量加载所有provider配置
    const providerEnvMap = {
      'gemini': {
        apiKey: envVars.GEMINI_API_KEY,
        baseUrl: envVars.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta'
      },
      'openai': {
        apiKey: envVars.OPENAI_API_KEY,
        baseUrl: envVars.OPENAI_BASE_URL || 'https://api.openai.com/v1'
      },
      'deepseek': {
        apiKey: envVars.DEEPSEEK_API_KEY,
        baseUrl: envVars.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'
      },
      'doubao': {
        apiKey: envVars.DOUBAO_API_KEY,
        baseUrl: envVars.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'
      },
      'anthropic': {
        apiKey: envVars.ANTHROPIC_API_KEY,
        baseUrl: envVars.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1'
      }
    }

    // 调试：打印环境变量状态
    this.logger.info('环境变量检查:')
    for (const [provider, config] of Object.entries(providerEnvMap)) {
      this.logger.info(`  ${provider}: ${config.apiKey ? '有Key' : '无Key'} (${config.apiKey ? config.apiKey.substring(0, 10) + '...' : 'undefined'})`)
    }

    for (const [providerName, config] of Object.entries(providerEnvMap)) {
      if (config.apiKey) {
        providers[providerName] = {
          name: providerName,
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          timeout: parseInt(process.env[`${providerName.toUpperCase()}_TIMEOUT`] || '30000'),
          maxRetries: parseInt(process.env[`${providerName.toUpperCase()}_MAX_RETRIES`] || '3'),
          rateLimit: {
            requestsPerMinute: parseInt(process.env[`${providerName.toUpperCase()}_RPM`] || '60'),
            tokensPerMinute: parseInt(process.env[`${providerName.toUpperCase()}_TPM`] || '100000')
          }
        }
        this.logger.info(`加载provider配置: ${providerName}`)
      } else {
        this.logger.warn(`Provider ${providerName} 未配置API Key，跳过`)
      }
    }

    return providers
  }

  private loadDefaultSettings() {
    return {
      maxTokens: parseInt(process.env.AI_DEFAULT_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.AI_DEFAULT_TEMPERATURE || '0.7'),
      timeout: parseInt(process.env.AI_DEFAULT_TIMEOUT || '30000')
    }
  }

  private getDefaultBusinessModules(): Record<string, BusinessModuleConfig> {
    return {
      'videoScriptGeneration': {
        name: 'videoScriptGeneration',
        preferredModels: [],
        fallbackModels: [],
        maxTokens: 4000,
        temperature: 0.7,
        timeout: 30000
      },
      'promptGeneration': {
        name: 'promptGeneration',
        preferredModels: [],
        fallbackModels: [],
        maxTokens: 2000,
        temperature: 0.8,
        timeout: 20000
      },
      'videoRanking': {
        name: 'videoRanking',
        preferredModels: [],
        fallbackModels: [],
        maxTokens: 1000,
        temperature: 0.3,
        timeout: 15000
      },
      'competitorAnalysis': {
        name: 'competitorAnalysis',
        preferredModels: [],
        fallbackModels: [],
        maxTokens: 6000,
        temperature: 0.5,
        timeout: 45000
      },
      'videoAnalysis': {
        name: 'videoAnalysis',
        preferredModels: [],
        fallbackModels: [],
        maxTokens: 5000,
        temperature: 0.6,
        timeout: 40000
      },
      'productAnalysis': {
        name: 'productAnalysis',
        preferredModels: [],
        fallbackModels: [],
        maxTokens: 5000,
        temperature: 0.6,
        timeout: 40000
      }
    }
  }

  getConfig(): AIConfig | null {
    return this.config
  }

  getProviderConfig(providerName: string): ProviderConfig | null {
    return this.config?.providers[providerName] || null
  }

  getBusinessModuleConfig(moduleName: string): BusinessModuleConfig | null {
    return this.config?.businessModules[moduleName] || null
  }

  getDefaultSettings() {
    return this.config?.defaultSettings || this.loadDefaultSettings()
  }

  async reloadConfig(): Promise<AIConfig> {
    this.config = null
    return this.loadConfig()
  }

  static resetInstance(): void {
    ConfigLoader.instance = null
  }

  /**
   * 手动加载环境变量文件
   */
  private loadEnvVars(): Record<string, string> {
    const envVars: Record<string, string> = {}
    
    // 尝试加载 .env.local
    try {
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
    
    // 尝试加载 .env
    try {
      const envPath = path.join(process.cwd(), '.env')
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8')
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
              // .env.local 优先级更高，不覆盖已存在的值
              if (!envVars[key.trim()]) {
                envVars[key.trim()] = value
              }
            }
          }
        }
      }
    } catch (error) {
      this.logger.warn('加载 .env 失败:', error)
    }
    
    return envVars
  }
}

export const getConfigLoader = () => ConfigLoader.getInstance()

export const resetConfigLoader = (): void => {
  ConfigLoader.resetInstance()
}