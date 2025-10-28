/**
 * 数据库迁移脚本：SQLite to PostgreSQL
 * 
 * 用途：将开发环境的 SQLite 数据迁移到生产环境的 PostgreSQL
 * 
 * 使用方式：
 *   1. 确保 .env 中有 SQLITE_URL（源）和 DATABASE_URL（目标）
 *   2. 运行: npx tsx scripts/migrate-to-postgresql.ts
 * 
 * ⚠️ 注意：
 *   - 这会清空目标数据库的所有数据！
 *   - 请先备份目标数据库
 *   - 建议先在测试环境验证
 */

import { PrismaClient } from '@prisma/client'

// SQLite 源数据库
const sourceDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.SQLITE_URL || 'file:./prisma/dev.db'
    }
  }
})

// PostgreSQL 目标数据库
const targetDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

interface MigrationStats {
  tableName: string
  count: number
  status: 'success' | 'error'
  error?: string
}

const stats: MigrationStats[] = []

async function migrateTable<T>(
  tableName: string,
  fetchData: () => Promise<T[]>,
  insertData: (data: T[]) => Promise<any>
) {
  console.log(`\n📦 迁移表: ${tableName}...`)
  
  try {
    const data = await fetchData()
    console.log(`   找到 ${data.length} 条记录`)
    
    if (data.length > 0) {
      await insertData(data)
      console.log(`   ✅ 成功插入 ${data.length} 条记录`)
    }
    
    stats.push({
      tableName,
      count: data.length,
      status: 'success'
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '未知错误'
    console.error(`   ❌ 迁移失败: ${errorMsg}`)
    stats.push({
      tableName,
      count: 0,
      status: 'error',
      error: errorMsg
    })
  }
}

async function clearTargetDatabase() {
  console.log('\n⚠️  清空目标数据库...')
  
  // 删除所有表的数据（按依赖关系倒序）
  await targetDb.$executeRaw`TRUNCATE TABLE "estimation_feedback_events" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "estimation_outcomes" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "estimation_decisions" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "estimation_candidates" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "estimation_candidate_sets" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "entity_metrics_daily" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "entity_embeddings" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "entity_features" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "entity_index" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "estimation_models" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "prompt_templates" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "user_submissions" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "competitor_tasks" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "ai_call_logs" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "comment_scraping_tasks" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "product_comments" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "product_pain_points" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "product_mappings" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "ranking_results" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "video_analyses" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "reference_videos" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "competitor_analyses" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "template_analyses" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "ad_data" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "videos" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "templates" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "styles" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "products" CASCADE`
  await targetDb.$executeRaw`TRUNCATE TABLE "users" CASCADE`
  
  console.log('✅ 目标数据库已清空')
}

async function migrate() {
  console.log('🚀 开始数据迁移: SQLite → PostgreSQL')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  try {
    // 测试数据库连接
    console.log('\n🔌 测试数据库连接...')
    await sourceDb.$connect()
    console.log('   ✅ SQLite 连接成功')
    await targetDb.$connect()
    console.log('   ✅ PostgreSQL 连接成功')
    
    // 询问用户确认
    console.log('\n⚠️  警告: 这将清空目标数据库的所有数据！')
    console.log('目标数据库:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':***@'))
    console.log('\n按 Ctrl+C 取消，或等待 5 秒后自动继续...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // 清空目标数据库
    await clearTargetDatabase()
    
    // 迁移核心表（按依赖关系顺序）
    
    // 1. 用户表
    await migrateTable(
      'users',
      () => sourceDb.user.findMany(),
      (data) => targetDb.user.createMany({ data, skipDuplicates: true })
    )
    
    // 2. 商品表
    await migrateTable(
      'products',
      () => sourceDb.product.findMany(),
      (data) => targetDb.product.createMany({ 
        data: data.map(item => ({
          ...item,
          sellingPoints: item.sellingPoints as any,
          painPoints: item.painPoints as any,
          targetCountries: item.targetCountries as any,
          targetAudience: item.targetAudience as any
        })), 
        skipDuplicates: true 
      })
    )
    
    // 3. 风格表
    await migrateTable(
      'styles',
      () => sourceDb.style.findMany(),
      (data) => targetDb.style.createMany({ data, skipDuplicates: true })
    )
    
    // 4. 模板表
    await migrateTable(
      'templates',
      () => sourceDb.template.findMany(),
      (data) => targetDb.template.createMany({ data, skipDuplicates: true })
    )
    
    // 5. 视频表
    await migrateTable(
      'videos',
      () => sourceDb.video.findMany(),
      (data) => targetDb.video.createMany({ data, skipDuplicates: true })
    )
    
    // 6. 广告数据表
    await migrateTable(
      'ad_data',
      () => sourceDb.adData.findMany(),
      (data) => targetDb.adData.createMany({ data, skipDuplicates: true })
    )
    
    // 7. 模板分析表
    await migrateTable(
      'template_analyses',
      () => sourceDb.templateAnalysis.findMany(),
      (data) => targetDb.templateAnalysis.createMany({ data, skipDuplicates: true })
    )
    
    // 8. 竞品分析表
    await migrateTable(
      'competitor_analyses',
      () => sourceDb.competitorAnalysis.findMany(),
      (data) => targetDb.competitorAnalysis.createMany({ data, skipDuplicates: true })
    )
    
    // 9. 参考视频表
    await migrateTable(
      'reference_videos',
      () => sourceDb.referenceVideo.findMany(),
      (data) => targetDb.referenceVideo.createMany({ data, skipDuplicates: true })
    )
    
    // 10. 视频分析表
    await migrateTable(
      'video_analyses',
      () => sourceDb.videoAnalysis.findMany(),
      (data) => targetDb.videoAnalysis.createMany({ data, skipDuplicates: true })
    )
    
    // 11. 排名结果表
    await migrateTable(
      'ranking_results',
      () => sourceDb.rankingResult.findMany(),
      (data) => targetDb.rankingResult.createMany({ data, skipDuplicates: true })
    )
    
    // 12. 商品映射表
    await migrateTable(
      'product_mappings',
      () => sourceDb.productMapping.findMany(),
      (data) => targetDb.productMapping.createMany({ data, skipDuplicates: true })
    )
    
    // 13. 商品痛点表
    await migrateTable(
      'product_pain_points',
      () => sourceDb.productPainPoint.findMany(),
      (data) => targetDb.productPainPoint.createMany({ data, skipDuplicates: true })
    )
    
    // 14. 商品评论表
    await migrateTable(
      'product_comments',
      () => sourceDb.productComment.findMany(),
      (data) => targetDb.productComment.createMany({ data, skipDuplicates: true })
    )
    
    // 15. 评论爬取任务表
    await migrateTable(
      'comment_scraping_tasks',
      () => sourceDb.commentScrapingTask.findMany(),
      (data) => targetDb.commentScrapingTask.createMany({ data, skipDuplicates: true })
    )
    
    // 16. AI 调用日志表 - 模型不存在，跳过
    // await migrateTable(
    //   'ai_call_logs',
    //   () => sourceDb.aiCallLog.findMany(),
    //   (data) => targetDb.aiCallLog.createMany({ data, skipDuplicates: true })
    // )
    
    // 17. 竞品任务表 - 模型不存在，跳过
    // await migrateTable(
    //   'competitor_tasks',
    //   () => sourceDb.competitorTask.findMany(),
    //   (data) => targetDb.competitorTask.createMany({ data, skipDuplicates: true })
    // )
    
    // 18. 用户提交表
    await migrateTable(
      'user_submissions',
      () => sourceDb.userSubmission.findMany(),
      (data) => targetDb.userSubmission.createMany({ data, skipDuplicates: true })
    )
    
    // 19. Prompt 模板表
    await migrateTable(
      'prompt_templates',
      () => sourceDb.promptTemplate.findMany(),
      (data) => targetDb.promptTemplate.createMany({ data, skipDuplicates: true })
    )
    
    // 20. 预估模型相关表
    await migrateTable(
      'estimation_models',
      () => sourceDb.estimationModel.findMany(),
      (data) => targetDb.estimationModel.createMany({ data, skipDuplicates: true })
    )
    
    await migrateTable(
      'entity_index',
      () => sourceDb.entityIndex.findMany(),
      (data) => targetDb.entityIndex.createMany({ data, skipDuplicates: true })
    )
    
    await migrateTable(
      'entity_features',
      () => sourceDb.entityFeature.findMany(),
      (data) => targetDb.entityFeature.createMany({ data, skipDuplicates: true })
    )
    
    await migrateTable(
      'entity_embeddings',
      () => sourceDb.entityEmbedding.findMany(),
      (data) => targetDb.entityEmbedding.createMany({ data, skipDuplicates: true })
    )
    
    await migrateTable(
      'entity_metrics_daily',
      () => sourceDb.entityMetricsDaily.findMany(),
      (data) => targetDb.entityMetricsDaily.createMany({ data, skipDuplicates: true })
    )
    
    await migrateTable(
      'estimation_candidate_sets',
      () => sourceDb.estimationCandidateSet.findMany(),
      (data) => targetDb.estimationCandidateSet.createMany({ data, skipDuplicates: true })
    )
    
    await migrateTable(
      'estimation_candidates',
      () => sourceDb.estimationCandidate.findMany(),
      (data) => targetDb.estimationCandidate.createMany({ data, skipDuplicates: true })
    )
    
    await migrateTable(
      'estimation_decisions',
      () => sourceDb.estimationDecision.findMany(),
      (data) => targetDb.estimationDecision.createMany({ data, skipDuplicates: true })
    )
    
    await migrateTable(
      'estimation_outcomes',
      () => sourceDb.estimationOutcome.findMany(),
      (data) => targetDb.estimationOutcome.createMany({ data, skipDuplicates: true })
    )
    
    await migrateTable(
      'estimation_feedback_events',
      () => sourceDb.estimationFeedbackEvent.findMany(),
      (data) => targetDb.estimationFeedbackEvent.createMany({ data, skipDuplicates: true })
    )
    
    // 打印迁移统计
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 迁移统计')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    const successCount = stats.filter(s => s.status === 'success').length
    const errorCount = stats.filter(s => s.status === 'error').length
    const totalRecords = stats.reduce((sum, s) => sum + s.count, 0)
    
    console.log(`\n总表数: ${stats.length}`)
    console.log(`成功: ${successCount}`)
    console.log(`失败: ${errorCount}`)
    console.log(`总记录数: ${totalRecords}`)
    
    console.log('\n详细统计:')
    console.table(stats)
    
    if (errorCount === 0) {
      console.log('\n✅ 数据迁移完成！')
    } else {
      console.log('\n⚠️  数据迁移完成，但有错误')
      console.log('请检查上面的错误信息')
    }
    
  } catch (error) {
    console.error('\n❌ 迁移失败:', error)
    throw error
  } finally {
    await sourceDb.$disconnect()
    await targetDb.$disconnect()
  }
}

// 运行迁移
migrate()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

