/**
 * 数据迁移脚本：将人设的单选类目/商品迁移到多选字段
 * 
 * 运行: npm run migrate-persona
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 开始迁移人设数据到多选格式...\n')

  try {
    // 1. 获取所有人设
    const personas = await prisma.persona.findMany({
      select: {
        id: true,
        name: true,
        categoryId: true,
        productId: true,
        categoryIds: true,
        productIds: true
      }
    })

    console.log(`📊 找到 ${personas.length} 个人设\n`)

    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0

    // 2. 遍历每个人设
    for (const persona of personas) {
      try {
        // 检查是否已经有多选数据
        const hasMultiSelect = persona.categoryIds && persona.categoryIds.length > 0

        if (hasMultiSelect) {
          console.log(`⏭️  跳过 "${persona.name}" - 已有多选数据`)
          skippedCount++
          continue
        }

        // 准备多选数据
        const categoryIds: string[] = []
        const productIds: string[] = []

        // 从单选字段迁移
        if (persona.categoryId && persona.categoryId !== 'default-category') {
          categoryIds.push(persona.categoryId)
        }

        if (persona.productId) {
          productIds.push(persona.productId)
        }

        // 如果没有有效数据，跳过
        if (categoryIds.length === 0) {
          console.log(`⚠️  跳过 "${persona.name}" - 无有效类目数据`)
          skippedCount++
          continue
        }

        // 更新人设
        await prisma.persona.update({
          where: { id: persona.id },
          data: {
            categoryIds,
            productIds
          }
        })

        console.log(`✅ 迁移成功: "${persona.name}"`)
        console.log(`   类目: ${categoryIds.join(', ')}`)
        if (productIds.length > 0) {
          console.log(`   商品: ${productIds.join(', ')}`)
        }
        console.log()

        migratedCount++

      } catch (error) {
        console.error(`❌ 迁移失败 "${persona.name}":`, error)
        errorCount++
      }
    }

    // 3. 输出统计
    console.log('\n' + '='.repeat(50))
    console.log('📈 迁移统计:')
    console.log(`   ✅ 成功迁移: ${migratedCount} 个`)
    console.log(`   ⏭️  已跳过: ${skippedCount} 个`)
    console.log(`   ❌ 失败: ${errorCount} 个`)
    console.log(`   📊 总计: ${personas.length} 个`)
    console.log('='.repeat(50))

    if (errorCount > 0) {
      console.log('\n⚠️  存在迁移失败的记录，请检查错误日志')
    } else {
      console.log('\n🎉 所有人设数据迁移完成！')
    }

  } catch (error) {
    console.error('\n❌ 迁移过程发生错误:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

