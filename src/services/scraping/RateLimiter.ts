export class RateLimiter {
  private buckets: Map<string, { count: number; resetTime: number }> = new Map()
  private defaultRate: number

  constructor(defaultRate: number = 3) {
    this.defaultRate = defaultRate
  }

  /**
   * 检查是否允许请求
   */
  async canMakeRequest(platform: string, ratePerSec?: number): Promise<boolean> {
    const rate = ratePerSec || this.defaultRate
    const now = Date.now()
    const key = platform
    const bucket = this.buckets.get(key)

    if (!bucket || now >= bucket.resetTime) {
      // 创建新的时间窗口
      this.buckets.set(key, {
        count: 1,
        resetTime: now + 1000 // 1秒后重置
      })
      return true
    }

    if (bucket.count >= rate) {
      return false
    }

    bucket.count++
    return true
  }

  /**
   * 等待直到可以发送请求
   */
  async waitForRateLimit(platform: string, ratePerSec?: number): Promise<void> {
    while (!(await this.canMakeRequest(platform, ratePerSec))) {
      await this.sleep(100) // 等待100ms后重试
    }
  }

  /**
   * 获取等待时间
   */
  getWaitTime(platform: string, ratePerSec?: number): number {
    const rate = ratePerSec || this.defaultRate
    const bucket = this.buckets.get(platform)

    if (!bucket) return 0

    const now = Date.now()
    if (now >= bucket.resetTime) return 0

    if (bucket.count < rate) return 0

    return bucket.resetTime - now
  }

  /**
   * 清理过期的时间窗口
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, bucket] of Array.from(this.buckets.entries())) {
      if (now >= bucket.resetTime) {
        this.buckets.delete(key)
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
