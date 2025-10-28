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

  // 创建示例人设（Personas）
  const personas = await Promise.all([
    prisma.persona.create({
      data: {
        productId: products[0].id, // 无线蓝牙耳机
        version: 1,
        coreIdentity: {
          name: 'Sarah Chen',
          age: 28,
          gender: 'female',
          location: 'San Francisco, CA - A trendy tech hub neighborhood',
          occupation: 'UX Designer at a mid-sized startup'
        },
        look: {
          generalAppearance: 'Modern, approachable professional with an artistic edge. Fit build from regular yoga and walking meetings.',
          hair: 'Shoulder-length black hair, often in a sleek ponytail or loose waves',
          clothingAesthetic: 'Tech-minimalist chic: neutral tones, quality basics from Everlane and Uniqlo, occasional statement jewelry',
          signatureDetails: 'Always wearing small gold hoop earrings and a simple leather tote bag'
        },
        vibe: {
          traits: ['Pragmatic', 'Creative', 'Detail-oriented', 'Thoughtful', 'Efficient', 'Slightly introverted'],
          demeanor: 'Calm and composed, speaks deliberately, warm smile when discussing things she loves',
          communicationStyle: 'Clear and concise, like explaining a design concept to a colleague. Uses "honestly" and "I found that..." frequently'
        },
        context: {
          hobbies: 'Listening to design podcasts during commute, weekend farmers market visits, trying new coffee shops for laptop work',
          values: 'Values quality over quantity, seeks products that simplify daily routines, believes in thoughtful design',
          frustrations: 'Tangled wires, products that break easily, dealing with poor audio quality during video calls, wasting time on unreliable tech',
          homeEnvironment: 'Minimalist studio apartment with plants, natural light, clean lines, organized workspace with Apple products'
        },
        why: 'As a UX designer who spends hours in video calls and values both form and function, her endorsement of audio products carries weight with fellow professionals seeking quality tech.',
        createdBy: 'system',
        modelUsed: {
          provider: 'OpenAI',
          model: 'gpt-4o-latest'
        }
      }
    }),
    prisma.persona.create({
      data: {
        productId: products[1].id, // 智能手表
        version: 1,
        coreIdentity: {
          name: 'Marcus Johnson',
          age: 34,
          gender: 'male',
          location: 'Austin, TX - Active lifestyle community near hiking trails',
          occupation: 'Personal Trainer and Fitness Content Creator'
        },
        look: {
          generalAppearance: 'Athletic build, energetic presence, sun-kissed complexion from outdoor workouts',
          hair: 'Short, neat fade haircut, well-groomed beard',
          clothingAesthetic: 'Performance athleisure: Nike, Lululemon, Under Armour. Always ready for a workout.',
          signatureDetails: 'Visible tan lines from fitness tracker, protein shaker bottle always nearby'
        },
        vibe: {
          traits: ['Motivating', 'Data-driven', 'Enthusiastic', 'Disciplined', 'Health-conscious', 'Goal-oriented', 'Approachable'],
          demeanor: 'High energy but not overwhelming, genuinely excited about fitness tech and helping others',
          communicationStyle: 'Talks like a friend who's passionate about helping you reach your goals. Uses phrases like "game-changer," "track your progress," "consistency is key"'
        },
        context: {
          hobbies: 'Morning trail runs, meal prep Sundays, recording workout tutorials, reading about exercise science',
          values: 'Believes in data-driven fitness, values accurate health tracking, prioritizes recovery and sleep quality',
          frustrations: 'Inaccurate fitness data, devices that don\'t sync properly, short battery life during long workouts, complicated interfaces',
          homeEnvironment: 'Organized home gym setup, meal prep containers lined up in fridge, charging station for all devices, fitness magazines on coffee table'
        },
        why: 'As a fitness professional who relies on accurate health data for both personal training and content creation, his recommendation of fitness wearables is trusted by an audience seeking reliable workout companions.',
        createdBy: 'system',
        modelUsed: {
          provider: 'OpenAI',
          model: 'gpt-4o-latest'
        }
      }
    }),
    prisma.persona.create({
      data: {
        productId: products[2].id, // 护肤精华液
        version: 1,
        coreIdentity: {
          name: 'Emily Park',
          age: 31,
          gender: 'female',
          location: 'Los Angeles, CA - Health-conscious, beauty-focused neighborhood',
          occupation: 'Licensed Esthetician and Skincare Consultant'
        },
        look: {
          generalAppearance: 'Radiant, glowing skin (her best advertisement), healthy and well-rested appearance',
          hair: 'Long, glossy brown hair with subtle highlights, always looks nourished',
          clothingAesthetic: 'Clean, soft feminine style: flowing fabrics, neutral colors, natural fibers. Looks effortlessly put together.',
          signatureDetails: 'Dewy, natural makeup look, always carries a facial mist in her bag, wears SPF daily'
        },
        vibe: {
          traits: ['Knowledgeable', 'Gentle', 'Patient', 'Trustworthy', 'Detail-oriented', 'Passionate about skincare'],
          demeanor: 'Soft-spoken but confident, nurturing energy, genuinely cares about skin health over trends',
          communicationStyle: 'Speaks like a caring expert friend who wants to share a secret. Uses phrases like "your skin will thank you," "I tell all my clients," "the key is consistency"'
        },
        context: {
          hobbies: 'Reading ingredient labels for fun, trying new clean beauty products, Sunday self-care rituals, following skincare science accounts',
          values: 'Believes in ingredient transparency, values sustainable packaging, prioritizes skin health over quick fixes, educated consumer choices',
          frustrations: 'Misleading marketing claims, harsh ingredients, products that promise overnight miracles, wasteful packaging, overpriced items with cheap formulations',
          homeEnvironment: 'Organized bathroom with labeled skincare routine, natural light for application, humidifier running, clean white aesthetic with plants'
        },
        why: 'As a licensed esthetician with professional training and daily client consultations, her recommendation of skincare products carries authority with an audience seeking expert-validated solutions for their skin concerns.',
        createdBy: 'system',
        modelUsed: {
          provider: 'OpenAI',
          model: 'gpt-4o-latest'
        }
      }
    })
  ])

  console.log('创建了', personas.length, '个人设模板')

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
