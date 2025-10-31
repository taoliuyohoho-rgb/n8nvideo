#!/usr/bin/env tsx
/**
 * 种子脚本：为美妆、个护、厨具、大健康、图书类目创建 video-prompt 模板
 * 每个类目 5 个角度：unboxing, feature_demo, problem_solution（替代benchmark）, creator_pov, before_after（替代benchmark）
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 美妆类目模板
const beautyTemplates = [
  {
    id: 'Beauty-UGC-Unboxing-15s',
    name: 'Beauty-UGC-Unboxing-15s',
    businessModule: 'video-prompt',
    description: '美妆开箱：展示包装、质地、试色',
    content: `Task: Generate a 15s UGC unboxing ad for {{productName}}.
Instruction language: {{instructionLang}}. Voiceover/screen text: {{voiceoverLang}}.

Persona: {{personaName}}, beauty enthusiast.

Hook ({{voiceoverLang}}): {{script_open}}
Main ({{voiceoverLang}}): {{script_main}}
Close ({{voiceoverLang}}): {{script_close}}

Shots:
{{shots_list}}

Technical: {{tech_orientation}}, natural lighting, close-up texture shots, soft focus on skin.
Platform: 9:16 vertical, clear product visibility, captions in {{screenTextLang}}.

Do not translate quoted dialogue; keep it exactly as provided.`,
    variables: 'productName,personaName,instructionLang,voiceoverLang,screenTextLang,script_open,script_main,script_close,shots_list,tech_orientation',
    isActive: true,
    isDefault: false,
    performance: 0.85,
    usageCount: 0,
    successRate: 0.9
  },
  {
    id: 'Beauty-UGC-FeatureDemo-15s',
    name: 'Beauty-UGC-FeatureDemo-15s',
    businessModule: 'video-prompt',
    description: '美妆功效演示：上妆过程、持妆效果',
    content: `Task: Generate a 15s UGC feature demo ad for {{productName}}.
Instruction language: {{instructionLang}}. Voiceover/screen text: {{voiceoverLang}}.

Hook ({{voiceoverLang}}): {{script_open}}
Main ({{voiceoverLang}}): {{script_main}}
Close ({{voiceoverLang}}): {{script_close}}

Shots:
{{shots_list}}

Technical: {{tech_orientation}}, ring light, mirror shot, before/after split if applicable.
Platform: 9:16 vertical, face clearly visible, captions in {{screenTextLang}}.

Do not translate quoted dialogue; keep it exactly as provided.`,
    variables: 'productName,instructionLang,voiceoverLang,screenTextLang,script_open,script_main,script_close,shots_list,tech_orientation',
    isActive: true,
    isDefault: false,
    performance: 0.88,
    usageCount: 0,
    successRate: 0.92
  },
  {
    id: 'Beauty-UGC-ProblemSolution-15s',
    name: 'Beauty-UGC-ProblemSolution-15s',
    businessModule: 'video-prompt',
    description: '美妆痛点解决：针对肤质问题、上妆困扰',
    content: `Task: Generate a 15s UGC problem-solution ad for {{productName}}.
Instruction language: {{instructionLang}}. Voiceover/screen text: {{voiceoverLang}}.

Hook ({{voiceoverLang}}): {{script_open}}
Main ({{voiceoverLang}}): {{script_main}}
Close ({{voiceoverLang}}): {{script_close}}

Shots:
{{shots_list}}

Technical: {{tech_orientation}}, natural lighting, close-up on skin texture, emotional expressions.
Platform: 9:16 vertical, relatable scenarios, captions in {{screenTextLang}}.

Do not translate quoted dialogue; keep it exactly as provided.`,
    variables: 'productName,instructionLang,voiceoverLang,screenTextLang,script_open,script_main,script_close,shots_list,tech_orientation',
    isActive: true,
    isDefault: false,
    performance: 0.86,
    usageCount: 0,
    successRate: 0.91
  },
  {
    id: 'Beauty-UGC-CreatorPOV-15s',
    name: 'Beauty-UGC-CreatorPOV-15s',
    businessModule: 'video-prompt',
    description: '美妆博主视角：分享使用心得、搭配技巧',
    content: `Task: Generate a 15s UGC creator POV ad for {{productName}}.
Instruction language: {{instructionLang}}. Voiceover/screen text: {{voiceoverLang}}.

Persona: {{personaName}}, beauty content creator sharing honest review.

Hook ({{voiceoverLang}}): {{script_open}}
Main ({{voiceoverLang}}): {{script_main}}
Close ({{voiceoverLang}}): {{script_close}}

Shots:
{{shots_list}}

Technical: {{tech_orientation}}, vlog style, handheld casual, direct eye contact with camera.
Platform: 9:16 vertical, authentic feel, captions in {{screenTextLang}}.

Do not translate quoted dialogue; keep it exactly as provided.`,
    variables: 'productName,personaName,instructionLang,voiceoverLang,screenTextLang,script_open,script_main,script_close,shots_list,tech_orientation',
    isActive: true,
    isDefault: false,
    performance: 0.87,
    usageCount: 0,
    successRate: 0.93
  },
  {
    id: 'Beauty-UGC-BeforeAfter-15s',
    name: 'Beauty-UGC-BeforeAfter-15s',
    businessModule: 'video-prompt',
    description: '美妆前后对比：使用前后效果对比',
    content: `Task: Generate a 15s UGC before/after comparison ad for {{productName}}.
Instruction language: {{instructionLang}}. Voiceover/screen text: {{voiceoverLang}}.

Hook ({{voiceoverLang}}): {{script_open}}
Main ({{voiceoverLang}}): {{script_main}}
Close ({{voiceoverLang}}): {{script_close}}

Shots:
{{shots_list}}

Technical: {{tech_orientation}}, split screen or side-by-side comparison, consistent lighting.
Platform: 9:16 vertical, clear before/after labels, captions in {{screenTextLang}}.

Do not translate quoted dialogue; keep it exactly as provided.`,
    variables: 'productName,instructionLang,voiceoverLang,screenTextLang,script_open,script_main,script_close,shots_list,tech_orientation',
    isActive: true,
    isDefault: false,
    performance: 0.89,
    usageCount: 0,
    successRate: 0.94
  }
]

// 个护类目模板（沿用美妆结构，调整场景）
const personalCareTemplates = beautyTemplates.map(t => ({
  ...t,
  id: t.id.replace('Beauty', 'PersonalCare'),
  name: t.name.replace('Beauty', 'PersonalCare'),
  description: t.description.replace('美妆', '个护')
}))

// 厨具类目模板
const kitchenTemplates = [
  {
    id: 'Kitchen-UGC-Unboxing-15s',
    name: 'Kitchen-UGC-Unboxing-15s',
    businessModule: 'video-prompt',
    description: '厨具开箱：展示包装、配件、做工',
    content: `Task: Generate a 15s UGC unboxing ad for {{productName}}.
Instruction language: {{instructionLang}}. Voiceover/screen text: {{voiceoverLang}}.

Hook ({{voiceoverLang}}): {{script_open}}
Main ({{voiceoverLang}}): {{script_main}}
Close ({{voiceoverLang}}): {{script_close}}

Shots:
{{shots_list}}

Technical: {{tech_orientation}}, overhead kitchen shots, hands-on demo, natural home lighting.
Platform: 9:16 vertical, product details visible, captions in {{screenTextLang}}.

Do not translate quoted dialogue; keep it exactly as provided.`,
    variables: 'productName,instructionLang,voiceoverLang,screenTextLang,script_open,script_main,script_close,shots_list,tech_orientation',
    isActive: true,
    isDefault: false
  },
  {
    id: 'Kitchen-UGC-FeatureDemo-15s',
    name: 'Kitchen-UGC-FeatureDemo-15s',
    businessModule: 'video-prompt',
    description: '厨具功能演示：烹饪过程、操作便捷性',
    content: `Task: Generate a 15s UGC cooking demo ad for {{productName}}.
Instruction language: {{instructionLang}}. Voiceover/screen text: {{voiceoverLang}}.

Hook ({{voiceoverLang}}): {{script_open}}
Main ({{voiceoverLang}}): {{script_main}}
Close ({{voiceoverLang}}): {{script_close}}

Shots:
{{shots_list}}

Technical: {{tech_orientation}}, overhead + side angle, sizzling sounds, steam and motion.
Platform: 9:16 vertical, food appeal, safe handling visible, captions in {{screenTextLang}}.

Do not translate quoted dialogue; keep it exactly as provided.`,
    variables: 'productName,instructionLang,voiceoverLang,screenTextLang,script_open,script_main,script_close,shots_list,tech_orientation',
    isActive: true,
    isDefault: false
  },
  {
    id: 'Kitchen-UGC-ProblemSolution-15s',
    name: 'Kitchen-UGC-ProblemSolution-15s',
    businessModule: 'video-prompt',
    description: '厨具痛点解决：省时、易清洗、收纳',
    content: `Task: Generate a 15s UGC problem-solution ad for {{productName}}.
Instruction language: {{instructionLang}}. Voiceover/screen text: {{voiceoverLang}}.

Hook ({{voiceoverLang}}): {{script_open}}
Main ({{voiceoverLang}}): {{script_main}}
Close ({{voiceoverLang}}): {{script_close}}

Shots:
{{shots_list}}

Technical: {{tech_orientation}}, real kitchen mess → clean solution, relatable home setting.
Platform: 9:16 vertical, before/after clarity, captions in {{screenTextLang}}.

Do not translate quoted dialogue; keep it exactly as provided.`,
    variables: 'productName,instructionLang,voiceoverLang,screenTextLang,script_open,script_main,script_close,shots_list,tech_orientation',
    isActive: true,
    isDefault: false
  },
  {
    id: 'Kitchen-UGC-CreatorPOV-Recipe-15s',
    name: 'Kitchen-UGC-CreatorPOV-Recipe-15s',
    businessModule: 'video-prompt',
    description: '厨具博主视角：食谱分享、烹饪技巧',
    content: `Task: Generate a 15s UGC recipe tutorial ad for {{productName}}.
Instruction language: {{instructionLang}}. Voiceover/screen text: {{voiceoverLang}}.

Persona: {{personaName}}, home cook sharing quick recipe.

Hook ({{voiceoverLang}}): {{script_open}}
Main ({{voiceoverLang}}): {{script_main}}
Close ({{voiceoverLang}}): {{script_close}}

Shots:
{{shots_list}}

Technical: {{tech_orientation}}, fast-paced cooking montage, appetizing final shot.
Platform: 9:16 vertical, recipe steps clear, captions in {{screenTextLang}}.

Do not translate quoted dialogue; keep it exactly as provided.`,
    variables: 'productName,personaName,instructionLang,voiceoverLang,screenTextLang,script_open,script_main,script_close,shots_list,tech_orientation',
    isActive: true,
    isDefault: false
  },
  {
    id: 'Kitchen-UGC-TimeSaver-15s',
    name: 'Kitchen-UGC-TimeSaver-15s',
    businessModule: 'video-prompt',
    description: '厨具省时对比：传统方式 vs 新工具',
    content: `Task: Generate a 15s UGC time-saving comparison ad for {{productName}}.
Instruction language: {{instructionLang}}. Voiceover/screen text: {{voiceoverLang}}.

Hook ({{voiceoverLang}}): {{script_open}}
Main ({{voiceoverLang}}): {{script_main}}
Close ({{voiceoverLang}}): {{script_close}}

Shots:
{{shots_list}}

Technical: {{tech_orientation}}, split screen timing, clock overlay, busy parent appeal.
Platform: 9:16 vertical, time stamps visible, captions in {{screenTextLang}}.

Do not translate quoted dialogue; keep it exactly as provided.`,
    variables: 'productName,instructionLang,voiceoverLang,screenTextLang,script_open,script_main,script_close,shots_list,tech_orientation',
    isActive: true,
    isDefault: false
  }
]

// 大健康类目模板
const healthTemplates = [
  {
    id: 'Health-UGC-Unboxing-15s',
    name: 'Health-UGC-Unboxing-15s',
    businessModule: 'video-prompt',
    description: '健康产品开箱：展示包装、成分、认证',
    content: `Task: Generate a 15s UGC unboxing ad for {{productName}}.
Instruction language: {{instructionLang}}. Voiceover/screen text: {{voiceoverLang}}.

Hook ({{voiceoverLang}}): {{script_open}}
Main ({{voiceoverLang}}): {{script_main}}
Close ({{voiceoverLang}}): {{script_close}}

Shots:
{{shots_list}}

Technical: {{tech_orientation}}, clean background, ingredient label close-ups, trust signals.
Platform: 9:16 vertical, certifications visible, captions in {{screenTextLang}}.

Do not translate quoted dialogue; keep it exactly as provided.`,
    variables: 'productName,instructionLang,voiceoverLang,screenTextLang,script_open,script_main,script_close,shots_list,tech_orientation',
    isActive: true,
    isDefault: false
  },
  {
    id: 'Health-UGC-FeatureDemo-DailyUse-15s',
    name: 'Health-UGC-FeatureDemo-DailyUse-15s',
    businessModule: 'video-prompt',
    description: '健康产品日常使用：服用方式、场景',
    content: `Task: Generate a 15s UGC daily routine ad for {{productName}}.
Instruction language: {{instructionLang}}. Voiceover/screen text: {{voiceoverLang}}.

Hook ({{voiceoverLang}}): {{script_open}}
Main ({{voiceoverLang}}): {{script_main}}
Close ({{voiceoverLang}}): {{script_close}}

Shots:
{{shots_list}}

Technical: {{tech_orientation}}, morning routine, active lifestyle shots, uplifting mood.
Platform: 9:16 vertical, wellness aesthetic, captions in {{screenTextLang}}.

Do not translate quoted dialogue; keep it exactly as provided.`,
    variables: 'productName,instructionLang,voiceoverLang,screenTextLang,script_open,script_main,script_close,shots_list,tech_orientation',
    isActive: true,
    isDefault: false
  },
  {
    id: 'Health-UGC-ProblemSolution-15s',
    name: 'Health-UGC-ProblemSolution-15s',
    businessModule: 'video-prompt',
    description: '健康痛点解决：疲劳、免疫、睡眠',
    content: `Task: Generate a 15s UGC wellness solution ad for {{productName}}.
Instruction language: {{instructionLang}}. Voiceover/screen text: {{voiceoverLang}}.

Hook ({{voiceoverLang}}): {{script_open}}
Main ({{voiceoverLang}}): {{script_main}}
Close ({{voiceoverLang}}): {{script_close}}

Shots:
{{shots_list}}

Technical: {{tech_orientation}}, tired → energized transformation, natural light, real scenarios.
Platform: 9:16 vertical, health disclaimers if needed, captions in {{screenTextLang}}.

Do not translate quoted dialogue; keep it exactly as provided.`,
    variables: 'productName,instructionLang,voiceoverLang,screenTextLang,script_open,script_main,script_close,shots_list,tech_orientation',
    isActive: true,
    isDefault: false
  },
  {
    id: 'Health-UGC-CreatorPOV-JourneyShare-15s',
    name: 'Health-UGC-CreatorPOV-JourneyShare-15s',
    businessModule: 'video-prompt',
    description: '健康博主视角：个人健康旅程分享',
    content: `Task: Generate a 15s UGC wellness journey ad for {{productName}}.
Instruction language: {{instructionLang}}. Voiceover/screen text: {{voiceoverLang}}.

Persona: {{personaName}}, wellness advocate sharing personal experience.

Hook ({{voiceoverLang}}): {{script_open}}
Main ({{voiceoverLang}}): {{script_main}}
Close ({{voiceoverLang}}): {{script_close}}

Shots:
{{shots_list}}

Technical: {{tech_orientation}}, authentic selfie style, progress timeline, uplifting vibe.
Platform: 9:16 vertical, genuine emotion, captions in {{screenTextLang}}.

Do not translate quoted dialogue; keep it exactly as provided.`,
    variables: 'productName,personaName,instructionLang,voiceoverLang,screenTextLang,script_open,script_main,script_close,shots_list,tech_orientation',
    isActive: true,
    isDefault: false
  },
  {
    id: 'Health-UGC-ScientificProof-15s',
    name: 'Health-UGC-ScientificProof-15s',
    businessModule: 'video-prompt',
    description: '健康产品科学依据：成分功效、研究背书',
    content: `Task: Generate a 15s UGC science-backed ad for {{productName}}.
Instruction language: {{instructionLang}}. Voiceover/screen text: {{voiceoverLang}}.

Hook ({{voiceoverLang}}): {{script_open}}
Main ({{voiceoverLang}}): {{script_main}}
Close ({{voiceoverLang}}): {{script_close}}

Shots:
{{shots_list}}

Technical: {{tech_orientation}}, ingredient animation, study/certification graphics, credible tone.
Platform: 9:16 vertical, data viz clear, captions in {{screenTextLang}}.

Do not translate quoted dialogue; keep it exactly as provided.`,
    variables: 'productName,instructionLang,voiceoverLang,screenTextLang,script_open,script_main,script_close,shots_list,tech_orientation',
    isActive: true,
    isDefault: false
  }
]

// 图书类目模板
const bookTemplates = [
  {
    id: 'Book-UGC-Unboxing-15s',
    name: 'Book-UGC-Unboxing-15s',
    businessModule: 'video-prompt',
    description: '图书开箱：展示封面、装帧、插图',
    content: `Task: Generate a 15s UGC book unboxing ad for {{productName}}.
Instruction language: {{instructionLang}}. Voiceover/screen text: {{voiceoverLang}}.

Hook ({{voiceoverLang}}): {{script_open}}
Main ({{voiceoverLang}}): {{script_main}}
Close ({{voiceoverLang}}): {{script_close}}

Shots:
{{shots_list}}

Technical: {{tech_orientation}}, cozy reading nook, page flipping ASMR, warm lighting.
Platform: 9:16 vertical, cover and key pages visible, captions in {{screenTextLang}}.

Do not translate quoted dialogue; keep it exactly as provided.`,
    variables: 'productName,instructionLang,voiceoverLang,screenTextLang,script_open,script_main,script_close,shots_list,tech_orientation',
    isActive: true,
    isDefault: false
  },
  {
    id: 'Book-UGC-KeyTakeaways-15s',
    name: 'Book-UGC-KeyTakeaways-15s',
    businessModule: 'video-prompt',
    description: '图书核心观点：分享金句、启发',
    content: `Task: Generate a 15s UGC book summary ad for {{productName}}.
Instruction language: {{instructionLang}}. Voiceover/screen text: {{voiceoverLang}}.

Hook ({{voiceoverLang}}): {{script_open}}
Main ({{voiceoverLang}}): {{script_main}}
Close ({{voiceoverLang}}): {{script_close}}

Shots:
{{shots_list}}

Technical: {{tech_orientation}}, text overlay of key quotes, thoughtful expressions, coffee shop vibe.
Platform: 9:16 vertical, quotes readable, captions in {{screenTextLang}}.

Do not translate quoted dialogue; keep it exactly as provided.`,
    variables: 'productName,instructionLang,voiceoverLang,screenTextLang,script_open,script_main,script_close,shots_list,tech_orientation',
    isActive: true,
    isDefault: false
  },
  {
    id: 'Book-UGC-ProblemSolution-15s',
    name: 'Book-UGC-ProblemSolution-15s',
    businessModule: 'video-prompt',
    description: '图书解决痛点：针对读者困惑、成长需求',
    content: `Task: Generate a 15s UGC transformative book ad for {{productName}}.
Instruction language: {{instructionLang}}. Voiceover/screen text: {{voiceoverLang}}.

Hook ({{voiceoverLang}}): {{script_open}}
Main ({{voiceoverLang}}): {{script_main}}
Close ({{voiceoverLang}}): {{script_close}}

Shots:
{{shots_list}}

Technical: {{tech_orientation}}, relatable struggle → insight moment, contemplative mood.
Platform: 9:16 vertical, emotional connection, captions in {{screenTextLang}}.

Do not translate quoted dialogue; keep it exactly as provided.`,
    variables: 'productName,instructionLang,voiceoverLang,screenTextLang,script_open,script_main,script_close,shots_list,tech_orientation',
    isActive: true,
    isDefault: false
  },
  {
    id: 'Book-UGC-CreatorPOV-Review-15s',
    name: 'Book-UGC-CreatorPOV-Review-15s',
    businessModule: 'video-prompt',
    description: '图书博主书评：个人阅读体验分享',
    content: `Task: Generate a 15s UGC book review ad for {{productName}}.
Instruction language: {{instructionLang}}. Voiceover/screen text: {{voiceoverLang}}.

Persona: {{personaName}}, book lover sharing honest review.

Hook ({{voiceoverLang}}): {{script_open}}
Main ({{voiceoverLang}}): {{script_main}}
Close ({{voiceoverLang}}): {{script_close}}

Shots:
{{shots_list}}

Technical: {{tech_orientation}}, bookshelf background, holding book naturally, direct camera talk.
Platform: 9:16 vertical, authentic bookworm vibe, captions in {{screenTextLang}}.

Do not translate quoted dialogue; keep it exactly as provided.`,
    variables: 'productName,personaName,instructionLang,voiceoverLang,screenTextLang,script_open,script_main,script_close,shots_list,tech_orientation',
    isActive: true,
    isDefault: false
  },
  {
    id: 'Book-UGC-ReadingChallenge-15s',
    name: 'Book-UGC-ReadingChallenge-15s',
    businessModule: 'video-prompt',
    description: '图书阅读挑战：鼓励读者行动、社群感',
    content: `Task: Generate a 15s UGC reading challenge ad for {{productName}}.
Instruction language: {{instructionLang}}. Voiceover/screen text: {{voiceoverLang}}.

Hook ({{voiceoverLang}}): {{script_open}}
Main ({{voiceoverLang}}): {{script_main}}
Close ({{voiceoverLang}}): {{script_close}}

Shots:
{{shots_list}}

Technical: {{tech_orientation}}, progress tracker visual, cozy reading montage, motivational tone.
Platform: 9:16 vertical, challenge rules clear, captions in {{screenTextLang}}.

Do not translate quoted dialogue; keep it exactly as provided.`,
    variables: 'productName,instructionLang,voiceoverLang,screenTextLang,script_open,script_main,script_close,shots_list,tech_orientation',
    isActive: true,
    isDefault: false
  }
]

async function main() {
  console.log('开始种子 video-prompt 模板（美妆、个护、厨具、大健康、图书）...')

  const allTemplates = [
    ...beautyTemplates,
    ...personalCareTemplates,
    ...kitchenTemplates,
    ...healthTemplates,
    ...bookTemplates
  ]

  for (const tpl of allTemplates) {
    await prisma.promptTemplate.upsert({
      where: { id: tpl.id },
      create: tpl,
      update: tpl
    })
    console.log(`✅ ${tpl.id}`)
  }

  console.log(`\n✅ 共种子 ${allTemplates.length} 个 video-prompt 模板`)
  console.log('类目覆盖: 美妆(5) + 个护(5) + 厨具(5) + 大健康(5) + 图书(5) = 25 个')
}

main()
  .catch((e) => {
    console.error('种子失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

