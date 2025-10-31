#!/usr/bin/env tsx

import { prisma } from '@/lib/prisma'

type TemplateInput = {
  name: string
  businessModule: string
  content: string
  variables: string
  description?: string
  isDefault?: boolean
  isActive?: boolean
  createdBy?: string
}

const templates: TemplateInput[] = [
  {
    name: '3C-Script-Unboxing-15s',
    businessModule: 'video-script',
    description: '3C 开箱速看 15s：三段文案 + 分镜，JSON 输出',
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    variables: JSON.stringify([
      'productName','category','sellingPoints','targetAudience','personaName','personaAge','personaOccupation','personaLocation','personaTraits','personaCommunicationStyle','duration','voiceoverLang'
    ]),
    content: `为{{productName}}生成{{duration}}秒开箱速看脚本（口播语言：{{voiceoverLang}}）。

角色/语气：{{personaName}}（{{personaAge}}，{{personaOccupation}}，{{personaLocation}}），语气：{{personaCommunicationStyle}}，特质：{{personaTraits}}。
受众：{{targetAudience}}。核心卖点：{{sellingPoints}}。

要求：
1) 前1-3秒必须是强Hook；
2) 三段文案分别产出：open/main/close（口语化、{{voiceoverLang}}），避免空话；
3) 产出分镜列表shots（每秒一个记录，含 camera/action/visibility/audio）；
4) 技术参数technical包含 orientation/filmingMethod/dominantHand/location/audioEnv；
5) 严格输出JSON，字段见下；

输出JSON（仅JSON）：
{
  "angle": "Unboxing",
  "energy": "positive",
  "durationSec": {{duration}},
  "lines": { "open": "...", "main": "...", "close": "..." },
  "shots": [ { "second": 0, "camera": "...", "action": "...", "visibility": "...", "audio": "..." } ],
  "technical": { "orientation": "vertical", "filmingMethod": "handheld", "dominantHand": "right", "location": "indoor", "audioEnv": "quiet" }
}`
  },
  {
    name: '3C-Script-FeatureDemo-15s',
    businessModule: 'video-script',
    description: '3C 核心功能演示 15s：演示切换/对比，JSON 输出',
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    variables: JSON.stringify([
      'productName','category','sellingPoints','targetAudience','personaName','personaAge','personaOccupation','personaLocation','personaTraits','personaCommunicationStyle','duration','voiceoverLang'
    ]),
    content: `为{{productName}}生成{{duration}}秒功能演示脚本（口播语言：{{voiceoverLang}}）。

角色/语气：{{personaName}}，{{personaCommunicationStyle}}；受众：{{targetAudience}}；卖点：{{sellingPoints}}。
要求：开头对比/问题引入；中段演示开关/前后对比；结尾单句价值总结和轻CTA。

输出JSON（仅JSON）：
{
  "angle": "Feature Demo",
  "energy": "confident",
  "durationSec": {{duration}},
  "lines": { "open": "...", "main": "...", "close": "..." },
  "shots": [ { "second": 0, "camera": "...", "action": "toggle feature", "visibility": "before/after labels", "audio": "..." } ],
  "technical": { "orientation": "vertical", "filmingMethod": "handheld", "dominantHand": "right", "location": "indoor", "audioEnv": "quiet" }
}`
  },
  {
    name: '3C-Script-PerformanceBenchmark-15s',
    businessModule: 'video-script',
    description: '3C 速度/性能对比 15s：计时条/导出时间对比，JSON 输出',
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    variables: JSON.stringify([
      'productName','category','sellingPoints','targetAudience','personaName','personaAge','personaOccupation','personaLocation','personaTraits','personaCommunicationStyle','duration','voiceoverLang'
    ]),
    content: `为{{productName}}生成{{duration}}秒性能对比脚本（口播语言：{{voiceoverLang}}）。

输出JSON（仅JSON）：
{
  "angle": "Benchmark",
  "energy": "energetic",
  "durationSec": {{duration}},
  "lines": { "open": "...", "main": "...", "close": "..." },
  "shots": [ { "second": 0, "camera": "screen top-down", "action": "timer start", "visibility": "timer overlay", "audio": "..." } ],
  "technical": { "orientation": "vertical", "filmingMethod": "handheld", "dominantHand": "right", "location": "indoor", "audioEnv": "quiet" }
}`
  },
  {
    name: '3C-Script-ProblemSolution-15s',
    businessModule: 'video-script',
    description: '3C 痛点→解决 15s：场景引入/功能解决/安心场景，JSON 输出',
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    variables: JSON.stringify([
      'productName','category','sellingPoints','targetAudience','personaName','personaAge','personaOccupation','personaLocation','personaTraits','personaCommunicationStyle','duration','voiceoverLang'
    ]),
    content: `为{{productName}}生成{{duration}}秒痛点解决脚本（口播语言：{{voiceoverLang}}）。

输出JSON（仅JSON）：
{
  "angle": "Problem-Solution",
  "energy": "reassuring",
  "durationSec": {{duration}},
  "lines": { "open": "...", "main": "...", "close": "..." },
  "shots": [ { "second": 0, "camera": "lifestyle mid", "action": "show low battery / cord mess", "visibility": "clear icons", "audio": "..." } ],
  "technical": { "orientation": "vertical", "filmingMethod": "handheld", "dominantHand": "right", "location": "indoor", "audioEnv": "quiet" }
}`
  },
  {
    name: '3C-Script-CreatorPOV-Setup-15s',
    businessModule: 'video-script',
    description: '3C 创作者POV教程 15s：步骤化+前后对比，JSON 输出',
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    variables: JSON.stringify([
      'productName','category','sellingPoints','targetAudience','personaName','personaAge','personaOccupation','personaLocation','personaTraits','personaCommunicationStyle','duration','voiceoverLang'
    ]),
    content: `为{{productName}}生成{{duration}}秒创作者视角设置教程脚本（口播语言：{{voiceoverLang}}）。

输出JSON（仅JSON）：
{
  "angle": "Creator POV",
  "energy": "helpful",
  "durationSec": {{duration}},
  "lines": { "open": "...", "main": "...", "close": "..." },
  "shots": [ { "second": 0, "camera": "POV", "action": "mount/plug steps", "visibility": "big step labels", "audio": "..." } ],
  "technical": { "orientation": "vertical", "filmingMethod": "handheld", "dominantHand": "right", "location": "indoor", "audioEnv": "quiet" }
}`
  },
]

async function upsertTemplates() {
  const results: any[] = []
  for (const t of templates) {
    const existing = await prisma.promptTemplate.findFirst({ where: { name: t.name, businessModule: t.businessModule } })
    if (existing) {
      const updated = await prisma.promptTemplate.update({ where: { id: existing.id }, data: { content: t.content, variables: t.variables, description: t.description, isActive: t.isActive ?? true, isDefault: t.isDefault ?? false } })
      results.push({ id: updated.id, name: updated.name, status: 'updated' })
    } else {
      const created = await prisma.promptTemplate.create({ data: t })
      results.push({ id: created.id, name: created.name, status: 'created' })
    }
  }
  return results
}

async function main() {
  const res = await upsertTemplates()
  console.log('3C video-script templates upserted:', res)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })


