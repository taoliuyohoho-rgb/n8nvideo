/**
 * 删除不活跃且没有商品关联的类目
 */

import { prisma } from '../lib/prisma'

async function removeInactiveCategories() {
  console.log('🧹 开始清理不活跃的类目...')

  try {
    // 获取所有不活跃的类目
    const inactiveCategories = await prisma.category.findMany({
      where: { isActive: false },
      include: {
        _count: {
          select: { 
            products: true,
            personas: true 
          }
        }
      }
    })

    console.log(`📋 找到 ${inactiveCategories.length} 个不活跃的类目`)

    // 删除没有关联的类目
    let deletedCount = 0
    for (const cat of inactiveCategories) {
      if (cat._count.products === 0 && cat._count.personas === 0) {
        await prisma.category.delete({
          where: { id: cat.id }
        })
        console.log(`✅ 删除类目: ${cat.name} (无关联数据)`)
        deletedCount++
      } else {
        console.log(`⚠️ 保留类目: ${cat.name} (有 ${cat._count.products} 个商品, ${cat._count.personas} 个人设)`)
      }
    }

    console.log(`\n✅ 删除了 ${deletedCount} 个不活跃的类目`)

    // 显示最终统计（只显示活跃的）
    const activeCategories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: [
        { level: 'asc' },
        { name: 'asc' }
      ]
    })

    console.log('\n📊 活跃类目统计:')
    activeCategories.forEach(cat => {
      const indent = cat.level === 2 ? '  ' : ''
      console.log(`${indent}${cat.name} (Level ${cat.level}): ${cat._count.products} 个商品`)
    })

    console.log('\n✨ 清理完成！')

  } catch (error) {
    console.error('❌ 清理失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 执行清理
removeInactiveCategories()
  .then(() => {
    console.log('✅ 脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error)
    process.exit(1)
  })

