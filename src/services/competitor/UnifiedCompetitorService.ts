/**
 * 统一竞品分析服务
 * Admin和Dashboard共用，通过推荐引擎动态选择AI模型和Prompt
 */

import { PrismaClient } from '@prisma/client'
import { aiExecutor } from '@/src/services/ai/AiExecutor'
import { recommendRank } from '@/src/services/recommendation/recommend'
import { filterProductInfo, type ProductContext } from '@/src/utils/productInfoFilter'

const prisma = new PrismaClient()

export interface CompetitorAnalysisInput {
  productId: string
  input: string // 文本或链接
  images?: string[] // 图片数组
  isUrl?: boolean
}

export interface CompetitorAnalysisOutput {
  sellingPoints: string[]
  painPoints: string[]
  targetAudience?: string
  other?: string[]
  aiModelUsed: string
  promptUsed: string
  addedSellingPoints?: number
  addedPainPoints?: number
  totalSellingPoints?: number
  totalPainPoints?: number
  // 推荐引擎候选项（用于用户反馈）
  modelCandidates?: Array<{
    id: string
    title: string
    score: number
    reason: string
    type: 'fine-top' | 'coarse-top' | 'explore'
  }>
  promptCandidates?: Array<{
    id: string
    name: string
    score: number
    reason: string
    type: 'fine-top' | 'coarse-top' | 'explore'
  }>
  chosenModelIndex?: number
  chosenPromptIndex?: number
  decisionId?: string // 推荐决策ID，用于反馈
}

export class UnifiedCompetitorService {
  
  /**
   * 仅获取推荐候选项，不执行AI
   */
  async getRecommendations(params: CompetitorAnalysisInput): Promise<{
    decisionId?: string
    modelCandidates: Array<{
      id: string
      title: string
      score: number
      reason: string
      type: 'fine-top' | 'coarse-top' | 'explore'
    }>
    promptCandidates: Array<{
      id: string
      name: string
      score: number
      reason: string
      type: 'fine-top' | 'coarse-top' | 'explore'
    }>
  }> {
    const { input, images } = params

    // 1. 判断输入类型
    const inputType = this.detectInputType(input, images)
    
    // 2. 推荐AI模型
    const modelRecommendation = await this.recommendModelWithCandidates(inputType)
    
    // 3. 推荐Prompt
    const promptRecommendation = await this.recommendPromptWithCandidates()
    
    return {
      decisionId: modelRecommendation.decisionId,
      modelCandidates: modelRecommendation.candidates,
      promptCandidates: promptRecommendation.candidates
    }
  }
  
