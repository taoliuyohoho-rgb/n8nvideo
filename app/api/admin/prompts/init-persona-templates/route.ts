import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


/**
 * 初始化人设生成Prompt模板
 * 根据PRD定义创建5个不同风格的人设生成模板
 */
export async function POST(request: NextRequest) {
  try {
    const personaTemplates = [
      // 1. 北美日常风
      {
        name: '人设生成-北美日常风',
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
- 仅输出人设结构，不输出脚本。
- 语气更口语、生活化；Location 贴近北美城市周边社区；Occupation 偏常见职业（护士、教师、咖啡店经理等）；
- Vibe 强调"务实、体贴、讲效率"；Why 侧重"忙碌的日常让 TA 对 {{sellingPointsTop5}} 的这些点格外敏感"。`,
        variables: JSON.stringify(['productName', 'country', 'targetAudiences', 'sellingPointsTop5', 'painPointsTop5']),
        description: '北美日常风格人设生成模板，贴近生活、轻专家、人设可信度来源=职业/日常痛点',
        isDefault: true,
        createdBy: 'system'
      },
      // 2. 美妆护肤风
      {
        name: '人设生成-美妆护肤风',
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
- 仅输出人设结构，不输出脚本。
- Look 中细化肤质/作息；Vibe 偏温柔、安抚；Context 中加入晨晚护肤节奏；
- Why 侧重"长期稳定使用者视角"，避免宣传功效用语，强调"体验可信"。`,
        variables: JSON.stringify(['productName', 'country', 'targetAudiences', 'sellingPointsTop5', 'painPointsTop5']),
        description: '美妆护肤风格人设生成模板，强调肤质/作息/场景，口吻亲和，真实性优先',
        isDefault: true,
        createdBy: 'system'
      },
      // 3. 健身健康风
      {
        name: '人设生成-健身健康风',
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
- 仅输出人设结构，不输出脚本。
- Context 加入训练/通勤/饮食场景；Vibe 更自律但不严格；
- Why 结合"节省时间/提升坚持度/便携"等与 {{sellingPointsTop5}} 相呼应的可信理由。`,
        variables: JSON.stringify(['productName', 'country', 'targetAudiences', 'sellingPointsTop5', 'painPointsTop5']),
        description: '健身健康风格人设生成模板，注重习惯/饮食/训练场景，强调前后对比"可信"',
        isDefault: true,
        createdBy: 'system'
      },
      // 4. 科技极客风
      {
        name: '人设生成-科技极客风',
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
- 仅输出人设结构，不输出脚本。
- Communication Style 更简洁、数据化；Look 简约；
- Why 强调"效率/设计/一致性/可维护性"类信任来源，避免营销语。`,
        variables: JSON.stringify(['productName', 'country', 'targetAudiences', 'sellingPointsTop5', 'painPointsTop5']),
        description: '科技极客风格人设生成模板，讲究效率/设计/数据，语言更理性与克制',
        isDefault: true,
        createdBy: 'system'
      },
      // 5. 家居实用风
      {
        name: '人设生成-家居实用风',
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
- 仅输出人设结构，不输出脚本。
- Home Environment 更细；Context 融入家庭成员/宠物/收纳；
- Why 强调"减少杂乱/省时/好打理"，与 {{painPointsTop5}} 的家庭痛点贴合。`,
        variables: JSON.stringify(['productName', 'country', 'targetAudiences', 'sellingPointsTop5', 'painPointsTop5']),
        description: '家居实用风格人设生成模板，收纳/清洁/省时，细节与家庭场景结合',
        isDefault: true,
        createdBy: 'system'
      }
    ]

    // 检查是否已存在人设生成模板
    const existingTemplates = await prisma.promptTemplate.findMany({
      where: {
        businessModule: 'persona.generate'
      }
    })

    if (existingTemplates.length > 0) {
      return NextResponse.json({
        success: true,
        message: '人设生成模板已存在',
        count: existingTemplates.length
      })
    }

    // 创建模板
    const createdTemplates = []
    for (const template of personaTemplates) {
      const created = await prisma.promptTemplate.create({
        data: template
      })
      createdTemplates.push(created)
    }

    return NextResponse.json({
      success: true,
      message: '人设生成模板初始化成功',
      templates: createdTemplates.map(t => ({
        id: t.id,
        name: t.name,
        businessModule: t.businessModule
      }))
    })

  } catch (error) {
    console.error('初始化人设生成模板失败:', error)
    return NextResponse.json(
      { success: false, error: '初始化失败' },
      { status: 500 }
    )
  }
}
