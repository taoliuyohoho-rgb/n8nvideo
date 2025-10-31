import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runCompetitorContract } from '@/src/services/ai/contracts'

// 使用新的Contract直接处理竞品分析（绕过傻逼编排器）
async function processProductCompetitorAnalysis(
  product: Record<string, unknown>,
  urlsForProduct: string[],
  rawText?: string,
  images?: string[],
  videoUrl?: string,
  customPrompt?: string
): Promise<{ description: string; sellingPoints: string[]; painPoints: string[]; targetAudience: string }> {
  // 构建输入文本
  const textParts: string[] = []
  if (rawText) textParts.push(rawText)
  if (urlsForProduct.length > 0) {
    textParts.push(`竞品链接: ${urlsForProduct.join(', ')}`)
  }
  if (videoUrl) textParts.push(`视频链接: ${videoUrl}`)
  
  const competitorText = textParts.join('\n\n')

  // 直接调用 runCompetitorContract
  const result = await runCompetitorContract({
    input: {
      rawText: competitorText,
      images: images && images.length > 0 ? images : undefined
    },
    needs: {
      vision: !!(images && images.length > 0),
      search: false,
    },
    policy: {
      maxConcurrency: 3,
      timeoutMs: 30000,
      allowFallback: false
    } as any,
    customPrompt,
    context: {
      productName: String(product.name || ''),
      category: String(product.category || ''),
      painPoints: []
    }
  })

  // 生成描述（优先目标受众，其次第一个卖点）
  const description = result.targetAudience 
    ? result.targetAudience.slice(0, 20)
    : (result.sellingPoints[0] ? result.sellingPoints[0].slice(0, 20) : '')

  return {
    description,
    sellingPoints: result.sellingPoints.slice(0, 10),
    painPoints: result.painPoints || [],
    targetAudience: result.targetAudience || ''
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
    const tasks: Array<{ id: string; productId: string; platform: string }> = []
    const hasCompetitorTasks = !!(prisma as { competitorTask?: { create: unknown } }).competitorTask?.create
    for (const p of products) {
      let task: { id: string; productId: string; platform: string }
      if (hasCompetitorTasks) {
        task = await ((prisma as unknown) as { competitorTask: { create: (data: Record<string, unknown>) => Promise<{ id: string; productId: string; platform: string }> } }).competitorTask.create({
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
            await ((prisma as unknown) as { competitorTask: { update: (params: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<unknown> } }).competitorTask.update({ where: { id: task.id }, data: { status: 'running', startedAt: new Date() } })
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

          // 使用新的分析架构处理竞品分析
          let aiOutput: { description: string; sellingPoints: string[] }
          try {
            aiOutput = await processProductCompetitorAnalysis(
              product,
              urlsForProduct,
              rawText,
              images,
              videoUrl,
              prompt
            )
          } catch (e: unknown) {
            const msg = (e as Error)?.message || 'AI处理失败'
            // 写入ai_call_logs
            if ((prisma as { aiCallLog?: { create: unknown } }).aiCallLog?.create) {
              await ((prisma as unknown) as { aiCallLog: { create: (data: Record<string, unknown>) => Promise<unknown> } }).aiCallLog.create({ 
                data: {
                  business: 'competitor',
                  model: model || 'auto',
                  success: false,
                  promptPreview: (prompt || '').slice(0, 200),
                  rawPreview: '',
                  error: msg
                }
              })
            }
            if (hasCompetitorTasks) {
              await (prisma as any).competitorTask.update({ 
                where: { id: task.id }, 
                data: { status: 'failed', errorLog: msg, completedAt: new Date() } 
              })
            } else {
              await prisma.commentScrapingTask.update({ 
                where: { id: task.id }, 
                data: { status: 'failed', errorLog: msg, completedAt: new Date() } 
              })
            }
            console.warn('❌ 竞品分析失败:', { taskId: task.id, productId: product.id, msg })
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
          if ((prisma as any).aiCallLog?.create) {
            await (prisma as any).aiCallLog.create({ 
              data: {
                business: 'competitor',
                model: model || 'auto',
                success: true,
                promptPreview: (prompt || '').slice(0, 200),
                rawPreview: `${desc} | ${points.slice(0,2).join('、')}`.slice(0, 200)
              }
            })
          }
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


