/**
 * 验证人设数据脚本
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('验证人设数据...\n')

  // 1. 查询类目
  const categories = await prisma.category.findMany({
    where: {
      name: {
        in: ['3C数码', '美妆', '个护', '厨具'],
      },
    },
    include: {
      personas: true,
    },
  })

  console.log('📁 类目和人设统计:')
  console.log('─'.repeat(60))

  for (const category of categories) {
    console.log(`\n${category.name} (ID: ${category.id})`)
    console.log(`  目标市场: ${category.targetMarket || '未设置'}`)
    console.log(`  人设数量: ${category.personas.length}`)
    
    if (category.personas.length > 0) {
      console.log('  人设列表:')
      for (const persona of category.personas) {
        console.log(`    - ${persona.name}`)
        console.log(`      描述: ${persona.description || '无'}`)
        console.log(`      AI模型: ${persona.aiModel}`)
        console.log(`      创建时间: ${persona.createdAt.toISOString()}`)
      }
    }
  }

  // 2. 统计总数
  const totalCategories = categories.length
  const totalPersonas = categories.reduce((sum, cat) => sum + cat.personas.length, 0)

  console.log('\n' + '─'.repeat(60))
  console.log('📊 总计:')
  console.log(`  类目: ${totalCategories} 个`)
  console.log(`  人设: ${totalPersonas} 个`)
  console.log('─'.repeat(60))
}

main()
  .catch((error) => {
    console.error('验证失败:', error)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })

