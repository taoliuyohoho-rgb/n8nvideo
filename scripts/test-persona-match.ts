/**
 * 测试人设自动匹配功能
 */

import { PrismaClient } from '@prisma/client'
import { matchProductsByRules } from '../src/services/persona/personaProductMatcher'

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 开始测试人设自动匹配...\n')

  // 查询一个人设
  const persona = await prisma.persona.findFirst({
    where: {
      name: {
        contains: '美食博主'
      }
    }
  })

  if (!persona) {
    console.log('❌ 未找到"美食博主"人设')
    return
  }

  console.log(`✅ 找到人设: ${persona.name}`)
  console.log(`📋 人设信息:`)
  console.log(`   - 职业: ${(persona.coreIdentity as any)?.occupation}`)
  console.log(`   - 爱好: ${(persona.context as any)?.hobbies}`)
  console.log(`   - 年龄: ${(persona.coreIdentity as any)?.age}`)
  console.log(`   - 当前关联商品: ${persona.productId || '无'}`)
  console.log()

  // 执行匹配
  const matchedProducts = await matchProductsByRules(persona)

  console.log(`\n🎯 匹配结果 (共 ${matchedProducts.length} 个):`)
  console.log('─'.repeat(80))
  
  matchedProducts.slice(0, 10).forEach((sp, idx) => {
    console.log(`${idx + 1}. ${sp.product.name}`)
    console.log(`   类目: ${sp.product.category}${sp.product.subcategory ? ` > ${sp.product.subcategory}` : ''}`)
    console.log(`   评分: ${sp.score}`)
    console.log()
  })

  console.log('\n✅ 测试完成！')
}

main()
  .catch((e) => {
    console.error('❌ 测试失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

