// 分析服务编排器

import { UserInputHandler } from '../input/UserInputHandler'
import { WebScrapingHandler } from '../input/WebScrapingHandler'
import { AIGeneratedHandler } from '../input/AIGeneratedHandler'
import { InputNormalizer } from '../input/InputNormalizer'
import { TextAnalysisEngine } from '../analysis/TextAnalysisEngine'
import { ImageAnalysisEngine } from '../analysis/ImageAnalysisEngine'
import { VideoAnalysisEngine } from '../analysis/VideoAnalysisEngine'
import { MultimodalAnalysisEngine } from '../analysis/MultimodalAnalysisEngine'
import { ProductAnalysisOutput } from '../output/ProductAnalysisOutput'
import { PromptTemplateOutput } from '../output/PromptTemplateOutput'
import { GenericOutput } from '../output/GenericOutput'
import type { 
  AnalysisOrchestrationRequest, 
  AnalysisOrchestrationResult, 
  OrchestrationStep,
  OrchestrationPipeline 
} from './types'

export class AnalysisOrchestrator {
  private inputHandlers: Map<string, any> = new Map()
  private analysisEngines: Map<string, any> = new Map()
  private outputHandlers: Map<string, any> = new Map()
  private normalizer: InputNormalizer = new InputNormalizer()

  constructor() {
    this.initializeHandlers()
    this.normalizer = new InputNormalizer()
  }

  /**
   * 初始化处理器
   */
  private initializeHandlers() {
    // 输入处理器
    this.inputHandlers.set('user', new UserInputHandler())
    this.inputHandlers.set('scraping', new WebScrapingHandler())
    this.inputHandlers.set('ai-generated', new AIGeneratedHandler())

    // 分析引擎
    this.analysisEngines.set('text', new TextAnalysisEngine())
    this.analysisEngines.set('image', new ImageAnalysisEngine())
    this.analysisEngines.set('video', new VideoAnalysisEngine())
    this.analysisEngines.set('multimodal', new MultimodalAnalysisEngine())

    // 输出处理器
    this.outputHandlers.set('product-analysis', new ProductAnalysisOutput())
    this.outputHandlers.set('prompt-template', new PromptTemplateOutput())
    this.outputHandlers.set('generic', new GenericOutput())
  }

  /**
   * 执行分析编排
   */
  async execute(request: AnalysisOrchestrationRequest): Promise<AnalysisOrchestrationResult> {
    const startTime = Date.now()
    const steps: Array<{ step: string; duration: number; success: boolean; error?: string }> = []

    try {
      // 1. 输入处理步骤
      const inputResult = await this.executeStep('input-processing', async () => {
        return await this.processInput(request)
      }, steps)

      // 2. 数据标准化步骤
      const normalizedResult = await this.executeStep('data-normalization', async () => {
        return await this.normalizer.normalize(inputResult)
      }, steps)

      // 3. 分析处理步骤
      const analysisResult = await this.executeStep('analysis-processing', async () => {
        return await this.processAnalysis(normalizedResult, request)
      }, steps)

      // 4. 输出处理步骤
      const outputResult = await this.executeStep('output-processing', async () => {
        return await this.processOutput(analysisResult, request)
      }, steps)

      return {
        success: true,
        data: outputResult,
        metadata: {
          scenario: request.businessScenario,
          processingTime: Date.now() - startTime,
          steps,
          timestamp: new Date()
        }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        metadata: {
          scenario: request.businessScenario,
          processingTime: Date.now() - startTime,
          steps,
          timestamp: new Date()
        },
        error: error instanceof Error ? error.message : '分析编排执行失败'
      }
    }
  }

  /**
   * 执行单个步骤
   */
  private async executeStep(
    stepName: string, 
    stepFunction: () => Promise<any>, 
    steps: Array<{ step: string; duration: number; success: boolean; error?: string }>
  ): Promise<any> {
    const stepStartTime = Date.now()
    
    try {
      const result = await stepFunction()
      steps.push({
        step: stepName,
        duration: Date.now() - stepStartTime,
        success: true
      })
      return result
    } catch (error) {
      steps.push({
        step: stepName,
        duration: Date.now() - stepStartTime,
        success: false,
        error: error instanceof Error ? error.message : '步骤执行失败'
      })
      throw error
    }
  }

  /**
   * 处理输入数据
   */
  private async processInput(request: AnalysisOrchestrationRequest): Promise<any> {
    const { input } = request

    // 根据输入类型选择处理器
    let handler
    if (input.type === 'text' || input.type === 'image' || input.type === 'video') {
      handler = this.inputHandlers.get('user')
    } else if (input.metadata?.source === 'scraping') {
      handler = this.inputHandlers.get('scraping')
    } else if (input.metadata?.source === 'ai-generated') {
      handler = this.inputHandlers.get('ai-generated')
    } else {
      handler = this.inputHandlers.get('user')
    }

    if (!handler) {
      throw new Error('没有找到合适的输入处理器')
    }

    return await handler.handle(input)
  }

