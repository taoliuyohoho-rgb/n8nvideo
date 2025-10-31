#!/usr/bin/env tsx

import { prisma } from '@/lib/prisma'

type Tpl = {
  name: string
  businessModule: 'video-prompt'
  content: string
  variables: string
  description?: string
  outputRules?: string
  isActive?: boolean
  isDefault?: boolean
  createdBy?: string
}

const baseVars = [
  'instructionLang',
  'voiceoverLang',
  'screenTextLang',
  'productName',
  'script_open',
  'script_main',
  'script_close',
  'shots_list',
  'durationSec',
  'tech_orientation',
  'tech_filmingMethod',
  'tech_dominantHand',
  'tech_location',
  'tech_audioEnv',
]

const soraRenderer: Tpl = {
  name: 'Renderer-Sora-UGC',
  businessModule: 'video-prompt',
  variables: JSON.stringify(baseVars),
  description: 'Sora 指令英文版渲染器：分镜/机位/语言声明/安全区/不翻译引号内台词',
  outputRules: JSON.stringify({ provider: 'sora', channel: 'generic' }),
  isActive: true,
  isDefault: true,
  createdBy: 'system',
  content: `Task: Generate a {{durationSec}}s vertical UGC ad for "{{productName}}".
Instruction language: {{instructionLang}}. Voiceover/screen text: {{voiceoverLang}}. Do not translate quoted dialogue; keep it exactly as provided.

Dialogue ({{voiceoverLang}}):
Hook: "{{script_open}}"
Main: "{{script_main}}"
Close: "{{script_close}}"

Shots (natural language camera directions; no overlays):
{{shots_list}}

Technical:
- orientation={{tech_orientation}}; filming={{tech_filmingMethod}}; dominantHand={{tech_dominantHand}}; location={{tech_location}}; audioEnv={{tech_audioEnv}}
- 9:16 vertical; clear product visibility; keep captions in safe area; smooth motion; avoid hard cuts.
`
}

const doubaoRenderer: Tpl = {
  name: 'Renderer-Doubao-UGC',
  businessModule: 'video-prompt',
  variables: JSON.stringify(baseVars),
  description: '豆包 中文版渲染器：指令简洁，保持分镜/技参与语言声明',
  outputRules: JSON.stringify({ provider: 'doubao', channel: 'generic' }),
  isActive: true,
  isDefault: false,
  createdBy: 'system',
  content: `任务：为「{{productName}}」生成 {{durationSec}} 秒竖屏 UGC 视频。
指令语言：{{instructionLang}}；口播/屏幕文字：{{voiceoverLang}}。引号内台词不要翻译。

台词（{{voiceoverLang}}）：
开场：「{{script_open}}」
主体：「{{script_main}}」
收束：「{{script_close}}」

分镜（自然语言机位，避免贴片/转场）：
{{shots_list}}

技参：
- 画幅={{tech_orientation}}；拍摄={{tech_filmingMethod}}；惯用手={{tech_dominantHand}}；场景={{tech_location}}；声音={{tech_audioEnv}}
- 9:16 竖屏；产品清晰露出；字幕安全区内；运动自然、避免硬切。
`
}

async function upsertAll() {
  const list = [soraRenderer, doubaoRenderer]
  const results: any[] = []
  for (const t of list) {
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
  .then(res => { console.log('Seeded video-prompt renderers:', res); process.exit(0) })
  .catch(err => { console.error(err); process.exit(1) })