  /**
   * 统一竞品分析入口
   */
  async analyzeCompetitor(
    params: CompetitorAnalysisInput,
    returnCandidates: boolean = false,
    chosenModelId?: string,
    chosenPromptId?: string
  ): Promise<CompetitorAnalysisOutput> {
    const { productId, input, images, isUrl } = params

    // 1. 判断输入类型（文本/图片/多模态/链接）
    const inputType = this.detectInputType(input, images)
    
    // 2. 链接解析（降级处理）
    if (isUrl) {
      return this.handleUrlParsing(input)
    }

    // 3. 推荐AI模型（基于输入类型）
    const modelRecommendation = await this.recommendModelWithCandidates(inputType)
    
    // 4. 推荐Prompt（基于业务模块）
    const promptRecommendation = await this.recommendPromptWithCandidates()
    
    // 5. 根据用户选择确定使用的模型和Prompt
    let chosenModel = modelRecommendation.chosen
    let chosenPrompt = promptRecommendation.chosen
    
    if (chosenModelId) {
      const selectedModel = modelRecommendation.candidates.find(c => c.id === chosenModelId)
      if (selectedModel) {
        const [provider, model] = selectedModel.title.split('/')
        chosenModel = { provider: provider as any, model: model || 'default' }
      }
    }
    
    if (chosenPromptId) {
      const selectedPrompt = promptRecommendation.candidates.find(c => c.id === chosenPromptId)
      if (selectedPrompt) {
        const promptData = await prisma.promptTemplate.findUnique({
          where: { id: chosenPromptId }
        })
        if (promptData) {
          chosenPrompt = {
            name: promptData.name,
            content: promptData.content,
            variables: promptData.variables ? JSON.parse(promptData.variables) : {}
          }
        }
      }
    }
    
    // 6. 获取商品信息（用于相关性判断和个性化）
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { 
        name: true,
        category: true,
        subcategory: true
      }
    })
    
    // 7. 调用AI解析
    const parsedData = await this.callAI(
      input,
      images,
      chosenModel.provider,
      chosenPrompt.content,
      chosenPrompt.variables,
      product?.name, // 传递商品名
      product?.category, // 传递商品类目
      product?.subcategory // 传递商品子类目
    )
    
    // 8. 去重合并到商品库
    const result = await this.mergeToProduct(productId, parsedData)
    
    const output: CompetitorAnalysisOutput = {
      ...result,
      aiModelUsed: `${chosenModel.provider}/${chosenModel.model}`,
      promptUsed: chosenPrompt.name,
      decisionId: modelRecommendation.decisionId
    }

    // 9. 如果需要返回候选项（用于用户反馈）
    if (returnCandidates) {
      output.modelCandidates = modelRecommendation.candidates
      output.promptCandidates = promptRecommendation.candidates
      output.chosenModelIndex = 0 // 精排第一个
      output.chosenPromptIndex = 0 // 精排第一个
    }
    
    return output
  }

  /**
   * 检测输入类型
   */
  private detectInputType(input: string, images?: string[]): 'text' | 'image' | 'multimodal' {
    const hasText = input && input.trim().length > 0
    const hasImages = images && images.length > 0

    if (hasText && hasImages) return 'multimodal'
    if (hasImages) return 'image'
    return 'text'
  }

  /**
   * 推荐AI模型（带候选项）
   */
  private async recommendModelWithCandidates(inputType: 'text' | 'image' | 'multimodal'): Promise<{
    chosen: { provider: string; model: string }
    candidates: Array<{
      id: string
      title: string
      score: number
      reason: string
      type: 'fine-top' | 'coarse-top' | 'explore'
    }>
    decisionId: string
  }> {
    // 构建推荐请求
    const recommendRequest = {
      scenario: 'task->model' as const,
      task: {
        businessModule: 'competitor-analysis',
        taskType: inputType,
        contentType: inputType,
        language: 'zh',
        subjectRef: {
          entityType: 'task',
          entityId: `competitor-${inputType}-${Date.now()}`
        }
      },
      constraints: {
        requireJsonMode: true,
        allowProviders: inputType === 'multimodal' || inputType === 'image' 
          ? ['gemini']
          : undefined
      },
      options: {
        strategyVersion: 'v1'
      }
    }

    try {
      const recommendation = await recommendRank(recommendRequest)
      const chosen = recommendation.chosen
      
      // 从chosen.title解析provider和model
      const [provider, model] = (chosen.title || 'gemini/gemini-pro').split('/')
      
      // 构造候选项（精排top2 + 粗排top2 + 探索2个）
      const candidates: Array<{
        id: string
        title: string
        score: number
        reason: string
        type: 'fine-top' | 'coarse-top' | 'explore'
      }> = []

      // 精排top2
      if (recommendation.fineList) {
        const fineTop = recommendation.fineList.slice(0, 2)
        fineTop.forEach(item => {
          candidates.push({
            id: item.id,
            title: item.title || 'unknown',
            score: item.fineScore || 0,
            reason: typeof item.reason === 'string' ? item.reason : JSON.stringify(item.reason),
            type: 'fine-top'
          })
        })
      }

      // 粗排top2（不在精排中的）
      if (recommendation.coarseList) {
        const fineIds = new Set(recommendation.fineList?.map(i => i.id) || [])
        const coarseTop = recommendation.coarseList.filter(i => !fineIds.has(i.id)).slice(0, 2)
        coarseTop.forEach(item => {
          candidates.push({
            id: item.id,
            title: item.title || 'unknown',
            score: item.coarseScore || 0,
            reason: typeof item.reason === 'string' ? item.reason : JSON.stringify(item.reason),
            type: 'coarse-top'
          })
        })
      }

      // 探索2个（未入池的随机）
      if (recommendation.fullPool) {
        const pooledIds = new Set([
          ...(recommendation.fineList?.map(i => i.id) || []),
          ...(recommendation.coarseList?.map(i => i.id) || [])
        ])
        const unpooled = recommendation.fullPool.filter(i => !pooledIds.has(i.id))
        const explore = unpooled.sort(() => Math.random() - 0.5).slice(0, 2)
        explore.forEach(item => {
          candidates.push({
            id: item.id,
            title: item.title || 'unknown',
            score: item.coarseScore || 0,
            reason: typeof item.reason === 'string' ? item.reason : JSON.stringify(item.reason),
            type: 'explore'
          })
        })
      }

      return {
        chosen: { provider: provider as any, model: model || 'default' },
        candidates,
        decisionId: recommendation.decisionId || 'unknown'
      }
    } catch (error) {
      console.error('模型推荐失败，使用默认:', error)
      // 降级
      const defaultProvider = inputType === 'multimodal' || inputType === 'image' ? 'gemini' : 'gemini'
      const defaultModel = inputType === 'multimodal' || inputType === 'image' ? 'gemini-pro-vision' : 'gemini-pro'
      return {
        chosen: { provider: defaultProvider, model: defaultModel },
        candidates: [{
          id: 'default',
          title: `${defaultProvider}/${defaultModel}`,
          score: 0.5,
          reason: '默认模型（推荐失败降级）',
          type: 'fine-top'
        }],
        decisionId: 'fallback'
      }
    }
  }

  /**
   * 推荐AI模型（基于输入类型）- 简化版
   */
  private async recommendModel(inputType: 'text' | 'image' | 'multimodal'): Promise<{
    provider: string
    model: string
  }> {
    // 构建推荐请求
    const recommendRequest = {
      scenario: 'task->model' as const,
      task: {
        businessModule: 'competitor-analysis',
        taskType: inputType,
        contentType: inputType,
        language: 'zh',
        subjectRef: {
          entityType: 'task',
          entityId: `competitor-${inputType}-${Date.now()}`
        }
      },
      constraints: {
        requireJsonMode: true, // 需要JSON输出
        allowProviders: inputType === 'multimodal' || inputType === 'image' 
          ? ['gemini'] // 多模态只支持Gemini
          : undefined // 文本支持所有
      },
      options: {
        strategyVersion: 'v1'
      }
    }

    try {
      const recommendation = await recommendRank(recommendRequest)
      const chosen = recommendation.chosen
      
      // 从chosen.title解析provider和model
      const [provider, model] = (chosen.title || 'gemini/gemini-pro').split('/')
      
      return {
        provider: provider as any,
        model: model || 'default'
      }
    } catch (error) {
      console.error('模型推荐失败，使用默认:', error)
      // 降级：根据输入类型选择默认模型
      if (inputType === 'multimodal' || inputType === 'image') {
        return { provider: 'gemini', model: 'gemini-pro-vision' }
      }
      return { provider: 'gemini', model: 'gemini-pro' }
    }
  }

  /**
   * 推荐Prompt（带候选项）
   */
  private async recommendPromptWithCandidates(): Promise<{
    chosen: { name: string; content: string; variables: Record<string, any> }
    candidates: Array<{
      id: string
      name: string
      score: number
      reason: string
      type: 'fine-top' | 'coarse-top' | 'explore'
    }>
  }> {
    try {
      // 从Prompt库查询竞品分析的模板
      const prompts = await prisma.promptTemplate.findMany({
        where: {
          businessModule: 'competitor-analysis',
          isActive: true
        },
        orderBy: [
          { performance: 'desc' },
          { successRate: 'desc' },
          { usageCount: 'desc' }
        ]
      })

      if (prompts.length === 0) {
        const defaultPrompt = this.getDefaultPrompt()
        return {
          chosen: defaultPrompt,
          candidates: [{
            id: 'default',
            name: defaultPrompt.name,
            score: 0.5,
            reason: '默认模板（库中无模板）',
            type: 'fine-top'
          }]
        }
      }

      // 选择最优模板
      const bestPrompt = prompts[0]
      const variables = bestPrompt.variables ? JSON.parse(bestPrompt.variables) : {}

      // 构造候选项（精排top2 + 粗排top1 + 探索2个）
      const candidates: Array<{
        id: string
        name: string
        score: number
        reason: string
        type: 'fine-top' | 'coarse-top' | 'explore'
      }> = []

      // 精排：performance和successRate加权排序（已排序）
      const fineTop = prompts.slice(0, 2)
      fineTop.forEach((p, idx) => {
        const score = (p.performance || 0) * 0.5 + (p.successRate || 0) * 0.3 + (p.isDefault ? 0.2 : 0)
        candidates.push({
          id: p.id,
          name: p.name,
          score,
          reason: `性能${p.performance?.toFixed(2)} 成功率${p.successRate?.toFixed(2)}${p.isDefault ? ' 默认' : ''}`,
          type: 'fine-top'
        })
      })

      // 粗排：使用频次高的（不在精排中）
      const fineIds = new Set(fineTop.map(p => p.id))
      const coarseTop = prompts.filter(p => !fineIds.has(p.id)).slice(0, 1)
      coarseTop.forEach(p => {
        candidates.push({
          id: p.id,
          name: p.name,
          score: (p.usageCount || 0) / 100, // 归一化
          reason: `使用${p.usageCount}次`,
          type: 'coarse-top'
        })
      })

      // 探索：新模板（usageCount < 10）
      const pooledIds = new Set([...fineTop.map(p => p.id), ...coarseTop.map(p => p.id)])
      const explore = prompts.filter(p => !pooledIds.has(p.id) && (p.usageCount || 0) < 10).slice(0, 2)
      explore.forEach(p => {
        candidates.push({
          id: p.id,
          name: p.name,
          score: 0.3, // 探索固定分数
          reason: `新模板探索（使用${p.usageCount || 0}次）`,
          type: 'explore'
        })
      })

      return {
        chosen: {
          name: bestPrompt.name,
          content: bestPrompt.content,
          variables
        },
        candidates
      }
    } catch (error) {
      console.error('Prompt推荐失败，使用默认:', error)
      const defaultPrompt = this.getDefaultPrompt()
      return {
        chosen: defaultPrompt,
        candidates: [{
          id: 'default',
          name: defaultPrompt.name,
          score: 0.5,
          reason: '默认模板（推荐失败降级）',
          type: 'fine-top'
        }]
      }
    }
  }

  /**
   * 推荐Prompt（从Prompt库）- 简化版
   */
  private async recommendPrompt(): Promise<{
    name: string
    content: string
    variables: Record<string, any>
  }> {
    try {
      // 从Prompt库查询竞品分析的模板
      const prompts = await prisma.promptTemplate.findMany({
        where: {
          businessModule: 'competitor-analysis',
          isActive: true
        },
        orderBy: [
          { performance: 'desc' },
          { successRate: 'desc' },
          { usageCount: 'desc' }
        ]
      })

      if (prompts.length === 0) {
        // 没有找到，使用默认Prompt
        return this.getDefaultPrompt()
      }

      // 选择最优模板（可通过推荐引擎进一步优化）
      const bestPrompt = prompts[0]
      
      // 解析变量
      const variables = bestPrompt.variables ? JSON.parse(bestPrompt.variables) : {}

      return {
        name: bestPrompt.name,
        content: bestPrompt.content,
        variables
      }
    } catch (error) {
      console.error('Prompt推荐失败，使用默认:', error)
      return this.getDefaultPrompt()
    }
  }

  /**
   * 默认Prompt模板
   */
  private getDefaultPrompt(): {
    name: string
    content: string
    variables: Record<string, any>
  } {
    return {
      name: 'competitor-analysis-default',
      content: `请分析以下竞品信息，提取关键信息：

1. 卖点（产品特性、优势、功能、材质、技术、设计等）- 必须
2. 痛点（用户问题、困扰、需求、缺点等）- 必须
3. 目标受众（用户画像、年龄段、职业、兴趣等）- 可选
4. 其他（使用场景、适用人群、注意事项等）- 可选

要求：
- 每个卖点/痛点独立成句，简洁明确（5-20字）
- 卖点至少提取{{minSellingPoints}}个，最多{{maxSellingPoints}}个
- 痛点至少提取{{minPainPoints}}个，最多{{maxPainPoints}}个
- 目标受众简洁描述（10-30字）
- 其他信息提炼重点（每条10-30字，最多{{maxOther}}条）
- 以JSON格式返回：
{
  "sellingPoints": ["卖点1", "卖点2", ...],
  "painPoints": ["痛点1", "痛点2", ...],
  "targetAudience": "目标受众描述",
  "other": ["其他信息1", "其他信息2", ...]
}

{{#if text}}
竞品文本：
{{text}}
{{/if}}

{{#if hasImages}}
包含 {{imageCount}} 张商品图片，请结合图片分析。
{{/if}}

请直接返回JSON，不要有其他说明文字。`,
      variables: {
        minSellingPoints: 3,
        maxSellingPoints: 10,
        minPainPoints: 1,
        maxPainPoints: 5,
        maxOther: 3
      }
    }
  }

  /**
   * 调用AI解析
   */
  private async callAI(
    text: string,
    images: string[] | undefined,
    provider: string,
    promptTemplate: string,
    variables: Record<string, any>,
    productName?: string,
    productCategory?: string,
    productSubcategory?: string
  ): Promise<{
    sellingPoints: string[]
    painPoints: string[]
    targetAudience?: string
    other?: string[]
  }> {
    // 填充Prompt变量（包含商品名称和类目信息）
    // 确保默认变量被正确设置
    const defaultVariables = {
      minSellingPoints: 3,
      maxSellingPoints: 10,
      minPainPoints: 1,
      maxPainPoints: 5,
      maxOther: 3
    }
    
    const allVariables = {
      ...defaultVariables, // 先设置默认值
      ...variables,        // 再覆盖数据库中的值
      text,
      hasImages: images && images.length > 0,
      imageCount: images?.length || 0,
      productName: productName || '未知商品',
      productCategory: productCategory || '未分类',
      productSubcategory: productSubcategory || ''
    }
    
    console.log('🔧 Prompt变量替换调试:')
    console.log('- 原始模板:', promptTemplate.substring(0, 200) + '...')
    console.log('- 变量列表:', allVariables)
    
    const enhancedPrompt = this.fillPromptVariables(promptTemplate, allVariables)
    
    console.log('- 替换后模板:', enhancedPrompt.substring(0, 300) + '...')
    
    // 在prompt中添加相关性判断指令（仅当商品信息明确时）
    const categoryInfo = productCategory ? `（${productCategory}${productSubcategory ? ' / ' + productSubcategory : ''}）` : ''
    const finalPrompt = `${enhancedPrompt}

【重要】相关性过滤规则：
1. 只提取与"${productName || '商品'}"${categoryInfo}相关的卖点和痛点
2. 如果输入内容与商品无关（如测试文本"abc"、随机字符等），返回空数组
3. 痛点必须是用户在使用该类商品时遇到的实际问题，而非无关内容
4. 如果输入内容过于简短（<10个字）或明显是测试数据，返回：{"sellingPoints":[],"painPoints":[],"targetAudience":"","other":[]}

请严格按照上述规则过滤不相关内容。`

    try {
      // 使用aiExecutor调用AI
      const response = await aiExecutor.enqueue(() =>
        aiExecutor.execute({
          provider: provider as any,
          prompt: finalPrompt,
          useSearch: false,
          images: images || []
        })
      )

      // 解析AI返回的JSON
      const cleanResponse = response.trim()
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '')
      const parsed = JSON.parse(cleanResponse)

      // 验证并清洗数据
      const sellingPoints = this.cleanArray(parsed.sellingPoints)
      const painPoints = this.cleanArray(parsed.painPoints)
      
      // 二次验证相关性（简单规则）
      const filteredPainPoints = painPoints.filter(point => {
        // 过滤明显无关的痛点
        const irrelevantKeywords = ['abc', 'test', '测试', '随机', 'xxx', '123']
        const lowerPoint = point.toLowerCase()
        return !irrelevantKeywords.some(kw => lowerPoint.includes(kw))
      })

      return {
        sellingPoints,
        painPoints: filteredPainPoints,
        targetAudience: typeof parsed.targetAudience === 'string' ? parsed.targetAudience.trim() : undefined,
        other: this.cleanArray(parsed.other)
      }
    } catch (error) {
      console.error('AI解析失败，使用降级逻辑:', error)
      // 降级：简单文本提取
      return this.fallbackParsing(text)
    }
  }

  /**
   * 填充Prompt变量（简单模板引擎）
   */
  private fillPromptVariables(template: string, variables: Record<string, any>): string {
    let result = template

    // 替换简单变量 {{variable}}
    result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match
    })

    // 处理条件语句 {{#if condition}} ... {{/if}}
    result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
      return variables[key] ? content : ''
    })

    return result
  }

  /**
   * 清洗数组数据
   */
  private cleanArray(arr: any): string[] {
    if (!Array.isArray(arr)) return []
    return arr.filter((item: any) => typeof item === 'string' && item.trim().length > 0)
  }

  /**
   * 降级解析（AI失败时）
   */
  private fallbackParsing(text: string): {
    sellingPoints: string[]
    painPoints: string[]
    targetAudience?: string
    other?: string[]
  } {
    const lines = text.split(/[。，；\n]/).map(l => l.trim()).filter(Boolean)
    const sellingPoints = lines.filter(l => l.length > 2 && l.length < 50).slice(0, 5)
    return { sellingPoints, painPoints: [], targetAudience: undefined, other: [] }
  }

  /**
   * 链接解析（降级处理）
   */
  private async handleUrlParsing(url: string): Promise<any> {
    throw new Error('链接解析失败：大多数平台不允许爬取。建议复制商品详情文本或截图粘贴。')
  }

  /**
   * 合并到商品库（去重 + 智能筛选）
   */
  private async mergeToProduct(
    productId: string,
    parsedData: {
      sellingPoints: string[]
      painPoints: string[]
      targetAudience?: string
      other?: string[]
    }
  ): Promise<CompetitorAnalysisOutput> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { 
        sellingPoints: true, 
        painPoints: true, 
        targetAudience: true,
        name: true,
        category: true,
        subcategory: true,
        description: true,
        targetCountries: true
      }
    })

    if (!product) {
      throw new Error('商品不存在')
    }

    // 解析现有数据
    const parseJSON = (field: string | null): string[] => {
      if (!field) return []
      try {
        const parsed = JSON.parse(field)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }

    const existingSellingPoints = parseJSON(product.sellingPoints)
    const existingPainPoints = parseJSON(product.painPoints)
    const existingTargetAudience = parseJSON(product.targetAudience)

    // 构建商品上下文
    const productContext: ProductContext = {
      productName: product.name || '未知商品',
      category: product.category || '未分类',
      subcategory: product.subcategory || undefined,
      description: product.description || undefined,
      targetCountries: Array.isArray(product.targetCountries) ? product.targetCountries : [],
      existingSellingPoints,
      existingPainPoints,
      existingTargetAudience
    }

    // 合并新数据
    const allSellingPoints = [...existingSellingPoints, ...parsedData.sellingPoints]
    const allPainPoints = [...existingPainPoints, ...parsedData.painPoints]
    const allTargetAudience = [
      ...existingTargetAudience, 
      ...(parsedData.targetAudience ? [parsedData.targetAudience] : [])
    ]

    // 使用智能筛选器筛选最匹配的前5个
    const filteredInfo = await filterProductInfo(
      allSellingPoints,
      allPainPoints,
      allTargetAudience,
      productContext,
      {
        maxSellingPoints: 5,
        maxPainPoints: 5,
        maxTargetAudience: 5,
        enableDeduplication: true,
        enableRelevanceScoring: true
      }
    )

    // 更新商品库
    await prisma.product.update({
      where: { id: productId },
      data: {
        sellingPoints: JSON.stringify(filteredInfo.sellingPoints),
        painPoints: JSON.stringify(filteredInfo.painPoints),
        targetAudience: JSON.stringify(filteredInfo.targetAudience),
        lastUserUpdate: new Date()
      }
    })

    return {
      sellingPoints: filteredInfo.sellingPoints,
      painPoints: filteredInfo.painPoints,
      targetAudience: filteredInfo.targetAudience.join(', '),
      other: parsedData.other,
      addedSellingPoints: parsedData.sellingPoints.length,
      addedPainPoints: parsedData.painPoints.length,
      totalSellingPoints: filteredInfo.sellingPoints.length,
      totalPainPoints: filteredInfo.painPoints.length,
      aiModelUsed: '', // 由调用方填充
      promptUsed: '' // 由调用方填充
    }
  }
}

export const unifiedCompetitorService = new UnifiedCompetitorService()

