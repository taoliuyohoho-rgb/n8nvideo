const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('初始化人设生成Prompt模板...')

  // 默认人设生成Prompt
  const defaultPrompt = await prisma.promptTemplate.upsert({
    where: {
      id: 'persona-generation-default-v1'
    },
    update: {},
    create: {
      id: 'persona-generation-default-v1',
      name: '人设生成-标准模板',
      businessModule: 'persona-generation',
      content: `你是一个专业的用户研究专家。请根据以下信息，生成一个详细的用户人设。

类目：{{category}}
目标市场：{{targetMarket}}
商品信息：{{productInfo}}
用户描述：{{textDescription}}

请生成包含以下结构的JSON格式人设：
{
  "coreIdentity": {
    "name": "人设姓名",
    "age": 25,
    "gender": "女",
    "occupation": "职业",
    "location": "地区"
  },
  "look": {
    "generalAppearance": "整体外观描述",
    "hair": "发型描述",
    "clothingAesthetic": "服装风格",
    "signatureDetails": "标志性细节"
  },
  "vibe": {
    "traits": ["性格特质1", "性格特质2", "性格特质3"],
    "demeanor": "整体气质",
    "communicationStyle": "沟通风格"
  },
  "context": {
    "hobbies": "兴趣爱好",
    "values": "价值观",
    "frustrations": "痛点困扰",
    "homeEnvironment": "生活环境"
  },
  "why": "为什么这个人设适合这个商品的可信度理由"
}

要求：
1. 人设要真实可信，符合当地市场特征
2. 所有字段都要填写具体内容，不要使用占位符
3. 数组字段至少包含2-3个元素
4. 确保返回的是有效的JSON格式`,
      variables: 'category,targetMarket,productInfo,textDescription',
      description: '标准人设生成模板，适用于大多数商品类目',
      isActive: true,
      isDefault: true
    }
  })
  console.log(`✅ 创建默认人设生成Prompt: ${defaultPrompt.name}`)

  // 快速人设生成Prompt
  const quickPrompt = await prisma.promptTemplate.upsert({
    where: {
      id: 'persona-generation-quick-v1'
    },
    update: {},
    create: {
      id: 'persona-generation-quick-v1',
      name: '人设生成-快速版',
      businessModule: 'persona-generation',
      content: `快速生成用户人设，基于商品类目和基本信息。

类目：{{category}}
商品：{{productInfo}}
描述：{{textDescription}}

生成简洁的人设JSON：
{
  "coreIdentity": {
    "name": "姓名",
    "age": 28,
    "gender": "性别",
    "occupation": "职业",
    "location": "地区"
  },
  "look": {
    "generalAppearance": "外观",
    "hair": "发型",
    "clothingAesthetic": "服装",
    "signatureDetails": "细节"
  },
  "vibe": {
    "traits": ["特质1", "特质2"],
    "demeanor": "气质",
    "communicationStyle": "沟通"
  },
  "context": {
    "hobbies": "爱好",
    "values": "价值观",
    "frustrations": "痛点",
    "homeEnvironment": "环境"
  },
  "why": "适合理由"
}

直接返回JSON，简洁明了。`,
      variables: 'category,productInfo,textDescription',
      description: '快速人设生成模板，适合快速测试',
      isActive: true,
      isDefault: false
    }
  })
  console.log(`✅ 创建快速人设生成Prompt: ${quickPrompt.name}`)

  console.log('\n✅ 人设生成Prompt模板初始化完成！')
  console.log(`默认模板: ${defaultPrompt.name}`)
  console.log(`快速模板: ${quickPrompt.name}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
