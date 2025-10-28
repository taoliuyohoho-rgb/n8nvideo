import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export type TaskType = 
  | 'video_generation'
  | 'competitor_analysis'
  | 'comment_scraping'
  | 'style_parsing'
  | 'prompt_generation'
  | 'video_analysis'
  | 'product_analysis'

export type TaskStatus = 
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'canceled'

export interface CreateTaskInput {
  type: TaskType
  payload: any
  priority?: number
  traceId?: string
  dedupeKey?: string
  ownerId?: string
  scheduledAt?: Date
  maxRetries?: number
  metadata?: any
}

export interface UpdateTaskInput {
  status?: TaskStatus
  progress?: number
  result?: any
  error?: string
  workerName?: string
  startedAt?: Date
  completedAt?: Date
}

export interface TaskQueryOptions {
  type?: TaskType | TaskType[]
  status?: TaskStatus | TaskStatus[]
  ownerId?: string
  traceId?: string
  limit?: number
  offset?: number
  orderBy?: 'createdAt' | 'priority' | 'scheduledAt'
  order?: 'asc' | 'desc'
}

export class TaskService {
  /**
   * 创建新任务
   */
  async createTask(input: CreateTaskInput) {
    const task = await prisma.task.create({
      data: {
        type: input.type,
        payload: JSON.stringify(input.payload),
        priority: input.priority ?? 0,
        traceId: input.traceId,
        dedupeKey: input.dedupeKey,
        ownerId: input.ownerId,
        scheduledAt: input.scheduledAt,
        maxRetries: input.maxRetries ?? 3,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    })

    await this.addTaskLog(task.id, 'info', 'Task created', { input })

    return this.serializeTask(task)
  }

  /**
   * 根据幂等键查找或创建任务
   */
  async findOrCreateTask(input: CreateTaskInput & { dedupeKey: string }) {
    const existing = await prisma.task.findUnique({
      where: { dedupeKey: input.dedupeKey },
    })

    if (existing) {
      return this.serializeTask(existing)
    }

    return this.createTask(input)
  }

  /**
   * 获取任务详情
   */
  async getTask(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    })

    if (!task) {
      return null
    }

