// 多层级排序服务
export interface HierarchicalConfig {
  // 全局配置
  global: TuningConfig
  
  // 类目配置
  categories: Record<string, TuningConfig>
  
  // 商品配置
  products: Record<string, TuningConfig>
  
  // 模板配置
  templates: Record<string, TuningConfig>
}

export interface TuningConfig {
  id: string
  level: 'global' | 'category' | 'product' | 'template'
  levelId: string
  name: string
  
  coarseRanking: {
    maxCandidates: number
    minScore: number
    weightFactors: {
      relevance: number
      quality: number
      diversity: number
      recency: number
    }
  }
  
  fineRanking: {
    maxResults: number
    minScore: number
    weightFactors: {
      userPreference: number
      businessValue: number
      technicalQuality: number
      marketTrend: number
    }
  }
  
  // 继承规则
  inheritance: {
    fromGlobal: boolean
    fromCategory: boolean
    fromProduct: boolean
    customOverrides: string[]
  }
}

export interface RankingContext {
  userId?: string
  categoryId?: string
  productId?: string
  templateId?: string
  userProfile?: any
  sessionData?: any
  timeContext?: {
    hour: number
    dayOfWeek: number
    season: string
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
  algorithm: 'coarse' | 'fine' | 'hierarchical'
  configUsed: TuningConfig
  inheritanceChain: string[]
}

export class HierarchicalRankingService {
  private config: HierarchicalConfig
  private analyticsService: any // TuningAnalyticsService

  constructor(config: HierarchicalConfig, analyticsService: any) {
    this.config = config
    this.analyticsService = analyticsService
  }

  /**
   * 多层级排序
   */
  async hierarchicalRanking(
    candidates: RankingCandidate[],
    context: RankingContext
  ): Promise<RankingResult> {
    const startTime = Date.now()

    try {
      // 1. 确定使用的配置
      const config = this.resolveConfig(context)
      
      // 2. 构建继承链
      const inheritanceChain = this.buildInheritanceChain(context)
      
      // 3. 应用配置进行排序
      const result = await this.applyRanking(candidates, config, context)
      
      return {
        ...result,
        algorithm: 'hierarchical',
        configUsed: config,
        inheritanceChain
      }

    } catch (error) {
      console.error('Hierarchical ranking failed:', error)
      throw error
    }
  }

  /**
   * 解析配置
   */
  private resolveConfig(context: RankingContext): TuningConfig {
    // 优先级：模板 > 商品 > 类目 > 全局
    
    // 1. 检查模板配置
    if (context.templateId && this.config.templates[context.templateId]) {
      const templateConfig = this.config.templates[context.templateId]
      if (!templateConfig.inheritance.fromGlobal && 
          !templateConfig.inheritance.fromCategory && 
          !templateConfig.inheritance.fromProduct) {
        return templateConfig
      }
      return this.mergeConfigs(templateConfig, context)
    }

    // 2. 检查商品配置
    if (context.productId && this.config.products[context.productId]) {
      const productConfig = this.config.products[context.productId]
      if (!productConfig.inheritance.fromGlobal && 
          !productConfig.inheritance.fromCategory) {
        return productConfig
      }
      return this.mergeConfigs(productConfig, context)
    }

    // 3. 检查类目配置
    if (context.categoryId && this.config.categories[context.categoryId]) {
      const categoryConfig = this.config.categories[context.categoryId]
      if (!categoryConfig.inheritance.fromGlobal) {
        return categoryConfig
      }
      return this.mergeConfigs(categoryConfig, context)
    }

    // 4. 使用全局配置
    return this.config.global
  }

  /**
   * 合并配置
   */
  private mergeConfigs(
    baseConfig: TuningConfig,
    context: RankingContext
  ): TuningConfig {
    let mergedConfig = { ...baseConfig }

    // 从商品配置继承
    if (baseConfig.inheritance.fromProduct && context.productId && 
        this.config.products[context.productId]) {
      const productConfig = this.config.products[context.productId]
      mergedConfig = this.mergeConfig(mergedConfig, productConfig, 'product')
    }

    // 从类目配置继承
    if (baseConfig.inheritance.fromCategory && context.categoryId && 
        this.config.categories[context.categoryId]) {
      const categoryConfig = this.config.categories[context.categoryId]
      mergedConfig = this.mergeConfig(mergedConfig, categoryConfig, 'category')
    }

    // 从全局配置继承
    if (baseConfig.inheritance.fromGlobal) {
      mergedConfig = this.mergeConfig(mergedConfig, this.config.global, 'global')
    }

    return mergedConfig
  }

  /**
   * 合并单个配置
   */
  private mergeConfig(
    target: TuningConfig,
    source: TuningConfig,
    sourceLevel: string
  ): TuningConfig {
    const merged = { ...target }

    // 合并粗排参数
    merged.coarseRanking = {
      maxCandidates: target.coarseRanking.maxCandidates || source.coarseRanking.maxCandidates,
      minScore: target.coarseRanking.minScore || source.coarseRanking.minScore,
      weightFactors: {
        relevance: target.coarseRanking.weightFactors.relevance || 
                  source.coarseRanking.weightFactors.relevance,
        quality: target.coarseRanking.weightFactors.quality || 
                source.coarseRanking.weightFactors.quality,
        diversity: target.coarseRanking.weightFactors.diversity || 
                  source.coarseRanking.weightFactors.diversity,
        recency: target.coarseRanking.weightFactors.recency || 
                source.coarseRanking.weightFactors.recency
      }
    }

    // 合并精排参数
    merged.fineRanking = {
      maxResults: target.fineRanking.maxResults || source.fineRanking.maxResults,
      minScore: target.fineRanking.minScore || source.fineRanking.minScore,
      weightFactors: {
        userPreference: target.fineRanking.weightFactors.userPreference || 
                       source.fineRanking.weightFactors.userPreference,
        businessValue: target.fineRanking.weightFactors.businessValue || 
                      source.fineRanking.weightFactors.businessValue,
        technicalQuality: target.fineRanking.weightFactors.technicalQuality || 
                          source.fineRanking.weightFactors.technicalQuality,
        marketTrend: target.fineRanking.weightFactors.marketTrend || 
                     source.fineRanking.weightFactors.marketTrend
      }
    }

    return merged
  }

