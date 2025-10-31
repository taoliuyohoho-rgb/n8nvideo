/**
 * 推荐服务API
 * 封装推荐相关的API调用
 */

import { apiClient } from '../ApiClient'
import { API_ENDPOINTS } from '../endpoints'

export interface RecommendRankRequest {
  scenario: string
  task: any
  context?: any
  constraints?: any
  options?: any
}

export interface RecommendRankResponse {
  chosen: {
    id: string
    name?: string
    coarseScore: number
    fineScore: number
  }
  alternatives?: {
    fineTop2?: {
      id: string
      name?: string
      coarseScore: number
      fineScore: number
    }
    coarseExtras?: Array<{
      id: string
      name?: string
      coarseScore: number
      fineScore: number
    }>
    outOfPool?: Array<{
      id: string
      name?: string
      coarseScore: number
      fineScore: number
    }>
  }
  decisionId: string
}

export interface RecommendFeedbackRequest {
  decisionId: string
  eventType: 'expose' | 'select' | 'reject'
  payload: {
    scenario: string
    candidates?: any[]
    chosenCandidateId?: string
    reason?: string
  }
}

export class RecommendationService {
  /**
   * 获取推荐排名
   */
  async getRank(request: RecommendRankRequest) {
    return apiClient.post<RecommendRankResponse>(API_ENDPOINTS.RECOMMEND.RANK, request)
  }

  /**
   * 提交推荐反馈
   */
  async submitFeedback(request: RecommendFeedbackRequest) {
    return apiClient.post(API_ENDPOINTS.RECOMMEND.FEEDBACK, request)
  }
}

// 导出单例
export const recommendationService = new RecommendationService()
