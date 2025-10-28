const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateTemplatesToStyles() {
  try {
    console.log('开始迁移Template数据到Style表...')

    // 获取所有Template数据
    const templates = await prisma.template.findMany({
      include: {
        product: true
      }
    })

    console.log(`找到 ${templates.length} 个模板需要迁移`)

    let migratedCount = 0
    let errorCount = 0

    for (const template of templates) {
      try {
        // 检查是否已经存在对应的Style
        const existingStyle = await prisma.style.findFirst({
          where: {
            name: template.name,
            productId: template.productId
          }
        })

        if (existingStyle) {
          console.log(`风格 "${template.name}" 已存在，跳过`)
          continue
        }

        // 创建新的Style记录
        const style = await prisma.style.create({
          data: {
            name: template.name,
            description: template.description || '',
            category: template.product?.category || '未分类', // 从关联的商品获取类目
            subcategory: template.product?.subcategory || '',
            tone: template.tonePool || 'professional',
            scriptStructure: template.structure || null,
            visualStyle: template.videoStylePool || null,
            targetAudience: null, // 新字段，暂时为空
            productId: template.productId,
            templatePerformance: null, // 新字段，暂时为空
            hookPool: template.hookPool || null,
            targetCountries: template.targetCountries || null,
            isActive: template.isActive
          }
        })

        // 更新Template记录，关联到新的Style
        await prisma.template.update({
          where: { id: template.id },
          data: {
            styleId: style.id
          }
        })

        migratedCount++
        console.log(`✓ 迁移模板 "${template.name}" 到风格库`)

      } catch (error) {
        errorCount++
        console.error(`✗ 迁移模板 "${template.name}" 失败:`, error.message)
      }
    }

    console.log(`\n迁移完成:`)
    console.log(`- 成功迁移: ${migratedCount} 个`)
    console.log(`- 失败: ${errorCount} 个`)

  } catch (error) {
    console.error('迁移过程中发生错误:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行迁移
migrateTemplatesToStyles()
