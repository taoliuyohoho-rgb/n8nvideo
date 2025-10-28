import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'
import { aiExecutor } from '@/src/services/ai/AiExecutor'
import { runCompetitorContract } from '@/src/services/ai/contracts'
import { CompetitorAnalysisService } from '@/src/services/competitor/CompetitorAnalysisService'

const prisma = new PrismaClient()

// 竞品解析服务（解析URL基础数据）
const competitorService = new CompetitorAnalysisService({
  supportedPlatforms: ['tiktok', 'youtube', 'instagram', 'facebook'],
  timeout: 30,
  maxRetries: 3
})

// 将模型标记为未验证（401/403时降级）
async function markModelAsUnverified(modelId: string) {
  try {
    const verifiedModelsFile = path.join(process.cwd(), 'verified-models.json')
    if (!fs.existsSync(verifiedModelsFile)) return
    const data = fs.readFileSync(verifiedModelsFile, 'utf8')
    const models = JSON.parse(data)
    const model = models.find((m: any) => m.id === modelId)
    if (model) {
      model.status = 'unverified'
      model.verified = false
      fs.writeFileSync(verifiedModelsFile, JSON.stringify(models, null, 2))
      console.log(`⚠️ 模型 ${model.name} 已标记为未验证`)
    }
  } catch (error) {
    console.error('更新模型验证状态失败:', error)
  }
}

// 解析AI返回的描述与卖点
function parseCompetitorAIResponse(text: string): { description: string; sellingPoints: string[] } {
  // 优先解析JSON
  try {
    let jsonCandidate = text
    const codeBlock = text.match(/```(?:json)?\n([\s\S]*?)\n```/i)
    if (codeBlock && codeBlock[1]) jsonCandidate = codeBlock[1]
    const obj = JSON.parse(jsonCandidate)
    // 兼容多种键名
    const description = (obj.description || obj.desc || obj.summary || '').toString().trim()
    const rawPoints = obj.sellingPoints || obj.selling_points || obj.points || obj.bullets || []
    const pointsRaw = Array.isArray(rawPoints) ? rawPoints : []
    const sellingPoints = pointsRaw
      .map((p: any) => (typeof p === 'string' ? p : (p?.text || p?.title || '')))
      .map((s: string) => s.trim())
      .filter((s: string) => s)
      .slice(0, 12)
    if (description || sellingPoints.length > 0) {
      const finalDesc = description ? description.slice(0, 20) : ''
      return { description: finalDesc, sellingPoints }
    }
  } catch (e) {
    // ignore
  }
  // 回退：从行文本提取卖点
  const lines = text.replace(/\r/g, '\n').split('\n').map(l => l.trim()).filter(Boolean)
  const sellingPoints: string[] = []
  for (const line of lines) {
    const m = line.match(/^[-•\d\)]+\s*(.+)$/) || line.match(/^(.{8,})$/)
    if (m && m[1]) sellingPoints.push(m[1])
  }
  const uniq = Array.from(new Set(sellingPoints)).slice(0, 8)
  // 用第一条卖点作为兜底描述（20字以内）
  const fallbackDesc = uniq[0] ? uniq[0].slice(0, 20) : ''
  return { description: fallbackDesc, sellingPoints: uniq }
}

// 基于竞品解析结果生成描述与卖点（复用 aiExecutor）
async function generateDescriptionAndSellingPoints(
  productName: string,
  competitorSummaries: Array<{ title?: string; description?: string; keyPoints?: string[]; sellingPoints?: string[] }>,
  customPrompt?: string
): Promise<{ description: string; sellingPoints: string[] }> {
  const defaultPrompt = `你是资深跨境电商运营。现在基于以下竞品要点，为“{productName}”生成：
1) 一段中文商品描述（20字以内，简短扼要）
2) 6-10条中文卖点（每条10-20字，尽量与竞品一致，不得杜撰；输出为JSON数组）

必须严格输出JSON对象：
{
  "description": "...",
  "sellingPoints": ["...","..."]
}

竞品要点：
{competitors}
`
  const competitorsBlock = competitorSummaries.map((c, i) => {
    const parts: string[] = []
    if (c.title) parts.push(`标题: ${c.title}`)
    if (c.description) parts.push(`描述: ${c.description}`)
    if (Array.isArray(c.keyPoints) && c.keyPoints.length) parts.push(`要点: ${c.keyPoints.join('；')}`)
    if (Array.isArray(c.sellingPoints) && c.sellingPoints.length) parts.push(`卖点: ${c.sellingPoints.join('；')}`)
    return `#${i + 1} ${parts.join('\n')}`
  }).join('\n\n')

  const prompt = (customPrompt || defaultPrompt)
    .replace(/\{productName\}/g, productName)
    .replace(/\{competitors\}/g, competitorsBlock)

  try {
    const text = await aiExecutor.enqueue(() => aiExecutor.execute({ provider: 'gemini', prompt, useSearch: false }))
    return parseCompetitorAIResponse(text)
  } catch (err: any) {
    const status = err?.status
    if (status === 401 || status === 403) {
      await markModelAsUnverified('gemini-2.5-flash')
    }
    throw err
  }
}

