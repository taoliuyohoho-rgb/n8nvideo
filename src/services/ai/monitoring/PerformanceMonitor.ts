/**
 * AI服务性能监控
 * 
 * 收集和分析AI服务的性能指标
 */

export interface PerformanceMetrics {
  latency: {
    p50: number
    p95: number
    p99: number
    avg: number
    min: number
    max: number
  }
  throughput: {
    requestsPerSecond: number
    tokensPerSecond: number
    requestsPerMinute: number
  }
  availability: {
    uptime: number
    errorRate: number
    successRate: number
    totalRequests: number
    successfulRequests: number
    failedRequests: number
  }
  resources: {
    memoryUsage: number
    cpuUsage: number
    queueLength: number
  }
}

export interface RequestMetrics {
  requestId: string
  serviceId: string
  provider: string
  model: string
  scenario: string
  startTime: number
  endTime?: number
  latency?: number
  success: boolean
  error?: string
  tokens?: {
    input: number
    output: number
    total: number
  }
  cost?: number
  metadata?: Record<string, any>
}

export interface ServiceStats {
  serviceId: string
  provider: string
  model: string
  metrics: PerformanceMetrics
  lastUpdated: Date
}

export class PerformanceMonitor {
  private requestMetrics: Map<string, RequestMetrics> = new Map()
  private serviceStats: Map<string, ServiceStats> = new Map()
  private logger = console // 后续可以替换为统一的logger
  private readonly MAX_METRICS_HISTORY = 10000 // 最大保留指标数量

  /**
   * 开始记录请求
   */
  startRequest(
    requestId: string,
    serviceId: string,
    provider: string,
    model: string,
    scenario: string,
    metadata?: Record<string, any>
  ): string {
    const metrics: RequestMetrics = {
      requestId,
      serviceId,
      provider,
      model,
      scenario,
      startTime: Date.now(),
      success: false,
      metadata
    }

    this.requestMetrics.set(requestId, metrics)
    this.logger.debug(`开始记录请求: ${requestId} (${provider}/${model})`)
    return requestId
  }

  /**
   * 记录请求成功
   */
  recordSuccess(
    requestId: string,
    data: {
      latency: number
      tokens?: { input: number; output: number; total: number }
      cost?: number
    }
  ): void {
    const metrics = this.requestMetrics.get(requestId)
    if (!metrics) {
      this.logger.warn(`尝试记录不存在的请求: ${requestId}`)
      return
    }

    metrics.endTime = Date.now()
    metrics.latency = data.latency
    metrics.success = true
    metrics.tokens = data.tokens
    metrics.cost = data.cost

    this.updateServiceStats(metrics)
    this.cleanupOldMetrics()
    
    this.logger.debug(`请求成功记录: ${requestId} - ${data.latency}ms${data.tokens ? ` (${data.tokens.total} tokens)` : ''}${data.cost ? ` ($${data.cost.toFixed(4)})` : ''}`)
  }

  /**
   * 记录请求失败
   */
  recordError(requestId: string, error: unknown): void {
    const metrics = this.requestMetrics.get(requestId)
    if (!metrics) {
      this.logger.warn(`尝试记录不存在的请求: ${requestId}`)
      return
    }

    metrics.endTime = Date.now()
    metrics.latency = metrics.endTime - metrics.startTime
    metrics.success = false
    metrics.error = error instanceof Error ? error.message : '未知错误'

    this.updateServiceStats(metrics)
    this.cleanupOldMetrics()
    
    this.logger.debug(`请求失败记录: ${requestId} - ${metrics.latency}ms - ${metrics.error}`)
  }

  /**
   * 获取服务性能指标
   */
  getServiceMetrics(serviceId: string): PerformanceMetrics | null {
    const stats = this.serviceStats.get(serviceId)
    return stats?.metrics || null
  }

  /**
   * 获取所有服务统计
   */
  getAllServiceStats(): ServiceStats[] {
    return Array.from(this.serviceStats.values())
  }

  /**
   * 获取全局性能指标
   */
  getGlobalMetrics(): PerformanceMetrics {
    const allMetrics = Array.from(this.requestMetrics.values())
    return this.calculateMetrics(allMetrics)
  }

  /**
   * 获取指定时间范围的指标
   */
  getMetricsInRange(startTime: number, endTime: number): PerformanceMetrics {
    const metrics = Array.from(this.requestMetrics.values())
      .filter(m => m.startTime >= startTime && m.startTime <= endTime)
    
    return this.calculateMetrics(metrics)
  }

  /**
   * 获取服务排名
   */
  getServiceRanking(metric: keyof PerformanceMetrics = 'latency'): Array<{
    serviceId: string
    provider: string
    model: string
    value: number
  }> {
    const stats = Array.from(this.serviceStats.values())
    
    return stats
      .map(stat => ({
        serviceId: stat.serviceId,
        provider: stat.provider,
        model: stat.model,
        value: this.getMetricValue(stat.metrics, metric)
      }))
      .sort((a, b) => {
        // 对于延迟，越小越好；对于其他指标，越大越好
        if (metric === 'latency') {
          return a.value - b.value
        } else {
          return b.value - a.value
        }
      })
  }

