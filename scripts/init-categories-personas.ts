/**
 * 初始化类目和默认人设脚本
 * 
 * 功能：
 * 1. 创建品类数据（3C、美妆、个护、厨具）
 * 2. 为马来西亚市场生成默认人设
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 品类配置
const CATEGORIES = [
  {
    name: '3C数码',
    description: '电子产品、数码配件、智能设备等',
    level: 1,
    targetMarket: '马来西亚',
  },
  {
    name: '美妆',
    description: '化妆品、护肤品、美容工具等',
    level: 1,
    targetMarket: '马来西亚',
  },
  {
    name: '个护',
    description: '个人护理、卫生用品、健康产品等',
    level: 1,
    targetMarket: '马来西亚',
  },
  {
    name: '厨具',
    description: '厨房用具、烹饪器具、餐具等',
    level: 1,
    targetMarket: '马来西亚',
  },
]

// 默认人设配置（马来西亚市场）
const DEFAULT_PERSONAS = [
  // 3C数码人设
  {
    categoryName: '3C数码',
    personas: [
      {
        name: '马来科技达人',
        description: '热衷于最新科技产品的年轻专业人士',
        generatedContent: {
          basicInfo: {
            age: '25-35',
            gender: '男性为主',
            occupation: 'IT专业人士、创业者',
            income: '中高收入（RM 5000-10000）',
            location: '吉隆坡、槟城等大城市',
          },
          behavior: {
            purchaseHabits: '喜欢在线购物，关注产品评测和开箱视频，追求性价比和最新技术',
            usageScenarios: '工作、娱乐、社交分享',
            decisionFactors: '性能、品牌口碑、价格、售后服务',
            brandPreference: '国际品牌和高性价比品牌',
          },
          preferences: {
            priceSensitivity: '中等偏低',
            featureNeeds: ['高性能', '创新功能', '良好的用户体验', '长续航'],
            qualityExpectations: '高品质，可靠性强',
            serviceExpectations: '快速配送、良好的售后支持',
          },
          psychology: {
            values: ['创新', '效率', '品质', '社交认同'],
            lifestyle: '快节奏都市生活，注重工作与生活平衡',
            painPoints: ['产品选择困难', '担心买到假货', '配送时间长', '售后服务不佳'],
            motivations: ['提升工作效率', '体验最新技术', '社交分享', '自我提升'],
          },
        },
        aiModel: 'gemini-2.0-flash-exp',
        promptTemplate: 'default-template',
      },
      {
        name: '马来学生群体',
        description: '追求性价比的大学生和年轻群体',
        generatedContent: {
          basicInfo: {
            age: '18-25',
            gender: '不限',
            occupation: '学生、初入职场',
            income: '低收入（RM 1000-3000）',
            location: '各大城市和大学城',
          },
          behavior: {
            purchaseHabits: '价格敏感，喜欢促销和折扣，通过社交媒体了解产品',
            usageScenarios: '学习、娱乐、社交',
            decisionFactors: '价格、性价比、同学推荐',
            brandPreference: '性价比高的品牌',
          },
          preferences: {
            priceSensitivity: '高',
            featureNeeds: ['基本功能完善', '耐用', '时尚外观'],
            qualityExpectations: '中等品质，能满足日常需求',
            serviceExpectations: '价格优惠、便捷配送',
          },
          psychology: {
            values: ['性价比', '实用性', '潮流'],
            lifestyle: '校园生活，社交活跃',
            painPoints: ['预算有限', '选择困难', '担心质量问题'],
            motivations: ['学习需求', '娱乐放松', '社交展示'],
          },
        },
        aiModel: 'gemini-2.0-flash-exp',
        promptTemplate: 'default-template',
      },
    ],
  },
  // 美妆人设
  {
    categoryName: '美妆',
    personas: [
      {
        name: '马来都市丽人',
        description: '注重外表和个人形象的职业女性',
        generatedContent: {
          basicInfo: {
            age: '25-40',
            gender: '女性',
            occupation: '白领、专业人士',
            income: '中高收入（RM 4000-8000）',
            location: '吉隆坡、新山等大城市',
          },
          behavior: {
            purchaseHabits: '定期购买护肤品和化妆品，关注美妆博主推荐，愿意尝试新品',
            usageScenarios: '日常通勤、社交聚会、重要场合',
            decisionFactors: '品牌信誉、产品效果、成分安全、朋友推荐',
            brandPreference: '国际知名品牌和口碑好的品牌',
          },
          preferences: {
            priceSensitivity: '中等',
            featureNeeds: ['保湿补水', '美白提亮', '抗衰老', '防晒'],
            qualityExpectations: '高品质，温和不刺激',
            serviceExpectations: '专业咨询、快速配送、退换货方便',
          },
          psychology: {
            values: ['美丽', '自信', '品质生活'],
            lifestyle: '注重自我护理，追求精致生活',
            painPoints: ['皮肤问题困扰', '产品选择多难抉择', '担心过敏', '价格昂贵'],
            motivations: ['保持年轻', '提升自信', '职场形象', '社交需求'],
          },
        },
        aiModel: 'gemini-2.0-flash-exp',
        promptTemplate: 'default-template',
      },
      {
        name: '马来年轻美妆爱好者',
        description: '喜欢尝试新品的年轻女性',
        generatedContent: {
          basicInfo: {
            age: '18-28',
            gender: '女性',
            occupation: '学生、初入职场',
            income: '中低收入（RM 2000-4000）',
            location: '各大城市',
          },
          behavior: {
            purchaseHabits: '受社交媒体影响大，喜欢跟风购买网红产品，追求新鲜感',
            usageScenarios: '日常妆容、约会、拍照',
            decisionFactors: '价格、颜值、网红推荐、朋友种草',
            brandPreference: '平价品牌、网红品牌',
          },
          preferences: {
            priceSensitivity: '较高',
            featureNeeds: ['多功能', '便携', '高颜值', '持久'],
            qualityExpectations: '中等品质，满足日常需求',
            serviceExpectations: '价格实惠、包装精美、快速配送',
          },
          psychology: {
            values: ['潮流', '个性', '性价比'],
            lifestyle: '活跃在社交媒体，喜欢分享',
            painPoints: ['预算有限', '产品太多不知如何选择', '担心踩雷'],
            motivations: ['变美', '社交展示', '追随潮流'],
          },
        },
        aiModel: 'gemini-2.0-flash-exp',
        promptTemplate: 'default-template',
      },
    ],
  },
  // 个护人设
  {
    categoryName: '个护',
    personas: [
      {
        name: '马来健康生活者',
        description: '注重健康和生活品质的成熟群体',
        generatedContent: {
          basicInfo: {
            age: '30-50',
            gender: '不限',
            occupation: '中产家庭、专业人士',
            income: '中高收入（RM 5000-10000）',
            location: '城市和郊区',
          },
          behavior: {
            purchaseHabits: '注重产品成分和品质，偏好天然无害产品，定期购买',
            usageScenarios: '日常护理、家庭使用',
            decisionFactors: '安全性、品质、品牌信誉、功效',
            brandPreference: '知名品牌、天然有机品牌',
          },
          preferences: {
            priceSensitivity: '中等',
            featureNeeds: ['天然成分', '温和不刺激', '多功能', '家庭装'],
            qualityExpectations: '高品质，安全可靠',
            serviceExpectations: '专业建议、定期优惠、便捷购买',
          },
          psychology: {
            values: ['健康', '家庭', '品质', '安全'],
            lifestyle: '注重健康生活方式，关心家人',
            painPoints: ['担心产品安全性', '选择困难', '价格较高'],
            motivations: ['保护家人健康', '提升生活品质', '预防疾病'],
          },
        },
        aiModel: 'gemini-2.0-flash-exp',
        promptTemplate: 'default-template',
      },
      {
        name: '马来年轻个护用户',
        description: '追求便捷和效果的年轻群体',
        generatedContent: {
          basicInfo: {
            age: '20-35',
            gender: '不限',
            occupation: '上班族、学生',
            income: '中等收入（RM 3000-6000）',
            location: '城市地区',
          },
          behavior: {
            purchaseHabits: '线上购物为主，关注产品评价和推荐，追求便捷',
            usageScenarios: '日常护理、出行携带',
            decisionFactors: '效果、价格、便捷性、包装设计',
            brandPreference: '新兴品牌、高性价比品牌',
          },
          preferences: {
            priceSensitivity: '中等',
            featureNeeds: ['快速见效', '便携', '多功能', '时尚包装'],
            qualityExpectations: '中上品质，效果明显',
            serviceExpectations: '快速配送、良好客服、促销优惠',
          },
          psychology: {
            values: ['效率', '便捷', '个性'],
            lifestyle: '快节奏生活，注重个人形象',
            painPoints: ['时间紧张', '选择困难', '担心效果不佳'],
            motivations: ['提升形象', '解决问题', '便捷生活'],
          },
        },
        aiModel: 'gemini-2.0-flash-exp',
        promptTemplate: 'default-template',
      },
    ],
  },
  // 厨具人设
  {
    categoryName: '厨具',
    personas: [
      {
        name: '马来家庭主妇/主夫',
        description: '注重家庭饮食健康的家庭主力',
        generatedContent: {
          basicInfo: {
            age: '30-50',
            gender: '不限',
            occupation: '家庭主妇/主夫、兼职',
            income: '家庭收入 RM 5000-12000',
            location: '城市和郊区',
          },
          behavior: {
            purchaseHabits: '注重实用性和耐用性，喜欢多功能产品，看重性价比',
            usageScenarios: '日常烹饪、家庭聚餐、节日宴请',
            decisionFactors: '实用性、耐用性、安全性、价格',
            brandPreference: '知名品牌、口碑好的品牌',
          },
          preferences: {
            priceSensitivity: '中等偏高',
            featureNeeds: ['多功能', '易清洁', '耐用', '安全健康'],
            qualityExpectations: '高品质，使用寿命长',
            serviceExpectations: '良好售后、使用指导、合理价格',
          },
          psychology: {
            values: ['家庭', '健康', '实用', '节约'],
            lifestyle: '以家庭为中心，注重饮食健康',
            painPoints: ['厨具质量参差不齐', '清洁麻烦', '价格贵', '担心安全问题'],
            motivations: ['为家人做健康美食', '提升烹饪效率', '享受烹饪乐趣'],
          },
        },
        aiModel: 'gemini-2.0-flash-exp',
        promptTemplate: 'default-template',
      },
      {
        name: '马来年轻料理爱好者',
        description: '喜欢烹饪的年轻群体',
        generatedContent: {
          basicInfo: {
            age: '25-35',
            gender: '不限',
            occupation: '上班族、自由职业者',
            income: '中等收入（RM 4000-8000）',
            location: '城市地区',
          },
          behavior: {
            purchaseHabits: '受社交媒体影响，喜欢尝试新厨具和烹饪方式，追求美观和实用',
            usageScenarios: '日常烹饪、朋友聚会、社交分享',
            decisionFactors: '外观设计、功能性、品牌、社交媒体推荐',
            brandPreference: '设计感强的品牌、网红品牌',
          },
          preferences: {
            priceSensitivity: '中等',
            featureNeeds: ['高颜值', '多功能', '便捷', '适合拍照'],
            qualityExpectations: '中上品质，兼顾实用和美观',
            serviceExpectations: '快速配送、精美包装、售后支持',
          },
          psychology: {
            values: ['创意', '分享', '品质生活'],
            lifestyle: '享受生活，喜欢尝试新事物',
            painPoints: ['厨房空间有限', '清洁费时', '不知如何选择合适厨具'],
            motivations: ['提升烹饪技能', '社交分享', '享受美食', '装饰厨房'],
          },
        },
        aiModel: 'gemini-2.0-flash-exp',
        promptTemplate: 'default-template',
      },
    ],
  },
]

async function main() {
  console.log('开始初始化类目和人设数据...')

  try {
    // 1. 创建类目
    console.log('\n1. 创建品类数据...')
    const categoryMap = new Map<string, string>()

    for (const categoryData of CATEGORIES) {
      // 检查类目是否已存在
      let category = await prisma.category.findFirst({
        where: { name: categoryData.name },
      })

      if (!category) {
        category = await prisma.category.create({
          data: categoryData,
        })
        console.log(`  ✓ 创建类目: ${categoryData.name}`)
      } else {
        console.log(`  - 类目已存在: ${categoryData.name}`)
      }

      categoryMap.set(categoryData.name, category.id)
    }

    // 2. 创建默认人设
    console.log('\n2. 创建默认人设...')
    let totalPersonas = 0

    for (const categoryPersonas of DEFAULT_PERSONAS) {
      const categoryId = categoryMap.get(categoryPersonas.categoryName)
      if (!categoryId) {
        console.log(`  ✗ 未找到类目: ${categoryPersonas.categoryName}`)
        continue
      }

      for (const personaData of categoryPersonas.personas) {
        // 检查人设是否已存在
        const existingPersona = await prisma.persona.findFirst({
          where: {
            name: personaData.name,
            categoryId: categoryId,
          },
        })

        if (!existingPersona) {
          await prisma.persona.create({
            data: {
              name: personaData.name,
              description: personaData.description,
              categoryId: categoryId,
              generatedContent: personaData.generatedContent as any,
              aiModel: personaData.aiModel,
              promptTemplate: personaData.promptTemplate,
              createdBy: 'system',
              isActive: true,
            },
          })
          console.log(`  ✓ 创建人设: ${personaData.name} (${categoryPersonas.categoryName})`)
          totalPersonas++
        } else {
          console.log(`  - 人设已存在: ${personaData.name} (${categoryPersonas.categoryName})`)
        }
      }
    }

    console.log(`\n✅ 初始化完成！`)
    console.log(`   - 类目: ${CATEGORIES.length} 个`)
    console.log(`   - 新增人设: ${totalPersonas} 个`)
  } catch (error) {
    console.error('❌ 初始化失败:', error)
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