// 直接基于URL列表进行AI生成（启用搜索，适配淘宝等站点）
async function generateFromUrls(
  productName: string,
  urls: string[],
  customPrompt?: string
): Promise<{ description: string; sellingPoints: string[] }> {
  const defaultPrompt = `你是资深跨境电商运营。请基于以下竞品链接（可自行检索补充信息）总结，
为“{productName}”生成：
1) 一段中文商品描述（20字以内，简短扼要）
2) 6-10条中文卖点（每条10-20字，直接从竞品页面提取，不得杜撰；输出为JSON数组）

严格输出JSON对象：
{"description":"...","sellingPoints":["...","..."]}

竞品链接：\n{links}`
  const prompt = (customPrompt || defaultPrompt)
    .replace(/\{productName\}/g, productName)
    .replace(/\{links\}/g, urls.join('\n'))

  try {
    const text = await aiExecutor.enqueue(() => aiExecutor.execute({ provider: 'gemini', prompt, useSearch: true }))
    return parseCompetitorAIResponse(text)
  } catch (err: any) {
    const status = err?.status
    if (status === 401 || status === 403) {
      await markModelAsUnverified('gemini-2.5-flash')
    }
    throw err
  }
}

export async function POST(request: NextRequest) {
  try {
    const { productIds, urls, productLinks, model = 'auto', prompt, allowFallback = false, rawText, images, videoUrl } = await request.json()

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '请选择商品' },
        { status: 400 }
      )
    }
    // urls 可选：如果提供 productLinks，则按商品单独生效

    // 读取商品
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    })
    if (products.length === 0) {
      return NextResponse.json(
        { success: false, error: '未找到选中的商品' },
        { status: 404 }
      )
    }

    // 为每个商品创建一个“竞品分析”任务（优先 competitor_tasks，不存在则回退 comment_scraping_tasks）
    const tasks = [] as any[]
    const hasCompetitorTasks = !!((prisma as any).competitorTask && (prisma as any).competitorTask.create)
    for (const p of products) {
      let task: any
      if (hasCompetitorTasks) {
        task = await (prisma as any).competitorTask.create({
          data: {
            productId: p.id,
            status: 'pending',
            input: JSON.stringify({
              url: Array.isArray(productLinks?.[p.id]) ? productLinks[p.id][0] : (Array.isArray(urls) ? urls[0] : ''),
              rawText,
              images,
              model,
              prompt
            }),
            idempotencyKey: `${p.id}:${(Array.isArray(urls) ? urls.join(',') : '')}:${(rawText || '').slice(0,50)}`
          }
        })
      } else {
        task = await prisma.commentScrapingTask.create({
          data: {
            productId: p.id,
            platform: 'competitor',
            status: 'pending',
            keywords: (Array.isArray(urls) ? urls.join(',') : '')
          }
        })
      }
      tasks.push(task)
    }

    // 异步处理：解析竞品 → AI生成描述/卖点 → 更新商品 → 更新任务
    setTimeout(async () => {
      for (const task of tasks) {
        try {
          if (hasCompetitorTasks) {
            await (prisma as any).competitorTask.update({ where: { id: task.id }, data: { status: 'running', startedAt: new Date() } })
          } else {
            await prisma.commentScrapingTask.update({ where: { id: task.id }, data: { status: 'running', startedAt: new Date() } })
          }

          const product = products.find(p => p.id === task.productId)
          if (!product) throw new Error('商品不存在')

          // 解析该商品对应的URL集合
          const urlsForProduct: string[] = Array.isArray(productLinks?.[product.id])
            ? productLinks[product.id]
            : (Array.isArray(urls) ? urls : [])

          // 当没有链接时，允许使用文本/图片/视频作为证据（不再强制要求URL）
          const hasUrl = Array.isArray(urlsForProduct) && urlsForProduct.length > 0
          const hasRawEvidence = (rawText && String(rawText).trim().length > 0) || (Array.isArray(images) && images.length > 0) || !!videoUrl
          if (!hasUrl && !hasRawEvidence) {
            throw new Error('未提供有效输入（链接/文本/图片/视频）')
          }

          // 解析全部URL（可用则利用解析器）
          const competitorResults = [] as any[]
          for (const u of urlsForProduct) {
            try {
              const r = await competitorService.analyzeCompetitor(u)
              competitorResults.push(r)
            } catch (e) {
              console.warn('解析竞品失败:', u, e)
            }
          }

          // 统一通过新AI契约处理（优先使用解析结果，否则走用户输入 -> 证据）
          const input = {
            url: hasUrl ? urlsForProduct[0] : '',
            rawText,
            images,
            videoUrl
          }
          let aiOutput: { description: string; sellingPoints: string[] }
          try {
            aiOutput = await runCompetitorContract({
              input,
              customPrompt: prompt,
              // 无链接或解析失败时不启用搜索；只有有链接但解析为空、且用户允许兜底时才需要search
              needs: { search: hasUrl && competitorResults.length === 0, vision: Array.isArray(images) && images.length > 0 },
              policy: { allowFallback, model, idempotencyKey: `${task.productId}:${(input.url||'')}:${(input.rawText||'').slice(0,50)}` },
              context: {
                productName: product.name,
                category: product.category,
                painPoints: (() => {
                  try { return product.painPoints ? JSON.parse(product.painPoints as any) : [] } catch { return [] }
                })()
              }
            })
          } catch (e: any) {
            const msg = e?.message || 'AI处理失败'
            // 写入ai_call_logs
            if ((prisma as any).aiCallLog && (prisma as any).aiCallLog.create) await (prisma as any).aiCallLog.create({ data: {
              business: 'competitor',
              model: model || 'auto',
              success: false,
              promptPreview: (prompt || '').slice(0, 200),
              rawPreview: '',
              error: msg
            }})
            if (hasCompetitorTasks) {
              await (prisma as any).competitorTask.update({ where: { id: task.id }, data: { status: 'failed', errorLog: msg, completedAt: new Date() } })
            } else {
              await prisma.commentScrapingTask.update({ where: { id: task.id }, data: { status: 'failed', errorLog: msg, completedAt: new Date() } })
            }
            console.warn('❌ 契约处理失败:', { taskId: task.id, productId: product.id, msg })
            continue
          }

          // 校验结果有效性；空结果判为失败，不写回
          const points = (aiOutput.sellingPoints || [])
            .map((s: any) => (typeof s === 'string' ? s.trim() : ''))
            .filter(Boolean)
          const desc = (aiOutput.description || '').trim().slice(0, 20)

          if (!desc && points.length === 0) {
          if (hasCompetitorTasks) {
            await (prisma as any).competitorTask.update({ where: { id: task.id }, data: { status: 'failed', errorLog: 'AI未返回有效的描述或卖点', completedAt: new Date() } })
          } else {
            await prisma.commentScrapingTask.update({ where: { id: task.id }, data: { status: 'failed', errorLog: 'AI未返回有效的描述或卖点', completedAt: new Date() } })
          }
            console.warn('⚠️ AI输出为空，任务置为失败:', { taskId: task.id, productId: product.id })
            continue
          }

          // 构造写回数据（只在有值时写，避免把原有值清空）
          const updateData: any = { updatedAt: new Date() }
          if (desc) updateData.description = desc
          if (points.length > 0) updateData.sellingPoints = JSON.stringify(points)

          const updated = await prisma.product.update({
            where: { id: product.id },
            data: updateData
          })
          if ((prisma as any).aiCallLog && (prisma as any).aiCallLog.create) await (prisma as any).aiCallLog.create({ data: {
            business: 'competitor',
            model: model || 'auto',
            success: true,
            promptPreview: (prompt || '').slice(0, 200),
            rawPreview: `${desc} | ${points.slice(0,2).join('、')}`.slice(0, 200)
          }})
          console.log('✅ 竞品写回完成:', {
            productId: product.id,
            descLen: (updated.description || '').length,
            pointsCount: points.length
          })

          if (hasCompetitorTasks) {
            await (prisma as any).competitorTask.update({ where: { id: task.id }, data: { status: 'completed', completedAt: new Date(), progress: 100 } })
          } else {
            await prisma.commentScrapingTask.update({ where: { id: task.id }, data: { status: 'completed', completedAt: new Date(), progress: 100 } })
          }
        } catch (e: any) {
          if (hasCompetitorTasks) {
            await (prisma as any).competitorTask.update({ where: { id: task.id }, data: { status: 'failed', errorLog: e?.message || '未知错误', completedAt: new Date() } })
          } else {
            await prisma.commentScrapingTask.update({ where: { id: task.id }, data: { status: 'failed', errorLog: e?.message || '未知错误', completedAt: new Date() } })
          }
          console.error('❌ 竞品分析失败:', {
            taskId: task.id,
            productId: task.productId,
            error: e?.message || e
          })
        }
      }
    }, 500)

    return NextResponse.json({
      success: true,
      message: `已创建${tasks.length}个竞品分析任务`,
      tasks: tasks.map(t => ({ taskId: t.id, productId: t.productId, platform: t.platform }))
    })
  } catch (error: any) {
    console.error('批量竞品分析失败:', error)
    return NextResponse.json(
      { success: false, error: error?.message || '服务器错误' },
      { status: 500 }
    )
  }
}


