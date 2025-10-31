import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTraceId } from '@/src/middleware/traceId'
import { createApiLogger } from '@/src/services/logger/Logger'
import { recommendRank } from '@/src/services/recommendation/recommend'
import '@/src/services/recommendation/index'
import { callModel } from '@/src/services/ai/rules'
import { filterProductInfo } from '../../../../src/utils/productInfoFilter'
import type { ProductContext } from '../../../../src/services/recommendation/scorers/productInfoMatcher'
import { resolveLanguages } from '@/src/services/ai/video/language'


/**
 * 脚本生成 API
 * 根据商品信息和人设生成 15 秒 UGC 视频脚本
 */
async function handler(request: NextRequest, traceId: string) {
  const log = createApiLogger(traceId, 'script-generate')

  try {
    const body = await request.json()
    const { productId, personaId, variants = 1 } = body

    // 校验输入
    if (!productId) {
      log.warn('Missing productId')
      return NextResponse.json(
        { success: false, error: '商品ID必填', traceId },
        { status: 400 }
      )
    }

    if (!personaId) {
      log.warn('Missing personaId')
      return NextResponse.json(
        { success: false, error: '人设ID必填', traceId },
        { status: 400 }
      )
    }

    log.info('Generating script', { productId, personaId, variants })

    // 1. 获取商品信息
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        category: true,
        subcategory: true,
        description: true,
        sellingPoints: true,
        targetAudience: true,
        targetCountries: true
      }
    })

    if (!product) {
      log.warn('Product not found', { productId })
      return NextResponse.json(
        { success: false, error: '商品不存在', traceId },
        { status: 404 }
      )
    }

    // 2. 获取人设信息
    const persona = await prisma.persona.findUnique({
      where: { id: personaId }
    })

    if (!persona) {
      log.warn('Persona not found', { personaId })
      return NextResponse.json(
        { success: false, error: '人设不存在', traceId },
        { status: 404 }
      )
    }

    // 3. 解析商品和人设数据
    const rawSellingPoints = product.sellingPoints || []
    const targetCountries: string[] = Array.isArray(product.targetCountries)
      ? (product.targetCountries as string[])
      : (typeof product.targetCountries === 'string' && product.targetCountries.trim() ? [product.targetCountries] : [])
    const rawTargetAudiences = product.targetAudience || []
    
    // 4. 🎲 随机选择卖点和目标受众，增加多样性
    // 每次随机选择3-5个卖点和2-4个目标受众，避免总是使用相同的内容
    const randomCount = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
    
    const sellingPointsCount = randomCount(3, 5)
    const targetAudienceCount = randomCount(2, 4)
    
    log.info('Randomly selecting content', { 
      sellingPointsCount,
      targetAudienceCount,
      totalSellingPoints: Array.isArray(rawSellingPoints) ? rawSellingPoints.length : 0,
      totalTargetAudiences: Array.isArray(rawTargetAudiences) ? rawTargetAudiences.length : 0
    })
    
    const productContext: ProductContext = {
      productName: product.name || '未知商品',
      category: product.category || '未分类',
      subcategory: product.subcategory || undefined,
      description: product.description || undefined,
      targetCountries: Array.isArray(targetCountries) ? targetCountries : [],
      existingSellingPoints: Array.isArray(rawSellingPoints) ? rawSellingPoints as string[] : [],
      existingPainPoints: [],
      existingTargetAudience: Array.isArray(rawTargetAudiences) ? rawTargetAudiences as string[] : []
    }
    
    const filteredInfo = await filterProductInfo(
      Array.isArray(rawSellingPoints) ? rawSellingPoints as string[] : [],
      [],
      Array.isArray(rawTargetAudiences) ? rawTargetAudiences as string[] : [],
      productContext,
      {
        maxSellingPoints: sellingPointsCount,  // 🎲 随机数量
        maxPainPoints: 0,
        maxTargetAudience: targetAudienceCount,  // 🎲 随机数量
        enableDeduplication: true,
        enableRelevanceScoring: true
      }
    )
    
    // 🎲 再次打乱顺序，确保每次组合都不同
    const sellingPoints = filteredInfo.sellingPoints.sort(() => Math.random() - 0.5)
    const targetAudiences = filteredInfo.targetAudience.sort(() => Math.random() - 0.5)
    
    // 处理可能为 null/不规范的人设结构，提供健壮的默认值
    type CoreIdentity = { name: string; age: number; occupation: string; location: string }
    type Vibe = { traits?: string[]; communicationStyle?: string }

    const coreIdentity: CoreIdentity = (() => {
      const raw = (persona as unknown as { coreIdentity?: unknown })?.coreIdentity
      if (typeof raw === 'string' && raw.trim()) {
        return { name: raw.trim(), age: 25, occupation: '用户', location: '未知' }
      }
      if (raw && typeof raw === 'object') {
        const obj = raw as Partial<Record<'name' | 'occupation' | 'location', unknown>> & { age?: unknown }
        const name = typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim() : '用户'
        const age = typeof obj.age === 'number' ? obj.age : 25
        const occupation = typeof obj.occupation === 'string' && obj.occupation.trim() ? obj.occupation.trim() : '用户'
        const location = typeof obj.location === 'string' && obj.location.trim() ? obj.location.trim() : '未知'
        return { name, age, occupation, location }
      }
      return { name: '用户', age: 25, occupation: '用户', location: '未知' }
    })()

    const vibe: Vibe = (() => {
      const raw = (persona as unknown as { vibe?: unknown })?.vibe
      if (typeof raw === 'string' && raw.trim()) {
        return { traits: [], communicationStyle: raw.trim() }
      }
      if (raw && typeof raw === 'object') {
        const obj = raw as Partial<Record<'communicationStyle', unknown>> & { traits?: unknown }
        const traits = Array.isArray(obj.traits) ? (obj.traits.filter((t): t is string => typeof t === 'string')) : []
        const communicationStyle = typeof obj.communicationStyle === 'string' && obj.communicationStyle.trim()
          ? obj.communicationStyle.trim()
          : 'clear and conversational'
        return { traits, communicationStyle }
      }
      return { traits: [], communicationStyle: 'clear and conversational' }
    })()

    // 4. 推荐Prompt模板（🎲 禁用缓存以获得多样性）
    const promptRecommendation = await recommendRank({
      scenario: 'task->prompt',
      task: { 
        taskType: 'video-script', 
        contentType: 'text',
        jsonRequirement: true
      },
      context: { 
        region: targetCountries[0] || 'US',
        channel: 'general'
      },
      constraints: { maxLatencyMs: 8000 },
      options: {
        bypassCache: true  // 🎲 每次都重新推荐，避免缓存导致结果一致
      }
    })

    log.info('Prompt recommendation received', { 
      chosenId: promptRecommendation.chosen.id,
      decisionId: promptRecommendation.decisionId
    })

    // 5. 获取选中的Prompt模板
    let promptTemplate = await prisma.promptTemplate.findUnique({
      where: { id: promptRecommendation.chosen.id }
    })

    // 如果推荐模板不存在，或不是我们期望的3C脚本模板且产品属于3C大类，则回退到3C脚本模板
    const categoryText = (product.category || '').toLowerCase()
    const is3C = ['3c','电子','数码','手机','电脑','相机','家电','consumer electronics','electronics'].some(k => categoryText.includes(k))
    const isChosen3C = promptTemplate?.name?.startsWith('3C-Script-')
    if ((!promptTemplate || (is3C && !isChosen3C))) {
      const fallback3c = await prisma.promptTemplate.findFirst({ where: { businessModule: 'video-script', name: '3C-Script-FeatureDemo-15s', isActive: true } })
      if (fallback3c) {
        promptTemplate = fallback3c
      }
    }

    if (!promptTemplate) {
      log.error('Prompt template not found', { templateId: promptRecommendation.chosen.id })
      return NextResponse.json(
        { success: false, error: 'Prompt模板不存在', traceId },
        { status: 404 }
      )
    }

    // 6. 推荐AI模型（🎲 禁用缓存以获得多样性）
    const modelRecommendation = await recommendRank({
      scenario: 'task->model',
      task: { 
        taskType: 'video-script', 
        contentType: 'text',
        jsonRequirement: true
      },
      context: { 
        region: targetCountries[0] || 'US',
        channel: 'general'
      },
      constraints: { maxLatencyMs: 8000 },
      options: {
        bypassCache: true  // 🎲 每次都重新推荐，避免缓存导致结果一致
      }
    })

    log.info('Model recommendation received', { 
      chosenId: modelRecommendation.chosen.id,
      decisionId: modelRecommendation.decisionId
    })

    // 7. 构建Prompt
    // Derive voiceover language from target country rule (multiple -> en-US)
    const langResolved = resolveLanguages(undefined, targetCountries)

    const promptText = buildScriptPrompt(promptTemplate.content, {
      productName: product.name,
      category: product.category,
      sellingPoints: sellingPoints.join(', '),
      targetAudience: targetAudiences.join(', '),
      personaName: coreIdentity.name,
      personaAge: coreIdentity.age,
      personaOccupation: coreIdentity.occupation,
      personaLocation: coreIdentity.location,
      personaTraits: Array.isArray(vibe.traits) ? vibe.traits.join(', ') : 'friendly, authentic',
      personaCommunicationStyle: vibe.communicationStyle || 'clear and conversational',
      duration: 15,
      voiceoverLang: langResolved.voiceoverLang,
    })

    // 8. 调用AI生成脚本
    // 🔍 添加随机性避免重复
    const randomSeed = Math.random().toString(36).substring(7)
    const promptWithSeed = `${promptText}\n\n[Generation ID: ${randomSeed}]`
    
    log.info('Calling AI with prompt', { 
      promptLength: promptWithSeed.length,
      randomSeed,
      selectedSellingPoints: sellingPoints,
      selectedAudiences: targetAudiences,
      promptPreview: promptWithSeed.substring(0, 200) + '...'
    })
    
    const aiResult = await callModel({
      prompt: promptWithSeed,
      task: 'video-script',
      evidenceMode: true,
      schema: getScriptSchema()
    })

    if (!aiResult.success || !aiResult.data) {
      log.error('AI generation failed', { error: aiResult.error })
      return NextResponse.json(
        { success: false, error: '脚本生成失败', traceId },
        { status: 500 }
      )
    }

    // 🔍 记录AI原始返回数据用于诊断
    log.info('AI raw response', { 
      hasShots: !!aiResult.data?.shots,
      shotsCount: Array.isArray(aiResult.data?.shots) ? aiResult.data.shots.length : 0,
      shotsPreview: Array.isArray(aiResult.data?.shots) && aiResult.data.shots.length > 0
        ? JSON.stringify(aiResult.data.shots[0]).substring(0, 100)
        : 'N/A',
      linesPreview: aiResult.data?.lines 
        ? `open: ${aiResult.data.lines.open?.substring(0, 30)}...`
        : 'N/A'
    })

    // 9. 验证和清理数据
    const { script, warnings } = validateAndCleanScript(aiResult.data, {
      productName: product.name || '产品',
      sellingPoints: sellingPoints,
      targetAudience: targetAudiences,
      durationSec: 15,
    })

    // 如果有警告，记录到日志
    if (warnings.length > 0) {
      log.warn('Script validation warnings', { warnings })
    }

    // 10. 记录反馈
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/recommend/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decisionId: promptRecommendation.decisionId,
          eventType: 'execute_complete',
          payload: {
            chosenId: promptRecommendation.chosen.id,
            success: true,
            latencyMs: 0 // 实际应该记录真实耗时
          }
        })
      })
    } catch (error) {
      log.warn('Failed to record feedback', { error })
    }

    log.info('Script generated successfully', { 
      productId,
      personaId,
      scriptAngle: script.angle,
      hadWarnings: warnings.length > 0
    })

    return NextResponse.json({
      success: true,
      scripts: [script], // 目前只生成一个变体
      modelUsed: {
        modelId: modelRecommendation.chosen.id,
        promptId: promptRecommendation.chosen.id,
        promptTemplate: promptTemplate.name
      },
      warnings: warnings.length > 0 ? warnings : undefined // 只在有警告时返回
    })

  } catch (error) {
    log.error('Failed to generate script', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '脚本生成失败',
        traceId
      },
      { status: 500 }
    )
  }
}

