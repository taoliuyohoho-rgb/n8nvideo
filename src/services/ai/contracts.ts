import { buildEvidenceSummary, ensureUsableInput, Evidence, UserInput } from './input'
import { ModelNeeds, CallPolicy } from './rules'
import { coerceCompetitorOutput, CompetitorOutput } from './output'
import { callWithSchema, evidenceMode } from './contract'

export type CompetitorContext = {
  productName?: string
  category?: string
  painPoints?: string[]
}

export type CompetitorContractParams = {
  input: UserInput
  needs: ModelNeeds
  policy: CallPolicy
  customPrompt?: string
  context?: CompetitorContext
}

// 提取图片中的关键文本（轻量OCR，依赖视觉模型理解）
async function extractTextFromImages(images: string[] | undefined, policy: CallPolicy): Promise<string[]> {
  if (!images || images.length === 0) return []
  const prompt = `请从图片中提取与商品卖点相关的中文短语或词组，输出JSON数组，示例：\n["抑菌配方","温和不刺激","便携包"]。只输出JSON，不要说明。`
  const validator = (text: string) => {
    try {
      let json = text
      const m = text.match(/```(?:json)?\n([\s\S]*?)\n```/i)
      if (m && m[1]) json = m[1]
      const arr = JSON.parse(json)
      if (Array.isArray(arr)) return arr.map((s: any) => String(s)).filter(Boolean)
    } catch {}
    return null
  }
  const phrases = await callWithSchema<string[]>({ prompt, needs: { vision: true }, policy, validator, autoRepair: true, images })
  return phrases || []
}

function applyConsistencyFilter(points: string[], phrases: string[]): string[] {
  if (!points || points.length === 0) return points
  const phraseSet = new Set(phrases.map(p => p.trim()))
  const keep: string[] = []
  const generic = ['精选优质', '独特设计', '满足需求', '高品质', '用户体验', '一站式']
  for (const p of points) {
    const matched = Array.from(phraseSet).some(ph => p.includes(ph) || ph.includes(p))
    const isGeneric = generic.some(g => p.includes(g))
    if (matched && !isGeneric) keep.push(p)
  }
  // 若过滤后过少，保底返回前几条去重
  if (keep.length < Math.min(3, points.length)) {
    const extra = points.filter(p => !keep.includes(p)).slice(0, Math.max(0, 5 - keep.length))
    return Array.from(new Set([...keep, ...extra]))
  }
  return keep.slice(0, 10)
}

export async function runCompetitorContract(params: CompetitorContractParams): Promise<CompetitorOutput> {
  const evidences: Evidence[] = ensureUsableInput(params.input, params.policy.allowFallback)
  // build default prompt if none provided
  const defaultPrompt = `角色：你是跨境电商品类运营专家。\n\n目标商品：{productName}\n类目：{category}\n已知痛点（可为空）：{painPoints}\n\n任务：仅基于【证据】（文本/链接/图片OCR关键词）提炼本商品可落地的卖点和目标受众，严禁杜撰/空话。\n\n强约束：\n1) 只输出 JSON，对象结构：\n{\n  \"description\": \"≤20字简短描述\",\n  \"sellingPoints\": [\"卖点1\",\"卖点2\", ... 共6-10条],\n  \"targetAudience\": \"目标受众描述（10-30字，可选）\"\n}\n2) 每条卖点10-20字；必须与证据中出现的词句一致或同义改写，禁止"精选优质/专业指导/满足需求/提升点击/一站式"等模板化话术。\n3) 优先使用与类目/痛点相关的关键词（示例：草本、抑菌、私处、温和、无刺激、便携、独立包装、柔软亲肤、PH、洁净）。\n4) 目标受众要结合商品类目和竞品信息分析，基于证据推断，不要臆造。\n5) 若证据不足，输出空数组：{\"description\":\"\", \"sellingPoints\":[], \"targetAudience\":\"\"}，不要自造内容。\n\n证据：\n{evidence}`
  const evidenceText = buildEvidenceSummary(evidences)
  const base = params.customPrompt || defaultPrompt
  const pain = (params.context?.painPoints || []).join('、') || '无'
  const metaFilled = base
    .replace(/\{productName\}/g, params.context?.productName || '')
    .replace(/\{category\}/g, params.context?.category || '')
    .replace(/\{painPoints\}/g, pain)
  const prompt = evidenceMode(evidenceText, metaFilled)

  // 若仅有图片而缺少文本证据，先进行轻量OCR增强证据
  const images = Array.isArray(params.input.images) ? params.input.images : undefined
  let ocrPhrases: string[] = []
  if (images && images.length > 0 && (!params.input.rawText || params.input.rawText.trim().length < 10)) {
    try {
      ocrPhrases = await extractTextFromImages(images, params.policy)
    } catch (e) {
      // 忽略OCR失败，继续用原证据
    }
  }

  const needs: ModelNeeds = { ...params.needs, vision: params.needs.vision || (images && images.length > 0) }
  const parsed = await callWithSchema<CompetitorOutput>({
    prompt,
    needs,
    policy: params.policy,
    validator: coerceCompetitorOutput,
    autoRepair: true,
    images
  })
  if (ocrPhrases.length > 0 && parsed?.sellingPoints) {
    parsed.sellingPoints = applyConsistencyFilter(parsed.sellingPoints, ocrPhrases)
  }
  return parsed
}


