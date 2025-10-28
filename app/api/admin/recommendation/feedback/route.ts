import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 用户反馈API - 记录用户选择的备选模型/Prompt
 * 用于推荐引擎的反馈闭环优化
 */
export async function POST(request: NextRequest) {
  try {
    const { decisionId, userChoice, type, reason, eventType, payload } = await request.json()

    if (!decisionId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数 decisionId' },
        { status: 400 }
      )
    }

    // 显式反馈（可选）
    let feedback: any = null
    if (userChoice && type) {
      feedback = await prisma.recommendationFeedback.create({
        data: {
          decisionId,
          feedbackType: type, // 'model' | 'prompt'
          chosenCandidateId: userChoice,
          reason: reason || null,
          createdAt: new Date()
        }
      })
    }

    // 记录事件
    const ev = await prisma.recommendationEvent.create({
      data: {
        decisionId,
        eventType: eventType || (feedback ? 'explicit_feedback' : 'custom'),
        payload: payload ? JSON.stringify(payload) : null,
        createdAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: { feedback, event: ev }
    })
  } catch (error) {
    console.error('记录反馈/事件失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '记录失败'
      },
      { status: 500 }
    )
  }
}

