import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


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
      
      // 解析 variables JSON 字符串为数组
      let variables = [];
      if (prompt.variables) {
        try {
          variables = JSON.parse(prompt.variables);
        } catch (error) {
          console.error('解析 variables JSON 失败:', prompt.variables, error);
          if (typeof prompt.variables === 'string') {
            variables = prompt.variables.split(',').map(v => v.trim()).filter(v => v);
          }
        }
      }
      const parsedPrompt = {
        ...prompt,
        variables
      };
      
      return NextResponse.json({
        success: true,
        template: parsedPrompt
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

    // 解析所有 prompts 的 variables JSON 字符串为数组
    const parsedPrompts = prompts.map(prompt => {
      let variables = [];
      if (prompt.variables) {
        try {
          // 尝试解析 JSON
          variables = JSON.parse(prompt.variables);
        } catch (error) {
          // 如果不是有效的 JSON，尝试按逗号分割
          if (typeof prompt.variables === 'string') {
            variables = prompt.variables.split(',').map(v => v.trim()).filter(v => v);
          }
        }
      }
      return {
        ...prompt,
        variables
      };
    });

    return NextResponse.json({
      success: true,
      data: parsedPrompts
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

    // 解析 variables JSON 字符串为数组
    let parsedVariables = [];
    if (prompt.variables) {
      try {
        parsedVariables = JSON.parse(prompt.variables);
      } catch (error) {
        console.error('解析 variables JSON 失败:', prompt.variables, error);
        if (typeof prompt.variables === 'string') {
          parsedVariables = prompt.variables.split(',').map(v => v.trim()).filter(v => v);
        }
      }
    }
    const parsedPrompt = {
      ...prompt,
      variables: parsedVariables
    };

    return NextResponse.json({
      success: true,
      data: parsedPrompt
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

    // 解析 variables JSON 字符串为数组
    let parsedVariables = [];
    if (prompt.variables) {
      try {
        parsedVariables = JSON.parse(prompt.variables);
      } catch (error) {
        console.error('解析 variables JSON 失败:', prompt.variables, error);
        if (typeof prompt.variables === 'string') {
          parsedVariables = prompt.variables.split(',').map(v => v.trim()).filter(v => v);
        }
      }
    }
    const parsedPrompt = {
      ...prompt,
      variables: parsedVariables
    };

    return NextResponse.json({
      success: true,
      data: parsedPrompt
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
