// 调参数据分析服务
export interface AnalyticsData {
  // 时间范围
  timeRange: {
    start: Date
    end: Date
  }
  
  // 基础指标
  metrics: {
    impressions: number
    clicks: number
    conversions: number
    revenue: number
    users: number
  }
  
  // 分层指标
  levelMetrics: {
    global: LevelMetrics
    categories: Record<string, LevelMetrics>
    products: Record<string, LevelMetrics>
    templates: Record<string, LevelMetrics>
  }
  
  // 参数配置历史
  configHistory: ConfigSnapshot[]
  
  // A/B测试结果
  abTestResults: ABTestResult[]
}

export interface LevelMetrics {
  level: string
  levelId: string
  metrics: {
    ctr: number
    cvr: number
    satisfaction: number
    revenue: number
    bounceRate: number
    timeOnPage: number
  }
  
  // 参数配置
  config: TuningConfig
  
  // 趋势数据
  trends: {
    ctr: number[]
    cvr: number[]
    satisfaction: number[]
    revenue: number[]
  }
}

export interface ConfigSnapshot {
  timestamp: Date
  level: string
  levelId: string
  config: TuningConfig
  performance: PerformanceMetrics
}

export interface ABTestResult {
  testId: string
  name: string
  description: string
  
  // 测试配置
  variants: {
    control: TuningConfig
    treatment: TuningConfig
  }
  
  // 结果
  results: {
    control: PerformanceMetrics
    treatment: PerformanceMetrics
    significance: number
    confidence: number
  }
  
  // 建议
  recommendation: {
    shouldApply: boolean
    expectedImprovement: number
    riskLevel: 'low' | 'medium' | 'high'
  }
}

export interface PerformanceMetrics {
  ctr: number
  cvr: number
  satisfaction: number
  revenue: number
  sampleSize: number
  confidence: number
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
}

export interface TuningSuggestion {
  level: string
  levelId: string
  currentConfig: TuningConfig
  suggestedConfig: TuningConfig
  expectedImprovement: {
    ctr: number
    cvr: number
    satisfaction: number
    revenue: number
  }
  confidence: number
  reasoning: string[]
  riskAssessment: {
    level: 'low' | 'medium' | 'high'
    factors: string[]
  }
}

export class TuningAnalyticsService {
  private dataSource: any // 数据源接口

  constructor(dataSource: any) {
    this.dataSource = dataSource
  }

  /**
   * 获取分析数据
   */
  async getAnalyticsData(
    timeRange: { start: Date; end: Date },
    level?: string,
    levelId?: string
  ): Promise<AnalyticsData> {
    try {
      // 1. 获取基础指标
      const metrics = await this.getMetrics(timeRange, level, levelId)
      
      // 2. 获取分层指标
      const levelMetrics = await this.getLevelMetrics(timeRange)
      
      // 3. 获取配置历史
      const configHistory = await this.getConfigHistory(timeRange, level, levelId)
      
      // 4. 获取A/B测试结果
      const abTestResults = await this.getABTestResults(timeRange)

      return {
        timeRange,
        metrics,
        levelMetrics,
        configHistory,
        abTestResults
      }
    } catch (error) {
      console.error('Failed to get analytics data:', error)
      throw error
    }
  }

  /**
   * 生成调参建议
   */
  async generateTuningSuggestions(
    analyticsData: AnalyticsData
  ): Promise<TuningSuggestion[]> {
    const suggestions: TuningSuggestion[] = []

    try {
      // 1. 分析全局配置
      const globalSuggestion = await this.analyzeGlobalConfig(analyticsData)
      if (globalSuggestion) suggestions.push(globalSuggestion)

      // 2. 分析类目配置
      const categorySuggestions = await this.analyzeCategoryConfigs(analyticsData)
      suggestions.push(...categorySuggestions)

      // 3. 分析商品配置
      const productSuggestions = await this.analyzeProductConfigs(analyticsData)
      suggestions.push(...productSuggestions)

      // 4. 分析模板配置
      const templateSuggestions = await this.analyzeTemplateConfigs(analyticsData)
      suggestions.push(...templateSuggestions)

      // 5. 按置信度排序
      return suggestions.sort((a, b) => b.confidence - a.confidence)

    } catch (error) {
      console.error('Failed to generate tuning suggestions:', error)
      throw error
    }
  }

