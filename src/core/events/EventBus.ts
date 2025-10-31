import type { DomainEvent, EventHandler } from '../types'

export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map()
  private middleware: EventMiddleware[] = []

  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, [])
    }
    this.handlers.get(eventType)!.push(handler)
  }

  unsubscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  async publish(event: DomainEvent): Promise<void> {
    try {
      // 应用中间件
      for (const middleware of this.middleware) {
        await middleware.beforePublish(event)
      }

      // 获取处理器
      const handlers = this.handlers.get(event.type) || []
      
      // 并发执行所有处理器
      const promises = handlers.map(async (handler) => {
        try {
          await handler.handle(event)
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error)
          // 不抛出错误，避免影响其他处理器
        }
      })

      await Promise.all(promises)

      // 应用后置中间件
      for (const middleware of this.middleware) {
        await middleware.afterPublish(event)
      }

      console.log(`Event ${event.type} published successfully`)
    } catch (error) {
      console.error(`Failed to publish event ${event.type}:`, error)
      throw error
    }
  }

  addMiddleware(middleware: EventMiddleware): void {
    this.middleware.push(middleware)
  }

  removeMiddleware(middleware: EventMiddleware): void {
    const index = this.middleware.indexOf(middleware)
    if (index > -1) {
      this.middleware.splice(index, 1)
    }
  }

  getSubscribers(eventType: string): EventHandler[] {
    return this.handlers.get(eventType) || []
  }

  getAllEventTypes(): string[] {
    return Array.from(this.handlers.keys())
  }
}

export interface EventMiddleware {
  beforePublish(event: DomainEvent): Promise<void>
  afterPublish(event: DomainEvent): Promise<void>
}

// 日志中间件
export class LoggingMiddleware implements EventMiddleware {
  async beforePublish(event: DomainEvent): Promise<void> {
    console.log(`Publishing event: ${event.type}`, {
      timestamp: event.timestamp,
      source: event.source,
      correlationId: event.correlationId
    })
  }

  async afterPublish(event: DomainEvent): Promise<void> {
    console.log(`Event ${event.type} published successfully`)
  }
}

// 重试中间件
export class RetryMiddleware implements EventMiddleware {
  constructor(private maxRetries: number = 3) {}

  async beforePublish(event: DomainEvent): Promise<void> {
    // 重试逻辑可以在这里实现
  }

  async afterPublish(event: DomainEvent): Promise<void> {
    // 重试后的处理
  }
}
