const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function initTestStyles() {
  try {
    console.log('开始初始化测试风格数据...')

    // 首先检查是否有商品数据
    const products = await prisma.product.findMany()
    if (products.length === 0) {
      console.log('没有商品数据，先创建测试商品...')
      
      // 创建测试商品
      const testProduct = await prisma.product.create({
        data: {
          name: '测试商品',
          description: '用于测试的商品',
          category: '电子产品',
          subcategory: '手机配件',
          sellingPoints: JSON.stringify(['高质量', '性价比高', '耐用']),
          skuImages: JSON.stringify(['https://example.com/image1.jpg']),
          targetCountries: JSON.stringify(['US', 'UK', 'DE']),
          source: 'manual'
        }
      })
      console.log('创建测试商品:', testProduct.id)
    }

    // 获取第一个商品作为默认关联商品
    const defaultProduct = await prisma.product.findFirst()
    if (!defaultProduct) {
      console.error('无法获取默认商品')
      return
    }

    // 创建测试风格
    const testStyles = [
      {
        templateId: 'TMP001',
        name: '科技感风格',
        description: '适合电子产品的科技感视频风格',
        productId: defaultProduct.id,
        structure: JSON.stringify({
          opening: '产品特写',
          middle: '功能演示',
          ending: '品牌展示'
        }),
        hookPool: JSON.stringify(['科技感', '创新', '未来']),
        videoStylePool: JSON.stringify({
          colorScheme: '蓝色科技风',
          lighting: '明亮清晰',
          cameraAngle: '多角度展示',
          effects: '科技感特效'
        }),
        tonePool: 'professional',
        suggestedLength: '30s',
        recommendedCategories: '电子产品',
        targetCountries: 'US,UK,DE',
        templatePrompt: '科技感产品展示模板',
        isActive: true
      },
      {
        templateId: 'TMP002',
        name: '时尚美妆风格',
        description: '适合美妆护肤产品的时尚风格',
        productId: defaultProduct.id,
        structure: JSON.stringify({
          opening: '模特展示',
          middle: '产品使用',
          ending: '效果对比'
        }),
        hookPool: JSON.stringify(['美丽', '时尚', '自信']),
        videoStylePool: JSON.stringify({
          colorScheme: '粉色温柔风',
          lighting: '柔和自然光',
          cameraAngle: '特写镜头',
          effects: '美颜滤镜'
        }),
        tonePool: 'elegant',
        suggestedLength: '15s',
        recommendedCategories: '美妆护肤',
        targetCountries: 'US,UK,FR',
        templatePrompt: '时尚美妆展示模板',
        isActive: true
      },
      {
        templateId: 'TMP003',
        name: '活力运动风格',
        description: '适合运动产品的活力风格',
        productId: defaultProduct.id,
        structure: JSON.stringify({
          opening: '运动场景',
          middle: '产品使用',
          ending: '运动成果'
        }),
        hookPool: JSON.stringify(['活力', '健康', '运动']),
        videoStylePool: JSON.stringify({
          colorScheme: '橙色活力风',
          lighting: '明亮动感',
          cameraAngle: '动态拍摄',
          effects: '运动特效'
        }),
        tonePool: 'energetic',
        suggestedLength: '20s',
        recommendedCategories: '运动户外',
        targetCountries: 'US,UK,AU',
        templatePrompt: '活力运动展示模板',
        isActive: true
      }
    ]

    // 检查是否已存在测试风格
    const existingStyles = await prisma.template.findMany({
      where: {
        templateId: {
          in: testStyles.map(s => s.templateId)
        }
      }
    })

    if (existingStyles.length > 0) {
      console.log('测试风格已存在，跳过创建')
      return
    }

    // 创建测试风格
    for (const styleData of testStyles) {
      const style = await prisma.template.create({
        data: styleData
      })
      console.log('创建测试风格:', style.name)
    }

    console.log('测试风格数据初始化完成！')

  } catch (error) {
    console.error('初始化测试风格数据失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

initTestStyles()
