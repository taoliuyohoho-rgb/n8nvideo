import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prompt = await prisma.promptTemplate.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        content: true,
        variables: true,
        performance: true,
        successRate: true,
        usageCount: true
      }
    })

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt不存在' },
        { status: 404 }
      )
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
      ...parsedPrompt
    })
  } catch (error) {
    console.error('获取Prompt失败:', error)
    return NextResponse.json(
      { success: false, error: '获取失败' },
      { status: 500 }
    )
  }
}

