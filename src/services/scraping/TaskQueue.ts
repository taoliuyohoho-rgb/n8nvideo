import { prisma } from '@/lib/prisma'

export interface Task {
  id: string
  url: string
  platform: string
  productId?: string
  productName?: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  errorCode?: string
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
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

export class TaskQueue {
  private runningTasks: Map<string, Task> = new Map()
  private maxConcurrency: number

  constructor(maxConcurrency: number = 5) {
    this.maxConcurrency = maxConcurrency
  }

  /**
   * 提交任务到队列
   */
  async submitTasks(batchId: string, tasks: any[], options: any): Promise<number> {
    const concurrency = options.concurrency || this.maxConcurrency
    
    // 创建任务记录
    const createdTasks = await Promise.all(
      tasks.map(task => this.createTaskRecord(batchId, task))
    )

    // 异步处理任务
    this.processTasks(createdTasks, concurrency)

    return createdTasks.length
  }

  /**
   * 获取批量任务状态
   */
  async getBatchStatus(batchId: string): Promise<BatchStatus> {
    try {
      const tasks = await prisma.scrapingTask.findMany({
        where: { batchId }
      })

      const total = tasks.length
      const done = tasks.filter(t => t.status === 'completed').length
      const running = tasks.filter(t => t.status === 'running').length
      const failed = tasks.filter(t => t.status === 'failed').length

      const failedSamples = tasks
        .filter(t => t.status === 'failed')
        .slice(0, 20)
        .map(t => ({
          taskId: t.id,
          url: t.url,
          platform: t.platform,
          errorCode: t.errorCode || 'UNKNOWN',
          message: t.errorMessage || 'Unknown error'
        }))

      return {
        total,
        done,
        running,
        failed,
        failedSamples
      }
    } catch (error) {
      console.error('获取批量任务状态失败:', error)
      return {
        total: 0,
        done: 0,
        running: 0,
        failed: 0,
        failedSamples: []
      }
    }
  }

  /**
   * 创建任务记录
   */
  private async createTaskRecord(batchId: string, task: any): Promise<Task> {
    const created = await prisma.scrapingTask.create({
      data: {
        batchId,
        url: task.url,
        platform: task.platform,
        productId: task.productId,
        productName: task.productName,
        status: 'pending'
      }
    })

    return {
      id: created.id,
      url: created.url,
      platform: created.platform,
      productId: created.productId || undefined,
      productName: created.productName || undefined,
      status: created.status as any,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt
    }
  }

  /**
   * 处理任务队列
   */
  private async processTasks(tasks: Task[], concurrency: number): Promise<void> {
    const semaphore = new Semaphore(concurrency)
    
    for (const task of tasks) {
      semaphore.acquire().then(async () => {
        try {
          await this.processTask(task)
        } finally {
          semaphore.release()
        }
      })
    }
  }

  /**
   * 处理单个任务
   */
  private async processTask(task: Task): Promise<void> {
    try {
      // 更新任务状态为运行中
      await this.updateTaskStatus(task.id, 'running')
      this.runningTasks.set(task.id, task)

      // 执行抓取任务
      await this.executeScrapingTask(task)

      // 更新任务状态为完成
      await this.updateTaskStatus(task.id, 'completed')
      this.runningTasks.delete(task.id)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorCode = error instanceof Error && 'code' in error ? String(error.code) : 'UNKNOWN'

      // 更新任务状态为失败
      await this.updateTaskStatus(task.id, 'failed', errorCode, errorMessage)
      this.runningTasks.delete(task.id)
    }
  }

  /**
   * 执行抓取任务
   */
  private async executeScrapingTask(task: Task): Promise<void> {
    // 这里应该调用实际的抓取逻辑
    // 暂时模拟一个简单的抓取过程
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    // 模拟偶尔的失败
    if (Math.random() < 0.1) {
      throw new Error('Simulated scraping failure')
    }
  }

  /**
   * 更新任务状态
   */
  private async updateTaskStatus(
    taskId: string, 
    status: string, 
    errorCode?: string, 
    errorMessage?: string
  ): Promise<void> {
    await prisma.scrapingTask.update({
      where: { id: taskId },
      data: {
        status,
        errorCode,
        errorMessage,
        updatedAt: new Date()
      }
    })
  }
}

/**
 * 信号量实现
 */
class Semaphore {
  private permits: number
  private waiting: Array<() => void> = []

  constructor(permits: number) {
    this.permits = permits
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--
      return Promise.resolve()
    }

    return new Promise(resolve => {
      this.waiting.push(resolve)
    })
  }

  release(): void {
    this.permits++
    
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift()
      if (resolve) {
        this.permits--
        resolve()
      }
    }
  }
}
