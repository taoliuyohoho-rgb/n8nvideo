/**
 * 结构化日志工具
 * 用于统一日志格式，便于调试和排查问题
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  traceId?: string
  requestId?: string
  userId?: string
  module?: string
  action?: string
  [key: string]: any
}

class Logger {
  private baseContext: LogContext = {}

  /**
   * 设置全局上下文
   */
  setBaseContext(context: LogContext) {
    this.baseContext = { ...this.baseContext, ...context }
  }

  /**
   * 创建带上下文的日志器
   */
  withContext(context: LogContext) {
    const logger = new Logger()
    logger.baseContext = { ...this.baseContext, ...context }
    return logger
  }

  /**
   * Debug 日志
   */
  debug(message: string, context?: LogContext) {
    this.log('debug', message, context)
  }

  /**
   * Info 日志
   */
  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  /**
   * Warn 日志
   */
  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  /**
   * Error 日志
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = error instanceof Error
      ? {
          error: error.message,
          stack: error.stack,
          name: error.name,
        }
      : { error: String(error) }

    this.log('error', message, { ...context, ...errorContext })
  }

  /**
   * 核心日志方法
   */
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const fullContext = { ...this.baseContext, ...context }

    const logEntry = {
      timestamp,
      level,
      message,
      ...fullContext,
    }

    // 根据环境和级别选择输出方式
    const output = JSON.stringify(logEntry)

    switch (level) {
      case 'debug':
        console.debug(output)
        break
      case 'info':
        console.log(output)
        break
      case 'warn':
        console.warn(output)
        break
      case 'error':
        console.error(output)
        break
    }
  }

  /**
   * 测量执行时间
   */
  async measureTime<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const startTime = Date.now()
    this.info(`${operation} started`, context)

    try {
      const result = await fn()
      const duration = Date.now() - startTime
      this.info(`${operation} completed`, { ...context, durationMs: duration })
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      this.error(
        `${operation} failed`,
        error,
        { ...context, durationMs: duration }
      )
      throw error
    }
  }
}

// 单例导出
export const logger = new Logger()

/**
 * 为 API 路由创建带 traceId 的日志器
 */
export function createApiLogger(traceId: string, module: string) {
  return logger.withContext({ traceId, module })
}




