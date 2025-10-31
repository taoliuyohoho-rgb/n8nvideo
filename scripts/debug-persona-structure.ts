/**
 * 调试人设数据结构
 * 查看实际存储的字段
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('调试人设数据结构...\n')

  try {
    // 获取第一个人设作为示例
    const persona = await prisma.persona.findFirst({
      include: {
        product: true,
        category: true,
      },
    })

    if (!persona) {
      console.log('未找到人设数据')
      return
    }

    console.log('📋 人设数据结构示例:')
    console.log('─'.repeat(80))
    console.log('\n基础字段:')
    console.log(`  id: ${persona.id}`)
    console.log(`  name: ${persona.name}`)
    console.log(`  description: ${persona.description}`)
    console.log(`  categoryId: ${persona.categoryId}`)
    console.log(`  productId: ${persona.productId}`)
    console.log(`  aiModel: ${persona.aiModel}`)
    console.log(`  promptTemplate: ${persona.promptTemplate}`)
    console.log(`  createdBy: ${persona.createdBy}`)
    console.log(`  version: ${persona.version}`)
    console.log(`  isActive: ${persona.isActive}`)

    console.log('\n关联数据:')
    console.log(`  category.name: ${persona.category?.name}`)
    console.log(`  product: ${persona.product ? persona.product.name : '未关联'}`)

    console.log('\n📦 generatedContent 字段:')
    if (persona.generatedContent && typeof persona.generatedContent === 'object') {
      const content = persona.generatedContent as any
      console.log(JSON.stringify(content, null, 2))
    } else {
      console.log('  (空)')
    }

    console.log('\n📦 coreIdentity 字段:')
    if (persona.coreIdentity && typeof persona.coreIdentity === 'object') {
      const identity = persona.coreIdentity as any
      console.log(JSON.stringify(identity, null, 2))
    } else {
      console.log('  (空)')
    }

    console.log('\n📦 vibe 字段:')
    if (persona.vibe && typeof persona.vibe === 'object') {
      const vibe = persona.vibe as any
      console.log(JSON.stringify(vibe, null, 2))
    } else {
      console.log('  (空)')
    }

    console.log('\n📦 look 字段:')
    if (persona.look && typeof persona.look === 'object') {
      const look = persona.look as any
      console.log(JSON.stringify(look, null, 2))
    } else {
      console.log('  (空)')
    }

    console.log('\n📦 context 字段:')
    if (persona.context && typeof persona.context === 'object') {
      const ctx = persona.context as any
      console.log(JSON.stringify(ctx, null, 2))
    } else {
      console.log('  (空)')
    }

    console.log('\n─'.repeat(80))

    // 显示如何在 Admin UI 中访问数据
    console.log('\n💡 在 Admin UI 中的数据访问逻辑:')
    console.log('─'.repeat(80))
    
    const content = persona.generatedContent as any
    const basicInfo = content?.basicInfo || persona.coreIdentity
    const psychology = content?.psychology || persona.vibe
    
    console.log('\n兼容后的数据:')
    console.log(`  name: ${persona.name || basicInfo?.name || '未知'}`)
    console.log(`  age: ${basicInfo?.age || '未知'}`)
    console.log(`  gender: ${basicInfo?.gender || '未知'}`)
    console.log(`  location: ${basicInfo?.location || '未知'}`)
    console.log(`  occupation: ${basicInfo?.occupation || '未知'}`)
    console.log(`  values: ${JSON.stringify(psychology?.values || psychology?.traits || [])}`)

    console.log('\n')
  } catch (error) {
    console.error('❌ 调试失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

