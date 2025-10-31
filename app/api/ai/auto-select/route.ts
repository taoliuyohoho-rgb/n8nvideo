import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'


// AI模型验证状态文件
const VERIFIED_MODELS_FILE = path.join(process.cwd(), 'verified-models.json')

// 获取已验证的模型列表
function getVerifiedModels() {
  try {
    if (fs.existsSync(VERIFIED_MODELS_FILE)) {
      const data = fs.readFileSync(VERIFIED_MODELS_FILE, 'utf8')
      const models = JSON.parse(data)
      // 只返回已验证的模型（status为'verified'）
      return models.filter((m: any) => m.status === 'verified')
    }
  } catch (error) {
    console.error('读取已验证模型列表失败:', error)
  }
  
  // 默认全部未验证，需用户手动验证
  return [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', verified: false, status: 'unverified' },
    { id: 'doubao-seed-1-6-lite', name: '豆包 Seed 1.6 Lite', provider: '字节跳动', verified: false, status: 'unverified' }
  ]
}

export async function POST(request: NextRequest) {
  try {
    const { productName, category, templateId, businessModule } = await request.json()

    if (!productName || !category || !businessModule) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 获取历史表现数据
    const historicalData = await getHistoricalPerformance({
      productName,
      category,
      templateId,
      businessModule
    })

    // 计算各AI模型的得分
    const modelScores = await calculateModelScores(historicalData, {
      productName,
      category,
      templateId,
      businessModule
    })

    // 选择得分最高的模型
    const bestModel = modelScores.reduce((best: any, current: any) => 
      current.score > best.score ? current : best
    )

    return NextResponse.json({
      success: true,
      selectedModel: bestModel.modelId,
      modelName: bestModel.modelName,
      score: bestModel.score,
      factors: bestModel.factors,
      alternatives: modelScores.slice(1, 3) // 提供备选方案
    })

  } catch (error) {
    console.error('自动选择模型失败:', error)
    return NextResponse.json(
      { success: false, error: '自动选择模型失败' },
      { status: 500 }
    )
  }
}

// 获取历史表现数据
async function getHistoricalPerformance(params: {
  productName: string
  category: string
  templateId?: string
  businessModule: string
}) {
  try {
    // 查询相关的历史数据
    const videos = await prisma.video.findMany({
      where: {
        // 根据产品名称和类目匹配
        OR: [
          { generatedPrompt: { contains: params.productName } },
          { generatedPrompt: { contains: params.category } }
        ],
        // 根据业务模块匹配
        ...(params.businessModule === 'videoScriptGeneration' && {
          templateId: params.templateId
        })
      },
      include: {
        template: true
      },
      take: 100 // 限制查询数量
    })

    // 模拟历史表现数据（实际应该从数据库获取）
    return {
      totalVideos: videos.length,
      performance: {
        'gemini-2.5-flash': {
          ctr: 0.12,
          cvr: 0.08,
          playRate3s: 0.75,
          usageCount: 45
        },
        'doubao-seed-1-6-lite': {
          ctr: 0.15,
          cvr: 0.10,
          playRate3s: 0.80,
          usageCount: 30
        },
        'deepseek-chat': {
          ctr: 0.11,
          cvr: 0.07,
          playRate3s: 0.72,
          usageCount: 25
        },
        'gpt-4': {
          ctr: 0.13,
          cvr: 0.09,
          playRate3s: 0.78,
          usageCount: 20
        }
      }
    }
  } catch (error) {
    console.error('获取历史数据失败:', error)
    return { totalVideos: 0, performance: {} }
  }
}

// 计算模型得分
async function calculateModelScores(historicalData: any, params: any) {
  // 从已验证的模型列表中获取
  const verifiedModels = getVerifiedModels()
  console.log('auto-select使用的已验证模型:', verifiedModels.map((m: any) => m.name))
  
  const models = verifiedModels.map((m: any) => ({
    id: m.id,
    name: m.name,
    provider: m.provider
  }))

  return models.map((model: any) => {
    const performance = historicalData.performance[model.id] || {
      ctr: 0.10,
      cvr: 0.06,
      playRate3s: 0.70,
      usageCount: 0
    }

    // 计算综合得分
    const ctrScore = performance.ctr * 0.3
    const cvrScore = performance.cvr * 0.3
    const playRateScore = performance.playRate3s * 0.2
    const usageScore = Math.min(performance.usageCount / 50, 1) * 0.2

    // 根据产品类目调整得分
    let categoryBonus = 0
    if (params.category === '电子产品' && model.provider === 'Google') {
      categoryBonus = 0.05 // Gemini在电子产品上表现更好
    } else if (params.category === '美妆护肤' && model.provider === '字节跳动') {
      categoryBonus = 0.05 // 豆包在美妆上表现更好
    }

    const totalScore = ctrScore + cvrScore + playRateScore + usageScore + categoryBonus

    return {
      modelId: model.id,
      modelName: model.name,
      score: Math.round(totalScore * 100) / 100,
      factors: {
        ctr: performance.ctr,
        cvr: performance.cvr,
        playRate3s: performance.playRate3s,
        usageCount: performance.usageCount,
        categoryBonus
      }
    }
  }).sort((a: any, b: any) => b.score - a.score)
}