    return this.serializeTask(task)
  }

  /**
   * 更新任务状态
   */
  async updateTask(taskId: string, input: UpdateTaskInput) {
    const updateData: any = {}

    if (input.status !== undefined) updateData.status = input.status
    if (input.progress !== undefined) updateData.progress = input.progress
    if (input.result !== undefined) updateData.result = JSON.stringify(input.result)
    if (input.error !== undefined) updateData.error = input.error
    if (input.workerName !== undefined) updateData.workerName = input.workerName
    if (input.startedAt !== undefined) updateData.startedAt = input.startedAt
    if (input.completedAt !== undefined) updateData.completedAt = input.completedAt

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
    })

    await this.addTaskLog(taskId, 'info', 'Task updated', { update: input })

    return this.serializeTask(task)
  }

  /**
   * 标记任务开始执行
   */
  async startTask(taskId: string, workerName: string) {
    return this.updateTask(taskId, {
      status: 'running',
      workerName,
      startedAt: new Date(),
    })
  }

  /**
   * 标记任务成功完成
   */
  async completeTask(taskId: string, result: any) {
    return this.updateTask(taskId, {
      status: 'succeeded',
      progress: 100,
      result,
      completedAt: new Date(),
    })
  }

  /**
   * 标记任务失败
   */
  async failTask(taskId: string, error: string) {
    const task = await this.getTask(taskId)
    
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    // 检查是否需要重试
    if (task.retryCount < task.maxRetries) {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'pending',
          retryCount: task.retryCount + 1,
          error,
        },
      })

      await this.addTaskLog(taskId, 'warn', `Task failed, will retry (attempt ${task.retryCount + 1}/${task.maxRetries})`, { error })

      return this.getTask(taskId)
    }

    // 超过最大重试次数，标记为失败
    await this.updateTask(taskId, {
      status: 'failed',
      error,
      completedAt: new Date(),
    })

    await this.addTaskLog(taskId, 'error', 'Task failed permanently', { error })

    return this.getTask(taskId)
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string) {
    return this.updateTask(taskId, {
      status: 'canceled',
      completedAt: new Date(),
    })
  }

  /**
   * 查询任务列表
   */
  async queryTasks(options: TaskQueryOptions = {}) {
    const where: any = {}

    if (options.type) {
      where.type = Array.isArray(options.type) ? { in: options.type } : options.type
    }

    if (options.status) {
      where.status = Array.isArray(options.status) ? { in: options.status } : options.status
    }

    if (options.ownerId) {
      where.ownerId = options.ownerId
    }

    if (options.traceId) {
      where.traceId = options.traceId
    }

    const orderBy: any = {}
    const orderByField = options.orderBy || 'createdAt'
    const order = options.order || 'desc'
    orderBy[orderByField] = order

    const tasks = await prisma.task.findMany({
      where,
      orderBy,
      take: options.limit || 50,
      skip: options.offset || 0,
    })

    return tasks.map(task => this.serializeTask(task))
  }

  /**
   * 获取待执行任务（供 worker 消费）
   */
  async getPendingTasks(types?: TaskType[], limit: number = 10) {
    const where: any = {
      status: 'pending',
      OR: [
        { scheduledAt: null },
        { scheduledAt: { lte: new Date() } },
      ],
    }

    if (types && types.length > 0) {
      where.type = { in: types }
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: limit,
    })

    return tasks.map(task => this.serializeTask(task))
  }

  /**
   * 添加任务日志
   */
  async addTaskLog(taskId: string, level: string, message: string, data?: any) {
    await prisma.taskLog.create({
      data: {
        taskId,
        level,
        message,
        data: data ? JSON.stringify(data) : null,
      },
    })
  }

  /**
   * 获取任务日志
   */
  async getTaskLogs(taskId: string, limit: number = 100) {
    const logs = await prisma.taskLog.findMany({
      where: { taskId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    })

    return logs.map(log => ({
      id: log.id,
      level: log.level,
      message: log.message,
      data: log.data ? JSON.parse(log.data) : null,
      timestamp: log.timestamp,
    }))
  }

  /**
   * 序列化任务对象（解析 JSON 字段）
   */
  private serializeTask(task: any) {
    return {
      id: task.id,
      type: task.type,
      status: task.status,
      priority: task.priority,
      payload: task.payload ? JSON.parse(task.payload) : null,
      result: task.result ? JSON.parse(task.result) : null,
      error: task.error,
      progress: task.progress,
      traceId: task.traceId,
      dedupeKey: task.dedupeKey,
      ownerId: task.ownerId,
      workerName: task.workerName,
      retryCount: task.retryCount,
      maxRetries: task.maxRetries,
      createdAt: task.createdAt,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      scheduledAt: task.scheduledAt,
      metadata: task.metadata ? JSON.parse(task.metadata) : null,
    }
  }

  /**
   * 获取任务统计信息
   */
  async getTaskStats(options?: { type?: TaskType; ownerId?: string }) {
    const where: any = {}
    
    if (options?.type) where.type = options.type
    if (options?.ownerId) where.ownerId = options.ownerId

    const [total, pending, running, succeeded, failed, canceled] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.count({ where: { ...where, status: 'pending' } }),
      prisma.task.count({ where: { ...where, status: 'running' } }),
      prisma.task.count({ where: { ...where, status: 'succeeded' } }),
      prisma.task.count({ where: { ...where, status: 'failed' } }),
      prisma.task.count({ where: { ...where, status: 'canceled' } }),
    ])

    return {
      total,
      pending,
      running,
      succeeded,
      failed,
      canceled,
    }
  }
}

// 单例导出
export const taskService = new TaskService()




