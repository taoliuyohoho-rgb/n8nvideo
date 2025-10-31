/**
 * 进度更新API
 * 用于实时更新脚本生成进度
 */

import { NextRequest, NextResponse } from 'next/server'

// 内存存储进度信息（生产环境建议使用Redis）
const progressStore = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { step, progress, description, timestamp } = body

    if (!step || progress === undefined) {
      return NextResponse.json(
        { success: false, error: 'step和progress参数必填' },
        { status: 400 }
      )
    }

    // 生成进度ID（基于时间戳）
    const progressId = `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 存储进度信息
    const progressData = {
      id: progressId,
      step,
      progress: Math.min(100, Math.max(0, progress)), // 确保在0-100范围内
      description,
      timestamp: timestamp || Date.now(),
      createdAt: new Date().toISOString()
    }

    progressStore.set(progressId, progressData)

    // 清理过期数据（超过1小时）
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    for (const [id, data] of progressStore.entries()) {
      if (data.timestamp < oneHourAgo) {
        progressStore.delete(id)
      }
    }

    return NextResponse.json({
      success: true,
      data: progressData
    })

  } catch (error) {
    console.error('Progress update error:', error)
    return NextResponse.json(
      { success: false, error: '进度更新失败' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const progressId = searchParams.get('id')

    if (progressId) {
      // 获取特定进度
      const progress = progressStore.get(progressId)
      if (!progress) {
        return NextResponse.json(
          { success: false, error: '进度不存在' },
          { status: 404 }
        )
      }
      return NextResponse.json({
        success: true,
        data: progress
      })
    } else {
      // 获取所有进度
      const allProgress = Array.from(progressStore.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 100) // 最多返回100条

      return NextResponse.json({
        success: true,
        data: allProgress
      })
    }

  } catch (error) {
    console.error('Progress fetch error:', error)
    return NextResponse.json(
      { success: false, error: '获取进度失败' },
      { status: 500 }
    )
  }
}
