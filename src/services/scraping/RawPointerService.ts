import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export class RawPointerService {
  private storagePath: string
  private maxSize: number

  constructor() {
    this.storagePath = process.env.RAW_STORAGE_PATH || '/tmp/scraping-raw'
    this.maxSize = parseInt(process.env.RAW_STORAGE_MAX_SIZE || '104857600') // 100MB
    
    // 确保存储目录存在
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true })
    }
  }

  /**
   * 保存原始内容
   */
  async saveRawContent(content: string): Promise<string> {
    // 计算哈希
    const sha256 = crypto.createHash('sha256').update(content).digest('hex')
    
    // 检查是否已存在
    const existing = await prisma.rawPointer.findUnique({
      where: { sha256 }
    })

    if (existing) {
      return existing.id
    }

    // 压缩内容
    const compressed = this.compressContent(content)
    const size = Buffer.byteLength(compressed, 'utf8')

    // 检查大小限制
    if (size > this.maxSize) {
      throw new Error(`内容过大: ${size} bytes > ${this.maxSize} bytes`)
    }

    // 生成存储键
    const storageKey = this.generateStorageKey(sha256)
    const filePath = path.join(this.storagePath, storageKey)

    // 保存到文件系统
    fs.writeFileSync(filePath, compressed)

    // 保存到数据库
    const ttlExpireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天TTL
    
    const rawPointer = await prisma.rawPointer.create({
      data: {
        storageKey,
        sha256,
        size,
        ttlExpireAt
      }
    })

    return rawPointer.id
  }

  /**
   * 获取原始内容
   */
  async getRawContent(rawPointerId: string): Promise<string | null> {
    const rawPointer = await prisma.rawPointer.findUnique({
      where: { id: rawPointerId }
    })

    if (!rawPointer) {
      return null
    }

    // 检查是否过期
    if (new Date() > rawPointer.ttlExpireAt) {
      await this.deleteRawPointer(rawPointerId)
      return null
    }

    const filePath = path.join(this.storagePath, rawPointer.storageKey)
    
    if (!fs.existsSync(filePath)) {
      return null
    }

    const compressed = fs.readFileSync(filePath, 'utf8')
    return this.decompressContent(compressed)
  }

  /**
   * 删除原始指针
   */
  async deleteRawPointer(rawPointerId: string): Promise<void> {
    const rawPointer = await prisma.rawPointer.findUnique({
      where: { id: rawPointerId }
    })

    if (!rawPointer) return

    // 删除文件
    const filePath = path.join(this.storagePath, rawPointer.storageKey)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    // 删除数据库记录
    await prisma.rawPointer.delete({
      where: { id: rawPointerId }
    })
  }

  /**
   * 清理过期文件
   */
  async cleanupExpiredFiles(): Promise<number> {
    const expired = await prisma.rawPointer.findMany({
      where: {
        ttlExpireAt: {
          lt: new Date()
        }
      }
    })

    let deletedCount = 0
    for (const pointer of expired) {
      try {
        await this.deleteRawPointer(pointer.id)
        deletedCount++
      } catch (error) {
        console.error(`删除过期文件失败: ${pointer.id}`, error)
      }
    }

    return deletedCount
  }

  /**
   * 压缩内容
   */
  private compressContent(content: string): string {
    // 简单的GZIP压缩（实际项目中可以使用zlib）
    const zlib = require('zlib')
    return zlib.gzipSync(content).toString('base64')
  }

  /**
   * 解压内容
   */
  private decompressContent(compressed: string): string {
    const zlib = require('zlib')
    const buffer = Buffer.from(compressed, 'base64')
    return zlib.gunzipSync(buffer).toString('utf8')
  }

  /**
   * 生成存储键
   */
  private generateStorageKey(sha256: string): string {
    return `${sha256.substring(0, 8)}_${Date.now()}.gz`
  }
}
