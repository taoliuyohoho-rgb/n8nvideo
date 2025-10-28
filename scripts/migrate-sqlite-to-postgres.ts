import { PrismaClient as SqlitePrismaClient } from '@prisma/client'
import { PrismaClient as PostgresPrismaClient } from '@prisma/client'

// 连接到旧的 SQLite 数据库
const sqliteDb = new SqlitePrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
})

// 连接到新的 PostgreSQL 数据库
const postgresDb = new PostgresPrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function migrateData() {
  console.log('🚀 开始数据迁移...')
  
  try {
    // 1. 迁移 Products
    console.log('\n📦 迁移商品数据...')
    const products = await sqliteDb.product.findMany()
    console.log(`找到 ${products.length} 个商品`)
    
    for (const product of products) {
      // 解析 JSON 字符串字段
      let sellingPoints: any = []
      let painPoints: any = []
      let targetCountries: any = []
      let skuImages: any = []
      
      try {
        if (product.sellingPoints) {
          sellingPoints = typeof product.sellingPoints === 'string' 
            ? JSON.parse(product.sellingPoints) 
            : product.sellingPoints
        }
      } catch (e) {
        console.warn(`商品 ${product.name} 的 sellingPoints 解析失败:`, e)
      }
      
      try {
        if ((product as any).painPoints) {
          const pp = (product as any).painPoints
          painPoints = typeof pp === 'string' ? JSON.parse(pp) : pp
        }
      } catch (e) {
        console.warn(`商品 ${product.name} 的 painPoints 解析失败:`, e)
      }
      
      try {
        if (product.targetCountries) {
          targetCountries = typeof product.targetCountries === 'string'
            ? JSON.parse(product.targetCountries)
            : product.targetCountries
        }
      } catch (e) {
        console.warn(`商品 ${product.name} 的 targetCountries 解析失败:`, e)
      }
      
      try {
        if (product.skuImages) {
          skuImages = typeof product.skuImages === 'string'
            ? JSON.parse(product.skuImages)
            : product.skuImages
        }
      } catch (e) {
        console.warn(`商品 ${product.name} 的 skuImages 解析失败:`, e)
      }
      
      // 写入 PostgreSQL
      await postgresDb.product.upsert({
        where: { id: product.id },
        create: {
          id: product.id,
          name: product.name,
          description: product.description,
          category: product.category,
          subcategory: product.subcategory,
          sellingPoints: sellingPoints,
          skuImages: JSON.stringify(skuImages),
          targetCountries: JSON.stringify(targetCountries),
          source: product.source,
          sourceUserId: product.sourceUserId,
          isUserGenerated: product.isUserGenerated,
          needsReview: product.needsReview,
          lastUserUpdate: product.lastUserUpdate,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          painPoints: painPoints,
          painPointsLastUpdate: (product as any).painPointsLastUpdate,
          painPointsSource: (product as any).painPointsSource
        },
        update: {
          name: product.name,
          description: product.description,
          category: product.category,
          subcategory: product.subcategory,
          sellingPoints: sellingPoints,
          skuImages: JSON.stringify(skuImages),
          targetCountries: JSON.stringify(targetCountries),
          source: product.source,
          sourceUserId: product.sourceUserId,
          isUserGenerated: product.isUserGenerated,
          needsReview: product.needsReview,
          lastUserUpdate: product.lastUserUpdate,
          updatedAt: product.updatedAt,
          painPoints: painPoints,
          painPointsLastUpdate: (product as any).painPointsLastUpdate,
          painPointsSource: (product as any).painPointsSource
        }
      })
      console.log(`✅ 迁移商品: ${product.name}`)
    }
    
    console.log('\n✅ 数据迁移完成！')
    console.log(`   - 商品: ${products.length} 条`)
    
  } catch (error) {
    console.error('❌ 迁移失败:', error)
    throw error
  } finally {
    await sqliteDb.$disconnect()
    await postgresDb.$disconnect()
  }
}

migrateData()
  .then(() => {
    console.log('\n🎉 所有数据已成功迁移到 PostgreSQL')
    process.exit(0)
  })
  .catch((error) => {
    console.error('迁移过程中出现错误:', error)
    process.exit(1)
  })

