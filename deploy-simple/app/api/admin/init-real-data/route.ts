import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// 从Google Sheets获取的商品数据
const productsData = [
  { name: '电磁炉', category: '3C', price: 'RM79.00' },
  { name: '手持风扇', category: '3C', price: 'RM39.90' },
  { name: '电炖锅', category: '3C', price: 'RM143.00' },
  { name: '牛油果按摩膏', category: '美妆', price: 'RM19.90' },
  { name: 'XXXL按摩膏', category: '美妆', price: 'RM19.90' },
  { name: 'cosrx蜗牛血清精华原液', category: '美妆', price: 'RM17.90' },
  { name: 'cosrx珂丝艾丝氨基酸洗面奶', category: '美妆', price: 'RM12.99' },
  { name: 'cosrx芦荟隔离防晒霜', category: '美妆', price: 'RM15.80' },
  { name: '生发剂', category: '美妆', price: 'RM25.00' },
  { name: '祛斑', category: '美妆', price: 'RM18.99' },
  { name: '玻璃盖大肚锅', category: '3C', price: 'RM53.99' },
  { name: '电热水壶', category: '3C', price: 'RM62.00' },
  { name: '折叠锅', category: '3C', price: 'RM110.00' },
  { name: '妇炎洁草本私处湿巾', category: '美妆', price: 'RM14.50' },
  { name: '妇炎洁草本私处洗液', category: '美妆', price: 'RM11.66' }
]

export async function POST(request: NextRequest) {
  try {
    console.log('🗄️ 开始初始化真实数据...')

    // 1. 清空所有测试数据
    console.log('🧹 清空测试数据...')
    
    await prisma.productComment.deleteMany({})
    await prisma.productPainPoint.deleteMany({})
    await prisma.productMapping.deleteMany({})
    await prisma.rankingResult.deleteMany({})
    await prisma.videoAnalysis.deleteMany({})
    await prisma.referenceVideo.deleteMany({})
    await prisma.competitorAnalysis.deleteMany({})
    await prisma.templateAnalysis.deleteMany({})
    await prisma.adData.deleteMany({})
    await prisma.video.deleteMany({})
    await prisma.template.deleteMany({})
    await prisma.style.deleteMany({})
    await prisma.product.deleteMany({})
    await prisma.userSubmission.deleteMany({})
    await prisma.commentScrapingTask.deleteMany({})
    
    // 删除除管理员外的所有用户
    await prisma.user.deleteMany({
      where: {
        email: {
          not: 'admin@126.com'
        }
      }
    })
    
    console.log('✅ 测试数据清空完成')

    // 2. 创建真实的管理员账号
    console.log('👤 创建管理员账号...')
    const hashedPassword = await bcrypt.hash('dongnanyaqifei', 10)
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@126.com' },
      update: {},
      create: {
        email: 'admin@126.com',
        name: '管理员',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      }
    })
    console.log(`✅ 管理员账号创建成功: ${adminUser.email}`)

    // 3. 导入真实商品数据
    console.log('📦 导入商品数据...')
    
    const createdProducts = []
    for (const productData of productsData) {
      const product = await prisma.product.create({
        data: {
          name: productData.name,
          description: `高品质${productData.name}，适合${productData.category}类别`,
          category: productData.category,
          subcategory: productData.category === '3C' ? '电子产品' : '美妆护肤',
          sellingPoints: JSON.stringify([
            '高品质保证',
            '性价比高',
            '用户好评',
            '快速发货'
          ]),
          skuImages: JSON.stringify([
            `https://example.com/${productData.name.replace(/\s+/g, '_')}.jpg`
          ]),
          targetCountries: JSON.stringify(['MY', 'SG', 'TH', 'ID']),
          source: 'imported',
          isUserGenerated: false,
          needsReview: false
        }
      })
      createdProducts.push(product)
      console.log(`✅ 商品创建成功: ${product.name}`)
    }

    // 4. 创建一些真实的视频数据用于统计
    console.log('🎬 创建示例视频数据...')
    
    const sampleProducts = createdProducts.slice(0, 5)
    
    // 创建一些模板
    const createdTemplates = []
    for (let i = 0; i < 3; i++) {
      const product = sampleProducts[i % sampleProducts.length]
      const template = await prisma.template.create({
        data: {
          templateId: `template_${Date.now()}_${i}`,
          name: `${product.name}推广模板${i + 1}`,
          description: `为${product.name}设计的推广视频模板`,
          productId: product.id,
          structure: JSON.stringify({
            opening: '产品特写',
            middle: '功能演示',
            ending: '购买引导'
          }),
          hookPool: JSON.stringify([
            '限时优惠',
            '新品上市',
            '用户好评'
          ]),
          videoStylePool: JSON.stringify([
            '现代简约',
            '温馨家居',
            '科技感'
          ]),
          tonePool: JSON.stringify([
            '专业',
            '亲切',
            '活力'
          ]),
          suggestedLength: '15-30秒',
          recommendedCategories: JSON.stringify([product.category]),
          targetCountries: JSON.stringify(['MY', 'SG']),
          templatePrompt: `为${product.name}创建一个吸引人的推广视频`,
          source: 'system',
          isActive: true
        }
      })
      createdTemplates.push(template)
      
      // 为每个模板创建一些视频
      for (let j = 0; j < 2; j++) {
        await prisma.video.create({
          data: {
            templateId: template.id,
            userId: adminUser.id,
            videoTitle: `${product.name}推广视频${j + 1}`,
            videoDescription: `展示${product.name}的优质特性`,
            generatedPrompt: `创建一个展示${product.name}的视频`,
            status: 'generated',
            videoUrl: `https://example.com/video_${Date.now()}_${j}.mp4`
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: '真实数据初始化成功',
      data: {
        adminUser: {
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role
        },
        products: createdProducts.length,
        templates: createdTemplates.length,
        videos: createdTemplates.length * 2
      }
    })

  } catch (error) {
    console.error('❌ 真实数据初始化失败:', error)
    return NextResponse.json(
      { success: false, error: '真实数据初始化失败' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
