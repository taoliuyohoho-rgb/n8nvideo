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
    name: '3C-UGC-Unboxing-15s',
    businessModule: 'video-prompt',
    description: '3C UGC unboxing, 15s, hook-first, accessory layout, hero close',
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    variables: JSON.stringify([
      'productName','voiceoverLang','personaName','personaAge','personaGender','personaOccupation','personaTraits','personaCommunicationStyle','targetAudience','designHighlight','handFeel','ports','keyFeature1','keyFeature2','keyFeature3','discountOrOffer'
    ]),
    content: `Task: Generate a 15s vertical UGC unboxing ad for "{{productName}}".
Instruction language: en-US. Voiceover/screen text: {{voiceoverLang}}. Do not translate quoted dialogue; keep it exactly as provided.

Persona: {{personaName}}, {{personaAge}}y, {{personaGender}}, {{personaOccupation}}; traits: {{personaTraits}}; voice: {{personaCommunicationStyle}}.
Audience: {{targetAudience}}.

Hook ({{voiceoverLang}}): "开箱第一眼，我直接被{{designHighlight}}惊到！"
Main ({{voiceoverLang}}): "手感{{handFeel}}, 接口{{ports}}, 核心卖点：{{keyFeature1}}、{{keyFeature2}}、{{keyFeature3}}。"
Close ({{voiceoverLang}}): "有{{discountOrOffer}}，入手真的值。现在就下单。"

Shots:
- t=0-2s | camera=macro close-up | action=cut seal → lift lid → hero reveal | visibility=logo + signature detail | audio=foil/box foley
- t=2-6s | camera=top-down | action=lay out all accessories (grid) | visibility=all-in-frame | audio=soft whoosh
- t=6-11s | camera=handheld mid | action=hold & rotate, press key/turn on | visibility=screen brightness/edges | audio=VO + soft bgm
- t=11-15s | camera=close-up | action=product hero + price/offer tag | visibility=text safe area | audio=VO CTA

Technical: 9:16 vertical, 1080x1920, 15s, smooth handheld, soft lighting, product clearly visible ≥8s, captions ≥36px inside safe area.`
  },
  {
    name: '3C-UGC-FeatureDemo-15s',
    businessModule: 'video-prompt',
    description: '3C UGC feature demo (e.g., low-light camera/ANC), 15s',
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    variables: JSON.stringify([
      'productName','voiceoverLang','personaName','personaAge','personaGender','personaOccupation','personaTraits','personaCommunicationStyle','targetAudience','featureFocus','featureToggle','secondaryBenefit','useScenario'
    ]),
    content: `Task: Generate a 15s UGC feature-demo ad for "{{productName}}" focusing on "{{featureFocus}}".
Instruction language: en-US. Voiceover/screen text: {{voiceoverLang}}. Do not translate quoted dialogue; keep it exactly as provided.

Persona: {{personaName}}, voice: {{personaCommunicationStyle}}.
Audience: {{targetAudience}}.

Hook ({{voiceoverLang}}): "这光线下也能拍出细节？看这个。"
Main ({{voiceoverLang}}): "打开{{featureToggle}}，对比前后：噪点更少，细节更清晰；再看{{secondaryBenefit}}。"
Close ({{voiceoverLang}}): "夜拍/降噪对我这种{{useScenario}}太有用了。"

Shots:
- 0-3s | split-screen | before vs after | visibility=labels "Before/After"
- 3-8s | handheld close | action=toggle {{featureToggle}} → live change
- 8-12s | macro | action=zoom detail (texture/edge/waveform)
- 12-15s | hero + overlay | action=stamp key benefit bullets | audio=VO CTA

Technical: 9:16, 1080x1920, stable motion, avoid hard cuts; keep on-screen labels in {{voiceoverLang}}.`
  },
  {
    name: '3C-UGC-PerformanceBenchmark-15s',
    businessModule: 'video-prompt',
    description: '3C UGC performance benchmark vs old device, 15s',
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    variables: JSON.stringify([
      'productName','voiceoverLang','taskType','improvementPercent','creatorType'
    ]),
    content: `Task: Generate a 15s UGC performance benchmark ad for "{{productName}}".
Instruction language: en-US. Voiceover/screen text: {{voiceoverLang}}.

Hook ({{voiceoverLang}}): "开机到剪完一条视频，只花了这么久？"
Main ({{voiceoverLang}}): "{{taskType}}实测：导入→剪辑→导出，时间对比老设备缩短{{improvementPercent}}%。温控/续航也稳。"
Close ({{voiceoverLang}}): "如果你也做{{creatorType}}，这速度真的香。"

Shots:
- 0-3s | timer overlay | action=start task
- 3-7s | screen top-down | action=timeline scrubbing/export progress
- 7-12s | split | action=old vs new time bars
- 12-15s | hero | action=callouts: "x% faster" "longer battery"

Technical: 9:16, clean overlays, readable timer, no tiny text.`
  },
  {
    name: '3C-UGC-ProblemSolution-15s',
    businessModule: 'video-prompt',
    description: '3C UGC problem → solution (battery/cord clutter), 15s',
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    variables: JSON.stringify([
      'productName','voiceoverLang','keyFeature1','keyFeature2','keyFeature3','painPoint'
    ]),
    content: `Task: Generate a 15s UGC problem-solution ad for "{{productName}}".
Instruction language: en-US. Voiceover/screen text: {{voiceoverLang}}.

Hook ({{voiceoverLang}}): "出门一天，电量还能稳到晚上？"
Main ({{voiceoverLang}}): "我用{{productName}}：{{keyFeature1}}让续航更久，{{keyFeature2}}解决{{painPoint}}，而且{{keyFeature3}}很轻。"
Close ({{voiceoverLang}}): "通勤/旅行都安心，用过就回不去。"

Shots:
- 0-2s | lifestyle mid | action=pull phone from bag with low-battery icon
- 2-8s | close | action=plug/attach/use feature (e.g., MagSafe/powerbank)
- 8-12s | meter | action=battery climbing/usage snapshots
- 12-15s | hero + CTA | action=offer + shop now

Technical: 9:16, day-to-night sequence possible, consistent white balance, captions safe.`
  },
  {
    name: '3C-UGC-CreatorPOV-Setup-15s',
    businessModule: 'video-prompt',
    description: '3C UGC creator POV setup guide, 15s',
    isDefault: false,
    isActive: true,
    createdBy: 'system',
    variables: JSON.stringify([
      'productName','voiceoverLang','step1','step2','step3','resultMetric'
    ]),
    content: `Task: Generate a 15s UGC creator-POV setup guide for "{{productName}}".
Instruction language: en-US. Voiceover/screen text: {{voiceoverLang}}.

Hook ({{voiceoverLang}}): "我1分钟这样设置，画面直接提升。"
Main ({{voiceoverLang}}): "第1步{{step1}}；第2步{{step2}}；第3步{{step3}}。结果：{{resultMetric}}更稳/更清。"
Close ({{voiceoverLang}}): "拍 vlog/直播都适用，收藏这套就够了。"

Shots:
- 0-2s | POV | action=mount/plug
- 2-10s | step-by-step top-down | action=dials/toggles
- 10-15s | before-after split | action=final look + CTA

Technical: 9:16, overhead rig or stable POV, large step labels, keep product in frame.`
  },
]

async function upsertTemplates() {
  const results: any[] = []
  for (const t of templates) {
    const existing = await prisma.promptTemplate.findFirst({
      where: { name: t.name, businessModule: t.businessModule }
    })
    if (existing) {
      const updated = await prisma.promptTemplate.update({
        where: { id: existing.id },
        data: {
          content: t.content,
          variables: t.variables,
          description: t.description,
          isActive: t.isActive ?? true,
          isDefault: t.isDefault ?? false,
        }
      })
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
  console.log('3C video-prompt templates upserted:', res)
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e)
  process.exit(1)
})


