import { PrismaClient, Prisma } from '@prisma/client'

const db = new PrismaClient()

async function finalVerify() {
  console.log('🔍 最终数据验证...\n')
  
  try {
    // 核心数据
    const userCount = await db.user.count()
    const promptCount = await db.promptTemplate.count()
    const productCount = await db.product.count()
    
    console.log('📊 核心业务数据:')
    console.log(`   用户: ${userCount}`)
    console.log(`   Prompt模板: ${promptCount}`)
    console.log(`   商品: ${productCount}`)
    
    // AI 推荐/决策数据（关键！）
    const recoDecisionCount = await db.recommendationDecision.count()
    const recoCandidateCount = await db.recommendationCandidate.count()
    const recoCandidateSetCount = await db.recommendationCandidateSet.count()
    const recoFeedbackCount = await db.recommendationFeedback.count()
    
    console.log('\n🤖 AI推荐系统数据:')
    console.log(`   推荐决策: ${recoDecisionCount}`)
    console.log(`   推荐候选: ${recoCandidateCount}`)
    console.log(`   候选集合: ${recoCandidateSetCount}`)
    console.log(`   用户反馈: ${recoFeedbackCount}`)
    
    // Estimation 数据
    const estimationDecisionCount = await db.estimationDecision.count()
    const estimationCandidateCount = await db.estimationCandidate.count()
    const estimationModelCount = await db.estimationModel.count()
    
    console.log('\n📈 评估系统数据:')
    console.log(`   评估决策: ${estimationDecisionCount}`)
    console.log(`   评估候选: ${estimationCandidateCount}`)
    console.log(`   评估模型: ${estimationModelCount}`)
    
    // 其他数据
    const videoCount = await db.video.count()
    const templateCount = await db.template.count()
    const styleCount = await db.style.count()
    
    console.log('\n📦 其他数据:')
    console.log(`   视频: ${videoCount}`)
    console.log(`   模板: ${templateCount}`)
    console.log(`   风格: ${styleCount}`)
    
    // 验证商品的 JSON 类型
    const sampleProduct = await db.product.findFirst({
      where: {
        sellingPoints: { not: Prisma.JsonNull }
      },
      select: {
        name: true,
        sellingPoints: true,
        painPoints: true
      }
    })
    
    if (sampleProduct) {
      console.log(`\n✅ 商品数据格式验证:`)
      console.log(`   示例商品: ${sampleProduct.name}`)
      console.log(`   卖点类型: ${Array.isArray(sampleProduct.sellingPoints) ? 'JSON数组 ✅' : typeof sampleProduct.sellingPoints + ' ❌'}`)
      if (Array.isArray(sampleProduct.sellingPoints)) {
        console.log(`   卖点数量: ${sampleProduct.sellingPoints.length}`)
      }
      console.log(`   痛点类型: ${Array.isArray(sampleProduct.painPoints) ? 'JSON数组 ✅' : typeof sampleProduct.painPoints + ' ❌'}`)
      if (Array.isArray(sampleProduct.painPoints)) {
        console.log(`   痛点数量: ${(sampleProduct.painPoints as any[]).length}`)
      }
    }
    
    const totalRecords = userCount + promptCount + productCount + recoDecisionCount + 
                        recoCandidateCount + recoCandidateSetCount + estimationDecisionCount + 
                        estimationCandidateCount + estimationModelCount
    
    console.log(`\n🎉 数据迁移验证完成！`)
    console.log(`   总计: ${totalRecords} 条记录`)
    
  } catch (error) {
    console.error('❌ 验证失败:', error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

finalVerify()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))

