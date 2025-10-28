import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const db = new PrismaClient()

async function migrateAIDecisions() {
  console.log('🚀 迁移 AI 决策数据...\n')
  
  try {
    // ===== 推荐系统数据 =====
    
    // 1. 迁移候选集合 (必须先迁移，因为有外键)
    console.log('📦 1/6 迁移推荐候选集合...')
    const recoCandidateSetsJson = execSync(
      `sqlite3 -json ./prisma/dev.db "SELECT * FROM reco_candidate_sets LIMIT 2000"`,
      { encoding: 'utf-8', cwd: '/Users/liutao/cursor/n8nvideo', maxBuffer: 50 * 1024 * 1024 }
    )
    const recoCandidateSets = JSON.parse(recoCandidateSetsJson || '[]')
    console.log(`   找到 ${recoCandidateSets.length} 条`)
    
    for (const rcs of recoCandidateSets) {
      await db.recommendationCandidateSet.upsert({
        where: { id: rcs.id },
        create: {
          id: rcs.id,
          subjectType: rcs.subjectType || 'product',
          subjectId: rcs.subjectId,
          subjectSnapshot: rcs.subjectSnapshot || '{}',
          targetType: rcs.targetType || 'model',
          contextSnapshot: rcs.contextSnapshot,
          createdAt: new Date(rcs.createdAt)
        },
        update: {}
      })
    }
    console.log(`   ✅ 完成`)
    
    // 2. 迁移推荐决策
    console.log('\n📦 2/6 迁移推荐决策...')
    const recoDecisionsJson = execSync(
      `sqlite3 -json ./prisma/dev.db "SELECT * FROM reco_decisions LIMIT 2000"`,
      { encoding: 'utf-8', cwd: '/Users/liutao/cursor/n8nvideo', maxBuffer: 50 * 1024 * 1024 }
    )
    const recoDecisions = JSON.parse(recoDecisionsJson || '[]')
    console.log(`   找到 ${recoDecisions.length} 条`)
    
    for (const rd of recoDecisions) {
      await db.recommendationDecision.upsert({
        where: { id: rd.id },
        create: {
          id: rd.id,
          candidateSetId: rd.candidateSetId,
          chosenTargetType: rd.chosenTargetType || 'model',
          chosenTargetId: rd.chosenTargetId || 'unknown',
          strategyVersion: rd.strategyVersion || 'v1',
          weightsSnapshot: rd.weightsSnapshot,
          topK: rd.topK || 5,
          exploreFlags: rd.exploreFlags,
          requestId: rd.requestId,
          segmentKey: rd.segmentKey,
          createdAt: new Date(rd.createdAt)
        },
        update: {}
      })
    }
    console.log(`   ✅ 完成`)
    
    // 3. 迁移推荐候选项 (分批)
    console.log('\n📦 3/6 迁移推荐候选项...')
    const BATCH_SIZE = 1000
    let offset = 0
    let totalCandidates = 0
    
    while (true) {
      const recoCandidatesJson = execSync(
        `sqlite3 -json ./prisma/dev.db "SELECT * FROM reco_candidates LIMIT ${BATCH_SIZE} OFFSET ${offset}"`,
        { encoding: 'utf-8', cwd: '/Users/liutao/cursor/n8nvideo', maxBuffer: 50 * 1024 * 1024 }
      )
      const recoCandidates = JSON.parse(recoCandidatesJson || '[]')
      
      if (recoCandidates.length === 0) break
      
      console.log(`   处理第 ${offset}-${offset + recoCandidates.length} 条...`)
      
      for (const rc of recoCandidates) {
        await db.recommendationCandidate.upsert({
          where: { id: rc.id },
          create: {
            id: rc.id,
            candidateSetId: rc.candidateSetId,
            targetType: rc.targetType || 'model',
            targetId: rc.targetId || 'unknown',
            coarseScore: rc.coarseScore || 0,
            fineScore: rc.fineScore,
            reason: rc.reason,
            filtered: Boolean(rc.filtered),
            filterReason: rc.filterReason,
            createdAt: new Date(rc.createdAt)
          },
          update: {}
        })
      }
      
      totalCandidates += recoCandidates.length
      offset += BATCH_SIZE
      
      if (recoCandidates.length < BATCH_SIZE) break
    }
    console.log(`   ✅ 完成，共 ${totalCandidates} 条`)
    
    // ===== 评估系统数据 =====
    
    // 4. 迁移评估候选集合 (必须先迁移)
    console.log('\n📦 4/6 迁移评估候选集合...')
    const estimationCandidateSetsJson = execSync(
      `sqlite3 -json ./prisma/dev.db "SELECT * FROM estimation_candidate_sets"`,
      { encoding: 'utf-8', cwd: '/Users/liutao/cursor/n8nvideo' }
    )
    const estimationCandidateSets = JSON.parse(estimationCandidateSetsJson || '[]')
    console.log(`   找到 ${estimationCandidateSets.length} 条`)
    
    for (const ecs of estimationCandidateSets) {
      await db.estimationCandidateSet.upsert({
        where: { id: ecs.id },
        create: {
          id: ecs.id,
          taskSnapshot: ecs.taskSnapshot || '{}',
          contextSnapshot: ecs.contextSnapshot,
          createdAt: new Date(ecs.createdAt)
        },
        update: {}
      })
    }
    console.log(`   ✅ 完成`)
    
    // 5. 迁移评估候选项 (跳过缺少模型的)
    console.log('\n📦 5/6 迁移评估候选项...')
    const estimationCandidatesJson = execSync(
      `sqlite3 -json ./prisma/dev.db "SELECT * FROM estimation_candidates"`,
      { encoding: 'utf-8', cwd: '/Users/liutao/cursor/n8nvideo' }
    )
    const estimationCandidates = JSON.parse(estimationCandidatesJson || '[]')
    console.log(`   找到 ${estimationCandidates.length} 条`)
    
    let skipped = 0
    let migrated = 0
    
    for (const ec of estimationCandidates) {
      // 检查 modelId 是否存在
      const modelExists = await db.estimationModel.findUnique({
        where: { id: ec.modelId }
      })
      
      if (!modelExists) {
        skipped++
        continue
      }
      
      await db.estimationCandidate.upsert({
        where: { id: ec.id },
        create: {
          id: ec.id,
          candidateSetId: ec.candidateSetId,
          modelId: ec.modelId,
          coarseScore: ec.coarseScore,
          fineScore: ec.fineScore,
          reason: ec.reason,
          filtered: Boolean(ec.filtered),
          filterReason: ec.filterReason,
          createdAt: new Date(ec.createdAt)
        },
        update: {}
      })
      migrated++
    }
    console.log(`   ✅ 完成 (迁移 ${migrated} 条, 跳过 ${skipped} 条缺少模型的)`)
    
    // 6. 迁移评估决策
    console.log('\n📦 6/6 迁移评估决策...')
    const estimationDecisionsJson = execSync(
      `sqlite3 -json ./prisma/dev.db "SELECT * FROM estimation_decisions"`,
      { encoding: 'utf-8', cwd: '/Users/liutao/cursor/n8nvideo' }
    )
    const estimationDecisions = JSON.parse(estimationDecisionsJson || '[]')
    console.log(`   找到 ${estimationDecisions.length} 条`)
    
    for (const ed of estimationDecisions) {
      await db.estimationDecision.upsert({
        where: { id: ed.id },
        create: {
          id: ed.id,
          candidateSetId: ed.candidateSetId,
          chosenModelId: ed.chosenModelId,
          strategyVersion: ed.strategyVersion || 'v1',
          weightsSnapshot: ed.weightsSnapshot,
          topK: ed.topK || 5,
          exploreFlags: ed.exploreFlags,
          expectedCost: ed.expectedCost,
          expectedLatency: ed.expectedLatency,
          requestId: ed.requestId,
          segmentKey: ed.segmentKey,
          createdAt: new Date(ed.createdAt)
        },
        update: {}
      })
    }
    console.log(`   ✅ 完成`)
    
    console.log('\n🎉 AI决策数据迁移完成！')
    
  } catch (error: any) {
    console.error('\n❌ 迁移失败:', error.message)
    if (error.stack) console.error(error.stack)
    throw error
  } finally {
    await db.$disconnect()
  }
}

migrateAIDecisions()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
