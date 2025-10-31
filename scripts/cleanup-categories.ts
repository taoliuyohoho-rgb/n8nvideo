/**
 * 清理类目表，保持与类目管理界面一致
 * 
 * 一级类目：美妆、个护、3C、大健康、其他
 * 二级类目：护肤品、彩妆、电子产品、保健品、服装、鞋包
 */

import { prisma } from '../lib/prisma'

async function cleanupCategories() {
  console.log('🧹 开始清理类目表...')

  try {
    // 1. 先处理现有数据，不删除，而是标记为不活跃
    const existingCategories = await prisma.category.findMany()
    console.log(`📋 找到 ${existingCategories.length} 个现有类目`)

    // 标记所有现有类目为不活跃
    await prisma.category.updateMany({
      data: { isActive: false }
    })
    console.log(`✅ 将所有现有类目标记为不活跃`)

    // 2. 创建或更新标准一级类目
    const level1Categories = [
      { name: '美妆', description: '美妆护肤类产品', level: 1 },
      { name: '个护', description: '个人护理类产品', level: 1 },
      { name: '3C', description: '3C电子产品', level: 1 },
      { name: '大健康', description: '健康保健类产品', level: 1 },
      { name: '其他', description: '其他类目产品', level: 1 }
    ]

    const createdLevel1: any[] = []
    for (const cat of level1Categories) {
      // 检查是否已存在
      const existing = existingCategories.find(c => c.name === cat.name)
      
      let result
      if (existing) {
        // 更新现有类目
        result = await prisma.category.update({
          where: { id: existing.id },
          data: {
            description: cat.description,
            level: cat.level,
            isActive: true,
            parentId: null // 确保是一级类目
          }
        })
        console.log(`✅ 更新一级类目: ${result.name} (${result.id})`)
      } else {
        // 创建新类目
        result = await prisma.category.create({
          data: {
            name: cat.name,
            description: cat.description,
            level: cat.level,
            isActive: true
          }
        })
        console.log(`✅ 创建一级类目: ${result.name} (${result.id})`)
      }
      createdLevel1.push(result)
    }

    // 3. 创建或更新二级类目
    const level2Categories = [
      { name: '护肤品', parentName: '美妆', description: '护肤护理产品' },
      { name: '彩妆', parentName: '美妆', description: '彩妆化妆品' },
      { name: '电子产品', parentName: '3C', description: '电子数码产品' },
      { name: '保健品', parentName: '大健康', description: '保健品类' },
      { name: '服装', parentName: '其他', description: '服装类' },
      { name: '鞋包', parentName: '其他', description: '鞋包配饰' }
    ]

    for (const cat of level2Categories) {
      const parent = createdLevel1.find(c => c.name === cat.parentName)
      if (!parent) {
        console.warn(`⚠️ 找不到父类目: ${cat.parentName}`)
        continue
      }

      // 检查是否已存在
      const existing = existingCategories.find(c => c.name === cat.name)
      
      if (existing) {
        // 更新现有类目
        await prisma.category.update({
          where: { id: existing.id },
          data: {
            description: cat.description,
            parentId: parent.id,
            level: 2,
            isActive: true
          }
        })
        console.log(`✅ 更新二级类目: ${cat.name} (父: ${cat.parentName})`)
      } else {
        // 创建新类目
        await prisma.category.create({
          data: {
            name: cat.name,
            description: cat.description,
            parentId: parent.id,
            level: 2,
            isActive: true
          }
        })
        console.log(`✅ 创建二级类目: ${cat.name} (父: ${cat.parentName})`)
      }
    }

    // 4. 更新商品的categoryId
    console.log('\n📦 开始更新商品类目关联...')
    
    const products = await prisma.product.findMany({
      select: { id: true, category: true, categoryId: true }
    })

    const allCategories = await prisma.category.findMany()
    
    let updatedCount = 0
    for (const product of products) {
      if (!product.category) continue

      // 根据商品的category名称找到对应的Category记录
      let matchedCategory = allCategories.find(c => 
        c.name === product.category || 
        c.name.includes(product.category) ||
        product.category.includes(c.name)
      )

      // 如果没找到精确匹配，尝试模糊匹配
      if (!matchedCategory) {
        const categoryLower = product.category.toLowerCase()
        if (categoryLower.includes('美妆') || categoryLower.includes('护肤') || categoryLower.includes('彩妆')) {
          matchedCategory = allCategories.find(c => c.name === '美妆')
        } else if (categoryLower.includes('3c') || categoryLower.includes('电子') || categoryLower.includes('数码')) {
          matchedCategory = allCategories.find(c => c.name === '3C')
        } else if (categoryLower.includes('健康') || categoryLower.includes('保健')) {
          matchedCategory = allCategories.find(c => c.name === '大健康')
        } else if (categoryLower.includes('个护') || categoryLower.includes('护理')) {
          matchedCategory = allCategories.find(c => c.name === '个护')
        } else {
          matchedCategory = allCategories.find(c => c.name === '其他')
        }
      }

      if (matchedCategory && product.categoryId !== matchedCategory.id) {
        await prisma.product.update({
          where: { id: product.id },
          data: { 
            categoryId: matchedCategory.id,
            category: matchedCategory.name // 统一类目名称
          }
        })
        updatedCount++
        console.log(`  更新商品: ${product.id} -> ${matchedCategory.name}`)
      }
    }

    console.log(`\n✅ 更新了 ${updatedCount} 个商品的类目关联`)

    // 5. 显示最终统计
    const finalCategories = await prisma.category.findMany({
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

    console.log('\n📊 最终类目统计:')
    finalCategories.forEach(cat => {
      const indent = cat.level === 2 ? '  ' : ''
      console.log(`${indent}${cat.name} (Level ${cat.level}): ${cat._count.products} 个商品`)
    })

    console.log('\n✨ 类目清理完成！')

  } catch (error) {
    console.error('❌ 清理失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 执行清理
cleanupCategories()
  .then(() => {
    console.log('✅ 脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error)
    process.exit(1)
  })

