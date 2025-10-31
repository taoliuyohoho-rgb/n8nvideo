import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { analyzeContent, createCompetitorAnalysisService } from '@/src/services/analysis'
import { runCompetitorContract } from '@/src/services/ai/contracts'
import { prisma } from '@/lib/prisma'
import { recommendRank } from '@/src/services/recommendation/recommend'
import '@/src/services/recommendation/index'

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

      // 2. 将base64图片转换为Buffer（仅接受 data:image/*;base64, 前缀的 DataURL）
      const imageBuffers = competitorImages ? competitorImages
        .filter((val: unknown) => typeof val === 'string' && (val as string).startsWith('data:image'))
        .map((base64: string, index: number) => {
        console.log(`[API] 处理图片 ${index + 1}:`, {
          originalLength: base64.length,
          hasPrefix: base64.includes(','),
          prefix: base64.substring(0, 50) + '...'
        })
        
        // 移除data:image/...;base64,前缀
        const base64Data = base64.includes(',') ? base64.split(',')[1] : base64
        const buffer = Buffer.from(base64Data, 'base64')
        
        console.log(`[API] 转换后图片 ${index + 1}:`, {
          bufferLength: buffer.length,
          firstBytes: Array.from(buffer.slice(0, 8)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')
        })
        
        return buffer
      }) : []

      // 3. 使用新的竞品分析Contract（直接调用，绕过编排器）
      const analysisResult = await runCompetitorContract({
        input: {
          rawText: competitorText || '',
          images: imageBuffers.length > 0 ? imageBuffers.map((buf: Buffer) => `data:image/jpeg;base64,${buf.toString('base64')}`) : undefined
        },
        needs: {
          vision: imageBuffers.length > 0,
          search: false
        } as any,
        policy: {
          timeoutMs: 30000,
          allowFallback: allowFallback || false
        } as any,
        customPrompt,
        context: {
          productName: product.name,
          category: product.category || '',
          painPoints: []
        }
      })

      console.log('[API] runCompetitorContract 返回:', JSON.stringify(analysisResult, null, 2))

      // 3. 处理分析结果并更新商品信息
      // runCompetitorContract 直接返回 CompetitorOutput 类型：
      // { description, sellingPoints, painPoints?, targetAudience? }
      // 注意：targetCountries 不从AI分析提取，而是从商品预设中读取
      const normalizedRoot = analysisResult || {}

      console.log('[API] AI分析结果原始数据(归一化后root):', JSON.stringify(normalizedRoot, null, 2))

      const coerceToArray = (val: unknown): string[] => {
        if (!val) return []
        if (Array.isArray(val)) return val.filter(Boolean).map(v => String(v).trim()).filter(Boolean)
        if (typeof val === 'string') {
          const s = val.trim()
          if (!s) return []
          return s.split(/[、，,;；\n\r\t|\/]/).map(x => x.trim()).filter(Boolean)
        }
        return []
      }

      const firstNonEmpty = (...candidates: unknown[]): string[] => {
        for (const c of candidates) {
          const arr = coerceToArray(c)
          if (arr.length > 0) return arr
        }
        return []
      }

      // 更健壮地提取卖点/痛点，兼容多种字段命名
      const root = normalizedRoot as Record<string, unknown>
      let sellingPoints: string[] = firstNonEmpty(
        root?.sellingPoints,
        root?.selling_points,
        root?.points,
        root?.bullets,
        root?.advantages,
        root?.highlights,
        root?.features,
        root?.pros,
        root?.卖点,
        root?.亮点,
        root?.特点,
        root?.优势
      )
      let painPoints: string[] = firstNonEmpty(
        root?.painPoints,
        root?.pain_points,
        root?.pains,
        root?.issues,
        root?.cons,
        root?.痛点,
        root?.问题,
        root?.劣势
      )
      // 目标受众：更健壮地提取并标准化为数组（补充更多同义字段）
      const targetAudienceList: string[] = firstNonEmpty(
        root?.targetAudiences,
        root?.targetAudience,
        root?.audience,
        root?.audiences,
        root?.targetUsers,
        root?.userSegments,
        root?.audienceSegments,
        root?.segments,
        root?.targetGroups,
        root?.用户群,
        root?.目标用户,
        root?.受众,
        root?.人群,
        root?.适用人群,
        root?.target
      )
      
      // 提取单个目标受众字符串（用于描述生成）
      const targetAudience = targetAudienceList.length > 0 ? targetAudienceList[0] : ''

      // 类目敏感过滤：避免图书类出现"防水/材质/耐用"等不相关词
      try {
        const productCategory = (product as { category?: string })?.category || ''
        const isBookCategory = typeof productCategory === 'string' && /书|图书|书籍/i.test(productCategory)
        if (isBookCategory) {
          const invalidTerms = /(防水|耐用|材质|轻便|多功能|智能|外观|机身|充电|续航|蓝牙|拍照|像素|噪音)/i
          sellingPoints = (sellingPoints || []).filter(p => !invalidTerms.test(String(p)))
          painPoints = (painPoints || []).filter(p => !invalidTerms.test(String(p)))
        }
      } catch {}

      // 兜底：若AI未提取到卖点，尝试从用户输入文本中解析 “卖点:” 行
      if (sellingPoints.length === 0 && typeof competitorText === 'string' && competitorText.trim()) {
        try {
          const rawMatches = Array.from(competitorText.matchAll(/卖点[:：]\s*([^\n\r]+)/g))
          const extracted: string[] = []
          for (const m of rawMatches) {
            const line = (m[1] || '').trim()
            if (!line) continue
            // 以常见分隔符切分：中文顿号/逗号/分号/英文逗号
            const parts = line.split(/[、,，;；]/).map(s => s.trim()).filter(Boolean)
            extracted.push(...parts)
          }
          const uniq = Array.from(new Set(extracted.map(s => s.trim()).filter(Boolean)))
          if (uniq.length > 0) {
            sellingPoints = uniq
            console.log('[API] 兜底解析卖点成功（来自文本“卖点:”行）:', sellingPoints.slice(0, 5))
          }
        } catch (e) {
          console.warn('[API] 兜底解析卖点失败:', e)
        }
      }
      
      console.log('[API] 提取到的数据:', {
        sellingPointsCount: sellingPoints.length,
        painPointsCount: painPoints.length,
        targetAudienceCount: targetAudienceList.length,
        sellingPoints: sellingPoints.slice(0, 3),
        painPoints: painPoints.slice(0, 3),
        targetAudience: targetAudience
      })

      // 解析现有卖点
      let existingSellingPointsList: string[] = []
      try {
        const productSellingPoints = (product as { sellingPoints?: string | string[] }).sellingPoints
        if (productSellingPoints) {
          if (typeof productSellingPoints === 'string') {
            existingSellingPointsList = JSON.parse(productSellingPoints)
          } else if (Array.isArray(productSellingPoints)) {
            existingSellingPointsList = productSellingPoints.filter(Boolean).map(s => String(s))
          }
        }
      } catch (e) {
        console.warn('解析sellingPoints失败:', e)
      }

      // 去重并添加新卖点
      let addedSellingPoints = 0
      const existingSet = new Set(existingSellingPointsList.map(sp => sp.trim().toLowerCase()))
      const newSellingPoints: string[] = []
      
      console.log('[API] 现有卖点数量:', existingSellingPointsList.length)
      
      for (const point of sellingPoints) {
        const normalizedPoint = String(point || '').trim()
        if (normalizedPoint && !existingSet.has(normalizedPoint.toLowerCase())) {
          newSellingPoints.push(normalizedPoint)
          existingSellingPointsList.push(normalizedPoint)
          addedSellingPoints++
          existingSet.add(normalizedPoint.toLowerCase())
          console.log('[API] 新增卖点:', normalizedPoint)
        } else if (normalizedPoint) {
          console.log('[API] 卖点已存在，跳过:', normalizedPoint)
        }
      }
      
      console.log('[API] 新增卖点统计:', {
        totalFromAI: sellingPoints.length,
        alreadyExists: sellingPoints.length - newSellingPoints.length,
        added: addedSellingPoints,
        finalTotal: existingSellingPointsList.length
      })

      // 解析现有痛点（兼容字符串/数组/对象数组）
      let existingPainPoints: string[] = []
      try {
        const productPainPoints = (product as { painPoints?: string | string[] }).painPoints
        if (productPainPoints) {
          const normalize = (val: unknown): string[] => {
            if (!val) return []
            if (Array.isArray(val)) {
              return val
                .map((item) => {
                  if (typeof item === 'string') return item
                  if (item && typeof item === 'object') {
                    const obj = item as Record<string, unknown>
                    return String(
                      obj.text || obj.painPoint || obj.point || obj.label || obj.value || ''
                    )
                  }
                  return ''
                })
                .map(s => String(s).trim())
                .filter(Boolean)
            }
            if (typeof val === 'string') {
              try {
                const parsed = JSON.parse(val)
                return normalize(parsed)
              } catch {
                return []
              }
            }
            return []
          }
          existingPainPoints = normalize(productPainPoints)
        }
      } catch {}

      // 合并痛点
      let addedPainPoints = 0
      const painSet = new Set(existingPainPoints.map(p => p.trim().toLowerCase()))
      console.log('[API] 现有痛点数量:', existingPainPoints.length)
      
      for (const p of painPoints as string[]) {
        const norm = String(p || '').trim()
        if (norm && !painSet.has(norm.toLowerCase())) {
          existingPainPoints.push(norm)
          painSet.add(norm.toLowerCase())
          addedPainPoints++
          console.log('[API] 新增痛点:', norm)
        } else if (norm) {
          console.log('[API] 痛点已存在，跳过:', norm)
        }
      }
      
      console.log('[API] 新增痛点统计:', {
        totalFromAI: painPoints.length,
        alreadyExists: painPoints.length - addedPainPoints,
        added: addedPainPoints,
        finalTotal: existingPainPoints.length
      })

      // 准备更新数据
      const updateData: Record<string, unknown> = {
        updatedAt: new Date()
      }

      // 更新商品描述（从竞品信息中提取，优先使用目标受众或第一个卖点；限制20字）
      const clamp20 = (s: string) => {
        const t = String(s || '').trim()
        return t.length <= 20 ? t : t.slice(0, 20)
      }
      if (targetAudience?.trim()) {
        updateData.description = clamp20(targetAudience)
        console.log('[API] 更新商品描述（目标受众）:', updateData.description)
      } else if (sellingPoints.length > 0) {
        updateData.description = clamp20(sellingPoints[0])
        console.log('[API] 更新商品描述（第一个卖点）:', updateData.description)
      }

      // 更新卖点（JSON字段存储为数组，保持与其他接口一致）
      if (addedSellingPoints > 0) {
        updateData.sellingPoints = existingSellingPointsList
      }

      // 兜底：若AI未提取到痛点，从文本中解析"痛点:"行
      if (painPoints.length === 0 && typeof competitorText === 'string' && competitorText.trim()) {
        try {
          const rawMatches = Array.from(competitorText.matchAll(/痛点[:：]\s*([^\n\r]+)/g))
          const extracted: string[] = []
          for (const m of rawMatches) {
            const line = (m[1] || '').trim()
            if (!line) continue
            const parts = line.split(/[、,，;；]/).map(s => s.trim()).filter(Boolean)
            extracted.push(...parts)
          }
          const uniq = Array.from(new Set(extracted.map(s => s.trim()).filter(Boolean)))
          if (uniq.length > 0) {
            for (const pt of uniq) {
              const key = pt.toLowerCase()
              if (!painSet.has(key)) {
                existingPainPoints.push(pt)
                painSet.add(key)
                addedPainPoints++
              }
            }
            console.log('[API] 兜底解析痛点成功（来自文本"痛点:"行）:', uniq.slice(0, 5))
          }
        } catch (e) {
          console.warn('[API] 兜底解析痛点失败:', e)
        }
      }

      // 更新痛点：强制写入（无论是否新增）
      updateData.painPoints = existingPainPoints
      updateData.painPointsLastUpdate = new Date()
      updateData.painPointsSource = 'ai-analysis'

      // 更新目标受众：强制写入（无论是否有新值）
      try {
        const existingAudience = Array.isArray((product as { targetAudience?: string | string[] }).targetAudience)
          ? ((product as { targetAudience: string[] }).targetAudience)
          : []
        const mergedAudience = Array.from(new Set([
          ...existingAudience.filter(Boolean).map(s => String(s).trim()),
          ...targetAudienceList.map(s => String(s || '').trim()).filter(Boolean)
        ]))
        updateData.targetAudience = mergedAudience
      } catch {
        updateData.targetAudience = targetAudienceList.map(s => String(s || '').trim()).filter(Boolean)
      }

      // 目标国家不从AI分析提取，保持商品原有设置

      // 执行数据库更新（检查是否有除updatedAt外的其他字段）
      const fieldsToUpdate = Object.keys(updateData).filter(key => key !== 'updatedAt')
      if (fieldsToUpdate.length > 0) {
        await prisma.product.update({
          where: { id: productId },
          data: updateData
        })
        
        console.log(`[API] 商品 ${productId} 数据已更新:`, {
          addedSellingPoints,
          addedPainPoints,
          totalSellingPoints: existingSellingPointsList.length,
          totalPainPoints: existingPainPoints.length,
          updatedFields: fieldsToUpdate,
          updateData
        })
      } else {
        console.log(`[API] 商品 ${productId} 无新增数据，跳过更新`)
      }

      // 额外：将本次痛点分析结果保存到 product_pain_points 表，便于历史追溯/统计
      try {
        if (Array.isArray(painPoints) && painPoints.length > 0) {
          await prisma.productPainPoint.create({
            data: {
              productId,
              platform: 'ai',
              productName: product.name || '',
              painPoints: JSON.stringify(painPoints),
              frequency: painPoints.length,
              // 预留字段，后续可填入更细的AI分析结果
              aiAnalysis: JSON.stringify({
                source: 'competitor-analysis',
                model: aiModel || 'auto',
                modelDecisionId: modelDecisionId || undefined,
                promptDecisionId: promptDecisionId || undefined
              })
            }
          })
        }
      } catch (e) {
        console.warn('[API] 保存痛点分析记录失败（不影响主流程）:', e)
      }

      // 4. 提交推荐系统反馈（非阻塞 + 超时保护 + 相对路径）
      const postFeedback = async (decisionId: string, notes: string) => {
        try {
          const controller = new AbortController()
          const t = setTimeout(() => controller.abort(), 1000)
          await fetch('/api/recommend/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ decisionId, notes, eventType: 'analysis_complete' }),
            signal: controller.signal
          }).catch(() => {})
          clearTimeout(t)
        } catch {}
      }
      if (modelDecisionId) postFeedback(modelDecisionId, `竞品分析成功，新增卖点${addedSellingPoints}个，痛点${addedPainPoints}个`)
      if (promptDecisionId) postFeedback(promptDecisionId, `Prompt执行成功，提取${addedSellingPoints}个卖点、${addedPainPoints}个痛点`)

      return NextResponse.json({
        success: true,
        data: {
          productId,
          addedSellingPoints,
          addedPainPoints,
          sellingPoints: existingSellingPointsList, // 返回完整的卖点列表，而不是新增的
          painPoints: existingPainPoints, // 返回完整的痛点列表
          targetAudience: targetAudience || null, // 使用提取的目标受众字符串
          analysisMetadata: (analysisResult as any).metadata
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

    // 使用新的分析架构处理URL输入
    const competitorService = createCompetitorAnalysisService()
    
    let result

    if (url) {
      // 单个URL分析（直接调用Contract）
      const analysisResult = await runCompetitorContract({
        input: {
          rawText: `竞品链接: ${url}`,
          images: undefined
        },
        needs: {
          vision: false,
          search: false,
        } as any,
        policy: {
          timeoutMs: 30000,
          allowFallback: false
        } as any,
        customPrompt: undefined,
        context: {
          productName: '',
          category: '',
          painPoints: []
        }
      })

      // analysisResult 已经是 CompetitorOutput 类型，直接返回
      result = analysisResult
    } else if (urls && Array.isArray(urls)) {
      // 批量URL分析（直接调用Contract）
      const analysisResults = await Promise.all(
        urls.map(async (urlItem) => {
          try {
            return await runCompetitorContract({
              input: {
                rawText: `竞品链接: ${urlItem}`,
                images: undefined
              },
              needs: {
                vision: false,
                search: false
              } as any,
              policy: {
                maxConcurrency: 3,
                timeoutMs: 30000,
                allowFallback: false
              } as any,
              customPrompt: undefined,
              context: {
                productName: '',
                category: '',
                painPoints: []
              }
            })
          } catch {
            return null
          }
        })
      )

      result = analysisResults.filter(Boolean)
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error: unknown) {
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

    // 批量URL分析（直接调用Contract）
    const analysisResults = await Promise.all(
      urls.map(async (url) => {
        try {
          const analysisResult = await runCompetitorContract({
            input: {
              rawText: `竞品链接: ${url}`,
              images: undefined
            },
            needs: {
              vision: false,
              search: false
            } as any,
            policy: {
              timeoutMs: 30000,
              allowFallback: false
            },
            customPrompt: undefined,
            context: {
              productName: '',
              category: '',
              painPoints: []
            }
          })
          return analysisResult
        } catch {
          return null
        }
      })
    )

    const results = analysisResults.filter(Boolean)
    
    // 简单的竞品比较（基于分析结果）
    const comparison = {
      totalCompetitors: results.length,
      commonSellingPoints: findCommonElements(
        results.map((r: any) => r?.combinedInsights?.sellingPoints || [])
      ),
      commonPainPoints: findCommonElements(
        results.map((r: any) => r?.combinedInsights?.painPoints || [])
      ),
      averageConfidence: results.reduce((sum: number, r: any) => sum + (r?.confidence || 0), 0) / (results.length || 1)
    }

    return NextResponse.json({
      success: true,
      data: {
        competitors: results,
        comparison
      }
    })

  } catch (error: unknown) {
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

// 辅助方法：查找共同元素
function findCommonElements(arrays: string[][]): string[] {
  if (arrays.length === 0) return []
  
  const firstArray = arrays[0]
  return firstArray.filter(item => 
    arrays.every(arr => arr.includes(item))
  )
}
