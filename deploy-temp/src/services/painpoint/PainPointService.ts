import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface PainPoint {
  text: string
  frequency: number
  severity: 'high' | 'medium' | 'low'
  sources: string[] // 来源平台
}

export class PainPointService {
  /**
   * 合并和去重痛点
   */
  async mergePainPoints(productId: string, newPainPoints: string[], platform: string): Promise<PainPoint[]> {
    // 获取产品现有痛点
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    let existingPainPoints: PainPoint[] = []
    if (product?.painPoints) {
      try {
        existingPainPoints = JSON.parse(String(product.painPoints))
      } catch (e) {
        console.error('解析现有痛点失败:', e)
      }
    }

    // 合并新旧痛点
    const mergedMap = new Map<string, PainPoint>()

    // 添加现有痛点
    existingPainPoints.forEach(pp => {
      const key = this.normalizePainPoint(pp.text)
      mergedMap.set(key, pp)
    })

    // 添加新痛点
    newPainPoints.forEach(text => {
      const key = this.normalizePainPoint(text)
      const existing = mergedMap.get(key)
      
      if (existing) {
        // 痛点已存在，增加频次和来源
        existing.frequency += 1
        if (!existing.sources.includes(platform)) {
          existing.sources.push(platform)
        }
      } else {
        // 新痛点
        mergedMap.set(key, {
          text,
          frequency: 1,
          severity: 'medium',
          sources: [platform]
        })
      }
    })

    // 转换为数组
    const allPainPoints = Array.from(mergedMap.values())

    // AI分析和筛选，保留最重要的10个
    const finalPainPoints = await this.aiAnalyzeAndFilter(allPainPoints)

    // 更新到数据库
    await prisma.product.update({
      where: { id: productId },
      data: {
        painPoints: JSON.stringify(finalPainPoints),
        painPointsLastUpdate: new Date(),
        painPointsSource: JSON.stringify({
          platforms: Array.from(new Set(finalPainPoints.flatMap(pp => pp.sources))),
          lastPlatform: platform,
          totalAnalyzed: allPainPoints.length,
          selected: finalPainPoints.length
        })
      }
    })

    return finalPainPoints
  }

  /**
   * 标准化痛点文本（用于去重）
   */
  private normalizePainPoint(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[，。！？；：""''（）【】]/g, '')
      .replace(/\s+/g, ' ')
  }

  /**
   * AI分析和筛选痛点
   * 选择最重要的10个痛点
   */
  private async aiAnalyzeAndFilter(painPoints: PainPoint[]): Promise<PainPoint[]> {
    // 按频次和严重程度排序
    const scored = painPoints.map(pp => ({
      ...pp,
      score: this.calculatePainPointScore(pp)
    }))

    // 按分数降序排序
    scored.sort((a, b) => b.score - a.score)

    // 评估严重程度
    scored.forEach(pp => {
      pp.severity = this.evaluateSeverity(pp)
    })

    // 选择前10个
    const top10 = scored.slice(0, 10)

    // AI优化文本描述（使其更简洁明了）
    const optimized = top10.map(pp => ({
      text: this.optimizePainPointText(pp.text),
      frequency: pp.frequency,
      severity: pp.severity,
      sources: pp.sources
    }))

    return optimized
  }

  /**
   * 计算痛点分数
   */
  private calculatePainPointScore(pp: PainPoint): number {
    let score = 0

    // 频次权重 (40%)
    score += pp.frequency * 40

    // 严重程度权重 (30%)
    const severityScores = { high: 30, medium: 20, low: 10 }
    score += severityScores[pp.severity] || 20

    // 多平台验证权重 (30%)
    score += pp.sources.length * 15

    return score
  }

  /**
   * 评估严重程度
   */
  private evaluateSeverity(pp: any): 'high' | 'medium' | 'low' {
    const text = pp.text.toLowerCase()

    // 高严重程度关键词
    const highKeywords = [
      '无法', '不能', '坏了', '损坏', '严重', '危险', '不安全',
      '完全', '根本', '彻底', '失败', '故障', '问题', '退货'
    ]

    // 低严重程度关键词
    const lowKeywords = [
      '稍微', '有点', '一点', '还好', '还行', '一般', '可以'
    ]

    // 检查高严重程度
    if (highKeywords.some(kw => text.includes(kw))) {
      return 'high'
    }

    // 检查低严重程度
    if (lowKeywords.some(kw => text.includes(kw))) {
      return 'low'
    }

    // 频次高也认为是高严重程度
    if (pp.frequency >= 5) {
      return 'high'
    }

    // 默认中等严重程度
    return 'medium'
  }

  /**
   * 优化痛点文本描述
   */
  private optimizePainPointText(text: string): string {
    // 移除多余的空格和标点
    let optimized = text.trim()
      .replace(/\s+/g, ' ')
      .replace(/[，。！？；：]+$/g, '')

    // 限制长度（最多30个字符）
    if (optimized.length > 30) {
      optimized = optimized.substring(0, 27) + '...'
    }

    return optimized
  }

  /**
   * 获取产品痛点
   */
  async getProductPainPoints(productId: string): Promise<PainPoint[]> {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product?.painPoints) {
      return []
    }

    try {
      return JSON.parse(String(product.painPoints))
    } catch (e) {
      console.error('解析痛点失败:', e)
      return []
    }
  }

  /**
   * 从评论中提取痛点
   */
  extractPainPointsFromComments(comments: string[]): string[] {
    const painPoints: string[] = []

    comments.forEach(comment => {
      // 使用简单的规则提取痛点
      const negativePatterns = [
        /(.{0,15})(问题|故障|坏了|损坏|不好|差|失望|不满意)(.{0,15})/g,
        /(.{0,15})(无法|不能|没法|不会|无效)(.{0,15})/g,
        /(.{0,15})(太|很|非常|特别|超级)(差|烂|糟糕|失望)(.{0,15})/g,
      ]

      negativePatterns.forEach(pattern => {
        const matches = comment.match(pattern)
        if (matches) {
          matches.forEach(match => {
            const cleaned = match.trim()
            if (cleaned.length > 5 && cleaned.length < 50) {
              painPoints.push(cleaned)
            }
          })
        }
      })
    })

    return painPoints
  }
}

