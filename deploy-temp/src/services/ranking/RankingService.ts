// 粗排精排服务
export interface RankingConfig {
  // 粗排配置
  coarseRanking: {
    maxCandidates: number
    minScore: number
    weightFactors: {
      relevance: number      // 相关性权重
      quality: number       // 质量权重
      diversity: number     // 多样性权重
      recency: number       // 时效性权重
    }
  }
  // 精排配置
  fineRanking: {
    maxResults: number
    minScore: number
    weightFactors: {
      userPreference: number    // 用户偏好权重
      businessValue: number     // 商业价值权重
      technicalQuality: number // 技术质量权重
      marketTrend: number      // 市场趋势权重
    }
  }
}

export interface RankingCandidate {
  id: string
  type: 'template' | 'video' | 'product'
  score: number
  metadata: Record<string, any>
  features: {
    relevance: number
    quality: number
    diversity: number
    recency: number
    userPreference?: number
    businessValue?: number
    technicalQuality?: number
    marketTrend?: number
  }
}

export interface RankingResult {
  candidates: RankingCandidate[]
  totalCount: number
  processingTime: number
  algorithm: 'coarse' | 'fine'
}

export class RankingService {
  private config: RankingConfig

  constructor(config: RankingConfig) {
    this.config = config
  }

  /**
   * 粗排算法 - 快速筛选候选集
   */
  async coarseRanking(
    candidates: RankingCandidate[],
    context: any
  ): Promise<RankingResult> {
    const startTime = Date.now()
    
    // 1. 基础过滤
    const filteredCandidates = candidates.filter(candidate => {
      return candidate.score >= this.config.coarseRanking.minScore
    })

    // 2. 计算综合得分
    const scoredCandidates = filteredCandidates.map(candidate => {
      const weights = this.config.coarseRanking.weightFactors
      
      const compositeScore = 
        candidate.features.relevance * weights.relevance +
        candidate.features.quality * weights.quality +
        candidate.features.diversity * weights.diversity +
        candidate.features.recency * weights.recency

      return {
        ...candidate,
        score: compositeScore
      }
    })

    // 3. 排序并限制数量
    const sortedCandidates = scoredCandidates
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.coarseRanking.maxCandidates)

    return {
      candidates: sortedCandidates,
      totalCount: sortedCandidates.length,
      processingTime: Date.now() - startTime,
      algorithm: 'coarse'
    }
  }

  /**
   * 精排算法 - 精细化排序
   */
  async fineRanking(
    candidates: RankingCandidate[],
    context: any,
    userProfile?: any
  ): Promise<RankingResult> {
    const startTime = Date.now()

    // 1. 计算用户偏好得分
    const candidatesWithPreference = candidates.map(candidate => {
      const userPreferenceScore = this.calculateUserPreferenceScore(
        candidate, 
        userProfile
      )
      
      return {
        ...candidate,
        features: {
          ...candidate.features,
          userPreference: userPreferenceScore
        }
      }
    })

    // 2. 计算商业价值得分
    const candidatesWithBusinessValue = candidatesWithPreference.map(candidate => {
      const businessValueScore = this.calculateBusinessValueScore(
        candidate,
        context
      )
      
      return {
        ...candidate,
        features: {
          ...candidate.features,
          businessValue: businessValueScore
        }
      }
    })

    // 3. 计算技术质量得分
    const candidatesWithTechnicalQuality = candidatesWithBusinessValue.map(candidate => {
      const technicalQualityScore = this.calculateTechnicalQualityScore(candidate)
      
      return {
        ...candidate,
        features: {
          ...candidate.features,
          technicalQuality: technicalQualityScore
        }
      }
    })

    // 4. 计算市场趋势得分
    const candidatesWithMarketTrend = candidatesWithTechnicalQuality.map(candidate => {
      const marketTrendScore = this.calculateMarketTrendScore(candidate, context)
      
      return {
        ...candidate,
        features: {
          ...candidate.features,
          marketTrend: marketTrendScore
        }
      }
    })

    // 5. 计算最终得分
    const finalCandidates = candidatesWithMarketTrend.map(candidate => {
      const weights = this.config.fineRanking.weightFactors
      
      const finalScore = 
        candidate.features.userPreference * weights.userPreference +
        candidate.features.businessValue * weights.businessValue +
        candidate.features.technicalQuality * weights.technicalQuality +
        candidate.features.marketTrend * weights.marketTrend

      return {
        ...candidate,
        score: finalScore
      }
    })

    // 6. 过滤和排序
    const filteredCandidates = finalCandidates.filter(
      candidate => candidate.score >= this.config.fineRanking.minScore
    )

    const sortedCandidates = filteredCandidates
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.fineRanking.maxResults)

    return {
      candidates: sortedCandidates,
      totalCount: sortedCandidates.length,
      processingTime: Date.now() - startTime,
      algorithm: 'fine'
    }
  }

  /**
   * 计算用户偏好得分
   */
  private calculateUserPreferenceScore(
    candidate: RankingCandidate,
    userProfile?: any
  ): number {
    if (!userProfile) return 0.5 // 默认中等偏好

    // 基于用户历史行为计算偏好
    const categoryMatch = userProfile.preferredCategories?.includes(
      candidate.metadata.category
    ) ? 1.0 : 0.0

    const styleMatch = userProfile.preferredStyles?.includes(
      candidate.metadata.style
    ) ? 1.0 : 0.0

    const interactionScore = userProfile.interactionHistory?.[candidate.id] || 0.0

    return (categoryMatch + styleMatch + interactionScore) / 3
  }

  /**
   * 计算商业价值得分
   */
  private calculateBusinessValueScore(
    candidate: RankingCandidate,
    context: any
  ): number {
    // 基于转化率、ROI等商业指标
    const conversionRate = candidate.metadata.conversionRate || 0.0
    const roi = candidate.metadata.roi || 0.0
    const marketDemand = candidate.metadata.marketDemand || 0.0

    return (conversionRate + roi + marketDemand) / 3
  }

  /**
   * 计算技术质量得分
   */
  private calculateTechnicalQualityScore(candidate: RankingCandidate): number {
    // 基于技术指标：清晰度、稳定性、兼容性等
    const clarity = candidate.metadata.clarity || 0.0
    const stability = candidate.metadata.stability || 0.0
    const compatibility = candidate.metadata.compatibility || 0.0

    return (clarity + stability + compatibility) / 3
  }

  /**
   * 计算市场趋势得分
   */
  private calculateMarketTrendScore(
    candidate: RankingCandidate,
    context: any
  ): number {
    // 基于市场趋势数据
    const trendScore = candidate.metadata.trendScore || 0.0
    const seasonality = candidate.metadata.seasonality || 0.0
    const viralPotential = candidate.metadata.viralPotential || 0.0

    return (trendScore + seasonality + viralPotential) / 3
  }

  /**
   * 混合排序 - 结合粗排和精排
   */
  async hybridRanking(
    candidates: RankingCandidate[],
    context: any,
    userProfile?: any
  ): Promise<RankingResult> {
    // 1. 先进行粗排
    const coarseResult = await this.coarseRanking(candidates, context)
    
    // 2. 对粗排结果进行精排
    const fineResult = await this.fineRanking(
      coarseResult.candidates,
      context,
      userProfile
    )

    return {
      ...fineResult,
      processingTime: coarseResult.processingTime + fineResult.processingTime
    }
  }
}
