import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const postgresDb = new PrismaClient()

async function migrateData() {
  console.log('🚀 开始从 SQLite 导出数据到 PostgreSQL...')
  
  // 先导出 SQLite 数据为 JSON
  console.log('\n📤 正在从 SQLite 导出数据...')
  const { execSync } = require('child_process')
  
  try {
    // 使用 sqlite3 命令导出 products 表
    const productsJson = execSync(
      `sqlite3 -json ./prisma/dev.db "SELECT * FROM products"`,
      { encoding: 'utf-8', cwd: '/Users/liutao/cursor/n8nvideo' }
    )
    
    const products = JSON.parse(productsJson || '[]')
    console.log(`找到 ${products.length} 个商品`)
    
    // 导入到 PostgreSQL
    console.log('\n📥 正在导入到 PostgreSQL...')
    for (const product of products) {
      // 解析 JSON 字符串字段
      let sellingPoints: any = []
      let painPoints: any = null
      
      try {
        if (product.sellingPoints) {
          sellingPoints = JSON.parse(product.sellingPoints)
        }
      } catch (e) {
        console.warn(`商品 ${product.name} 的 sellingPoints 解析失败`)
        sellingPoints = []
      }
      
      try {
        if (product.painPoints) {
          painPoints = JSON.parse(product.painPoints)
        }
      } catch (e) {
        console.warn(`商品 ${product.name} 的 painPoints 解析失败`)
        painPoints = null
      }
      
      await postgresDb.product.upsert({
        where: { id: product.id },
        create: {
          id: product.id,
          name: product.name,
          description: product.description || '',
          category: product.category,
          subcategory: product.subcategory,
          sellingPoints: sellingPoints,
          skuImages: product.skuImages || '[]',
          targetCountries: product.targetCountries || '[]',
          source: product.source || 'manual',
          sourceUserId: product.sourceUserId,
          isUserGenerated: Boolean(product.isUserGenerated),
          needsReview: Boolean(product.needsReview),
          lastUserUpdate: product.lastUserUpdate ? new Date(product.lastUserUpdate) : null,
          createdAt: new Date(product.createdAt),
          updatedAt: new Date(product.updatedAt),
          painPoints: painPoints,
          painPointsLastUpdate: product.painPointsLastUpdate ? new Date(product.painPointsLastUpdate) : null,
          painPointsSource: product.painPointsSource
        },
        update: {
          name: product.name,
          description: product.description || '',
          category: product.category,
          subcategory: product.subcategory,
          sellingPoints: sellingPoints,
          skuImages: product.skuImages || '[]',
          targetCountries: product.targetCountries || '[]',
          updatedAt: new Date(product.updatedAt),
          painPoints: painPoints,
          painPointsLastUpdate: product.painPointsLastUpdate ? new Date(product.painPointsLastUpdate) : null,
          painPointsSource: product.painPointsSource
        }
      })
      console.log(`✅ ${product.name}`)
    }
    
    console.log('\n🎉 迁移完成！')
    console.log(`   - 商品: ${products.length} 条`)
    
  } catch (error: any) {
    console.error('❌ 迁移失败:', error.message)
    throw error
  } finally {
    await postgresDb.$disconnect()
  }
}

migrateData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))

