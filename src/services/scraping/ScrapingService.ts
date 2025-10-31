import { prisma } from '@/lib/prisma'
import { EvidenceService } from './EvidenceService'
import { PlatformAdapter } from './adapters/PlatformAdapter'
import { RateLimiter } from './RateLimiter'
import { TaskQueue } from './TaskQueue'

export interface ScrapingOptions {
  platform?: string
  concurrency?: number
  rateLimit?: {
    perSec?: number
  }
  force?: boolean
  idempotencyKey?: string
}

export interface ScrapingResult {
  batchId: string
  accepted: number
  duplicated: number
  planned: number
}

export interface BatchStatus {
  total: number
  done: number
  running: number
  failed: number
  failedSamples: Array<{
    taskId: string
    url: string
    platform: string
    errorCode: string
    message: string
  }>
}

export class ScrapingService {
  private evidenceService: EvidenceService
  private rateLimiter: RateLimiter
  private taskQueue: TaskQueue

  constructor() {
    this.evidenceService = new EvidenceService()
    this.rateLimiter = new RateLimiter()
    this.taskQueue = new TaskQueue()
  }

  /**
   * 创建批量抓取任务
   */
  async createBatch(
    urls?: string[],
    productIds?: string[],
    options: ScrapingOptions = {}
  ): Promise<ScrapingResult> {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 验证输入
    if (!urls && !productIds) {
      throw new Error('必须提供 urls 或 productIds')
    }

    // 获取商品信息（如果提供了 productIds）
    let products: any[] = []
    if (productIds && productIds.length > 0) {
      products = await prisma.product.findMany({
        where: { id: { in: productIds } }
      })
    }

    // 生成抓取任务
    const tasks = await this.generateTasks(urls, products, options)
    
    // 去重检查（24h内不重复）
    const { accepted, duplicated } = await this.deduplicateTasks(tasks, options.force)
    
    // 提交到任务队列
    const planned = await this.taskQueue.submitTasks(batchId, accepted, options)

    return {
      batchId,
      accepted: accepted.length,
      duplicated,
      planned
    }
  }

  /**
   * 获取批量任务状态
   */
  async getBatchStatus(batchId: string): Promise<BatchStatus> {
    return await this.taskQueue.getBatchStatus(batchId)
  }

  /**
   * 生成抓取任务
   */
  private async generateTasks(
    urls?: string[],
    products?: any[],
    options: ScrapingOptions = {}
  ): Promise<any[]> {
    const tasks: any[] = []

    // 处理直接URL
    if (urls) {
      for (const url of urls) {
        const platform = this.detectPlatform(url)
        tasks.push({
          url,
          platform,
          productId: null,
          productName: null
        })
      }
    }

    // 处理商品相关任务
    if (products) {
      for (const product of products) {
        const productUrls = await this.generateProductUrls(product, options.platform)
        for (const url of productUrls) {
          const platform = this.detectPlatform(url)
          tasks.push({
            url,
            platform,
            productId: product.id,
            productName: product.name
          })
        }
      }
    }

    return tasks
  }

  /**
   * 为商品生成相关URL
   */
  private async generateProductUrls(product: any, platform?: string): Promise<string[]> {
    const urls: string[] = []
    const platforms = platform ? [platform] : this.getSupportedPlatforms()

    for (const p of platforms) {
      const adapter = PlatformAdapter.getAdapter(p)
      const productUrls = await adapter.generateProductUrls(product)
      urls.push(...productUrls)
    }

    return urls
  }

  /**
   * 检测平台
   */
  private detectPlatform(url: string): string {
    if (url.includes('tiktok.com') || url.includes('douyin.com')) return 'tiktok'
    if (url.includes('amazon.com')) return 'amazon'
    if (url.includes('facebook.com') || url.includes('meta.com')) return 'meta'
    if (url.includes('shopee.com')) return 'shopee'
    if (url.includes('taobao.com')) return 'taobao'
    if (url.includes('jd.com')) return 'jd'
    if (url.includes('1688.com')) return '1688'
    return 'unknown'
  }

  /**
   * 获取支持的平台列表
   */
  private getSupportedPlatforms(): string[] {
    return [
      'tiktok', 'amazon', 'meta', 'shopee', 
      'taobao', 'jd', '1688', 'pdd'
    ]
  }

  /**
   * 去重检查
   */
  private async deduplicateTasks(tasks: any[], force: boolean = false): Promise<{
    accepted: any[]
    duplicated: number
  }> {
    if (force) {
      return { accepted: tasks, duplicated: 0 }
    }

    const accepted: any[] = []
    let duplicated = 0

    for (const task of tasks) {
      // 检查24小时内是否已抓取过相同URL
      const existing = await prisma.productEvidence.findFirst({
        where: {
          url: task.url,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })

      if (existing) {
        duplicated++
      } else {
        accepted.push(task)
      }
    }

    return { accepted, duplicated }
  }
}