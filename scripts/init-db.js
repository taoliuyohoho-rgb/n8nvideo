#!/usr/bin/env node

/**
 * 数据库初始化脚本
 * 创建必要的数据库表和示例数据
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function initDatabase() {
  console.log('🗄️ 初始化数据库...')

  try {
    // 1. 创建示例用户
    console.log('创建示例用户...')
    const user = await prisma.user.upsert({
      where: { email: 'demo@example.com' },
      update: {},
      create: {
        email: 'demo@example.com',
        name: 'Demo User'
      }
    })
    console.log(`✅ 用户创建成功: ${user.email}`)

    // 2. 创建示例商品
    console.log('创建示例商品...')
    const product = await prisma.product.upsert({
      where: { id: 'default-product' },
      update: {},
      create: {
        id: 'default-product',
        name: '电磁炉',
        description: '高效加热，多功能烹饪，智能触控',
        category: '家居用品',
        subcategory: '厨房电器',
        sellingPoints: JSON.stringify(['新人-5RM', '限时7折', '高效节能', '安全可靠', '易清洁']),
        skuImages: JSON.stringify(['https://example.com/induction_cooker.jpg']),
        targetCountries: JSON.stringify(['MY', 'SG', 'TH'])
      }
    })
    console.log(`✅ 商品创建成功: ${product.name}`)

    // 3. 创建示例模板
    console.log('创建示例模板...')
    const template = await prisma.template.upsert({
      where: { templateId: 'TMP001' },
      update: {},
      create: {
        templateId: 'TMP001',
        name: '电磁炉产品展示模板',
        description: '适用于电磁炉的专业展示模板',
        productId: product.id,
        structure: '开场吸引 -> 产品展示 -> 功能演示 -> 品牌强化',
        hookPool: '问题式开场, 数据震撼, 场景代入',
        videoStylePool: '专业拍摄, 多角度展示, 细节特写',
        tonePool: '专业, 可信, 现代',
        suggestedLength: '15-30秒',
        recommendedCategories: '家居用品, 厨房电器',
        targetCountries: 'MY, SG, TH, ID',
        templatePrompt: 'Create a professional product showcase video for induction cooker, highlighting its efficiency, safety features, and ease of use. Include marketing message: 新人-5RM；限时7折',
        videoAnalysisAI: 'gemini',
        promptGenerationAI: 'gemini',
        videoGenerationAI: 'sora'
      }
    })
    console.log(`✅ 模板创建成功: ${template.name}`)

    // 4. 创建示例视频记录
    console.log('创建示例视频记录...')
    const video = await prisma.video.create({
      data: {
        templateId: template.id,
        userId: user.id,
        videoTitle: '电磁炉产品展示视频',
        videoDescription: '展示电磁炉的核心功能和卖点，包含新人-5RM；限时7折营销信息',
        generatedPrompt: 'Create a professional product video for induction cooker, highlighting its efficiency, safety features, and ease of use. Include marketing message: 新人-5RM；限时7折. Key selling points: 高效节能, 安全可靠, 易清洁. Target audience: 家庭主妇, 烹饪爱好者.',
        promptGenerationAI: 'gemini',
        videoGenerationAI: 'sora',
        status: 'generated'
      }
    })
    console.log(`✅ 视频记录创建成功: ${video.id}`)

    // 5. 创建示例广告数据
    console.log('创建示例广告数据...')
    const adData = await prisma.adData.create({
      data: {
        videoId: video.id,
        platform: 'tiktok',
        shopId: 'shop001',
        spend: 100.50,
        impressions: 10000,
        clicks: 500,
        views: 8000,
        ctr: 0.05,
        ctr3s: 0.75,
        ctrComplete: 0.60,
        conversions: 25,
        cvr: 0.05,
        gmv: 1250.00,
        orders: 25,
        likes: 150,
        shares: 30,
        comments: 45,
        userDemographics: JSON.stringify({
          age: '25-45',
          gender: 'mixed',
          interests: ['cooking', 'home_improvement', 'kitchen_appliances']
        }),
        date: new Date()
      }
    })
    console.log(`✅ 广告数据创建成功: ${adData.id}`)

    console.log('\n🎉 数据库初始化完成！')
    console.log('\n📊 创建的数据:')
    console.log(`   👤 用户: 1个`)
    console.log(`   📦 商品: 1个`)
    console.log(`   📝 模板: 1个`)
    console.log(`   🎬 视频: 1个`)
    console.log(`   📈 广告数据: 1条`)

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 运行初始化
initDatabase()
  .then(() => {
    console.log('\n✅ 数据库初始化成功！')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 数据库初始化失败:', error)
    process.exit(1)
  })
