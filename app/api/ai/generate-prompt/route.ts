import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recommendRank } from '@/src/services/recommendation/recommend'
import '@/src/services/recommendation/index'
import { aiExecutor } from '@/src/services/ai/AiExecutor'
import { buildVideoPrompt } from '@/src/services/ai/video/VideoPromptBuilder'
import { resolveLanguages } from '@/src/services/ai/video/language'


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      productName,
      productImage,
      sellingPoints,
      marketingInfo,
      targetCountry,
      targetAudience,
      competitorUrl,
      referenceVideo,
      selectedStyleId,
      scriptId,
      scriptData,
      provider,
      voiceoverLang,
      enableProgress = false // 是否启用进度反馈
    } = body

    // 进度回调函数（已禁用，改为本地模拟）
    const updateProgress = async (step: string, progress: number, description?: string) => {
      // 不再调用不存在的进度API，避免404错误
      // 前端改用本地模拟进度
      if (enableProgress) {
        console.log(`Progress: ${step} - ${progress}% - ${description}`)
      }
    }

    // 获取选中的模板信息（可选）
    const selectedTemplate = selectedStyleId
      ? await prisma.template.findUnique({ where: { id: selectedStyleId } })
      : null

    // 步骤1: AI推荐配置
    await updateProgress('recommend', 10, '正在选择最佳模型和Prompt模板...')
    
    // 选择 Prompt 模板（task->prompt）——用于挑选 video-prompt 模板
    const promptReco = await recommendRank({
      scenario: 'task->prompt',
      task: { taskType: 'video-generation', contentType: 'video' },
      context: { region: targetCountry, businessModule: 'video-prompt' },
      constraints: { maxLatencyMs: 5000 },
    })
    
    await updateProgress('recommend', 20, 'Prompt模板推荐完成')

    // 步骤2: 模板处理（优先 video-prompt 模板）
    await updateProgress('template', 30, '正在处理Prompt模板和变量替换...')
    
    let promptTemplateText = ''
    let templateContent: string | null = null
    try {
      const tpl = await prisma.promptTemplate.findUnique({ where: { id: promptReco.chosen.id } })
      if (tpl?.content && tpl.businessModule === 'video-prompt') {
        templateContent = tpl.content
      }
      if (!templateContent && tpl?.content) {
        // 如果推荐返回了非 video-prompt 的模板，则忽略，仅用于回显；使用我们的视频模板或兜底
      }
      if (tpl?.content && tpl.businessModule !== 'video-prompt') {
        // 兼容旧逻辑：仅在无脚本时，才用文字替换生成简单提示
        // 确保默认变量被正确设置
        const defaultVariables = {
          minSellingPoints: 3,
          maxSellingPoints: 10,
          minPainPoints: 1,
          maxPainPoints: 5,
          maxOther: 3
        }
        
        promptTemplateText = tpl.content
          .replace(/\{\{minSellingPoints\}\}/g, String(defaultVariables.minSellingPoints))
          .replace(/\{\{maxSellingPoints\}\}/g, String(defaultVariables.maxSellingPoints))
          .replace(/\{\{minPainPoints\}\}/g, String(defaultVariables.minPainPoints))
          .replace(/\{\{maxPainPoints\}\}/g, String(defaultVariables.maxPainPoints))
          .replace(/\{\{maxOther\}\}/g, String(defaultVariables.maxOther))
          .replace(/\{\{productName\}\}/g, productName || '')
          .replace(/\{\{category\}\}/g, selectedTemplate?.recommendedCategories || '')
          .replace(/\{\{sellingPoints\}\}/g, Array.isArray(sellingPoints) ? sellingPoints.slice(0, 5).join(', ') : (sellingPoints || ''))
          .replace(/\{\{targetAudience\}\}/g, targetAudience || '')
          .replace(/\{\{targetCountry\}\}|\{\{country\}\}/g, targetCountry || '')
          .replace(/\{\{duration\}\}/g, '30')
          .replace(/\{\{painPoints\}\}/g, '用户痛点待分析')
          .replace(/\{\{usageScenarios\}\}/g, '使用场景待分析')
          .replace(/\{\{coreValue\}\}/g, Array.isArray(sellingPoints) ? sellingPoints[0] : (sellingPoints || ''))
      }
    } catch {}

    // 如果有脚本，则优先用脚本+人设+video-prompt模板生成高质量提示
    let builtPrompt: string | null = null
    if (scriptId || scriptData) {
      try {
        let scriptSnapshot = scriptData
        let personaSnapshot: any = null
        let productNameFromDb = productName || 'Product'
        let targetCountriesArr: string[] = []

        if (!scriptSnapshot && scriptId) {
          const dbScript = await prisma.script.findUnique({ where: { id: scriptId }, include: { product: true, persona: true } })
          if (dbScript) {
            productNameFromDb = dbScript.product?.name || productNameFromDb
            const tc = dbScript.product?.targetCountries
            const countryArr = Array.isArray((dbScript as any).product?.country) ? (dbScript as any).product?.country as string[] : []
            targetCountriesArr = countryArr.length > 0 ? countryArr : (typeof tc === 'string' ? safeParseStringArray(tc) : [])
            scriptSnapshot = {
              angle: dbScript.angle,
              energy: dbScript.energy,
              durationSec: dbScript.durationSec || 15,
              lines: dbScript.lines as any,
              shots: dbScript.shots as any,
              technical: dbScript.technical as any,
            }
            if (dbScript.persona) {
              const ci = coerceObj(dbScript.persona.coreIdentity)
              personaSnapshot = {
                id: dbScript.persona.id,
                name: ci && typeof ci === 'object' ? (ci as any).name : undefined,
                coreIdentity: ci,
                look: coerceObj(dbScript.persona.look),
                vibe: coerceObj(dbScript.persona.vibe),
                context: coerceObj(dbScript.persona.context),
              }
            }
          }
        }

        // 如果推荐模板不是 video-prompt，则尝试按角度选择 3C 模板
        if (!templateContent && scriptSnapshot?.angle) {
          const angleText = String(scriptSnapshot.angle).toLowerCase()
          let tplName: string | undefined
          if (angleText.includes('unboxing') || angleText.includes('开箱')) tplName = '3C-UGC-Unboxing-15s'
          else if (angleText.includes('feature') || angleText.includes('功能')) tplName = '3C-UGC-FeatureDemo-15s'
          else if (angleText.includes('benchmark') || angleText.includes('性能') || angleText.includes('速度')) tplName = '3C-UGC-PerformanceBenchmark-15s'
          else if (angleText.includes('solution') || angleText.includes('痛点')) tplName = '3C-UGC-ProblemSolution-15s'
          else if (angleText.includes('pov') || angleText.includes('教程') || angleText.includes('setup')) tplName = '3C-UGC-CreatorPOV-Setup-15s'
          if (tplName) {
            const tpl = await prisma.promptTemplate.findFirst({ where: { businessModule: 'video-prompt', name: tplName, isActive: true } })
            if (tpl?.content) templateContent = tpl.content
          }
        }

        const built = buildVideoPrompt({
          providerName: selectedTemplate?.videoGenerationAI || 'sora',
          productName: productNameFromDb,
          targetCountries: targetCountriesArr.length > 0 ? targetCountriesArr : (targetCountry ? [targetCountry] : []),
          script: scriptSnapshot,
          persona: personaSnapshot,
          templateContent: templateContent || undefined,
        })
        builtPrompt = built.prompt
      } catch {}
    }

    if (!builtPrompt && !promptTemplateText) {
      promptTemplateText = generateSoraPrompt({
        productName,
        sellingPoints,
        marketingInfo,
        targetCountry,
        targetAudience,
        selectedTemplate
      })
    }
    
    await updateProgress('template', 40, '模板处理完成')

    // 选择模型（task->model）
    const modelReco = await recommendRank({
      scenario: 'task->model',
      task: { taskType: 'video-script', contentType: 'text', jsonRequirement: false },
      context: { region: targetCountry },
      constraints: { maxLatencyMs: 5000 }, // 减少超时时间
    })
    
    await updateProgress('recommend', 50, '模型推荐完成')

    // 步骤3: 生成最终视频 Prompt（不再调用大模型，使用结构化渲染）
    await updateProgress('generate', 60, '正在生成视频Prompt...')
    const startTs = Date.now()
    let soraPrompt = builtPrompt || promptTemplateText
    const latencyMs = Date.now() - startTs
    await updateProgress('generate', 80, '视频Prompt生成完成')

    // 已不需要解析脚本JSON

    // 步骤4: 质量评估（跳过：Prompt为结构化渲染）
    const qualityEvaluation = null
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/recommend/feedback`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionId: modelReco.decisionId, eventType: 'execute_complete', payload: { chosenId: modelReco?.chosen?.id, latencyMs, success: true }, latencyMs })
      })
    } catch {}

    // 步骤5: 完成
    await updateProgress('complete', 100, '脚本生成完成，准备使用')

    return NextResponse.json({
      success: true,
      soraPrompt,
      prompt: soraPrompt, // 兼容字段
      templateInfo: selectedTemplate ? {
        name: selectedTemplate.name,
        description: selectedTemplate.description,
        structure: selectedTemplate.structure
      } : null,
      qualityEvaluation: qualityEvaluation,
      recommendations: {
        model: modelReco?.chosen ? {
          id: modelReco.chosen.id,
          title: modelReco.chosen.title || modelReco.chosen.id,
          provider: provider || selectedTemplate?.videoGenerationAI || 'sora'
        } : null,
        promptTemplate: promptReco?.chosen ? {
          id: promptReco.chosen.id,
          title: promptReco.chosen.title || promptReco.chosen.id
        } : null
      },
      meta: {
        providerUsed: provider || selectedTemplate?.videoGenerationAI || 'sora',
        instructionLang: resolveLanguages(provider || selectedTemplate?.videoGenerationAI || 'sora', Array.isArray(targetCountry) ? targetCountry : (targetCountry ? [targetCountry] : [])).instructionLang,
        voiceoverLang: voiceoverLang || undefined,
        templateChosen: templateContent ? true : false,
      }
    })

  } catch (error) {
    console.error('Prompt生成错误:', error)
    console.error('错误堆栈:', error instanceof Error ? error.stack : 'N/A')
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Prompt生成失败' },
      { status: 500 }
    )
  }
}

function generateSoraPrompt({
  productName,
  sellingPoints,
  marketingInfo,
  targetCountry,
  targetAudience,
  selectedTemplate
}: any) {
  // 构建基础prompt
  let prompt = `Create a professional product video for "${productName}" targeting ${targetCountry} market. `

  // 添加产品信息
  if (sellingPoints) {
    const points = Array.isArray(sellingPoints) ? sellingPoints : [sellingPoints]
    prompt += `Key selling points: ${points.join(', ')}. `
  }

  // 添加营销信息
  if (marketingInfo) {
    prompt += `Marketing message: ${marketingInfo}. `
  }

  // 添加目标受众
  if (targetAudience) {
    prompt += `Target audience: ${targetAudience}. `
  }

  // 添加模板信息
  if (selectedTemplate) {
    prompt += `Video structure: ${selectedTemplate.structure}. `
    prompt += `Hook style: ${selectedTemplate.hookPool}. `
    prompt += `Video style: ${selectedTemplate.videoStylePool}. `
    prompt += `Tone: ${selectedTemplate.tonePool}. `
    prompt += `Suggested length: ${selectedTemplate.suggestedLength}. `
  }

  // 添加技术要求
  prompt += `Technical requirements: High quality 4K video, smooth camera movements, professional editing, suitable for social media platforms. `

  // 添加时长和格式
  prompt += `Duration: 15-30 seconds, vertical format (9:16) for mobile viewing, with clear product visibility and engaging visuals.`

  return prompt
}

function safeParseStringArray(input: any): string[] {
  if (!input) return []
  if (Array.isArray(input)) return input.filter((x) => typeof x === 'string') as string[]
  if (typeof input === 'string') {
    const s = input.trim()
    if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('"') && s.endsWith('"'))) {
      try { const val = JSON.parse(s); return Array.isArray(val) ? val.filter((x) => typeof x === 'string') : [] } catch {}
    }
    return s.split(',').map((x) => x.trim()).filter(Boolean)
  }
  return []
}

function coerceObj<T = any>(val: any): T | null {
  if (!val) return null
  if (typeof val === 'object') return val as T
  if (typeof val === 'string') { try { const obj = JSON.parse(val); return typeof obj === 'object' && obj ? (obj as T) : null } catch { return null } }
  return null
}