/**
 * 构建脚本生成Prompt
 */
function buildScriptPrompt(template: string, variables: {
  productName: string
  category: string
  sellingPoints: string
  targetAudience: string
  personaName: string
  personaAge: number
  personaOccupation: string
  personaLocation: string
  personaTraits: string
  personaCommunicationStyle: string
  duration: number
  voiceoverLang: string
}): string {
  const base = template
    .replace(/\{\{productName\}\}/g, variables.productName)
    .replace(/\{\{category\}\}/g, variables.category)
    .replace(/\{\{sellingPoints\}\}/g, variables.sellingPoints)
    .replace(/\{\{targetAudience\}\}/g, variables.targetAudience)
    .replace(/\{\{personaName\}\}/g, variables.personaName)
    .replace(/\{\{personaAge\}\}/g, variables.personaAge.toString())
    .replace(/\{\{personaOccupation\}\}/g, variables.personaOccupation)
    .replace(/\{\{personaLocation\}\}/g, variables.personaLocation)
    .replace(/\{\{personaTraits\}\}/g, variables.personaTraits)
    .replace(/\{\{personaCommunicationStyle\}\}/g, variables.personaCommunicationStyle)
    .replace(/\{\{duration\}\}/g, variables.duration.toString())
    .replace(/\{\{voiceoverLang\}\}/g, variables.voiceoverLang)

  // 🎲 生成随机的创意角度，增加多样性
  const creativityAngles = [
    '场景切入（用户日常场景）',
    '问题引入（痛点对比）', 
    '数据震撼（具体数字）',
    '故事叙述（用户故事）',
    '对比展示（前后对比）',
    '功能演示（操作展示）',
    '体验感受（第一人称）'
  ]
  const randomAngle = creativityAngles[Math.floor(Math.random() * creativityAngles.length)]
  
  // 追加统一的强约束与最终输出Schema，覆盖模板中可能存在的松散"输出格式"定义
  const finalSchemaConstraint = `\n\n【最终输出（严格JSON，仅此一个对象）】\n必须输出以下结构，不要输出任何注释或多余文本：\n{\n  "angle": "脚本角度（如：产品展示/痛点解决/对比等，≤8字）",\n  "energy": "整体节奏（如：紧凑/自然/活泼）",\n  "durationSec": ${variables.duration},\n  "lines": {\n    "open": "开场钩子（${variables.voiceoverLang}，避免'大家好/今天给大家分享'等套话，10-18字，必须包含一个具体卖点或痛点）",\n    "main": "主体内容（${variables.voiceoverLang}，结合卖点：${variables.sellingPoints}，用事实/对比/数字说明，不得空话，30-60字）",\n    "close": "行动号召（${variables.voiceoverLang}，明确下一步和紧迫感，8-16字）"\n  },\n  "shots": [\n    {"second": 0,  "camera": "特写",   "action": "展示${variables.productName}核心卖点", "visibility": "主体清晰可见", "audio": "旁白+轻快BGM"},\n    {"second": 5,  "camera": "半身",   "action": "对比/演示关键效果",     "visibility": "对比信息清晰",   "audio": "旁白+环境声"},\n    {"second": 10, "camera": "特写",   "action": "强化信任点/数据证据",     "visibility": "数据/证明清晰",   "audio": "旁白"}\n  ],\n  "technical": {\n    "orientation": "竖屏",\n    "filmingMethod": "手持",\n    "dominantHand": "右手",\n    "location": "家庭/办公室",\n    "audioEnv": "安静室内"\n  }\n}\n\n🎨 创意多样性要求（重要！）：\n- 本次建议采用"${randomAngle}"的开场方式，但可以根据卖点灵活调整\n- 卖点呈现：不要按顺序罗列所有卖点，选择2-3个最相关的进行深入展示\n- 语言风格：尝试不同的表达方式（对比式/叙事式/教学式/情感式/数据式）\n- 镜头设计：根据angle调整镜头类型，避免千篇一律的"特写-半身-特写"\n- 创意组合：同样的卖点可以有完全不同的表达和展示顺序\n\n硬性规则：\n- 所有句子必须围绕产品与受众：${variables.productName}｜${variables.targetAudience}\n- 必须显式提及至少1个卖点：${variables.sellingPoints}\n- 禁止出现："大家好"、"给大家推荐"、"喜欢记得点赞关注" 等模板化表达；若必须引导关注，请转为具体行动（如"立即领取7天试用"）。\n- **shots数组必须包含至少3个镜头**，每个镜头必须有具体的second、camera、action、visibility、audio，不能为空数组。\n- shots中的action必须具体描述画面内容，结合产品特性和卖点，不能使用通用模板。\n- 只输出JSON，不加markdown代码块。`

  return `${base}\n\n${finalSchemaConstraint}`
}

