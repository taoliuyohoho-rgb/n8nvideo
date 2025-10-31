import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { PromptRule, PromptRuleFormData, ApiResponse, BusinessModule } from '@/types/prompt-rule';

// GET /api/admin/prompt-rules - 查询提示词规则
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessModule = searchParams.get('businessModule') as BusinessModule | null;

    // 如果指定了业务模块，返回该模块的规则
    if (businessModule) {
      const rule = await prisma.promptRule.findUnique({
        where: { businessModule }
      });
      
      return NextResponse.json<ApiResponse<PromptRule | null>>({
        success: true,
        data: rule
      });
    }

    // 否则返回所有规则
    const rules = await prisma.promptRule.findMany({
      orderBy: { businessModule: 'asc' }
    });

    return NextResponse.json<ApiResponse<PromptRule[]>>({
      success: true,
      data: rules
    });
  } catch (error: unknown) {
    console.error('获取提示词规则失败:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/admin/prompt-rules - 创建新的提示词规则
export async function POST(request: NextRequest) {
  try {
    const body: PromptRuleFormData = await request.json();
    const { businessModule, inputFormat, outputFormat, analysisMethod } = body;

    if (!businessModule || !inputFormat || !outputFormat || !analysisMethod) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '缺少必需参数: businessModule, inputFormat, outputFormat, analysisMethod' },
        { status: 400 }
      );
    }

    const rule = await prisma.promptRule.create({
      data: {
        businessModule,
        inputFormat,
        outputFormat,
        analysisMethod
      }
    });

    return NextResponse.json<ApiResponse<PromptRule>>({
      success: true,
      data: rule
    });
  } catch (error: unknown) {
    console.error('创建提示词规则失败:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT /api/admin/prompt-rules - 更新提示词规则
export async function PUT(request: NextRequest) {
  try {
    const body: PromptRuleFormData & { id: string } = await request.json();
    const { id, businessModule, inputFormat, outputFormat, analysisMethod } = body;

    if (!id) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '缺少必需参数: id' },
        { status: 400 }
      );
    }

    const rule = await prisma.promptRule.update({
      where: { id },
      data: {
        businessModule,
        inputFormat,
        outputFormat,
        analysisMethod
      }
    });

    return NextResponse.json<ApiResponse<PromptRule>>({
      success: true,
      data: rule
    });
  } catch (error: unknown) {
    console.error('更新提示词规则失败:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/prompt-rules - 删除提示词规则
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '缺少必需参数: id' },
        { status: 400 }
      );
    }

    await prisma.promptRule.delete({
      where: { id }
    });

    return NextResponse.json<ApiResponse<never>>({
      success: true,
      message: '提示词规则已删除'
    });
  } catch (error: unknown) {
    console.error('删除提示词规则失败:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
