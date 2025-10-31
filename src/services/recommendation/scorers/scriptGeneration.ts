import type { RecommendRankRequest, CandidateItem } from '../types'
import type { Scorer } from '../registry'

export const scriptGenerationScorer: Scorer = {
  rank: async (req: RecommendRankRequest) => {
    // 简单的脚本生成推荐逻辑
    // 返回模拟的候选列表
    
    const mockCandidates: CandidateItem[] = [
      {
        id: 'gemini-2.5-flash',
        type: 'model',
        name: 'Gemini 2.5 Flash',
        title: 'Gemini 2.5 Flash',
        summary: '适合脚本生成的模型',
        coarseScore: 0.8,
        fineScore: 0.9
      },
      {
        id: 'deepseek-chat',
        type: 'model', 
        name: 'DeepSeek Chat',
        title: 'DeepSeek Chat',
        summary: '备选模型',
        coarseScore: 0.7,
        fineScore: 0.8
      }
    ]
    
    return {
      topK: mockCandidates.slice(0, 3),
      coarseList: mockCandidates,
      fullPool: mockCandidates
    }
  }
}
