// 分析服务编排层统一导出

export { AnalysisOrchestrator } from './AnalysisOrchestrator'
export type { 
  AnalysisOrchestrationRequest, 
  AnalysisOrchestrationResult,
  OrchestrationStep,
  OrchestrationPipeline 
} from './types'

// 创建默认编排器实例
import { AnalysisOrchestrator } from './AnalysisOrchestrator'
export const analysisOrchestrator = new AnalysisOrchestrator()

// 便捷方法
export const analyzeContent = async (request: any) => {
  return analysisOrchestrator.execute(request)
}

export const createAnalysisPipeline = (scenario: string) => {
  return analysisOrchestrator.createPipeline(scenario)
}

export const getSupportedScenarios = () => {
  return analysisOrchestrator.getSupportedScenarios()
}

export const getScenarioCapabilities = (scenario: string) => {
  return analysisOrchestrator.getScenarioCapabilities(scenario)
}
