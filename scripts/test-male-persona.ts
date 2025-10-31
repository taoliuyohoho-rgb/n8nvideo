/**
 * 测试男性人设匹配
 */

import { PrismaClient } from '@prisma/client'
import { matchProductsByRules } from '../src/services/persona/personaProductMatcher'

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 测试男性人设匹配...\n')

  // 查询几个男性人设
  const personas = await prisma.persona.findMany({
    where: {
      coreIdentity: {
        path: ['gender'],
        equals: '男'
      }
    },
    take: 3
  })

  if (personas.length === 0) {
    console.log('❌ 未找到男性人设')
    return
  }

  for (const persona of personas) {
    console.log('\n' + '='.repeat(80))
    console.log(`✅ 人设: ${persona.name}`)
    console.log(`   职业: ${(persona.coreIdentity as any)?.occupation}`)
    console.log(`   年龄: ${(persona.coreIdentity as any)?.age}`)
    console.log(`   性别: ${(persona.coreIdentity as any)?.gender}`)
    console.log()

    // 执行匹配
    const matchedProducts = await matchProductsByRules(persona)

    console.log(`🎯 Top 5 匹配结果:`)
    matchedProducts.slice(0, 5).forEach((sp, idx) => {
      console.log(`  ${idx + 1}. ${sp.product.name} (${sp.product.category}) - 评分: ${sp.score}`)
    })
  }

  console.log('\n' + '='.repeat(80))
  console.log('✅ 测试完成！')
}

main()
  .catch((e) => {
    console.error('❌ 测试失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

