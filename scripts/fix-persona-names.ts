/**
 * 修复人设名称字段
 * 确保所有人设都有正确的 name 字段
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始修复人设名称字段...\n')

  try {
    // 获取所有人设
    const personas = await prisma.persona.findMany()

    console.log(`找到 ${personas.length} 个人设\n`)

    let updatedCount = 0

    for (const persona of personas) {
      // 检查 name 字段
      let needsUpdate = false
      let newName = persona.name

      // 如果 name 是默认值或为空，尝试从其他字段提取
      if (!newName || newName === '未命名人设') {
        needsUpdate = true
        
        // 尝试从 coreIdentity 获取
        if (persona.coreIdentity && typeof persona.coreIdentity === 'object') {
          const coreIdentity = persona.coreIdentity as any
          if (coreIdentity.name) {
            newName = coreIdentity.name
          }
        }
        
        // 尝试从 generatedContent 获取
        if (!newName || newName === '未命名人设') {
          if (persona.generatedContent && typeof persona.generatedContent === 'object') {
            const generatedContent = persona.generatedContent as any
            if (generatedContent.basicInfo?.name) {
              newName = generatedContent.basicInfo.name
            }
          }
        }

        // 如果还是没有，使用 ID 的后缀
        if (!newName || newName === '未命名人设') {
          newName = `人设-${persona.id.slice(-8)}`
        }
      }

      if (needsUpdate) {
        await prisma.persona.update({
          where: { id: persona.id },
          data: { name: newName },
        })
        console.log(`✓ 更新人设: ${persona.id} -> ${newName}`)
        updatedCount++
      } else {
        console.log(`- 跳过（已有名称）: ${newName}`)
      }
    }

    console.log(`\n✅ 完成！更新了 ${updatedCount} 个人设`)
  } catch (error) {
    console.error('❌ 修复失败:', error)
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

