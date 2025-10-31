// 统一商品分析API
// 提供统一的商品分析接口，支持多种输入类型和分析场景

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { analyzeProduct, analyzeProductsBatch, getProductAnalysisCapabilities } from '@/src/services/analysis'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      productId, 
      inputType, 
      content, 
      context, 
      options,
      batch = false 
    } = body

    // 验证必需参数
    if (!productId) {
      return NextResponse.json(
        { success: false, error: '商品ID是必需的' },
        { status: 400 }
      )
    }

    if (!inputType || !content) {
      return NextResponse.json(
        { success: false, error: '输入类型和内容是必需的' },
        { status: 400 }
      )
    }

    // 单个商品分析
    if (!batch) {
      const result = await analyzeProduct({
        productId,
        inputType,
        content,
        context,
        options
      })

      return NextResponse.json(result)
    }

    // 批量分析
    if (!Array.isArray(content)) {
      return NextResponse.json(
        { success: false, error: '批量分析时内容必须是数组' },
        { status: 400 }
      )
    }

    const requests = content.map((item, index) => ({
      productId: Array.isArray(productId) ? productId[index] : productId,
      inputType,
      content: item,
      context,
      options
    }))

    const results = await analyzeProductsBatch(requests)

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      }
    })

  } catch (error) {
    console.error('统一商品分析失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '统一商品分析失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const capabilities = getProductAnalysisCapabilities()
    
    return NextResponse.json({
      success: true,
      data: {
        capabilities,
        description: '统一商品分析服务，支持多种输入类型和分析场景',
        version: '1.0.0',
        endpoints: {
          single: 'POST /api/product/unified-analyze',
          batch: 'POST /api/product/unified-analyze?batch=true',
          capabilities: 'GET /api/product/unified-analyze'
        }
      }
    })
  } catch (error) {
    console.error('获取分析能力失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '获取分析能力失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
