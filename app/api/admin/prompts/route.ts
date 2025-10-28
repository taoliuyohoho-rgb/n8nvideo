import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/prompts - 查询 Prompt 模板（支持通过id查询单个或列表查询）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const businessModule = searchParams.get('businessModule');
    const isActive = searchParams.get('isActive');

    // 如果提供了 id，返回单个模板
    if (id) {
      const prompt = await prisma.promptTemplate.findUnique({
        where: { id }
      });
      if (!prompt) {
        return NextResponse.json(
          { success: false, error: '模板不存在' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        template: prompt
      });
    }

    // 否则返回列表
    const where: any = {};
    if (businessModule) where.businessModule = businessModule;
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const prompts = await prisma.promptTemplate.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { performance: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: prompts
    });
  } catch (error: any) {
    console.error('获取Prompt模板失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/prompts - 创建新的 Prompt 模板
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      businessModule,
      content,
      variables,
      description,
      isDefault,
      createdBy
    } = body;

    if (!name || !businessModule || !content) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数: name, businessModule, content' },
        { status: 400 }
      );
    }

    const prompt = await prisma.promptTemplate.create({
      data: {
        name,
        businessModule,
        content,
        variables: variables ? JSON.stringify(variables) : null,
        description,
        isDefault: isDefault || false,
        createdBy
      }
    });

    return NextResponse.json({
      success: true,
      data: prompt
    });
  } catch (error: any) {
    console.error('创建Prompt模板失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/prompts - 更新 Prompt 模板
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      content,
      variables,
      description,
      isActive,
      isDefault
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数: id' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (content !== undefined) updateData.content = content;
    if (variables !== undefined) updateData.variables = JSON.stringify(variables);
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const prompt = await prisma.promptTemplate.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      data: prompt
    });
  } catch (error: any) {
    console.error('更新Prompt模板失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/prompts - 删除 Prompt 模板
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数: id' },
        { status: 400 }
      );
    }

    await prisma.promptTemplate.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Prompt模板已删除'
    });
  } catch (error: any) {
    console.error('删除Prompt模板失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
