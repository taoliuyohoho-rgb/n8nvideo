import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始种子数据...')

  // 创建示例商品
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: '无线蓝牙耳机',
        description: '高品质无线蓝牙耳机，降噪功能强大',
        category: '电子产品',
        subcategory: '音频设备',
        sellingPoints: JSON.stringify([
          '主动降噪技术',
          '30小时续航',
          '快速充电',
          '防水设计'
        ]),
        skuImages: JSON.stringify([
          'https://example.com/earphone1.jpg',
          'https://example.com/earphone2.jpg'
        ]),
        targetCountries: JSON.stringify(['US', 'UK', 'DE', 'JP'])
      }
    }),
    prisma.product.create({
      data: {
        name: '智能手表',
        description: '多功能智能手表，健康监测专家',
        category: '电子产品',
        subcategory: '可穿戴设备',
        sellingPoints: JSON.stringify([
          '24小时心率监测',
          '睡眠质量分析',
          '运动模式追踪',
          '防水设计'
        ]),
        skuImages: JSON.stringify([
          'https://example.com/watch1.jpg',
          'https://example.com/watch2.jpg'
        ]),
        targetCountries: JSON.stringify(['US', 'CA', 'AU'])
      }
    }),
    prisma.product.create({
      data: {
        name: '护肤精华液',
        description: '抗衰老护肤精华，天然成分',
        category: '美妆护肤',
        subcategory: '面部护理',
        sellingPoints: JSON.stringify([
          '天然植物提取',
          '抗衰老功效',
          '敏感肌适用',
          '无添加防腐剂'
        ]),
        skuImages: JSON.stringify([
          'https://example.com/serum1.jpg',
          'https://example.com/serum2.jpg'
        ]),
        targetCountries: JSON.stringify(['US', 'UK', 'FR', 'JP', 'KR'])
      }
    })
  ])

  console.log('创建了', products.length, '个商品')

  // 创建示例风格 - 暂时注释掉，因为 schema 中没有 style 模型
  /*
  const styles = await Promise.all([
    prisma.style.create({
      data: {
        name: '科技感风格',
        description: '适合电子产品的科技感视频风格',
        category: '电子产品',
        subcategory: '科技',
        tone: 'professional',
        scriptStructure: JSON.stringify({
          opening: '产品特写',
          middle: '功能演示',
          ending: '品牌展示'
        }),
        visualStyle: JSON.stringify({
          colorScheme: '蓝色科技风',
          lighting: '明亮清晰',
          cameraAngle: '多角度展示',
          effects: '科技感特效'
        }),
        targetAudience: JSON.stringify({
          age: '25-45',
          gender: 'all',
          interests: ['科技', '电子产品']
        }),
        sourceVideo: 'https://example.com/tech-style-video.mp4'
      }
    }),
    prisma.style.create({
      data: {
        name: '时尚美妆风格',
        description: '适合美妆护肤产品的时尚风格',
        category: '美妆护肤',
        subcategory: '时尚',
        tone: 'elegant',
        scriptStructure: JSON.stringify({
          opening: '模特展示',
          middle: '产品使用',
          ending: '效果对比'
        }),
        visualStyle: JSON.stringify({
          colorScheme: '粉色温柔风',
          lighting: '柔和自然光',
          cameraAngle: '特写镜头',
          effects: '美颜滤镜'
        }),
        targetAudience: JSON.stringify({
          age: '18-35',
          gender: 'female',
          interests: ['美妆', '护肤', '时尚']
        }),
        sourceVideo: 'https://example.com/beauty-style-video.mp4'
      }
    }),
    prisma.style.create({
      data: {
        name: '活力运动风格',
        description: '适合运动产品的活力风格',
        category: '运动健身',
        subcategory: '活力',
        tone: 'energetic',
        scriptStructure: JSON.stringify({
          opening: '运动场景',
          middle: '产品使用',
          ending: '运动成果'
        }),
        visualStyle: JSON.stringify({
          colorScheme: '橙色活力风',
          lighting: '明亮动感',
          cameraAngle: '动态拍摄',
          effects: '运动特效'
        }),
        targetAudience: JSON.stringify({
          age: '20-40',
          gender: 'all',
          interests: ['运动', '健身', '户外']
        }),
        sourceVideo: 'https://example.com/sports-style-video.mp4'
      }
    })
  ])

  console.log('创建了', styles.length, '个风格')
  */

  // 创建示例竞品分析
  const competitors = await Promise.all([
    prisma.competitorAnalysis.create({
      data: {
        url: 'https://example.com/competitor1',
        platform: 'tiktok',
        title: '竞品蓝牙耳机',
        description: '高性能降噪蓝牙耳机',
        thumbnail: 'https://example.com/thumbnail1.jpg',
        productName: '竞品蓝牙耳机',
        sellingPoints: JSON.stringify([
          '音质清晰',
          '续航持久',
          '舒适佩戴'
        ]),
        marketingInfo: JSON.stringify({
          price: '$99',
          promotion: '限时优惠20%',
          features: ['降噪', '防水']
        }),
        targetAudience: JSON.stringify({
          age: '25-40',
          gender: 'all',
          interests: ['音乐', '科技']
        })
      }
    })
  ])

  console.log('创建了', competitors.length, '个竞品分析')

  console.log('种子数据完成！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
