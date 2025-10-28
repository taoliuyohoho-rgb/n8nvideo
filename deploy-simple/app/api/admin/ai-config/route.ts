import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 获取AI配置
export async function GET(request: NextRequest) {
  try {
    // 这里应该从数据库获取配置，暂时返回默认配置
    const defaultConfig = {
      videoAnalysisAI: {
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        apiKey: '',
        isActive: true
      },
      promptGenerationAI: {
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        apiKey: '',
        isActive: true
      },
      videoGenerationAI: {
        provider: 'sora',
        model: 'sora-1.0',
        apiKey: '',
        isActive: true
      }
    }

    return NextResponse.json({
      success: true,
      data: defaultConfig
    })
  } catch (error) {
    console.error('获取AI配置失败:', error)
    return NextResponse.json(
      { success: false, error: '获取AI配置失败' },
      { status: 500 }
    )
  }
}

// 保存AI配置
export async function POST(request: NextRequest) {
  try {
    const config = await request.json()

    // 验证配置格式
    if (!config.videoAnalysisAI || !config.promptGenerationAI || !config.videoGenerationAI) {
      return NextResponse.json(
        { success: false, error: '配置格式不正确' },
        { status: 400 }
      )
    }

    // 验证API Key
    const requiredFields = ['provider', 'model', 'apiKey', 'isActive']
    for (const aiType of ['videoAnalysisAI', 'promptGenerationAI', 'videoGenerationAI']) {
      for (const field of requiredFields) {
        if (!(field in config[aiType])) {
          return NextResponse.json(
            { success: false, error: `${aiType} 缺少 ${field} 字段` },
            { status: 400 }
          )
        }
      }
    }

    // 这里应该将配置保存到数据库
    // 暂时只返回成功响应
    console.log('保存AI配置:', config)

    // 模拟保存到数据库
    // 在实际应用中，这里应该将配置保存到数据库
    // 例如：await prisma.aiConfig.upsert({ ... })

    return NextResponse.json({
      success: true,
      message: 'AI配置保存成功',
      data: config
    })
  } catch (error) {
    console.error('保存AI配置失败:', error)
    return NextResponse.json(
      { success: false, error: '保存AI配置失败' },
      { status: 500 }
    )
  }
}
