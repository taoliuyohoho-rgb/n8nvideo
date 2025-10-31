/**
 * 推荐系统数据层 Hook
 * 使用 React Query 统一管理推荐请求，提供缓存、去重、状态管理
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { recommendationService, type RecommendRankResponse } from '@/src/core/api'

// 推荐请求参数类型
export interface RecommendationParams {
  scenario: 'product->style' | 'task->model' | 'task->prompt'
  task: any
  context?: any
  constraints?: any
}

// 生成稳定的查询键
export const getRecommendationQueryKey = (params: RecommendationParams) => [
  'recommendations',
  params.scenario,
  params.task?.businessModule,
  params.task?.productId,
  params.task?.personaId,
  params.task?.scriptId,
  JSON.stringify(params.context || {}),
  JSON.stringify(params.constraints || {})
]

// 推荐请求函数
const fetchRecommendations = async (params: RecommendationParams): Promise<RecommendRankResponse> => {
  const response = await recommendationService.getRank({
    scenario: params.scenario,
    task: params.task,
    context: params.context || {},
    constraints: params.constraints || {}
  })
  
  // API返回格式是 { success: true, data: {...} }
  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to fetch recommendations')
  }
  
  return response.data as RecommendRankResponse
}

// 主推荐 Hook
export function useRecommendations(
  params: RecommendationParams,
  options?: Omit<UseQueryOptions<RecommendRankResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: getRecommendationQueryKey(params),
    queryFn: () => fetchRecommendations(params),
    staleTime: 60_000, // 1分钟内认为数据是新鲜的
    gcTime: 5 * 60_000, // 5分钟后清理缓存
    retry: 2, // 失败时重试2次
    retryDelay: 1000, // 重试延迟1秒
    refetchOnWindowFocus: false, // 窗口聚焦时不重新请求
    refetchOnMount: false, // 组件挂载时不重新请求（如果缓存存在）
    ...options
  })
}

// 模型推荐 Hook（简化版）
export function useModelRecommendations(
  businessModule: string,
  productId?: string | null,
  personaId?: string | null,
  scriptId?: string | null,
  constraints?: any
) {
  const params: RecommendationParams = {
    scenario: 'task->model',
    task: {
      businessModule,
      ...(productId && { productId }),
      ...(personaId && { personaId }),
      ...(scriptId && { scriptId })
    },
    context: {},
    constraints: constraints || {}
  }

  return useRecommendations(params)
}

// Prompt推荐 Hook（简化版）
export function usePromptRecommendations(
  businessModule: string,
  productId?: string | null,
  personaId?: string | null,
  constraints?: any
) {
  const params: RecommendationParams = {
    scenario: 'task->prompt',
    task: {
      businessModule,
      ...(productId && { productId }),
      ...(personaId && { personaId })
    },
    context: {},
    constraints: constraints || {}
  }

  return useRecommendations(params)
}

// 样式推荐 Hook（简化版）
export function useStyleRecommendations(
  productId: string,
  constraints?: any
) {
  const params: RecommendationParams = {
    scenario: 'product->style',
    task: { productId },
    context: {},
    constraints: constraints || {}
  }

  return useRecommendations(params)
}