  /**
   * 清理过期指标
   */
  private cleanupOldMetrics(): void {
    if (this.requestMetrics.size <= this.MAX_METRICS_HISTORY) {
      return
    }

    // 按时间排序，删除最旧的指标
    const sortedMetrics = Array.from(this.requestMetrics.entries())
      .sort((a, b) => a[1].startTime - b[1].startTime)

    const toDelete = sortedMetrics.slice(0, this.requestMetrics.size - this.MAX_METRICS_HISTORY)
    
    for (const [requestId] of toDelete) {
      this.requestMetrics.delete(requestId)
    }

    this.logger.debug(`清理了 ${toDelete.length} 个过期指标`)
  }

  /**
   * 更新服务统计
   */
  private updateServiceStats(metrics: RequestMetrics): void {
    const serviceId = metrics.serviceId
    let stats = this.serviceStats.get(serviceId)

    if (!stats) {
      stats = {
        serviceId,
        provider: metrics.provider,
        model: metrics.model,
        metrics: this.createEmptyMetrics(),
        lastUpdated: new Date()
      }
      this.serviceStats.set(serviceId, stats)
    }

    // 获取该服务的所有指标
    const serviceMetrics = Array.from(this.requestMetrics.values())
      .filter(m => m.serviceId === serviceId)

    // 重新计算指标
    stats.metrics = this.calculateMetrics(serviceMetrics)
    stats.lastUpdated = new Date()
  }

  /**
   * 计算性能指标
   */
  private calculateMetrics(metrics: RequestMetrics[]): PerformanceMetrics {
    if (metrics.length === 0) {
      return this.createEmptyMetrics()
    }

    const latencies = metrics
      .filter(m => m.latency !== undefined)
      .map(m => m.latency!)
      .sort((a, b) => a - b)

    const successfulRequests = metrics.filter(m => m.success)
    const failedRequests = metrics.filter(m => !m.success)

    const totalTokens = metrics
      .filter(m => m.tokens)
      .reduce((sum, m) => sum + (m.tokens?.total || 0), 0)

    const totalCost = metrics
      .filter(m => m.cost !== undefined)
      .reduce((sum, m) => sum + (m.cost || 0), 0)

    const timeSpan = this.calculateTimeSpan(metrics)
    const requestsPerSecond = metrics.length / (timeSpan / 1000)
    const tokensPerSecond = totalTokens / (timeSpan / 1000)

    return {
      latency: {
        p50: this.calculatePercentile(latencies, 0.5),
        p95: this.calculatePercentile(latencies, 0.95),
        p99: this.calculatePercentile(latencies, 0.99),
        avg: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
        min: latencies.length > 0 ? Math.min(...latencies) : 0,
        max: latencies.length > 0 ? Math.max(...latencies) : 0
      },
      throughput: {
        requestsPerSecond: requestsPerSecond,
        tokensPerSecond: tokensPerSecond,
        requestsPerMinute: requestsPerSecond * 60
      },
      availability: {
        uptime: successfulRequests.length / metrics.length,
        errorRate: failedRequests.length / metrics.length,
        successRate: successfulRequests.length / metrics.length,
        totalRequests: metrics.length,
        successfulRequests: successfulRequests.length,
        failedRequests: failedRequests.length
      },
      resources: {
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        cpuUsage: 0, // 需要额外的CPU监控库
        queueLength: 0 // 需要从队列管理器获取
      }
    }
  }

  /**
   * 计算时间跨度
   */
  private calculateTimeSpan(metrics: RequestMetrics[]): number {
    if (metrics.length === 0) return 0
    
    const startTimes = metrics.map(m => m.startTime)
    const endTimes = metrics.map(m => m.endTime || m.startTime)
    
    const minStart = Math.min(...startTimes)
    const maxEnd = Math.max(...endTimes)
    
    return maxEnd - minStart
  }

  /**
   * 计算百分位数
   */
  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0
    
    const index = Math.ceil(sortedArray.length * percentile) - 1
    return sortedArray[Math.max(0, index)]
  }

  /**
   * 获取指标值
   */
  private getMetricValue(metrics: PerformanceMetrics, metric: keyof PerformanceMetrics): number {
    switch (metric) {
      case 'latency':
        return metrics.latency.avg
      case 'throughput':
        return metrics.throughput.requestsPerSecond
      case 'availability':
        return metrics.availability.successRate
      case 'resources':
        return metrics.resources.memoryUsage
      default:
        return 0
    }
  }

  /**
   * 创建空指标
   */
  private createEmptyMetrics(): PerformanceMetrics {
    return {
      latency: { p50: 0, p95: 0, p99: 0, avg: 0, min: 0, max: 0 },
      throughput: { requestsPerSecond: 0, tokensPerSecond: 0, requestsPerMinute: 0 },
      availability: { uptime: 0, errorRate: 0, successRate: 0, totalRequests: 0, successfulRequests: 0, failedRequests: 0 },
      resources: { memoryUsage: 0, cpuUsage: 0, queueLength: 0 }
    }
  }

  /**
   * 重置所有指标
   */
  reset(): void {
    this.requestMetrics.clear()
    this.serviceStats.clear()
    this.logger.info('性能监控指标已重置')
  }

  /**
   * 获取监控统计
   */
  getStats(): {
    totalRequests: number
    activeRequests: number
    servicesCount: number
    memoryUsage: number
  } {
    const activeRequests = Array.from(this.requestMetrics.values())
      .filter(m => !m.endTime).length

    return {
      totalRequests: this.requestMetrics.size,
      activeRequests,
      servicesCount: this.serviceStats.size,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024
    }
  }
}

// 单例实例
let performanceMonitorInstance: PerformanceMonitor | null = null

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor()
  }
  return performanceMonitorInstance
}

export function resetPerformanceMonitor(): void {
  performanceMonitorInstance = null
}

