import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { fetchTemplatesFromSheet, detectDuplicateTemplates, mergeSimilarTemplates } from '@/lib/google-sheets'
import { calculateTemplateSimilarity } from '@/lib/similarity-detection'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log('开始同步Google Sheets数据...')

    // 1. 从Google Sheets获取模板数据
    const templates = await fetchTemplatesFromSheet()
    console.log(`从Google Sheets获取到 ${templates.length} 个模板`)

    // 2. 检测重复模板
    const duplicates = detectDuplicateTemplates(templates, 80)
    console.log(`检测到 ${duplicates.length} 对重复模板`)

    // 3. 处理重复模板
    const processedTemplates = [...templates]
    const mergedTemplates = new Set<string>()

    for (const duplicate of duplicates) {
      const template1 = processedTemplates.find(t => t.templateId === duplicate.template1)
      const template2 = processedTemplates.find(t => t.templateId === duplicate.template2)
      
      if (template1 && template2 && !mergedTemplates.has(duplicate.template1) && !mergedTemplates.has(duplicate.template2)) {
        // 合并模板
        const merged = mergeSimilarTemplates(template1, template2)
        processedTemplates.push(merged)
        
        // 标记为已合并
        mergedTemplates.add(duplicate.template1)
        mergedTemplates.add(duplicate.template2)
        
        console.log(`合并模板: ${duplicate.template1} + ${duplicate.template2}`)
      }
    }

    // 4. 同步到数据库
    let syncedCount = 0
    let updatedCount = 0
    let createdCount = 0

    for (const template of processedTemplates) {
      if (mergedTemplates.has(template.templateId)) {
        continue // 跳过已合并的模板
      }

      try {
        // 检查是否已存在
        const existing = await prisma.template.findFirst({
          where: { 
            OR: [
              { templateId: template.templateId },
              { name: template.templateName }
            ]
          }
        })

        if (existing) {
          // 更新现有模板
          await prisma.template.update({
            where: { id: existing.id },
            data: {
              templateId: template.templateId,
              name: template.templateName,
              description: template.templatePrompt,
              productId: 'default-product', // 需要从商品库获取
              structure: template.structure,
              hookPool: template.hookPool,
              videoStylePool: template.videoStylePool,
              tonePool: template.tonePool,
              suggestedLength: template.suggestedLength,
              recommendedCategories: template.recommendedCategories,
              targetCountries: template.targetCountries,
              templatePrompt: template.templatePrompt,
              isActive: true
            }
          })
          updatedCount++
        } else {
          // 创建新模板
          await prisma.template.create({
            data: {
              templateId: template.templateId,
              name: template.templateName,
              description: template.templatePrompt,
              productId: 'default-product', // 需要从商品库获取
              structure: template.structure,
              hookPool: template.hookPool,
              videoStylePool: template.videoStylePool,
              tonePool: template.tonePool,
              suggestedLength: template.suggestedLength,
              recommendedCategories: template.recommendedCategories,
              targetCountries: template.targetCountries,
              templatePrompt: template.templatePrompt,
              isActive: true
            }
          })
          createdCount++
        }
        syncedCount++
      } catch (error) {
        console.error(`同步模板 ${template.templateId} 失败:`, error)
      }
    }

    // 5. 记录同步结果
    const syncResult = {
      totalTemplates: templates.length,
      duplicatesFound: duplicates.length,
      processedTemplates: processedTemplates.length,
      syncedCount,
      createdCount,
      updatedCount,
      duplicates: duplicates.map(d => ({
        template1: d.template1,
        template2: d.template2,
        similarity: d.similarity,
        reasons: d.reason
      }))
    }

    console.log('同步完成:', syncResult)

    return NextResponse.json({
      success: true,
      message: 'Google Sheets同步完成',
      data: syncResult
    })

  } catch (error) {
    console.error('同步Google Sheets失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '同步失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// 获取同步状态
export async function GET() {
  try {
    const totalTemplates = await prisma.template.count()
    const activeTemplates = await prisma.template.count({ where: { isActive: true } })
    
    return NextResponse.json({
      success: true,
      data: {
        totalTemplates,
        activeTemplates,
        lastSyncTime: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('获取同步状态失败:', error)
    return NextResponse.json(
      { success: false, error: '获取同步状态失败' },
      { status: 500 }
    )
  }
}
