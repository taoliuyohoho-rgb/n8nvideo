#!/usr/bin/env tsx

import { prisma } from '@/lib/prisma'

type Tpl = {
  name: string
  businessModule: 'video-script'
  content: string
  variables: string
  description?: string
  inputRequirements?: string
  outputRequirements?: string
  outputRules?: string
  isActive?: boolean
  isDefault?: boolean
  createdBy?: string
}

const schemaBlock = `严格输出 JSON（仅一个对象，不要 markdown，不要说明文字）：
{
  "angle": "脚本角度（≤8字，如：开箱/功能/性能/痛点/POV）",
  "energy": "整体节奏（如：自然/紧凑/活泼/专业）",
  "durationSec": {{duration}},
  "lines": {
    "open": "开场钩子（{{voiceoverLang}}，10-18字；禁止'大家好/给大家推荐'等套话；必须包含一个具体卖点/问题）",
    "main": "主体（{{voiceoverLang}}，结合卖点：{{sellingPoints}}；用事实/对比/数字/具体动作；30-60字）",
    "close": "收束+CTA（{{voiceoverLang}}，明确下一步/利益点；8-16字）"
  },
  "shots": [
    {"second": 0,  "camera": "特写/半身/POV", "action": "具体可拍动作", "visibility": "主体清晰可见", "audio": "旁白+环境"},
    {"second": 4,  "camera": "移动/变焦",   "action": "演示/对比/证据", "visibility": "关键信息可读", "audio": "旁白"},
    {"second": 8,  "camera": "回到主体",     "action": "强化卖点/结果", "visibility": "产品+结果清晰", "audio": "旁白"}
  ],
  "technical": {
    "orientation": "竖屏",
    "filmingMethod": "手持",
    "dominantHand": "右手",
    "location": "家庭/办公/生活化场景",
    "audioEnv": "安静室内"
  }
}`

const bannedBlock = `硬性禁止："大家好"、"给大家推荐/分享"、"喜欢的话记得点赞关注"、空洞词（很好/不错）与无依据的夸张描述。`

const baseVars = [
  'productName',
  'category',
  'sellingPoints',
  'painPoints',
  'targetAudience',
  'personaName',
  'personaTraits',
  'personaCommunicationStyle',
  'voiceoverLang',
  'duration'
]

function mkScriptTemplate(angleKey: string, angleTitle: string, guidance: string, tags: { categoryTags?: string[]; channel?: string; }) : Tpl {
  const meta = {
    angle: angleKey,
    categoryTags: tags.categoryTags || ['generic'],
    channel: tags.channel || 'generic',
    durationRange: [12, 15],
    languageAgnostic: true,
  }

  const content = `生成{{duration}}秒 ${angleTitle} UGC 脚本（口播语言：{{voiceoverLang}}）。

【场景要求】
- 真实生活化、手机手持；开口即进场景（0-2秒）。
- 结合人设语气：{{personaName}}（{{personaTraits}}，{{personaCommunicationStyle}}）。
- 受众：{{targetAudience}}；必须命中至少1个卖点：{{sellingPoints}}。
- ${guidance}

${bannedBlock}

【输出】
${schemaBlock}
`

  return {
    name: `Script-${angleKey}-generic`,
    businessModule: 'video-script',
    content,
    variables: JSON.stringify(baseVars),
    description: `Angle=${angleKey}; Generic; 稳定JSON输出; 禁用套话; 可拍分镜;`,
    outputRules: JSON.stringify(meta),
    isActive: true,
    isDefault: false,
    createdBy: 'system'
  }
}

const templates: Tpl[] = [
  mkScriptTemplate('unboxing', '开箱速看', '配件铺陈→手感/细节→亮屏或关键动作；Hook 要具体（如数值/对比）。', {}),
  mkScriptTemplate('feature_demo', '核心功能演示', '明确开关/模式/前后对比；用具体动作与短句表达结果。', {}),
  mkScriptTemplate('benchmark', '性能/速度对比', '计时/导出/续航等可量化指标；必须出现一个数字差异。', {}),
  mkScriptTemplate('problem_solution', '痛点→解决', '先抛痛点，再给可见解决步骤；收束强调“省时/省事/更稳”。', {}),
  mkScriptTemplate('creator_pov', '创作者POV教程', '步骤化（≤3步）；POV 视角；最后给“立刻可用”的结果感受。', {}),
]

async function upsertAll() {
  const results: any[] = []
  for (const t of templates) {
    const existing = await prisma.promptTemplate.findFirst({ where: { name: t.name, businessModule: t.businessModule } })
    if (existing) {
      const updated = await prisma.promptTemplate.update({ where: { id: existing.id }, data: t })
      results.push({ id: updated.id, name: updated.name, status: 'updated' })
    } else {
      const created = await prisma.promptTemplate.create({ data: t })
      results.push({ id: created.id, name: created.name, status: 'created' })
    }
  }
  return results
}

upsertAll()
  .then(res => { console.log('Seeded video-script templates:', res) ; process.exit(0) })
  .catch(err => { console.error(err); process.exit(1) })


