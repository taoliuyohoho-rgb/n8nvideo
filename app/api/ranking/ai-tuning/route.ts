import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


// AI一键调参接口
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      targetLevel = 'global', // global, category, product, template
      targetId,
      optimizationGoal = 'ctr' // ctr, cvr, roi, revenue
    } = body

    // 获取历史数据进行分析
    const historicalData = await getHistoricalPerformanceData(targetLevel, targetId)
    
    // 分析当前参数配置的问题
    const analysisResult = await analyzeParameterPerformance(historicalData)
    
    // 生成AI优化建议
    const aiSuggestions = await generateAIOptimizationSuggestions(analysisResult, optimizationGoal)
    
    // 应用AI建议（可选，或者返回建议让用户确认）
    const appliedConfig = await applyAISuggestions(aiSuggestions, targetLevel, targetId)

    return NextResponse.json({
      success: true,
      data: {
        analysis: analysisResult,
        suggestions: aiSuggestions,
        appliedConfig: appliedConfig,
        expectedImprovement: calculateExpectedImprovement(aiSuggestions, historicalData)
      }
    })

  } catch (error) {
    console.error('AI调参失败:', error)
    return NextResponse.json(
      { 
        error: 'AI调参失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// 获取历史表现数据
async function getHistoricalPerformanceData(level: string, levelId: string) {
  // 模拟获取历史数据
  // 实际实现中应该从数据库获取真实的广告表现数据
  
  const mockData = {
    currentMetrics: {
      ctr: 2.1,
      cvr: 1.8,
      roi: 3.2,
      revenue: 125000
    },
    historicalTrends: {
      ctr: [2.0, 2.1, 2.0, 2.2, 2.1, 2.0, 2.1],
      cvr: [1.8, 1.9, 1.7, 1.8, 1.8, 1.9, 1.8],
      roi: [3.1, 3.2, 3.0, 3.3, 3.2, 3.1, 3.2]
    },
    parameterHistory: {
      relevanceWeight: [30, 30, 30, 30, 30, 30, 30],
      qualityWeight: [25, 25, 25, 25, 25, 25, 25],
      diversityWeight: [25, 25, 25, 25, 25, 25, 25],
      recencyWeight: [20, 20, 20, 20, 20, 20, 20]
    },
    templatePerformance: [
      {
        templateId: 'TMP001',
        templateName: '科技感风格',
        productId: 'PROD001',
        productName: '无线蓝牙耳机',
        ctr: 2.1,
        cvr: 1.8,
        roi: 3.2,
        views: 10000,
        clicks: 210,
        conversions: 38
      },
      {
        templateId: 'TMP002',
        templateName: '运动风格',
        productId: 'PROD002',
        productName: '智能手表',
        ctr: 3.2,
        cvr: 2.5,
        roi: 4.1,
        views: 8000,
        clicks: 256,
        conversions: 64
      }
    ]
  }

  return mockData
}

// 分析参数表现
async function analyzeParameterPerformance(data: any) {
  const analysis = {
    issues: [] as any[],
    strengths: [] as any[],
    correlations: {} as any
  }

  // 分析CTR和CVR表现
  const avgCtr = data.currentMetrics.ctr
  const avgCvr = data.currentMetrics.cvr
  
  // 识别问题
  if (avgCtr < 2.5) {
    analysis.issues.push({
      type: 'low_ctr',
      message: 'CTR低于预期，相关性权重可能过高',
      severity: 'high',
      suggestion: '降低相关性权重，提高质量权重'
    })
  }

  if (avgCvr < 2.0) {
    analysis.issues.push({
      type: 'low_cvr',
      message: 'CVR表现不佳，多样性权重可能影响转化',
      severity: 'medium',
      suggestion: '调整多样性权重，优化转化路径'
    })
  }

  // 分析模板表现差异
  const templatePerformance = data.templatePerformance
  const performanceVariance = calculatePerformanceVariance(templatePerformance)
  
  if (performanceVariance > 0.5) {
    analysis.issues.push({
      type: 'high_variance',
      message: '模板表现差异较大，参数配置不够精准',
      severity: 'medium',
      suggestion: '针对不同商品*模板组合进行精细调参'
    })
  }

  // 识别优势
  if (avgCtr > 2.0 && avgCvr > 1.5) {
    analysis.strengths.push({
      type: 'stable_performance',
      message: '整体表现稳定，基础参数配置合理'
    })
  }

  return analysis
}

// 生成AI优化建议
async function generateAIOptimizationSuggestions(analysis: any, optimizationGoal: string) {
  const suggestions = []

  // 基于分析结果生成建议
  for (const issue of analysis.issues) {
    switch (issue.type) {
      case 'low_ctr':
        suggestions.push({
          type: 'parameter_adjustment',
          level: 'global',
          parameter: 'coarseRanking',
          changes: {
            relevance: 25, // 从30%降低到25%
            quality: 30,   // 从25%提高到30%
            diversity: 25,
            recency: 20
          },
          reasoning: '相关性权重过高导致低质量模板胜出，建议提高质量权重',
          expectedImprovement: {
            ctr: 0.3, // 预期CTR提升0.3%
            cvr: 0.2, // 预期CVR提升0.2%
            confidence: 0.85
          }
        })
        break

      case 'low_cvr':
        suggestions.push({
          type: 'parameter_adjustment',
          level: 'category',
          parameter: 'fineRanking',
          changes: {
            userPreference: 35, // 提高用户偏好权重
            businessValue: 35,  // 提高商业价值权重
            technicalQuality: 20,
            marketTrend: 10
          },
          reasoning: '优化转化路径，提高用户偏好和商业价值权重',
          expectedImprovement: {
            ctr: 0.1,
            cvr: 0.4,
            confidence: 0.75
          }
        })
        break

      case 'high_variance':
        suggestions.push({
          type: 'granular_tuning',
          level: 'product_template',
          parameter: 'custom',
          changes: {
            'PROD001_TMP001': {
              relevance: 20,
              quality: 40,
              diversity: 20,
              recency: 20
            },
            'PROD002_TMP002': {
              relevance: 35,
              quality: 25,
              diversity: 25,
              recency: 15
            }
          },
          reasoning: '针对不同商品*模板组合进行精细调参',
          expectedImprovement: {
            ctr: 0.5,
            cvr: 0.6,
            confidence: 0.90
          }
        })
        break
    }
  }

  return suggestions
}

// 应用AI建议
async function applyAISuggestions(suggestions: any[], level: string, levelId: string) {
  const appliedConfig: any = {}

  for (const suggestion of suggestions) {
    // 这里应该实际更新数据库中的配置
    // 目前只是返回模拟的配置更新
    
    if (suggestion.type === 'parameter_adjustment') {
      appliedConfig[suggestion.parameter] = suggestion.changes
    }
  }

  return appliedConfig
}

// 计算预期改进
function calculateExpectedImprovement(suggestions: any[], historicalData: any) {
  let totalCtrImprovement = 0
  let totalCvrImprovement = 0
  let totalConfidence = 0

  for (const suggestion of suggestions) {
    totalCtrImprovement += suggestion.expectedImprovement.ctr
    totalCvrImprovement += suggestion.expectedImprovement.cvr
    totalConfidence += suggestion.expectedImprovement.confidence
  }

  const avgConfidence = totalConfidence / suggestions.length

  return {
    ctrImprovement: totalCtrImprovement,
    cvrImprovement: totalCvrImprovement,
    roiImprovement: totalCtrImprovement * totalCvrImprovement * 0.8, // 估算ROI改进
    revenueImprovement: historicalData.currentMetrics.revenue * (totalCtrImprovement + totalCvrImprovement) / 100,
    confidence: avgConfidence
  }
}

// 计算表现方差
function calculatePerformanceVariance(templatePerformance: any[]) {
  const ctrs = templatePerformance.map(t => t.ctr)
  const mean = ctrs.reduce((a, b) => a + b, 0) / ctrs.length
  const variance = ctrs.reduce((acc, ctr) => acc + Math.pow(ctr - mean, 2), 0) / ctrs.length
  return Math.sqrt(variance) / mean // 变异系数
}

// 获取AI调参历史
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level') || 'global'
    const levelId = searchParams.get('levelId') || ''

    // 模拟获取AI调参历史
    const history = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        level: 'global',
        changes: {
          relevance: 30,
          quality: 25
        },
        result: {
          ctrImprovement: 0.3,
          cvrImprovement: 0.2,
          roiImprovement: 0.25
        },
        status: 'applied'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        level: 'category',
        levelId: 'electronics',
        changes: {
          relevance: 35,
          quality: 30
        },
        result: {
          ctrImprovement: 0.5,
          cvrImprovement: 0.4,
          roiImprovement: 0.45
        },
        status: 'applied'
      }
    ]

    return NextResponse.json({
      success: true,
      data: history
    })

  } catch (error) {
    console.error('获取AI调参历史失败:', error)
    return NextResponse.json(
      { 
        error: '获取AI调参历史失败',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
