import { NextRequest, NextResponse } from 'next/server';
import { aiReverseEngineerService } from '@/src/services/ai/AIReverseEngineerService';
import { logger } from '@/src/services/logger/Logger';

export async function POST(request: NextRequest) {
  const traceId = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const formData = await request.formData();
    const businessModule = formData.get('businessModule') as string;
    const exampleType = formData.get('exampleType') as string;
    const referenceExample = formData.get('referenceExample') as File | string;

    // 参数验证
    if (!businessModule) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数: businessModule' },
        { status: 400 }
      );
    }

    if (!exampleType) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数: exampleType' },
        { status: 400 }
      );
    }

    if (!referenceExample) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数: referenceExample' },
        { status: 400 }
      );
    }

    // 验证业务模块
    const supportedModules = ['product-analysis', 'video-script', 'ai-reverse-engineer'];
    if (!supportedModules.includes(businessModule)) {
      return NextResponse.json(
        { success: false, error: `不支持的业务模块: ${businessModule}` },
        { status: 400 }
      );
    }

    // 验证实例类型
    const supportedTypes = ['selling-points', 'pain-points', 'target-audience', 'prompt-script', 'video'];
    if (!supportedTypes.includes(exampleType)) {
      return NextResponse.json(
        { success: false, error: `不支持的实例类型: ${exampleType}` },
        { status: 400 }
      );
    }

    logger.info('开始AI反推分析', { 
      traceId, 
      businessModule,
      exampleType,
      inputType: referenceExample instanceof File ? 'file' : 'text'
    });

    // 调用AI反推服务
    const result = await aiReverseEngineerService.analyzeReferenceAndRecommend({
      referenceExample,
      businessModule,
      exampleType: exampleType as any
    });

    logger.info('AI反推分析成功', { 
      traceId, 
      businessModule,
      modelCandidatesCount: result.modelCandidates.length,
      promptCandidatesCount: result.promptCandidates.length
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    logger.error('AI反推分析失败', { traceId, error: error.message });
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
