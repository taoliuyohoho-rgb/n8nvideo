import { NextRequest, NextResponse } from 'next/server'
import { CompetitorAnalysisService } from '@/src/services/competitor/CompetitorAnalysisService'
import { PrismaClient } from '@prisma/client'
import { AiExecutor } from '@/src/services/ai/AiExecutor'
import { runCompetitorContract } from '@/src/services/ai/contracts'
import { recommendRank } from '@/src/services/recommendation/recommend'
import '@/src/services/recommendation/index'

const prisma = new PrismaClient()
const competitorService = new CompetitorAnalysisService({
  supportedPlatforms: ['tiktok', 'youtube', 'instagram', 'facebook'],
  timeout: 30,
  maxRetries: 3
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      url, 
      urls, 
      productId,
      competitorText, 
      competitorImages, 
      customPrompt, 
      aiModel, 
      modelDecisionId, 
      promptDecisionId,
      allowFallback 
    } = body

    // 工具：宽容解析JSON（容忍代码块/前后缀）
    const tryParseJson = (raw: string) => {
      if (!raw || typeof raw !== 'string') throw new Error('empty')
      const text = raw.trim()
      // 1) ```json ... ```
      const fenced = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/)
      if (fenced && fenced[1]) {
        const t = fenced[1].trim()
        return JSON.parse(t)
      }
      // 2) 截取第一个 { 到最后一个 }
      const start = text.indexOf('{')
      const end = text.lastIndexOf('}')
      if (start !== -1 && end !== -1 && end > start) {
        const mid = text.slice(start, end + 1)
        return JSON.parse(mid)
      }
      // 3) 直接尝试
      return JSON.parse(text)
    }

    // 新版：支持 productId + competitorText/Images
    if (productId && (competitorText || (competitorImages && competitorImages.length > 0))) {
      // 1. 获取商品信息
      const product = await prisma.product.findUnique({
        where: { id: productId }
      })

      if (!product) {
        return NextResponse.json(
          { success: false, error: '商品不存在' },
          { status: 404 }
        )
      }

      // 解析卖点(兼容字符串JSON/数组)和目标国家
      let existingSellingPointsList: string[] = []
      let targetCountriesList: string[] = []
      
      try {
        if ((product as any).sellingPoints) {
          const sp: any = (product as any).sellingPoints
          if (typeof sp === 'string') {
            existingSellingPointsList = JSON.parse(sp)
          } else if (Array.isArray(sp)) {
            existingSellingPointsList = sp.filter(Boolean).map((s: any) => String(s))
          }
        }
      } catch (e) {
        console.warn('解析sellingPoints失败:', e)
      }

      try {
        if (product.targetCountries) {
          targetCountriesList = JSON.parse(product.targetCountries)
        }
      } catch (e) {
        console.warn('解析targetCountries失败:', e)
      }

      // 2a. 若文本中包含URL，则后端尝试抓取并合并到文本
      let normalizedCompetitorText = competitorText || ''
      try {
        const urlInText = (normalizedCompetitorText.match(/https?:\/\/\S+/i) || [])[0]
        if (urlInText) {
          const resp = await fetch(urlInText, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) })
          if (resp.ok) {
            const html = await resp.text()
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
            const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
            const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
            let keyInfo = ''
            if (bodyMatch) {
              keyInfo = bodyMatch[1]
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 600)
            }
            const title = titleMatch ? titleMatch[1].trim() : ''
            const desc = descMatch ? descMatch[1].trim() : ''
            normalizedCompetitorText = [title, desc, keyInfo].filter(Boolean).join('\n')
          }
        }
      } catch {
        // 忽略抓取失败
      }

      // 2b. 构建Prompt（使用customPrompt或默认）
      const defaultPrompt = `# 任务
你是资深跨境电商运营专家。基于下方的**竞品详情页内容**（文本或图片），为我们的商品提取新的卖点和目标受众信息。

# 我们的商品信息
**商品名称**: ${product.name}
**所属类目**: ${product.category}
**目标市场**: ${targetCountriesList.length > 0 ? targetCountriesList.join(', ') : '东南亚'}

**已有卖点**（请避免重复）:
${existingSellingPointsList.length > 0 ? existingSellingPointsList.map((sp, i) => `${i + 1}. ${sp}`).join('\n') : '暂无'}

# 竞品详情页内容
${normalizedCompetitorText || '（见图片）'}

# 输出要求
严格按以下JSON格式输出，只输出JSON，不要任何解释：

{
  "sellingPoints": [
    "针对${product.name}提取的卖点1（10-25字）",
    "针对${product.name}提取的卖点2（10-25字）",
    "..."
  ],
  "targetAudience": "目标受众描述（10-30字，可选）"
}

**注意事项**：
1. 卖点必须适用于"${product.name}"这个商品，不要泛化
2. 从竞品内容中提取，但表述为适合我们商品的卖点
3. 每个卖点10-25字，简洁有力
4. 与已有卖点去重，提供新的角度
5. 目标受众要结合商品类目和竞品信息分析
6. 只基于输入证据，不得臆造
7. 至少提取3-8个卖点`

      // -- 用户自定义模板填充与健壮性 --
      const fillTemplate = (tpl: string, vars: Record<string, string>) =>
        tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (vars[k] ?? ''))

      // 尝试从文本中抽取一个URL作为占位
      const urlInText = (normalizedCompetitorText.match(/https?:\/\/\S+/i) || [])[0] || ''
      const urlForPrompt = (typeof url === 'string' && url) ? url : urlInText

      let finalPrompt = customPrompt || defaultPrompt
      if (customPrompt && typeof customPrompt === 'string') {
        // 1) 预填常见变量
        let candidate = fillTemplate(customPrompt, {
          competitorUrl: urlForPrompt,
          category: product.category || '',
          productName: product.name || '',
          targetCountry: (targetCountriesList && targetCountriesList[0]) || '',
          targetAudience: ''
        })
        // 2) 若模板缺少 {evidence} 占位，则追加证据占位，避免丢证据
        if (!candidate.includes('{evidence}')) {
          candidate = `${candidate}\n\n证据：\n{evidence}`
        }
        // 3) 若用户模板仍残留未替换的 {{...}} 或明确依赖URL而我们没有URL，则退回默认模板
        if (/\{\{\s*\w+\s*\}\}/.test(candidate) || (/\{\{\s*competitorUrl\s*\}\}/.test(customPrompt) && !urlForPrompt)) {
          finalPrompt = defaultPrompt
        } else {
          finalPrompt = candidate
        }
      }

      // 3. 调用AI分析（优先使用严格JSON校验合同执行，失败再回退）
      try {
        const parsed = await runCompetitorContract({
          input: {
            rawText: normalizedCompetitorText,
            images: Array.isArray(competitorImages) ? competitorImages : undefined,
          },
          needs: { vision: Array.isArray(competitorImages) && competitorImages.length > 0 },
          policy: { allowFallback: true, model: 'auto', requireJsonMode: true },
          customPrompt: finalPrompt,
          context: { productName: product.name, category: product.category }
        })

        const sellingPoints = Array.isArray(parsed?.sellingPoints) ? parsed.sellingPoints : []
        const targetAudience = parsed?.targetAudience || ''

        // 保存卖点到数据库
        let addedSellingPoints = 0
        const existingSet = new Set(existingSellingPointsList.map(sp => sp.trim().toLowerCase()))
        for (const point of sellingPoints) {
          const normalizedPoint = String(point || '').trim()
          if (normalizedPoint && !existingSet.has(normalizedPoint.toLowerCase())) {
            existingSellingPointsList.push(normalizedPoint)
            addedSellingPoints++
            existingSet.add(normalizedPoint.toLowerCase())
          }
        }

        // 准备更新数据
        const updateData: any = {
          updatedAt: new Date()
        }

        // 更新卖点
        if (addedSellingPoints > 0) {
          updateData.sellingPoints = JSON.stringify(existingSellingPointsList)
        }

        // 更新目标受众（如果AI提取到了新的目标受众）
        if (targetAudience && targetAudience.trim()) {
          updateData.targetAudience = targetAudience.trim()
        }

        // 执行数据库更新
        if (Object.keys(updateData).length > 1) { // 除了updatedAt还有其他字段
          await prisma.product.update({
            where: { id: productId },
            data: updateData
          })
        }

        // 反馈（可选，沿用原逻辑）
        if (modelDecisionId) {
          try {
            await fetch('http://localhost:3000/api/recommend/feedback', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ decisionId: modelDecisionId, accepted: true, bucket: 'fine', notes: `竞品分析成功，新增卖点${addedSellingPoints}个` })
            })
          } catch {}
        }
        if (promptDecisionId) {
          try {
            await fetch('http://localhost:3000/api/recommend/feedback', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ decisionId: promptDecisionId, accepted: true, bucket: 'fine', notes: `Prompt执行成功，提取${addedSellingPoints}个卖点` })
            })
          } catch {}
        }

        return NextResponse.json({ 
          success: true, 
          data: { 
            productId, 
            addedSellingPoints, 
            addedPainPoints: 0, 
            sellingPoints,
            targetAudience: targetAudience || null
          } 
        })
      } catch (e) {
        // 合同执行失败则回退旧路径
      }

      // 回退执行
      const aiExecutor = new AiExecutor()
      
      // 解析provider
      // 通过推荐引擎获取模型候选链（优先使用前端传入的模型名，其次服务端重算一遍）
      const modelFallbackNames: string[] = []
      const parseProvider = (name: string): 'gemini' | 'doubao' | 'openai' | 'deepseek' | 'claude' => {
        const p = (name || '').split('/')?.[0]?.toLowerCase() || ''
        if (p === 'google' || p === 'gemini') return 'gemini'
        if (p === 'openai' || p === 'gpt') return 'openai'
        if (p === 'doubao' || p === '字节跳动' || p === 'bytedance') return 'doubao'
        if (p === 'deepseek') return 'deepseek'
        if (p === 'claude' || p === 'anthropic') return 'claude'
        return 'openai'
      }

      if (aiModel && typeof aiModel === 'string') {
        modelFallbackNames.push(aiModel)
      }

      try {
        const reco = await recommendRank({
          scenario: 'task->model',
          task: {
            taskType: 'competitor-analysis',
            contentType: (competitorImages && competitorImages.length > 0) ? 'image' : 'text',
            jsonRequirement: true
          },
          context: {
            channel: 'web'
          },
          constraints: {
            requireJsonMode: true,
            maxLatencyMs: 10000
          },
          options: { strategyVersion: 'v1' }
        })
        const chain: string[] = []
        if (reco?.chosen?.name) chain.push(reco.chosen.name)
        if (reco?.topK?.[1]?.name) chain.push(reco.topK[1].name)
        if (Array.isArray(reco?.alternatives?.coarseExtras)) {
          for (const c of reco.alternatives.coarseExtras) if (c?.name) chain.push(c.name)
        }
        if (Array.isArray(reco?.alternatives?.outOfPool)) {
          for (const c of reco.alternatives.outOfPool) if (c?.name) chain.push(c.name)
        }
        // 将服务端候选追加到链尾（避免与前端重复）
        for (const n of chain) if (n && !modelFallbackNames.includes(n)) modelFallbackNames.push(n)
      } catch (e) {
        console.warn('服务端获取模型候选失败，继续使用前端提供的模型:', e)
      }

      // 至少保证有一项
      if (modelFallbackNames.length === 0) modelFallbackNames.push('gemini/gemini-1.5-flash')

      console.log('竞品分析 - 模型候选链:', modelFallbackNames)
      
      // 顺序尝试：Top1 → Top2 → 粗排2个 → 池外2个
      let analysisResult: string | null = null
      const tryErrors: string[] = []
      for (const name of modelFallbackNames) {
        const provider = parseProvider(name)
        try {
          console.log(`尝试执行模型: ${name} (provider=${provider})`)
          analysisResult = await aiExecutor.execute({
            provider,
            prompt: finalPrompt,
            useSearch: false,
            images: competitorImages || []
          })
          if (analysisResult) break
        } catch (err: any) {
          const msg = err?.message || 'unknown'
          console.warn(`模型失败: ${name} → ${msg}`)
          tryErrors.push(`${name}: ${msg}`)
          continue
        }
      }
      if (!analysisResult) {
        return NextResponse.json({
          success: false,
          error: 'AI分析失败',
          details: `所有候选模型均失败: ${tryErrors.join(' | ')}`
        }, { status: 500 })
      }

      // 4. 解析结果（宽容解析）
      let parsedResult
      try {
        parsedResult = tryParseJson(analysisResult)
      } catch (e) {
        console.error('JSON解析失败:', analysisResult)
        return NextResponse.json({
          success: false,
          error: 'AI返回结果格式错误',
          details: analysisResult
        }, { status: 500 })
      }

      const { sellingPoints = [], targetAudience } = parsedResult

      // 5. 保存卖点和目标受众到数据库（去重并更新JSON字符串）
      let addedSellingPoints = 0
      const existingSet = new Set(existingSellingPointsList.map(sp => sp.trim().toLowerCase()))
      const newSellingPoints: string[] = []
      
      for (const point of sellingPoints) {
        const normalizedPoint = point.trim()
        if (normalizedPoint && !existingSet.has(normalizedPoint.toLowerCase())) {
          newSellingPoints.push(normalizedPoint)
          existingSellingPointsList.push(normalizedPoint) // 添加到已有列表
          addedSellingPoints++
          existingSet.add(normalizedPoint.toLowerCase()) // 避免本次提取的重复
        }
      }

      // 准备更新数据
      const updateData: any = {
        updatedAt: new Date()
      }

      // 更新卖点
      if (addedSellingPoints > 0) {
        updateData.sellingPoints = existingSellingPointsList as any
      }

      // 更新目标受众（如果AI提取到了新的目标受众）
      if (targetAudience && targetAudience.trim()) {
        updateData.targetAudience = targetAudience.trim()
      }

      // 执行数据库更新
      if (Object.keys(updateData).length > 1) { // 除了updatedAt还有其他字段
        await prisma.product.update({
          where: { id: productId },
          data: updateData
        })
      }

      // 6. 提交推荐系统反馈
      if (modelDecisionId) {
        try {
          await fetch('http://localhost:3000/api/recommend/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              decisionId: modelDecisionId,
              accepted: true,
              bucket: 'fine',
              notes: `竞品分析成功，新增卖点${addedSellingPoints}个`
            })
          })
        } catch (e) {
          console.error('提交模型反馈失败:', e)
        }
      }

      if (promptDecisionId) {
        try {
          await fetch('http://localhost:3000/api/recommend/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              decisionId: promptDecisionId,
              accepted: true,
              bucket: 'fine',
              notes: `Prompt执行成功，提取${addedSellingPoints}个卖点`
            })
          })
        } catch (e) {
          console.error('提交Prompt反馈失败:', e)
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          productId,
          addedSellingPoints,
          addedPainPoints: 0, // 暂不处理痛点
          sellingPoints,
          targetAudience: targetAudience || null
        }
      })
    }

    // 旧版：兼容 URL 输入
    if (!url && !urls) {
      return NextResponse.json(
        { error: 'URL or URLs are required (or provide productId with competitorText/Images)' },
        { status: 400 }
      )
    }

    let result

    if (url) {
      // 单个URL分析
      result = await competitorService.analyzeCompetitor(url)
    } else if (urls && Array.isArray(urls)) {
      // 批量URL分析
      result = await competitorService.batchAnalyzeCompetitors(urls)
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Competitor analysis failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Competitor analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const urls = searchParams.get('urls')?.split(',') || []

    if (urls.length === 0) {
      return NextResponse.json(
        { error: 'URLs parameter is required' },
        { status: 400 }
      )
    }

    const results = await competitorService.batchAnalyzeCompetitors(urls)
    
    // 比较竞品
    const comparison = await competitorService.compareCompetitors(results)

    return NextResponse.json({
      success: true,
      data: {
        competitors: results,
        comparison
      }
    })

  } catch (error) {
    console.error('Competitor comparison failed:', error)
    return NextResponse.json(
      { 
        error: 'Competitor comparison failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
