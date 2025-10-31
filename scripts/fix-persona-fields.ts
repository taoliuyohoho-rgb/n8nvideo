/**
 * 修复人设字段数据脚本
 * 
 * 将 generatedContent 中的数据提取到 coreIdentity、look、vibe、context 等字段
 * 解决人设信息显示"未知"的问题
 */

import { prisma } from '../lib/prisma'

async function fixPersonaFields() {
  console.log('🔧 开始修复人设字段...')
  
  try {
    // 1. 查询所有人设
    const personas = await prisma.persona.findMany({
      select: {
        id: true,
        name: true,
        generatedContent: true,
        coreIdentity: true,
        look: true,
        vibe: true,
        context: true,
        why: true
      }
    })
    
    console.log(`📊 找到 ${personas.length} 个人设记录`)
    
    let fixedCount = 0
    let skippedCount = 0
    
    // 2. 遍历每个人设
    for (const persona of personas) {
      // 如果已有完整的结构化字段，跳过
      if (persona.coreIdentity && persona.look && persona.vibe && persona.context) {
        console.log(`✓ 跳过已有完整字段的人设: ${persona.name} (${persona.id})`)
        skippedCount++
        continue
      }
      
      console.log(`🔨 修复人设: ${persona.name} (${persona.id})`)
      
      const generatedContent = persona.generatedContent as any
      
      // 提取 coreIdentity
      const extractedCoreIdentity = generatedContent?.coreIdentity || {
        name: generatedContent?.basicInfo?.name || persona.name,
        age: generatedContent?.basicInfo?.age || generatedContent?.age || 25,
        gender: generatedContent?.basicInfo?.gender || generatedContent?.gender || '不限',
        location: generatedContent?.basicInfo?.location || generatedContent?.location || '全球',
        occupation: generatedContent?.basicInfo?.occupation || generatedContent?.occupation || '专业人士'
      }
      
      // 提取 look
      const extractedLook = generatedContent?.look || {
        generalAppearance: '现代简约',
        hair: '整洁得体',
        clothingAesthetic: '简约舒适',
        signatureDetails: '注重品质'
      }
      
      // 提取 vibe
      const extractedVibe = generatedContent?.vibe || {
        traits: ['专业', '友好', '理性'],
        demeanor: '友好专业',
        communicationStyle: '清晰简洁'
      }
      
      // 提取 context
      const extractedContext = generatedContent?.context || {
        hobbies: generatedContent?.preferences?.featureNeeds?.join('、') || '品质生活',
        values: generatedContent?.psychology?.values?.join('、') || '品质、效率',
        frustrations: generatedContent?.psychology?.painPoints?.join('、') || '时间紧张',
        homeEnvironment: '现代都市'
      }
      
      // 提取 why
      const extractedWhy = generatedContent?.why || 
        persona.why || 
        `${extractedCoreIdentity.name}是${extractedCoreIdentity.location}的${extractedCoreIdentity.occupation}，关注品质与实用性`
      
      // 更新数据库
      try {
        await prisma.persona.update({
          where: { id: persona.id },
          data: {
            coreIdentity: extractedCoreIdentity as any,
            look: extractedLook as any,
            vibe: extractedVibe as any,
            context: extractedContext as any,
            why: extractedWhy
          }
        })
        
        console.log(`  ✅ 已修复: ${persona.name}`)
        console.log(`    - 姓名: ${extractedCoreIdentity.name}`)
        console.log(`    - 年龄: ${extractedCoreIdentity.age}`)
        console.log(`    - 性别: ${extractedCoreIdentity.gender}`)
        console.log(`    - 地区: ${extractedCoreIdentity.location}`)
        console.log(`    - 职业: ${extractedCoreIdentity.occupation}`)
        fixedCount++
      } catch (error) {
        console.error(`  ❌ 更新失败: ${persona.name}`, error)
      }
    }
    
    console.log('\n📈 修复完成:')
    console.log(`  ✅ 修复: ${fixedCount} 个`)
    console.log(`  ⏭️  跳过: ${skippedCount} 个`)
    console.log(`  📊 总计: ${personas.length} 个`)
    
  } catch (error) {
    console.error('❌ 修复失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 执行修复
fixPersonaFields()
  .then(() => {
    console.log('✅ 脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error)
    process.exit(1)
  })