  /**
   * 构建继承链
   */
  private buildInheritanceChain(context: RankingContext): string[] {
    const chain: string[] = []

    if (context.templateId) {
      chain.push(`template:${context.templateId}`)
    }
    if (context.productId) {
      chain.push(`product:${context.productId}`)
    }
    if (context.categoryId) {
      chain.push(`category:${context.categoryId}`)
    }
    chain.push('global')

    return chain
  }

  /**
   * 应用排序算法
   */
  private async applyRanking(
    candidates: RankingCandidate[],
    config: TuningConfig,
    context: RankingContext
  ): Promise<Omit<RankingResult, 'algorithm' | 'configUsed' | 'inheritanceChain'>> {
    const startTime = Date.now()

    // 1. 粗排
    const coarseResult = await this.coarseRanking(candidates, config, context)
    
    // 2. 精排
    const fineResult = await this.fineRanking(
      coarseResult.candidates,
      config,
      context
    )

    return {
      ...fineResult,
      processingTime: Date.now() - startTime
    }
  }

  /**
   * 粗排算法
   */
  private async coarseRanking(
    candidates: RankingCandidate[],
    config: TuningConfig,
    context: RankingContext
  ): Promise<{ candidates: RankingCandidate[] }> {
    // 1. 基础过滤
    const filteredCandidates = candidates.filter(candidate => {
      return candidate.score >= config.coarseRanking.minScore
    })

    // 2. 计算综合得分
    const scoredCandidates = filteredCandidates.map(candidate => {
      const weights = config.coarseRanking.weightFactors
      
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
      .slice(0, config.coarseRanking.maxCandidates)

    return { candidates: sortedCandidates }
  }

  /**
   * 精排算法
   */
  private async fineRanking(
    candidates: RankingCandidate[],
    config: TuningConfig,
    context: RankingContext
  ): Promise<{ candidates: RankingCandidate[]; totalCount: number }> {
    // 1. 计算用户偏好得分
    const candidatesWithPreference = candidates.map(candidate => {
      const userPreferenceScore = this.calculateUserPreferenceScore(
        candidate, 
        context.userProfile
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
      const weights = config.fineRanking.weightFactors
      
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
      candidate => candidate.score >= config.fineRanking.minScore
    )

    const sortedCandidates = filteredCandidates
      .sort((a, b) => b.score - a.score)
      .slice(0, config.fineRanking.maxResults)

    return {
      candidates: sortedCandidates,
      totalCount: sortedCandidates.length
    }
  }

  /**
   * 计算用户偏好得分
   */
  private calculateUserPreferenceScore(
    candidate: RankingCandidate,
    userProfile?: any
  ): number {
    if (!userProfile) return 0.5

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
    context: RankingContext
  ): number {
    const conversionRate = candidate.metadata.conversionRate || 0.0
    const roi = candidate.metadata.roi || 0.0
    const marketDemand = candidate.metadata.marketDemand || 0.0

    return (conversionRate + roi + marketDemand) / 3
  }

  /**
   * 计算技术质量得分
   */
  private calculateTechnicalQualityScore(candidate: RankingCandidate): number {
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
    context: RankingContext
  ): number {
    const trendScore = candidate.metadata.trendScore || 0.0
    const seasonality = candidate.metadata.seasonality || 0.0
    const viralPotential = candidate.metadata.viralPotential || 0.0

    return (trendScore + seasonality + viralPotential) / 3
  }

  /**
   * 更新配置
   */
  async updateConfig(
    level: 'global' | 'category' | 'product' | 'template',
    levelId: string,
    config: TuningConfig
  ): Promise<void> {
    try {
      switch (level) {
        case 'global':
          this.config.global = config
          break
        case 'category':
          this.config.categories[levelId] = config
          break
        case 'product':
          this.config.products[levelId] = config
          break
        case 'template':
          this.config.templates[levelId] = config
          break
      }

      // 这里应该保存到数据库
      await this.saveConfig(level, levelId, config)

    } catch (error) {
      console.error('Failed to update config:', error)
      throw error
    }
  }

  /**
   * 保存配置
   */
  private async saveConfig(
    level: string,
    levelId: string,
    config: TuningConfig
  ): Promise<void> {
    // 这里应该保存到数据库
    console.log(`Saving config for ${level}:${levelId}`, config)
  }

  /**
   * 获取配置
   */
  getConfig(
    level: 'global' | 'category' | 'product' | 'template',
    levelId?: string
  ): TuningConfig | null {
    switch (level) {
      case 'global':
        return this.config.global
      case 'category':
        return levelId ? this.config.categories[levelId] : null
      case 'product':
        return levelId ? this.config.products[levelId] : null
      case 'template':
        return levelId ? this.config.templates[levelId] : null
      default:
        return null
    }
  }

  /**
   * 获取所有配置
   */
  getAllConfigs(): HierarchicalConfig {
    return this.config
  }
}
