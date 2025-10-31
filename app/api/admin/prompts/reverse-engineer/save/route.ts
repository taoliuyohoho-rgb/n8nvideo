import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { aiReverseEngineerService } from '@/src/services/ai/AIReverseEngineerService';
import { logger } from '@/src/services/logger/Logger';

export async function POST(request: NextRequest) {
  const traceId = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const body = await request.json();
    const {
      businessModule,
      inputRequirements,
      outputRequirements,
      outputRules,
      suggestedTemplate
    } = body;

    // 参数验证
    if (!businessModule || !inputRequirements || !outputRequirements || !outputRules || !suggestedTemplate) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数' },
        { status: 400 }
      );
    }

    if (!suggestedTemplate.name || !suggestedTemplate.content) {
      return NextResponse.json(
        { success: false, error: '模板名称和内容不能为空' },
        { status: 400 }
      );
    }

    logger.info('开始保存Prompt模板', { 
      traceId, 
      businessModule,
      templateName: suggestedTemplate.name
    });

    // 调用AI反推服务保存模板
    const result = await aiReverseEngineerService.savePromptTemplate({
      inputRequirements,
      outputRequirements,
      outputRules,
      suggestedTemplate: {
        ...suggestedTemplate,
        businessModule
      }
    }, businessModule);

    logger.info('保存Prompt模板成功', { 
      traceId, 
      businessModule,
      templateId: result.id,
      templateName: result.name
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    logger.error('保存Prompt模板失败', { traceId, error: error.message });
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
