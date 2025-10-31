/**
 * 人设数据同步脚本
 * 
 * 功能：
 * 1. 统一类目名称（如 3c数码 → 3C）
 * 2. 同步人设表和商品表的类目和商品关系
 * 3. 修复不一致的数据
 * 4. 清理无效的关联
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 类目名称映射表 - 统一名称
const CATEGORY_NAME_MAP: Record<string, string> = {
  '3c数码': '3C',
  '3C数码': '3C',
  '3c': '3C',
  '美妆护肤': '美妆',
  '个人护理': '个护',
  '厨房用品': '厨具'
}

interface SyncStats {
  total: number
  fixed: number
  errors: number
  details: {
    categoryNameUnified: number
    categoryFixed: number
    productFixed: number
    invalidProductCleared: number
    invalidCategoryFixed: number
  }
}

async function syncPersonaData() {
  console.log('🔄 开始同步人设数据...\n')

  const stats: SyncStats = {
    total: 0,
    fixed: 0,
    errors: 0,
    details: {
      categoryNameUnified: 0,
      categoryFixed: 0,
      productFixed: 0,
      invalidProductCleared: 0,
      invalidCategoryFixed: 0
    }
  }

  try {
    // 0. 先统一类目名称
    console.log('📝 步骤1: 统一类目名称...\n')
    const categories = await prisma.category.findMany()
    
    for (const category of categories) {
      const normalizedName = CATEGORY_NAME_MAP[category.name]
      if (normalizedName && normalizedName !== category.name) {
        console.log(`🔧 统一类目名称: "${category.name}" → "${normalizedName}"`)
        
        // 检查目标类目是否已存在
        const targetCategory = await prisma.category.findFirst({
          where: { name: normalizedName }
        })
        
        if (targetCategory) {
          // 目标类目已存在，迁移所有关联
          console.log(`  目标类目已存在，迁移关联...`)
          
          // 迁移人设
          const personaCount = await prisma.persona.updateMany({
            where: { categoryId: category.id },
            data: { categoryId: targetCategory.id }
          })
          console.log(`  ✓ 迁移 ${personaCount.count} 个人设`)
          
          // 迁移商品
          const productCount = await prisma.product.updateMany({
            where: { categoryId: category.id },
            data: { categoryId: targetCategory.id }
          })
          console.log(`  ✓ 迁移 ${productCount.count} 个商品`)
          
          // 删除旧类目
          await prisma.category.delete({
            where: { id: category.id }
          })
          console.log(`  ✓ 删除旧类目`)
          
          stats.details.categoryNameUnified++
        } else {
          // 直接重命名
          await prisma.category.update({
            where: { id: category.id },
            data: { name: normalizedName }
          })
          console.log(`  ✓ 类目已重命名`)
          stats.details.categoryNameUnified++
        }
      }
    }
    
    console.log(`\n✅ 类目名称统一完成，共处理 ${stats.details.categoryNameUnified} 个类目\n`)
    
    // 1. 获取所有人设
    console.log('📝 步骤2: 同步人设数据...\n')
    const personas = await prisma.persona.findMany({
      include: {
        product: true,
        category: true
      }
    })

    stats.total = personas.length
    console.log(`📋 找到 ${personas.length} 个人设记录\n`)

    // 2. 逐个检查和修复
    for (const persona of personas) {
      console.log(`\n🔍 检查人设: ${persona.name} (ID: ${persona.id})`)
      let needsUpdate = false
      const updates: any = {}

      // 检查商品关联
      if (persona.productId) {
        const product = await prisma.product.findUnique({
          where: { id: persona.productId }
        })

        if (!product) {
          console.log(`  ⚠️  商品不存在，清理 productId: ${persona.productId}`)
          updates.productId = null
          stats.details.invalidProductCleared++
          needsUpdate = true
        } else {
          // 检查类目是否和商品一致
          if (product.categoryId && persona.categoryId !== product.categoryId) {
            console.log(`  🔧 修复类目不一致`)
            console.log(`     当前: ${persona.categoryId}`)
            console.log(`     商品: ${product.categoryId}`)
            updates.categoryId = product.categoryId
            stats.details.categoryFixed++
            needsUpdate = true
          }
        }
      }

      // 检查类目是否存在
      if (persona.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: persona.categoryId }
        })

        if (!category) {
          console.log(`  ⚠️  类目不存在: ${persona.categoryId}`)
          
          // 尝试从商品中获取类目
          if (persona.productId && persona.product?.categoryId) {
            console.log(`  🔧 从商品中恢复类目: ${persona.product.categoryId}`)
            updates.categoryId = persona.product.categoryId
            stats.details.invalidCategoryFixed++
            needsUpdate = true
          } else {
            // 尝试通过名称查找或创建默认类目
            const defaultCategory = await prisma.category.findFirst({
              where: { name: '未分类' }
            })

            if (defaultCategory) {
              console.log(`  🔧 使用默认类目: 未分类`)
              updates.categoryId = defaultCategory.id
              stats.details.invalidCategoryFixed++
              needsUpdate = true
            }
          }
        }
      } else {
        // 如果没有类目，尝试从商品获取
        if (persona.productId && persona.product?.categoryId) {
          console.log(`  🔧 从商品设置类目: ${persona.product.categoryId}`)
          updates.categoryId = persona.product.categoryId
          stats.details.categoryFixed++
          needsUpdate = true
        } else {
          // 设置默认类目
          const defaultCategory = await prisma.category.findFirst({
            where: { name: '未分类' }
          })

          if (defaultCategory) {
            console.log(`  🔧 设置默认类目: 未分类`)
            updates.categoryId = defaultCategory.id
            stats.details.categoryFixed++
            needsUpdate = true
          }
        }
      }

      // 执行更新
      if (needsUpdate) {
        try {
          await prisma.persona.update({
            where: { id: persona.id },
            data: updates
          })
          console.log(`  ✅ 已更新`)
          stats.fixed++
        } catch (error) {
          console.error(`  ❌ 更新失败:`, error)
          stats.errors++
        }
      } else {
        console.log(`  ✓ 数据正常`)
      }
    }

    // 3. 统计报告
    console.log('\n' + '='.repeat(60))
    console.log('📊 同步完成统计:')
    console.log('='.repeat(60))
    console.log(`总人设数:         ${stats.total}`)
    console.log(`需要修复:         ${stats.fixed}`)
    console.log(`修复失败:         ${stats.errors}`)
    console.log('\n详细统计:')
    console.log(`  类目名称统一:   ${stats.details.categoryNameUnified}`)
    console.log(`  类目修复:       ${stats.details.categoryFixed}`)
    console.log(`  商品修复:       ${stats.details.productFixed}`)
    console.log(`  无效商品清理:   ${stats.details.invalidProductCleared}`)
    console.log(`  无效类目修复:   ${stats.details.invalidCategoryFixed}`)
    console.log('='.repeat(60))

    // 4. 验证结果
    console.log('\n🔍 验证修复结果...')
    const verifyPersonas = await prisma.persona.findMany({
      include: {
        product: true,
        category: true
      }
    })

    let validCount = 0
    let invalidCount = 0

    for (const persona of verifyPersonas) {
      // 检查类目是否有效
      if (!persona.category) {
        console.log(`⚠️  人设 "${persona.name}" 的类目无效`)
        invalidCount++
        continue
      }

      // 检查商品关联是否有效
      if (persona.productId && !persona.product) {
        console.log(`⚠️  人设 "${persona.name}" 的商品关联无效`)
        invalidCount++
        continue
      }

      // 检查商品和类目是否一致
      if (persona.product && persona.product.categoryId !== persona.categoryId) {
        console.log(`⚠️  人设 "${persona.name}" 的类目和商品类目不一致`)
        invalidCount++
        continue
      }

      validCount++
    }

    console.log(`\n✅ 有效记录: ${validCount}`)
    console.log(`⚠️  仍有问题: ${invalidCount}`)

    if (invalidCount > 0) {
      console.log('\n💡 建议: 请手动检查上述问题记录')
    }

  } catch (error) {
    console.error('❌ 同步过程中出错:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 执行脚本
syncPersonaData()
  .then(() => {
    console.log('\n✅ 脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 脚本执行失败:', error)
    process.exit(1)
  })