  /**
   * 处理分析数据
   */
  private async processAnalysis(normalizedData: any, request: AnalysisOrchestrationRequest): Promise<any> {
    const { businessScenario } = request

    // 根据业务场景和输入类型选择分析引擎
    let engine
    if (businessScenario === 'product-analysis' || businessScenario === 'competitor-analysis') {
      if (normalizedData.images && normalizedData.images.length > 0 && normalizedData.text) {
        engine = this.analysisEngines.get('multimodal')
      } else if (normalizedData.images && normalizedData.images.length > 0) {
        engine = this.analysisEngines.get('image')
      } else {
        engine = this.analysisEngines.get('text')
      }
    } else if (businessScenario === 'video-analysis') {
      engine = this.analysisEngines.get('video')
    } else if (businessScenario === 'image-analysis') {
      engine = this.analysisEngines.get('image')
    } else if (businessScenario === 'text-analysis') {
      engine = this.analysisEngines.get('text')
    } else {
      // 通用场景，根据数据类型选择
      if (normalizedData.images && normalizedData.images.length > 0 && normalizedData.text) {
        engine = this.analysisEngines.get('multimodal')
      } else if (normalizedData.images && normalizedData.images.length > 0) {
        engine = this.analysisEngines.get('image')
      } else if (normalizedData.video) {
        engine = this.analysisEngines.get('video')
      } else {
        engine = this.analysisEngines.get('text')
      }
    }

    if (!engine) {
      throw new Error('没有找到合适的分析引擎')
    }

    // 构建分析请求
    const analysisRequest = {
      content: normalizedData.text || normalizedData.images?.[0] || normalizedData.video,
      images: normalizedData.images,
      type: request.input.type,
      context: request.context
    }

    return await engine.analyzeText(analysisRequest)
  }

  /**
   * 处理输出数据
   */
  private async processOutput(analysisResult: any, request: AnalysisOrchestrationRequest): Promise<any> {
    const { businessScenario } = request

    // 根据业务场景选择输出处理器
    let outputHandler
    if (businessScenario === 'product-analysis') {
      outputHandler = this.outputHandlers.get('product-analysis')
    } else if (businessScenario === 'generic') {
      outputHandler = this.outputHandlers.get('generic')
    } else {
      outputHandler = this.outputHandlers.get('generic')
    }

    if (!outputHandler) {
      throw new Error('没有找到合适的输出处理器')
    }

    // 构建输出请求
    const outputRequest = {
      analysisResult,
      businessScenario,
      context: request.context
    }

    return await outputHandler.processOutput(outputRequest)
  }

  /**
   * 创建分析管道
   */
  createPipeline(scenario: string): OrchestrationPipeline {
    const steps: OrchestrationStep[] = [
      {
        name: 'input-processing',
        execute: async (request) => this.processInput(request)
      },
      {
        name: 'data-normalization',
        execute: async (request) => {
          const inputResult = await this.processInput(request)
          return await this.normalizer.normalize(inputResult)
        },
        dependencies: ['input-processing']
      },
      {
        name: 'analysis-processing',
        execute: async (request) => {
          const inputResult = await this.processInput(request)
          const normalizedResult = await this.normalizer.normalize(inputResult)
          return this.processAnalysis(normalizedResult, request)
        },
        dependencies: ['data-normalization']
      },
      {
        name: 'output-processing',
        execute: async (request) => {
          const inputResult = await this.processInput(request)
          const normalizedResult = await this.normalizer.normalize(inputResult)
          const analysisResult = await this.processAnalysis(normalizedResult, request)
          return this.processOutput(analysisResult, request)
        },
        dependencies: ['analysis-processing']
      }
    ]

    return {
      steps,
      execute: async (request) => this.execute(request)
    }
  }

  /**
   * 获取支持的场景列表
   */
  getSupportedScenarios(): string[] {
    return [
      'product-analysis',
      'competitor-analysis',
      'video-analysis',
      'image-analysis',
      'text-analysis',
      'generic'
    ]
  }

  /**
   * 获取场景能力描述
   */
  getScenarioCapabilities(scenario: string): {
    inputTypes: string[]
    analysisEngines: string[]
    outputFormats: string[]
  } {
    const capabilities: Record<string, any> = {
      'product-analysis': {
        inputTypes: ['text', 'image', 'multimodal'],
        analysisEngines: ['text', 'image', 'multimodal'],
        outputFormats: ['product-data', 'analysis-record']
      },
      'competitor-analysis': {
        inputTypes: ['text', 'image', 'multimodal'],
        analysisEngines: ['text', 'image', 'multimodal'],
        outputFormats: ['competitor-data', 'market-insights']
      },
      'video-analysis': {
        inputTypes: ['video'],
        analysisEngines: ['video'],
        outputFormats: ['video-metadata', 'frame-analysis']
      },
      'image-analysis': {
        inputTypes: ['image'],
        analysisEngines: ['image'],
        outputFormats: ['image-metadata', 'object-detection']
      },
      'text-analysis': {
        inputTypes: ['text'],
        analysisEngines: ['text'],
        outputFormats: ['text-insights', 'entity-extraction']
      },
      'generic': {
        inputTypes: ['text', 'image', 'video', 'multimodal'],
        analysisEngines: ['text', 'image', 'video', 'multimodal'],
        outputFormats: ['generic-data']
      }
    }

    return capabilities[scenario] || capabilities['generic']
  }
}
