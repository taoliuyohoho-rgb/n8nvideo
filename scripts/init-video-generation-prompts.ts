/**
 * 初始化 video-generation 模块的 Prompt 模板
 * 只创建 video-generation 的 5 个模板，不影响其他模块
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 开始初始化 video-generation 模块 Prompt 模板...')

  const videoGenerationPrompts = [
    // ========== 视频生成 Prompt 生成 (5个) ==========
    {
      id: 'video-generation-standard-v1',
      name: '视频Prompt生成-标准模板',
      businessModule: 'video-generation',
      content: `根据以下信息生成视频生成 AI 的 Prompt：

**商品信息：**
- 商品名称：{{productName}}
- 商品类目：{{category}}
- 商品卖点：{{sellingPoints}}
- 目标受众：{{targetAudience}}

**脚本信息：**
{{scriptContent}}

**人设信息：**
{{personaInfo}}

**选用模板/风格：**
{{templateName}}

**要求：**
1. 生成一个完整的视频生成 Prompt，适用于 Sora、Runway、Pika 等视频生成 AI
2. Prompt 应包含：场景描述、视觉风格、镜头运动、氛围、色调等
3. 突出商品的核心卖点和目标受众的喜好
4. 保持 Prompt 简洁且有画面感（80-200字）

请直接输出 Prompt 文本，不需要 JSON 格式。`,
      variables: JSON.stringify(['productName', 'category', 'sellingPoints', 'targetAudience', 'scriptContent', 'personaInfo', 'templateName']),
      description: '标准视频Prompt生成',
      isDefault: true,
      isActive: true,
      createdBy: 'system'
    },
    {
      id: 'video-generation-visual-v1',
      name: '视频Prompt生成-视觉强化版',
      businessModule: 'video-generation',
      content: `根据商品和脚本生成强调视觉效果的视频 Prompt：

商品：{{productName}}
卖点：{{sellingPoints}}
脚本：{{scriptContent}}
模板风格：{{templateName}}

**视觉强化要求：**
- 强调光影效果、色彩搭配
- 突出产品的质感和细节
- 营造高端的视觉氛围
- 使用电影级的镜头语言

输出：直接生成可用于视频 AI 的 Prompt（100-250字）`,
      variables: JSON.stringify(['productName', 'sellingPoints', 'scriptContent', 'templateName']),
      description: '视觉强化版Prompt',
      isDefault: false,
      isActive: true,
      createdBy: 'system'
    },
    {
      id: 'video-generation-simple-v1',
      name: '视频Prompt生成-简洁版',
      businessModule: 'video-generation',
      content: `生成简洁高效的视频 Prompt：

商品：{{productName}}
核心卖点：{{sellingPoints}}
目标风格：{{templateName}}

要求：
- Prompt 控制在 50-100字
- 只包含最核心的视觉元素
- 适用于快速生成测试

直接输出 Prompt：`,
      variables: JSON.stringify(['productName', 'sellingPoints', 'templateName']),
      description: '简洁快速版',
      isDefault: false,
      isActive: true,
      createdBy: 'system'
    },
    {
      id: 'video-generation-scenario-v1',
      name: '视频Prompt生成-场景化',
      businessModule: 'video-generation',
      content: `基于使用场景生成视频 Prompt：

商品：{{productName}}
使用场景：{{usageScenarios}}
目标受众：{{targetAudience}}
脚本：{{scriptContent}}

**场景化要求：**
- 构建真实的使用场景
- 展现用户与产品的互动
- 营造代入感和共鸣
- 突出场景中的痛点和解决方案

输出场景化的视频 Prompt（120-250字）：`,
      variables: JSON.stringify(['productName', 'usageScenarios', 'targetAudience', 'scriptContent']),
      description: '场景化Prompt',
      isDefault: false,
      isActive: true,
      createdBy: 'system'
    },
    {
      id: 'video-generation-multimodel-v1',
      name: '视频Prompt生成-多模型适配',
      businessModule: 'video-generation',
      content: `生成适配多种视频生成 AI 的 Prompt：

商品：{{productName}}
卖点：{{sellingPoints}}
脚本：{{scriptContent}}
目标模型：{{targetModel}} (Sora/Runway/Pika/其他)

**适配策略：**
- Sora: 强调镜头运动和场景转换
- Runway: 注重风格控制和特效描述
- Pika: 简洁直接，突出主体动作

根据目标模型生成最优 Prompt（80-200字）：`,
      variables: JSON.stringify(['productName', 'sellingPoints', 'scriptContent', 'targetModel']),
      description: '多模型适配版',
      isDefault: false,
      isActive: true,
      createdBy: 'system'
    }
  ]

  let createdCount = 0
  let skippedCount = 0
  let updatedCount = 0

  for (const promptData of videoGenerationPrompts) {
    try {
      // 检查是否已存在
      const existing = await prisma.promptTemplate.findUnique({
        where: { id: promptData.id }
      })

      if (existing) {
        // 更新现有模板
        await prisma.promptTemplate.update({
          where: { id: promptData.id },
          data: {
            name: promptData.name,
            content: promptData.content,
            variables: promptData.variables,
            description: promptData.description,
            isDefault: promptData.isDefault,
            isActive: promptData.isActive,
            updatedAt: new Date()
          }
        })
        console.log(`✅ 更新: ${promptData.name}`)
        updatedCount++
      } else {
        // 创建新模板
        await prisma.promptTemplate.create({
          data: promptData
        })
        console.log(`🆕 创建: ${promptData.name}`)
        createdCount++
      }
    } catch (error) {
      console.error(`❌ 处理失败: ${promptData.name}`, error)
      skippedCount++
    }
  }

  console.log('\n📊 初始化完成:')
  console.log(`   - 新创建: ${createdCount} 个`)
  console.log(`   - 已更新: ${updatedCount} 个`)
  console.log(`   - 跳过: ${skippedCount} 个`)
  console.log(`   - 总计: ${videoGenerationPrompts.length} 个 video-generation 模板`)

  // 验证结果
  const count = await prisma.promptTemplate.count({
    where: { businessModule: 'video-generation' }
  })
  console.log(`\n✨ 数据库中现有 ${count} 个 video-generation 模板`)
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

