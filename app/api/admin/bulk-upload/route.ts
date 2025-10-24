import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Upload type is required' },
        { status: 400 }
      )
    }

    // 读取文件内容
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file must contain at least a header and one data row' },
        { status: 400 }
      )
    }

    // 解析CSV
    const headers = lines[0].split(',').map(h => h.trim())
    const dataRows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim())
      const row: Record<string, string> = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      return row
    })

    let processed = 0
    const errors: string[] = []

    if (type === 'products') {
      // 批量创建商品
      for (const row of dataRows) {
        try {
          await prisma.product.create({
            data: {
              name: row['商品名称'] || row['name'] || '',
              category: row['类目'] || row['category'] || '',
              subcategory: row['子类目'] || row['subcategory'] || '',
              sellingPoints: row['卖点'] || row['sellingPoints'] || '',
              targetCountries: row['目标国家'] || row['targetCountries'] || '',
              description: row['描述'] || row['description'] || '',
              skuImages: row['SKU图片'] || row['skuImages'] || ''
            }
          })
          processed++
        } catch (error) {
          console.error('Failed to create product:', error)
          errors.push(`商品 "${row['商品名称'] || row['name']}" 创建失败`)
        }
      }
    } else if (type === 'templates') {
      // 批量创建模板
      for (const row of dataRows) {
        try {
          await prisma.template.create({
            data: {
              templateId: row['模板ID'] || row['templateId'] || `TMP${Date.now()}`,
              name: row['模板名称'] || row['name'] || '',
              description: row['描述'] || row['description'] || '',
              productId: row['商品ID'] || row['productId'] || '',
              structure: row['结构'] || row['structure'] || '',
              hookPool: row['钩子池'] || row['hookPool'] || '',
              videoStylePool: row['视频风格池'] || row['videoStylePool'] || '',
              tonePool: row['语调池'] || row['tonePool'] || '',
              suggestedLength: row['建议时长'] || row['suggestedLength'] || '30',
              recommendedCategories: row['推荐类目'] || row['recommendedCategories'] || '',
              targetCountries: row['目标国家'] || row['targetCountries'] || '',
              templatePrompt: row['模板提示'] || row['templatePrompt'] || ''
            }
          })
          processed++
        } catch (error) {
          console.error('Failed to create template:', error)
          errors.push(`模板 "${row['模板名称'] || row['name']}" 创建失败`)
        }
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported upload type' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      processed,
      errors: errors.slice(0, 10), // 只返回前10个错误
      totalErrors: errors.length
    })

  } catch (error) {
    console.error('Bulk upload failed:', error)
    return NextResponse.json(
      { 
        error: 'Bulk upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
