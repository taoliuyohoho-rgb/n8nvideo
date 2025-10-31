import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    // 获取商品信息
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: '商品不存在' },
        { status: 404 }
      );
    }

    // 解析现有数据（用户手动输入，不需要AI分析，直接写库）
    let existingSellingPoints: string[] = [];
    let existingPainPoints: string[] = [];
    let existingTargetAudience = '';

    try {
      if ((product as any).sellingPoints) {
        const sp = (product as any).sellingPoints;
        existingSellingPoints = typeof sp === 'string' ? JSON.parse(sp) : sp;
      }
    } catch (e) {
      console.warn('解析现有卖点失败:', e);
    }

    try {
      if ((product as any).painPoints) {
        const pp = (product as any).painPoints;
        existingPainPoints = typeof pp === 'string' ? JSON.parse(pp) : pp;
      }
    } catch (e) {
      console.warn('解析现有痛点失败:', e);
    }

    existingTargetAudience = String(product.targetAudience || '');

    // 合并新内容
    const mergedSellingPoints = [...existingSellingPoints, ...(sellingPoints || [])];
    const mergedPainPoints = [...existingPainPoints, ...(painPoints || [])];
    const finalTargetAudience = targetAudience || existingTargetAudience;

    // 更新商品
    const updateData: any = {
      updatedAt: new Date()
    };

    if (sellingPoints && sellingPoints.length > 0) {
      updateData.sellingPoints = JSON.stringify(mergedSellingPoints);
    }
    if (painPoints && painPoints.length > 0) {
      updateData.painPoints = JSON.stringify(mergedPainPoints);
    }
    if (targetAudience) {
      updateData.targetAudience = finalTargetAudience;
    }

    await prisma.product.update({
      where: { id: productId },
      data: updateData
    });

    logger.info('手动添加内容成功', { traceId, productId });
    return NextResponse.json({
      success: true,
      message: '内容添加成功',
      data: {
        addedSellingPoints: sellingPoints?.length || 0,
        addedPainPoints: painPoints?.length || 0,
        hasTargetAudience: !!targetAudience
      }
    });

  } catch (error: any) {
    logger.error('手动添加内容失败', { traceId, error: error.message });
    return NextResponse.json(
      { success: false, error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
