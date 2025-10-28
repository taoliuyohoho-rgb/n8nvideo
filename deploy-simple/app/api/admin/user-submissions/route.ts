import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 获取用户提交列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // style, product
    const status = searchParams.get('status') // pending, approved, rejected
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {}
    if (type) where.type = type
    if (status) where.status = status

    const submissions = await prisma.userSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      // include: {
      //   // 这里可以添加用户信息的关联查询
      // }
    })

    const total = await prisma.userSubmission.count({ where })

    return NextResponse.json({
      success: true,
      data: {
        submissions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Get user submissions failed:', error)
    return NextResponse.json(
      { error: 'Failed to get user submissions' },
      { status: 500 }
    )
  }
}

// 创建用户提交
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      type,
      targetId,
      data,
      originalData,
      source,
      sourceVideoId,
      sourceUrl
    } = body

    if (!userId || !type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const submission = await prisma.userSubmission.create({
      data: {
        userId,
        type,
        targetId,
        data: JSON.stringify(data),
        originalData: originalData ? JSON.stringify(originalData) : null,
        source,
        sourceVideoId,
        sourceUrl
      }
    })

    return NextResponse.json({
      success: true,
      data: submission
    })

  } catch (error) {
    console.error('Create user submission failed:', error)
    return NextResponse.json(
      { error: 'Failed to create user submission' },
      { status: 500 }
    )
  }
}