  /**
   * 分析全局配置
   */
  private async analyzeGlobalConfig(
    analyticsData: AnalyticsData
  ): Promise<TuningSuggestion | null> {
    const globalMetrics = analyticsData.levelMetrics.global
    
    // 分析当前配置的问题
    const issues = this.identifyConfigIssues(globalMetrics)
    if (issues.length === 0) return null

    // 生成优化建议
    const suggestedConfig = this.generateOptimizedConfig(
      globalMetrics.config,
      issues
    )

    // 计算预期改进
    const expectedImprovement = this.calculateExpectedImprovement(
      globalMetrics,
      suggestedConfig
    )

    return {
      level: 'global',
      levelId: 'global',
      currentConfig: globalMetrics.config,
      suggestedConfig,
      expectedImprovement,
      confidence: this.calculateConfidence(globalMetrics, issues),
      reasoning: this.generateReasoning(issues),
      riskAssessment: this.assessRisk(suggestedConfig, globalMetrics.config)
    }
  }

  /**
   * 分析类目配置
   */
  private async analyzeCategoryConfigs(
    analyticsData: AnalyticsData
  ): Promise<TuningSuggestion[]> {
    const suggestions: TuningSuggestion[] = []

    for (const [categoryId, metrics] of Object.entries(analyticsData.levelMetrics.categories)) {
      const issues = this.identifyConfigIssues(metrics)
      if (issues.length === 0) continue

      const suggestedConfig = this.generateOptimizedConfig(metrics.config, issues)
      const expectedImprovement = this.calculateExpectedImprovement(metrics, suggestedConfig)

      suggestions.push({
        level: 'category',
        levelId: categoryId,
        currentConfig: metrics.config,
        suggestedConfig,
        expectedImprovement,
        confidence: this.calculateConfidence(metrics, issues),
        reasoning: this.generateReasoning(issues),
        riskAssessment: this.assessRisk(suggestedConfig, metrics.config)
      })
    }

    return suggestions
  }

  /**
   * 分析商品配置
   */
  private async analyzeProductConfigs(
    analyticsData: AnalyticsData
  ): Promise<TuningSuggestion[]> {
    const suggestions: TuningSuggestion[] = []

    for (const [productId, metrics] of Object.entries(analyticsData.levelMetrics.products)) {
      const issues = this.identifyConfigIssues(metrics)
      if (issues.length === 0) continue

      const suggestedConfig = this.generateOptimizedConfig(metrics.config, issues)
      const expectedImprovement = this.calculateExpectedImprovement(metrics, suggestedConfig)

      suggestions.push({
        level: 'product',
        levelId: productId,
        currentConfig: metrics.config,
        suggestedConfig,
        expectedImprovement,
        confidence: this.calculateConfidence(metrics, issues),
        reasoning: this.generateReasoning(issues),
        riskAssessment: this.assessRisk(suggestedConfig, metrics.config)
      })
    }

    return suggestions
  }

  /**
   * 分析模板配置
   */
  private async analyzeTemplateConfigs(
    analyticsData: AnalyticsData
  ): Promise<TuningSuggestion[]> {
    const suggestions: TuningSuggestion[] = []

    for (const [templateId, metrics] of Object.entries(analyticsData.levelMetrics.templates)) {
      const issues = this.identifyConfigIssues(metrics)
      if (issues.length === 0) continue

      const suggestedConfig = this.generateOptimizedConfig(metrics.config, issues)
      const expectedImprovement = this.calculateExpectedImprovement(metrics, suggestedConfig)

      suggestions.push({
        level: 'template',
        levelId: templateId,
        currentConfig: metrics.config,
        suggestedConfig,
        expectedImprovement,
        confidence: this.calculateConfidence(metrics, issues),
        reasoning: this.generateReasoning(issues),
        riskAssessment: this.assessRisk(suggestedConfig, metrics.config)
      })
    }

    return suggestions
  }

