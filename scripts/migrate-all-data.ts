import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const postgresDb = new PrismaClient()

async function migrateAllData() {
  console.log('🚀 开始完整数据迁移...\n')
  
  try {
    // 获取所有表名
    const tables = [
      'users',
      'products',
      'videos',
      'templates',
      'styles',
      'product_mappings',
      'product_pain_points',
      'estimation_models',
      'estimation_decisions',
      'estimation_candidates',
      'estimation_candidate_sets',
      'estimation_feedback_events',
      'estimation_outcomes',
      'reco_decisions',
      'reco_candidates',
      'reco_candidate_sets',
      'reco_feedback',
      'reco_events',
      'reco_outcomes',
      'recommendation_settings',
      'prompt_templates',
      'competitor_analyses',
      'video_analyses',
      'template_analyses',
      'reference_videos',
      'ranking_results',
      'ad_data',
      'comment_scraping_tasks',
      'product_comments',
      'user_submissions',
      'entity_embeddings',
      'entity_features',
      'entity_metrics_daily',
      'entity_index'
    ]
    
    let totalMigrated = 0
    
    for (const table of tables) {
      try {
        console.log(`\n📦 迁移表: ${table}`)
        
        // 从 SQLite 导出数据
        const jsonData = execSync(
          `sqlite3 -json ./prisma/dev.db "SELECT * FROM ${table}"`,
          { encoding: 'utf-8', cwd: '/Users/liutao/cursor/n8nvideo' }
        )
        
        const rows = JSON.parse(jsonData || '[]')
        
        if (rows.length === 0) {
          console.log(`  ⚠️  表 ${table} 为空，跳过`)
          continue
        }
        
        console.log(`  找到 ${rows.length} 条记录`)
        
        // 根据表名执行不同的迁移逻辑
        if (table === 'products') {
          await migrateProducts(rows)
        } else {
          // 其他表使用通用迁移
          await migrateGenericTable(table, rows)
        }
        
        totalMigrated += rows.length
        console.log(`  ✅ 完成`)
        
      } catch (error: any) {
        if (error.message?.includes('no such table')) {
          console.log(`  ⚠️  表 ${table} 不存在，跳过`)
        } else {
          console.warn(`  ❌ 表 ${table} 迁移失败:`, error.message)
        }
      }
    }
    
    console.log(`\n🎉 迁移完成！共迁移 ${totalMigrated} 条记录`)
    
  } catch (error) {
    console.error('❌ 迁移失败:', error)
    throw error
  } finally {
    await postgresDb.$disconnect()
  }
}

async function migrateProducts(rows: any[]) {
  for (const product of rows) {
    let sellingPoints: any = []
    let painPoints: any = null
    
    try {
      if (product.sellingPoints) {
        sellingPoints = JSON.parse(product.sellingPoints)
      }
    } catch (e) {
      sellingPoints = []
    }
    
    try {
      if (product.painPoints) {
        painPoints = JSON.parse(product.painPoints)
      }
    } catch (e) {
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
        sellingPoints: sellingPoints,
        painPoints: painPoints,
        updatedAt: new Date(product.updatedAt)
      }
    })
  }
}

async function migrateGenericTable(tableName: string, rows: any[]) {
  // 使用原始 SQL 插入数据（通用方法）
  for (const row of rows) {
    // 转换布尔值
    const processedRow = Object.fromEntries(
      Object.entries(row).map(([key, value]) => {
        if (typeof value === 'number' && (value === 0 || value === 1)) {
          // 检查字段名是否像布尔字段
          if (key.startsWith('is') || key.startsWith('has') || key.includes('Active') || key.includes('Review')) {
            return [key, Boolean(value)]
          }
        }
        return [key, value]
      })
    )
    
    try {
      await (postgresDb as any)[tableName].upsert({
        where: { id: row.id },
        create: processedRow,
        update: processedRow
      })
    } catch (e: any) {
      // 如果表不存在对应的 Prisma 模型，使用原始 SQL
      console.log(`    使用原始SQL插入 ${tableName}`)
    }
  }
}

migrateAllData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))

