import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { aiReverseEngineerService } from '@/src/services/ai/AIReverseEngineerService';
import { logger } from '@/src/services/logger/Logger';

export async function POST(request: NextRequest) {
  const traceId = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const formData = await request.formData();
    const businessModule = formData.get('businessModule') as string;
    const chosenModelId = formData.get('chosenModelId') as string;
    const chosenPromptId = formData.get('chosenPromptId') as string;
    const referenceExample = formData.get('referenceExample') as File | string;

    // 参数验证
    if (!businessModule || !chosenModelId || !chosenPromptId || !referenceExample) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数' },
        { status: 400 }
      );
    }

    logger.info('开始生成Prompt模板草稿', { 
      traceId, 
      businessModule,
      chosenModelId,
      chosenPromptId
    });

    // 调用AI反推服务生成草稿
    const result = await aiReverseEngineerService.generatePromptDraft({
      referenceExample,
      businessModule,
      chosenModelId,
      chosenPromptId
    });

    logger.info('生成Prompt模板草稿成功', { 
      traceId, 
      businessModule,
      templateName: result.suggestedTemplate.name
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    logger.error('生成Prompt模板草稿失败', { traceId, error: error.message });
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
