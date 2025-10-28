import { NextRequest, NextResponse } from 'next/server';
import { productAnalysisService } from '@/src/services/product/ProductAnalysisService';
import { logger } from '@/src/services/logger/Logger';

export async function POST(request: NextRequest) {
  const traceId = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const body = await request.json();
    const {
      productId,
      sellingPoints,
      painPoints,
      targetAudience
    } = body;

    // 参数验证
    if (!productId) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数: productId' },
        { status: 400 }
      );
    }

    if (!sellingPoints && !painPoints && !targetAudience) {
      return NextResponse.json(
        { success: false, error: '至少需要提供一种内容类型' },
        { status: 400 }
      );
    }

    // 验证内容长度
    const validateContent = (content: string[], type: string) => {
      for (const item of content) {
        if (item.length < 8 || item.length > 12) {
          throw new Error(`${type}长度必须在8-12字之间: "${item}"`);
        }
      }
      if (content.length > 5) {
        throw new Error(`${type}数量不能超过5个`);
      }
    };

    if (sellingPoints) validateContent(sellingPoints, '卖点');
    if (painPoints) validateContent(painPoints, '痛点');
    if (targetAudience && (targetAudience.length < 8 || targetAudience.length > 12)) {
      throw new Error('目标受众长度必须在8-12字之间');
    }

    logger.info('开始手动添加内容', { 
      traceId, 
      productId,
      sellingPointsCount: sellingPoints?.length || 0,
      painPointsCount: painPoints?.length || 0,
      hasTargetAudience: !!targetAudience
    });

    // 调用手动添加服务
    const success = await productAnalysisService.addManualContent(productId, {
      sellingPoints,
      painPoints,
      targetAudience
    });

    if (success) {
      logger.info('手动添加内容成功', { traceId, productId });
      return NextResponse.json({
        success: true,
        message: '内容添加成功'
      });
    } else {
      throw new Error('内容添加失败');
    }

  } catch (error: any) {
    logger.error('手动添加内容失败', { traceId, error: error.message });
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