  /**
   * 识别配置问题
   */
  private identifyConfigIssues(metrics: LevelMetrics): string[] {
    const issues: string[] = []

    // 检查CTR是否过低
    if (metrics.metrics.ctr < 0.1) {
      issues.push('点击率过低，建议提高相关性权重')
    }

    // 检查CVR是否过低
    if (metrics.metrics.cvr < 0.05) {
      issues.push('转化率过低，建议优化质量权重')
    }

    // 检查用户满意度
    if (metrics.metrics.satisfaction < 0.7) {
      issues.push('用户满意度较低，建议调整用户偏好权重')
    }

    // 检查多样性是否过高
    const diversityWeight = metrics.config.coarseRanking.weightFactors.diversity
    if (diversityWeight > 0.3 && metrics.metrics.cvr < 0.08) {
      issues.push('多样性权重过高影响转化率')
    }

    // 检查时效性权重
    const recencyWeight = metrics.config.coarseRanking.weightFactors.recency
    if (recencyWeight > 0.2 && metrics.metrics.ctr < 0.12) {
      issues.push('时效性权重过高影响相关性')
    }

    return issues
  }

  /**
   * 生成优化配置
   */
  private generateOptimizedConfig(
    currentConfig: TuningConfig,
    issues: string[]
  ): TuningConfig {
    const optimizedConfig = { ...currentConfig }

    // 根据问题调整权重
    issues.forEach(issue => {
      if (issue.includes('相关性权重')) {
        optimizedConfig.coarseRanking.weightFactors.relevance = Math.min(
          optimizedConfig.coarseRanking.weightFactors.relevance + 0.1,
          0.6
        )
      }
      if (issue.includes('质量权重')) {
        optimizedConfig.coarseRanking.weightFactors.quality = Math.min(
          optimizedConfig.coarseRanking.weightFactors.quality + 0.05,
          0.4
        )
      }
      if (issue.includes('多样性权重过高')) {
        optimizedConfig.coarseRanking.weightFactors.diversity = Math.max(
          optimizedConfig.coarseRanking.weightFactors.diversity - 0.05,
          0.1
        )
      }
      if (issue.includes('时效性权重过高')) {
        optimizedConfig.coarseRanking.weightFactors.recency = Math.max(
          optimizedConfig.coarseRanking.weightFactors.recency - 0.05,
          0.05
        )
      }
      if (issue.includes('用户偏好权重')) {
        optimizedConfig.fineRanking.weightFactors.userPreference = Math.min(
          optimizedConfig.fineRanking.weightFactors.userPreference + 0.1,
          0.5
        )
      }
    })

    return optimizedConfig
  }

