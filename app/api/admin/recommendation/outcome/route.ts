import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 记录推荐结果的Outcome指标
 * - latencyMs: 执行耗时
 * - editDistance: 编辑距离（用户修改程度）
 * - rejected: 是否拒绝/重跑
 * - conversion: 是否最终采用
 * - qualityScore: 综合质量评分
 */
export async function POST(request: NextRequest) {
  try {
    const {
      decisionId,
      latencyMs,
      editDistance,
      rejected,
      conversion,
      qualityScore,
      notes,
      addedSellingPoints,
      addedPainPoints,
      rerunCount
    } = await request.json()

    if (!decisionId) {
      return NextResponse.json(
        { success: false, error: '缺少 decisionId' },
        { status: 400 }
      )
    }

    // 检查是否已有outcome记录
    const existing = await prisma.recommendationOutcome.findUnique({
      where: { decisionId }
    })

    let outcome
    if (existing) {
      // 更新已有记录
      outcome = await prisma.recommendationOutcome.update({
        where: { decisionId },
        data: {
          latencyMs: latencyMs ?? existing.latencyMs,
          editDistance: editDistance ?? existing.editDistance,
          rejected: rejected ?? existing.rejected,
          conversion: conversion ?? existing.conversion,
          qualityScore: qualityScore ?? existing.qualityScore,
          notes: notes ?? existing.notes
        }
      })
    } else {
      // 创建新记录
      outcome = await prisma.recommendationOutcome.create({
        data: {
          decisionId,
          latencyMs: latencyMs ?? null,
          editDistance: editDistance ?? null,
          rejected: rejected ?? null,
          conversion: conversion ?? null,
          qualityScore: qualityScore ?? null,
          notes: notes ?? null
        }
      })
    }

    // 记录隐式反馈信号
    // 判定规则：
    // 1. 新增内容少 + 重跑多 -> implicit_negative
    // 2. 新增内容多 + 无重跑 -> implicit_positive
    // 3. 编辑距离大 -> implicit_negative
    let implicitSignal = null
    if (addedSellingPoints !== undefined && addedPainPoints !== undefined) {
      const totalAdded = addedSellingPoints + addedPainPoints
      if (totalAdded === 0 || (rerunCount && rerunCount > 1)) {
        implicitSignal = 'implicit_negative'
      } else if (totalAdded >= 3 && (!rerunCount || rerunCount === 0)) {
        implicitSignal = 'implicit_positive'
      }
    }

    if (editDistance !== undefined && editDistance > 0.3) {
      implicitSignal = 'implicit_negative'
    }

    // 记录隐式信号事件
    if (implicitSignal) {
      await prisma.recommendationEvent.create({
        data: {
          decisionId,
          eventType: implicitSignal,
          payload: JSON.stringify({
            addedSellingPoints,
            addedPainPoints,
            rerunCount,
            editDistance,
            reason: 'auto_inferred'
          })
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        outcome,
        implicitSignal
      }
    })
  } catch (error) {
    console.error('记录Outcome失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '记录失败'
      },
      { status: 500 }
    )
  }
}

