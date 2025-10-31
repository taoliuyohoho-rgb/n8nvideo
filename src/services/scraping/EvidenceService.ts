import { prisma } from '@/lib/prisma'
import { RawPointerService } from './RawPointerService'

export interface EvidenceData {
  productId: string
  platform: string
  url: string
  title: string
  description?: string
  images: string[]
  targetMarkets: string[]
  targetAudiences: string[]
  sellingPoints: string[]
  painPoints: string[]
  angles: string[]
  evidenceMeta: {
    capturedAt: string
    parserVer: string
    source: string
  }
  rawContent?: string
}

export class EvidenceService {
  private rawPointerService: RawPointerService

  constructor() {
    this.rawPointerService = new RawPointerService()
  }

  /**
   * 保存证据数据
   */
  async saveEvidence(data: EvidenceData): Promise<string> {
    let rawPointerId: string | null = null

    // 保存原始内容（如果提供）
    if (data.rawContent) {
      rawPointerId = await this.rawPointerService.saveRawContent(data.rawContent)
    }

    // 保存证据记录
    const evidence = await prisma.productEvidence.create({
      data: {
        productId: data.productId,
        platform: data.platform,
        url: data.url,
        title: data.title,
        description: data.description,
        images: data.images,
        targetMarkets: data.targetMarkets,
        targetAudiences: data.targetAudiences,
        sellingPoints: data.sellingPoints,
        painPoints: data.painPoints,
        angles: data.angles,
        evidenceMeta: data.evidenceMeta,
        rawPointerId
      }
    })

    // 聚合回写到Product表
    await this.aggregateToProduct(data.productId)

    return evidence.id
  }

  /**
   * 聚合证据数据到Product表
   */
  async aggregateToProduct(productId: string): Promise<void> {
    // 获取该商品的所有证据
    const evidences = await prisma.productEvidence.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' }
    })

    if (evidences.length === 0) return

    // 聚合数据
    const aggregated = this.aggregateEvidenceData(evidences)

    // 更新Product表
    await prisma.product.update({
      where: { id: productId },
      data: {
        sellingPointsTop5: aggregated.sellingPoints,
        painPointsTop5: aggregated.painPoints,
        targetMarkets: aggregated.targetMarkets,
        targetAudiences: aggregated.targetAudiences,
        description: aggregated.description,
        images: aggregated.images,
        evidenceLastUpdate: new Date()
      }
    })
  }

  /**
   * 聚合证据数据
   */
  private aggregateEvidenceData(evidences: any[]): {
    sellingPoints: string[]
    painPoints: string[]
    targetMarkets: string[]
    targetAudiences: string[]
    description: string
    images: string[]
  } {
    const allSellingPoints: string[] = []
    const allPainPoints: string[] = []
    const allTargetMarkets: string[] = []
    const allTargetAudiences: string[] = []
    const allImages: string[] = []
    const descriptions: string[] = []

    for (const evidence of evidences) {
      allSellingPoints.push(...(evidence.sellingPoints || []))
      allPainPoints.push(...(evidence.painPoints || []))
      allTargetMarkets.push(...(evidence.targetMarkets || []))
      allTargetAudiences.push(...(evidence.targetAudiences || []))
      allImages.push(...(evidence.images || []))
      if (evidence.description) {
        descriptions.push(evidence.description)
      }
    }

    return {
      sellingPoints: this.getTop5Unique(allSellingPoints),
      painPoints: this.getTop5Unique(allPainPoints),
      targetMarkets: Array.from(new Set(allTargetMarkets)),
      targetAudiences: Array.from(new Set(allTargetAudiences)),
      description: descriptions[0] || '', // 使用最新的描述
      images: Array.from(new Set(allImages))
    }
  }

  /**
   * 获取Top5唯一值
   */
  private getTop5Unique(items: string[]): string[] {
    const counts = new Map<string, number>()
    
    for (const item of items) {
      counts.set(item, (counts.get(item) || 0) + 1)
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([item]) => item)
  }

  /**
   * 获取商品的证据数据
   */
  async getProductEvidence(productId: string): Promise<any[]> {
    return await prisma.productEvidence.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: {
        rawPointer: true
      }
    })
  }

  /**
   * 清理过期证据
   */
  async cleanupExpiredEvidence(): Promise<number> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    const deleted = await prisma.productEvidence.deleteMany({
      where: {
        createdAt: {
          lt: sevenDaysAgo
        }
      }
    })

    return deleted.count
  }
}
