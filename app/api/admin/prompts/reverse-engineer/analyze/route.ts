import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
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
    const supportedTypes = ['selling-points', 'pain-points', 'target-audience', 'prompt-script', 'video', 'auto'];
    if (!supportedTypes.includes(exampleType)) {
      return NextResponse.json(
        { success: false, error: `不支持的实例类型: ${exampleType}` },
        { status: 400 }
      );
    }

    // 如果是auto类型，需要自动识别
    let finalExampleType = exampleType;
    if (exampleType === 'auto') {
      finalExampleType = await detectExampleType(referenceExample, businessModule);
    }

    logger.info('开始AI反推分析', { 
      traceId, 
      businessModule,
      exampleType,
      finalExampleType,
      inputType: referenceExample instanceof File ? 'file' : 'text'
    });

    // 调用AI反推服务
    const result = await aiReverseEngineerService.analyzeReferenceAndRecommend({
      referenceExample,
      businessModule,
      exampleType: finalExampleType as any
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

/**
 * 自动检测实例类型
 */
async function detectExampleType(
  referenceExample: string | File, 
  businessModule: string
): Promise<'selling-points' | 'pain-points' | 'target-audience' | 'prompt-script' | 'video'> {
  try {
    // 如果是文件，根据文件类型判断
    if (referenceExample instanceof File) {
      const type = referenceExample.type;
      if (type.startsWith('video/')) {
        return 'video';
      }
      if (type.startsWith('image/')) {
        // 图片可能是卖点、痛点或目标受众相关
        return 'selling-points'; // 默认返回卖点
      }
    }

    // 如果是文本，使用AI进行内容分析
    const textContent = referenceExample instanceof File 
      ? `[文件: ${referenceExample.name}]` 
      : referenceExample;

    // 简单的关键词匹配规则
    const content = textContent.toLowerCase();
    
    // 检查是否包含卖点相关关键词
    const sellingPointKeywords = ['优势', '特点', '卖点', '亮点', '功能', '效果', '好处', '价值'];
    if (sellingPointKeywords.some(keyword => content.includes(keyword))) {
      return 'selling-points';
    }

    // 检查是否包含痛点相关关键词
    const painPointKeywords = ['问题', '痛点', '困扰', '难题', '挑战', '困难', '不足', '缺点'];
    if (painPointKeywords.some(keyword => content.includes(keyword))) {
      return 'pain-points';
    }

    // 检查是否包含目标受众相关关键词
    const audienceKeywords = ['用户', '客户', '目标', '受众', '人群', '年龄', '性别', '职业'];
    if (audienceKeywords.some(keyword => content.includes(keyword))) {
      return 'target-audience';
    }

    // 检查是否包含脚本相关关键词
    const scriptKeywords = ['脚本', '台词', '旁白', '解说', '开场', '结尾', 'hook', 'cta'];
    if (scriptKeywords.some(keyword => content.includes(keyword))) {
      return 'prompt-script';
    }

    // 默认返回卖点类型
    return 'selling-points';
  } catch (error) {
    logger.warn('自动检测实例类型失败，使用默认类型', { error: error instanceof Error ? error.message : String(error) });
    return 'selling-points';
  }
}
