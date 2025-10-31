import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'


// 获取单个用户
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            videos: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('获取用户详情失败:', error)
    return NextResponse.json(
      { success: false, error: '获取用户详情失败' },
      { status: 500 }
    )
  }
}

// 更新用户
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { email, name, password, role, isActive, organizationId } = await request.json()

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      )
    }

    // 如果更新邮箱，验证格式并检查是否已被其他用户使用
    if (email && email !== existingUser.email) {
      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: '邮箱格式不正确' },
          { status: 400 }
        )
      }

      const emailExists = await prisma.user.findUnique({
        where: { email }
      })

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: '该邮箱已被其他用户使用' },
          { status: 400 }
        )
      }
    }

    // 如果更新用户名，检查是否已被其他用户使用
    if (name && name !== existingUser.name) {
      const nameExists = await prisma.user.findFirst({
        where: { 
          name,
          id: { not: params.id }
        }
      })

      if (nameExists) {
        return NextResponse.json(
          { success: false, error: '该用户名已被其他用户使用' },
          { status: 400 }
        )
      }
    }

    // 验证角色
    if (role) {
      const validRoles = ['admin', 'operator']
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { success: false, error: '无效的用户角色' },
          { status: 400 }
        )
      }
    }

    // 准备更新数据
    const updateData: any = {}
    if (email) updateData.email = email
    if (name) updateData.name = name
    if (role) updateData.role = role
    if (typeof isActive === 'boolean') updateData.isActive = isActive
    if (typeof organizationId !== 'undefined') updateData.organizationId = organizationId

    // 如果提供了新密码，则加密存储
    if (password) {
      const saltRounds = 10
      updateData.password = await bcrypt.hash(password, saltRounds)
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            videos: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: user,
      message: '用户更新成功'
    })
  } catch (error) {
    console.error('更新用户失败:', error)
    return NextResponse.json(
      { success: false, error: '更新用户失败' },
      { status: 500 }
    )
  }
}

// 删除用户
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      )
    }

    // 检查是否有相关数据
    const videoCount = await prisma.video.count({
      where: { userId: params.id }
    })

    if (videoCount > 0) {
      return NextResponse.json(
        { success: false, error: '该用户有关联的视频数据，无法删除' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: '用户删除成功'
    })
  } catch (error) {
    console.error('删除用户失败:', error)
    return NextResponse.json(
      { success: false, error: '删除用户失败' },
      { status: 500 }
    )
  }
}
