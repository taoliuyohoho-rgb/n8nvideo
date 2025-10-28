const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const personaTemplates = [
  {
    name: '基础人设生成模版',
    businessModule: 'persona.generate',
    content: `// ROLE & GOAL
你是一名 Casting Director 与 Consumer Psychologist，专注理解人与产品的真实连接。仅输出"理想 UGC 创作者人设"，不要写广告脚本或金句。

// INPUT
Product Name: {{productName}}
Country/Market: {{country}}
Target Audiences: {{targetAudiences}}
Top-5 Selling Points: {{sellingPointsTop5}}
Top-5 Pain Points: {{painPointsTop5}}

// REQUIRED OUTPUT STRUCTURE
I. Core Identity
- Name:
- Age: (具体数字)
- Sex/Gender:
- Location: (贴合 {{country}} 的真实生活环境描述)
- Occupation: (具体到工种/场景)

II. Physical Appearance & Personal Style (The "Look")
- General Appearance:
- Hair:
- Clothing Aesthetic:
- Signature Details:

III. Personality & Communication (The "Vibe")
- Key Personality Traits (5-7 个形容词):
- Demeanor & Energy Level:
- Communication Style:

IV. Lifestyle & Worldview (The "Context")
- Hobbies & Interests:
- Values & Priorities:
- Daily Frustrations / Pain Points: (与 {{painPointsTop5}} 呼应但不直说产品)
- Home Environment:

V. The "Why" (Persona Justification)
- Core Credibility: (1-2 句，说明为什么 TA 对该品类可信；可引用 {{sellingPointsTop5}} 的"为何在意"角度)

// RULES
- 严禁臆造品牌与功能；缺证据则留空或用更通用且可信的表述。
- 仅输出人设结构，不输出脚本。`,
    variables: 'productName,country,targetAudiences,sellingPointsTop5,painPointsTop5',
    description: '基础人设生成模版，适用于所有商品类型',
    isDefault: true,
    isActive: true,
  },
  {
    name: '北美日常风人设模版',
    businessModule: 'persona.generate',
    content: `在基础模版基础上，语气更口语、生活化；Location 贴近北美城市周边社区；Occupation 偏常见职业（护士、教师、咖啡店经理等）；
Vibe 强调"务实、体贴、讲效率"；Why 侧重"忙碌的日常让 TA 对 {{sellingPointsTop5}} 的这些点格外敏感"。

具体调整：
- 语言风格：更口语化，使用"you guys"、"honestly"等表达
- 生活场景：通勤、超市购物、周末家庭时间
- 可信度来源：日常使用经验、时间效率需求、性价比考量`,
    variables: 'productName,country,targetAudiences,sellingPointsTop5,painPointsTop5',
    description: '适合北美市场的日常消费品人设模版',
    isDefault: false,
    isActive: true,
  },
  {
    name: '美妆护肤风人设模版',
    businessModule: 'persona.generate',
    content: `在基础模版基础上，Look 中细化肤质/作息；Vibe 偏温柔、安抚；Context 中加入晨晚护肤节奏；
Why 侧重"长期稳定使用者视角"，避免宣传功效用语，强调"体验可信"。

具体调整：
- 外观细节：强调肤质类型、护肤习惯、妆容风格
- 生活方式：晨间/晚间护肤流程、产品试用习惯
- 可信度来源：个人使用体验、肤质匹配度、成分安全性`,
    variables: 'productName,country,targetAudiences,sellingPointsTop5,painPointsTop5',
    description: '适合美妆护肤类产品的人设模版',
    isDefault: false,
    isActive: true,
  },
  {
    name: '健身健康风人设模版',
    businessModule: 'persona.generate',
    content: `在基础模版基础上，Context 加入训练/通勤/饮食场景；Vibe 更自律但不严格；
Why 结合"节省时间/提升坚持度/便携"等与 {{sellingPointsTop5}} 相呼应的可信理由。

具体调整：
- 生活方式：训练计划、饮食控制、健康监测
- 价值观：效率、坚持、自我提升
- 可信度来源：实际使用效果、便利性、科学依据`,
    variables: 'productName,country,targetAudiences,sellingPointsTop5,painPointsTop5',
    description: '适合健身健康类产品的人设模版',
    isDefault: false,
    isActive: true,
  },
  {
    name: '科技极客风人设模版',
    businessModule: 'persona.generate',
    content: `在基础模版基础上，Communication Style 更简洁、数据化；Look 简约；
Why 强调"效率/设计/一致性/可维护性"类信任来源，避免营销语。

具体调整：
- 沟通风格：技术术语、数据驱动、逻辑清晰
- 外观：简约、功能性、品牌偏好
- 可信度来源：技术理解、使用效率、产品设计`,
    variables: 'productName,country,targetAudiences,sellingPointsTop5,painPointsTop5',
    description: '适合科技数码类产品的人设模版',
    isDefault: false,
    isActive: true,
  },
  {
    name: '家居实用风人设模版',
    businessModule: 'persona.generate',
    content: `在基础模版基础上，Home Environment 更细；Context 融入家庭成员/宠物/收纳；
Why 强调"减少杂乱/省时/好打理"，与 {{painPointsTop5}} 的家庭痛点贴合。

具体调整：
- 家庭环境：收纳系统、清洁习惯、空间利用
- 生活方式：家庭管理、时间安排、实用主义
- 可信度来源：实际使用场景、家庭需求、维护便利性`,
    variables: 'productName,country,targetAudiences,sellingPointsTop5,painPointsTop5',
    description: '适合家居生活类产品的人设模版',
    isDefault: false,
    isActive: true,
  },
];

async function initPersonaTemplates() {
  try {
    console.log('开始初始化人设生成 Prompt 模版...');

    for (const template of personaTemplates) {
      const existing = await prisma.promptTemplate.findFirst({
        where: {
          name: template.name,
          businessModule: template.businessModule,
        },
      });

      if (existing) {
        console.log(`模版 "${template.name}" 已存在，跳过`);
        continue;
      }

      await prisma.promptTemplate.create({
        data: template,
      });

      console.log(`已创建模版: ${template.name}`);
    }

    console.log('人设生成 Prompt 模版初始化完成！');
  } catch (error) {
    console.error('初始化人设模版失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  initPersonaTemplates();
}

module.exports = { initPersonaTemplates };