/**
 * 获取脚本Schema定义
 */
function getScriptSchema() {
  return {
    type: "object",
    properties: {
      angle: { type: "string" },
      energy: { type: "string" },
      durationSec: { type: "number" },
      lines: {
        type: "object",
        properties: {
          open: { type: "string" },
          main: { type: "string" },
          close: { type: "string" }
        },
        required: ["open", "main", "close"]
      },
      shots: {
        type: "array",
        minItems: 3,  // ✅ 强制要求至少3个镜头
        items: {
          type: "object",
          properties: {
            second: { type: "number" },
            camera: { type: "string" },
            action: { type: "string" },
            visibility: { type: "string" },
            audio: { type: "string" }
          },
          required: ["second", "camera", "action", "visibility", "audio"]
        }
      },
      technical: {
        type: "object",
        properties: {
          orientation: { type: "string" },
          filmingMethod: { type: "string" },
          dominantHand: { type: "string" },
          location: { type: "string" },
          audioEnv: { type: "string" }
        },
        required: ["orientation", "filmingMethod", "dominantHand", "location", "audioEnv"]
      }
    },
    required: ["angle", "energy", "durationSec", "lines", "shots", "technical"]
  }
}

/**
 * 验证和清理脚本数据
 */
function validateAndCleanScript(data: Record<string, unknown>, context?: { productName?: string; sellingPoints?: string[]; targetAudience?: string[]; durationSec?: number }): { script: Record<string, unknown>; warnings: string[] } {
  const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object'
  const isString = (value: unknown): value is string => typeof value === 'string'
  const bannedPhrases = [/大家好/g, /给大家(推荐|分享)/g, /喜欢的话?记得?点?赞?关?注?/g]
  const warnings: string[] = []

  const takeString = (obj: Record<string, unknown>, keys: string[]): string | undefined => {
    for (const k of keys) {
      const v = obj?.[k]
      if (typeof v === 'string' && v.trim()) return v.trim()
    }
    return undefined
  }

  const fromScriptSplit = (full?: string): { open?: string; main?: string; close?: string } => {
    if (!full) return {}
    const sentences = full.replace(/\n+/g, ' ').split(/(?<=[。！？!.?])/).map(s => s.trim()).filter(Boolean)
    if (sentences.length === 0) return {}
    const open = sentences[0]
    const close = sentences.length > 1 ? sentences[sentences.length - 1] : undefined
    const main = sentences.slice(1, -1).join(' ') || sentences[1]
    return { open, main, close }
  }

  const hook = takeString(data, ['hook', 'opening', 'open'])
  const mainContent = takeString(data, ['main', 'mainContent', 'solution', 'body'])
  const cta = takeString(data, ['cta', 'callToAction', 'close', 'closing'])
  const scriptText = takeString(data, ['script', 'content'])
  const split = !hook || !mainContent || !cta ? fromScriptSplit(scriptText) : {}

  const linesRecord = (() => {
    const maybeLines = (data as { lines?: unknown }).lines
    return isObject(maybeLines) ? (maybeLines as Record<string, unknown>) : undefined
  })()
  const openFromLines = linesRecord && isString(linesRecord['open']) ? linesRecord['open'] : undefined
  const mainFromLines = linesRecord && isString(linesRecord['main']) ? linesRecord['main'] : undefined
  const closeFromLines = linesRecord && isString(linesRecord['close']) ? linesRecord['close'] : undefined

  let openLine = openFromLines || hook || split.open
  let mainLine = mainFromLines || mainContent || split.main
  let closeLine = closeFromLines || cta || split.close

  // Better defaults using context, avoiding模板化
  if (!openLine) {
    const firstPoint = Array.isArray(context?.sellingPoints) && context?.sellingPoints.length > 0 ? context?.sellingPoints[0] : '核心卖点'
    openLine = `别再错过${context?.productName || '这款产品'}，${firstPoint}才是关键`.
      replace('，，', '，')
  }
  if (!mainLine) {
    const points = (context?.sellingPoints || []).slice(0, 3).join('、') || '真实对比、数据证明、上手即用'
    mainLine = `真实场景演示：${points}`
  }
  if (!closeLine) {
    closeLine = '现在下单，立减/试用名额有限'
  }

  // Remove banned phrases
  for (const r of bannedPhrases) {
    openLine = openLine.replace(r, '')
    mainLine = mainLine.replace(r, '')
    closeLine = closeLine.replace(r, '')
  }
  openLine = openLine.trim()
  mainLine = mainLine.trim()
  closeLine = closeLine.trim()

  // Normalize shots - 严格验证，避免依赖兜底逻辑
  let shots = Array.isArray(data?.shots) ? data.shots : undefined
  if (!shots || shots.length === 0) {
    const warningMsg = '⚠️ AI返回的shots为空，使用兜底逻辑生成shots（这不应该成为常态）'
    console.error('❌ AI返回的shots为空，这不应该发生！', { data })
    warnings.push(warningMsg)
    
    // 尝试从其他字段提取信息作为紧急兜底
    const hints = (Array.isArray(data?.subtitlePoints) ? data.subtitlePoints : [])
      .concat(Array.isArray(data?.visualEffects) ? data.visualEffects : [])
      .concat(Array.isArray(data?.shootingAngles) ? data.shootingAngles : [])

    const hint1 = typeof hints[0] === 'string' ? hints[0] : `展示${context?.productName || '产品'}核心卖点`
    const hint2 = typeof hints[1] === 'string' ? hints[1] : '功能演示/对比'
    const hint3 = typeof hints[2] === 'string' ? hints[2] : '数据/口碑证明'

    console.warn(warningMsg)
    shots = [
      { second: 0,  camera: '特写',   action: hint1, visibility: '主体清晰可见', audio: '旁白+轻快BGM' },
      { second: 5,  camera: '半身',   action: hint2, visibility: '关键信息可读', audio: '旁白+环境声' },
      { second: 10, camera: '特写',   action: hint3, visibility: '数据/证明清晰', audio: '旁白' },
    ]
  } else if (shots.length < 3) {
    // 如果shots数量不足3个，也记录警告
    const warningMsg = `⚠️ AI返回的shots数量不足：${shots.length}个（期望至少3个）`
    console.warn(warningMsg)
    warnings.push(warningMsg)
  }

  const technicalRecord = (() => {
    const maybeTech = (data as { technical?: unknown }).technical
    return isObject(maybeTech) ? (maybeTech as Record<string, unknown>) : undefined
  })()
  const orientation = technicalRecord && isString(technicalRecord['orientation']) ? technicalRecord['orientation'] : '竖屏'
  const filmingMethod = technicalRecord && isString(technicalRecord['filmingMethod']) ? technicalRecord['filmingMethod'] : '手持'
  const dominantHand = technicalRecord && isString(technicalRecord['dominantHand']) ? technicalRecord['dominantHand'] : '右手'
  const location = technicalRecord && isString(technicalRecord['location']) ? technicalRecord['location'] : '家庭环境'
  const audioEnv = technicalRecord && isString(technicalRecord['audioEnv']) ? technicalRecord['audioEnv'] : '安静室内'

  const script = {
    angle: typeof data?.angle === 'string' && data.angle.trim() ? data.angle : '痛点解决',
    energy: typeof data?.energy === 'string' && data.energy.trim() ? data.energy : '紧凑',
    durationSec: typeof data?.durationSec === 'number' ? data.durationSec : (context?.durationSec || 15),
    lines: {
      open: openLine,
      main: mainLine,
      close: closeLine
    },
    shots,
    technical: {
      orientation,
      filmingMethod,
      dominantHand,
      location,
      audioEnv
    }
  }

  return { script, warnings }
}

export const POST = withTraceId(handler)