import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function verify() {
  console.log('🔍 验证数据迁移状态...\n')
  
  try {
    // 检查用户
    const userCount = await db.user.count()
    console.log(`✅ 用户表: ${userCount} 条记录`)
    
    // 检查 Prompt 模板
    const promptCount = await db.promptTemplate.count()
    console.log(`✅ Prompt模板: ${promptCount} 条记录`)
    
    // 检查商品并验证 JSON 类型
    const productCount = await db.product.count()
    console.log(`✅ 商品表: ${productCount} 条记录`)
    
    // 检查第一个商品的卖点/痛点类型
    const sampleProduct = await db.product.findFirst({
      select: {
        name: true,
        sellingPoints: true,
        painPoints: true
      }
    })
    
    if (sampleProduct) {
      console.log(`\n📦 示例商品: ${sampleProduct.name}`)
      console.log(`   卖点类型: ${Array.isArray(sampleProduct.sellingPoints) ? 'JSON数组 ✅' : typeof sampleProduct.sellingPoints}`)
      console.log(`   卖点内容: ${Array.isArray(sampleProduct.sellingPoints) ? JSON.stringify(sampleProduct.sellingPoints.slice(0, 2)) : '非数组'}`)
      console.log(`   痛点类型: ${Array.isArray(sampleProduct.painPoints) ? 'JSON数组 ✅' : typeof sampleProduct.painPoints}`)
      console.log(`   痛点内容: ${Array.isArray(sampleProduct.painPoints) ? JSON.stringify((sampleProduct.painPoints as any[]).slice(0, 2)) : '非数组'}`)
    }
    
    // 检查其他表
    const videoCount = await db.video.count()
    const templateCount = await db.template.count()
    const styleCount = await db.style.count()
    
    console.log(`\n其他数据:`)
    console.log(`✅ 视频: ${videoCount} 条`)
    console.log(`✅ 模板: ${templateCount} 条`)
    console.log(`✅ 风格: ${styleCount} 条`)
    
    console.log(`\n✅ 数据迁移验证完成！`)
    
  } catch (error) {
    console.error('❌ 验证失败:', error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

verify()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))