  /**
   * 计算预期改进
   */
  private calculateExpectedImprovement(
    currentMetrics: LevelMetrics,
    suggestedConfig: TuningConfig
  ): {
    ctr: number
    cvr: number
    satisfaction: number
    revenue: number
  } {
    // 基于配置变化计算预期改进
    const relevanceIncrease = suggestedConfig.coarseRanking.weightFactors.relevance - 
      currentMetrics.config.coarseRanking.weightFactors.relevance
    
    const qualityIncrease = suggestedConfig.coarseRanking.weightFactors.quality - 
      currentMetrics.config.coarseRanking.weightFactors.quality

    const diversityDecrease = currentMetrics.config.coarseRanking.weightFactors.diversity - 
      suggestedConfig.coarseRanking.weightFactors.diversity

    return {
      ctr: currentMetrics.metrics.ctr * (1 + relevanceIncrease * 0.2),
      cvr: currentMetrics.metrics.cvr * (1 + qualityIncrease * 0.15 + diversityDecrease * 0.1),
      satisfaction: currentMetrics.metrics.satisfaction * (1 + relevanceIncrease * 0.1),
      revenue: currentMetrics.metrics.revenue * (1 + qualityIncrease * 0.2)
    }
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(metrics: LevelMetrics, issues: string[]): number {
    // 基于数据量和问题严重程度计算置信度
    const dataQuality = Math.min(metrics.metrics.ctr * 10, 1)
    const issueSeverity = Math.min(issues.length * 0.2, 0.8)
    
    return Math.max(0.3, Math.min(0.95, dataQuality + issueSeverity))
  }

  /**
   * 生成建议理由
   */
  private generateReasoning(issues: string[]): string[] {
    return issues.map(issue => {
      if (issue.includes('点击率过低')) {
        return '历史数据显示相关性权重提升10%可提高CTR 15-20%'
      }
      if (issue.includes('转化率过低')) {
        return '质量权重优化可显著提升用户转化率'
      }
      if (issue.includes('用户满意度')) {
        return '用户偏好权重调整可提升满意度评分'
      }
      if (issue.includes('多样性权重过高')) {
        return '降低多样性权重可减少无关内容，提升转化率'
      }
      if (issue.includes('时效性权重过高')) {
        return '时效性权重过高可能影响内容相关性'
      }
      return issue
    })
  }

  /**
   * 评估风险
   */
  private assessRisk(
    suggestedConfig: TuningConfig,
    currentConfig: TuningConfig
  ): { level: 'low' | 'medium' | 'high'; factors: string[] } {
    const factors: string[] = []
    let riskLevel: 'low' | 'medium' | 'high' = 'low'

    // 检查权重变化幅度
    const relevanceChange = Math.abs(
      suggestedConfig.coarseRanking.weightFactors.relevance - 
      currentConfig.coarseRanking.weightFactors.relevance
    )

    if (relevanceChange > 0.2) {
      factors.push('相关性权重变化较大')
      riskLevel = 'medium'
    }

    const qualityChange = Math.abs(
      suggestedConfig.coarseRanking.weightFactors.quality - 
      currentConfig.coarseRanking.weightFactors.quality
    )

    if (qualityChange > 0.15) {
      factors.push('质量权重变化较大')
      riskLevel = 'medium'
    }

    // 检查是否同时调整多个权重
    const totalChange = relevanceChange + qualityChange + 
      Math.abs(suggestedConfig.coarseRanking.weightFactors.diversity - 
        currentConfig.coarseRanking.weightFactors.diversity) +
      Math.abs(suggestedConfig.coarseRanking.weightFactors.recency - 
        currentConfig.coarseRanking.weightFactors.recency)

    if (totalChange > 0.3) {
      factors.push('多个权重同时调整')
      riskLevel = 'high'
    }

    return { level: riskLevel, factors }
  }

  /**
   * 获取基础指标
   */
  private async getMetrics(
    timeRange: { start: Date; end: Date },
    level?: string,
    levelId?: string
  ): Promise<any> {
    // 这里应该从数据源获取指标
    return {
      impressions: 1000000,
      clicks: 150000,
      conversions: 12000,
      revenue: 500000,
      users: 50000
    }
  }

  /**
   * 获取分层指标
   */
  private async getLevelMetrics(timeRange: { start: Date; end: Date }): Promise<any> {
    // 这里应该从数据源获取分层指标
    return {
      global: {
        level: 'global',
        levelId: 'global',
        metrics: {
          ctr: 0.15,
          cvr: 0.08,
          satisfaction: 0.85,
          revenue: 500000,
          bounceRate: 0.3,
          timeOnPage: 120
        },
        config: {} as TuningConfig,
        trends: {
          ctr: [0.14, 0.15, 0.16, 0.15, 0.17],
          cvr: [0.07, 0.08, 0.09, 0.08, 0.10],
          satisfaction: [0.82, 0.84, 0.85, 0.86, 0.87],
          revenue: [450000, 480000, 500000, 520000, 550000]
        }
      },
      categories: {},
      products: {},
      templates: {}
    }
  }

  /**
   * 获取配置历史
   */
  private async getConfigHistory(
    timeRange: { start: Date; end: Date },
    level?: string,
    levelId?: string
  ): Promise<ConfigSnapshot[]> {
    // 这里应该从数据源获取配置历史
    return []
  }

  /**
   * 获取A/B测试结果
   */
  private async getABTestResults(timeRange: { start: Date; end: Date }): Promise<ABTestResult[]> {
    // 这里应该从数据源获取A/B测试结果
    return []
  }
}
