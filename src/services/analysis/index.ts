// 分析服务统一入口

// 编排层
export { 
  AnalysisOrchestrator,
  analysisOrchestrator,
  analyzeContent,
  createAnalysisPipeline,
  getSupportedScenarios,
  getScenarioCapabilities
} from './orchestration'

// 输入层
export { UserInputHandler } from './input/UserInputHandler'
export { WebScrapingHandler } from './input/WebScrapingHandler'
export { AIGeneratedHandler } from './input/AIGeneratedHandler'
export { InputNormalizer } from './input/InputNormalizer'

// 分析层
export { TextAnalysisEngine } from './analysis/TextAnalysisEngine'
export { ImageAnalysisEngine } from './analysis/ImageAnalysisEngine'
export { VideoAnalysisEngine } from './analysis/VideoAnalysisEngine'
export { MultimodalAnalysisEngine } from './analysis/MultimodalAnalysisEngine'

// 输出层
export { ProductAnalysisOutput } from './output/ProductAnalysisOutput'
export { PromptTemplateOutput } from './output/PromptTemplateOutput'
export { GenericOutput } from './output/GenericOutput'

// 类型定义
export type { AnalysisOrchestrationRequest, AnalysisOrchestrationResult } from './orchestration/types'
export type { InputData, UserInputData, WebScrapingData, AIGeneratedData, NormalizedInput } from './input/types'
export type { AnalysisRequest, AnalysisResult } from './analysis/types'
export type { OutputRequest, OutputResult } from './output/types'

// 便捷方法
export const createAnalysisService = (scenario: string) => {
  return {
    analyze: async (request: any) => {
      const { analyzeContent } = await import('./orchestration')
      return analyzeContent({
        input: request.input,
        businessScenario: scenario,
        context: request.context,
        options: request.options
      })
    },
    getCapabilities: async () => {
      const { getScenarioCapabilities } = await import('./orchestration')
      return getScenarioCapabilities(scenario)
    },
    createPipeline: async () => {
      const { createAnalysisPipeline } = await import('./orchestration')
      return createAnalysisPipeline(scenario)
    }
  }
}

// 统一商品分析服务
export { 
  UnifiedProductAnalysisService,
  unifiedProductAnalysisService,
  analyzeProduct,
  analyzeProductsBatch,
  getProductAnalysisCapabilities
} from './UnifiedProductAnalysisService'

// 场景特定的服务创建器
export const createProductAnalysisService = () => createAnalysisService('product-analysis')
export const createCompetitorAnalysisService = () => createAnalysisService('competitor-analysis')
export const createVideoAnalysisService = () => createAnalysisService('video-analysis')
export const createImageAnalysisService = () => createAnalysisService('image-analysis')
export const createTextAnalysisService = () => createAnalysisService('text-analysis')
export const createGenericAnalysisService = () => createAnalysisService('generic')
