/**
 * 竞品分析数据迁移到商品分析
 * 
 * 将现有的竞品分析数据迁移到统一的商品分析模块
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/src/services/logger/Logger';

const prisma = new PrismaClient();

interface CompetitorData {
  id: string;
  productName: string;
  sellingPoints: string | null;
  marketingInfo: string | null;
  targetAudience: string | null;
}

async function migrateCompetitorData() {
  const traceId = `migration-${Date.now()}`;
  
  try {
    logger.info('开始竞品分析数据迁移', { traceId });

    // 1. 查询所有有竞品分析数据的记录
    const competitorData = await prisma.competitorAnalysis.findMany({
      where: {
        OR: [
          { sellingPoints: { not: null } },
          { marketingInfo: { not: null } },
          { targetAudience: { not: null } }
        ]
      },
      select: {
        id: true,
        productName: true,
        sellingPoints: true,
        marketingInfo: true,
        targetAudience: true
      }
    });

    logger.info(`找到 ${competitorData.length} 条竞品分析数据`, { traceId });

    if (competitorData.length === 0) {
      logger.info('没有需要迁移的数据', { traceId });
      return;
    }

    // 2. 按商品名称分组
    const groupedData = new Map<string, CompetitorData[]>();
    
    for (const data of competitorData) {
      if (!data.productName) continue;
      
      if (!groupedData.has(data.productName)) {
        groupedData.set(data.productName, []);
      }
      groupedData.get(data.productName)!.push(data as CompetitorData);
    }

    logger.info(`按商品名称分组，共 ${groupedData.size} 个商品`, { traceId });

    // 3. 查找对应的商品记录
    const migrationResults = [];
    
    for (const [productName, dataList] of Array.from(groupedData.entries())) {
      try {
        // 查找商品记录
        const product = await prisma.product.findFirst({
          where: {
            name: {
              contains: productName,
              mode: 'insensitive'
            }
          },
          select: {
            id: true,
            name: true,
            sellingPoints: true,
            painPoints: true,
            targetAudience: true
          }
        });

        if (!product) {
          logger.warn(`未找到商品: ${productName}`, { traceId });
          continue;
        }

        // 合并数据
        const mergedData = mergeCompetitorData(dataList);
        
        // 更新商品数据
        const updateData: any = {};
        
        if (mergedData.sellingPoints && mergedData.sellingPoints.length > 0) {
          const existingSellingPoints = product.sellingPoints ? JSON.parse(product.sellingPoints as string) : [];
          const newSellingPoints = [...existingSellingPoints, ...mergedData.sellingPoints];
          updateData.sellingPoints = JSON.stringify(newSellingPoints);
        }

        if (mergedData.painPoints && mergedData.painPoints.length > 0) {
          const existingPainPoints = product.painPoints ? JSON.parse(product.painPoints as string) : [];
          const newPainPoints = [...existingPainPoints, ...mergedData.painPoints];
          updateData.painPoints = JSON.stringify(newPainPoints);
        }

        if (mergedData.targetAudience) {
          updateData.targetAudience = JSON.stringify(mergedData.targetAudience);
        }

        if (Object.keys(updateData).length > 0) {
          updateData.updatedAt = new Date();
          
          await prisma.product.update({
            where: { id: product.id },
            data: updateData
          });

          migrationResults.push({
            productId: product.id,
            productName: product.name,
            sellingPointsAdded: mergedData.sellingPoints?.length || 0,
            painPointsAdded: mergedData.painPoints?.length || 0,
            hasTargetAudience: !!mergedData.targetAudience
          });

          logger.info(`迁移商品数据成功: ${product.name}`, { 
            traceId, 
            productId: product.id,
            sellingPointsAdded: mergedData.sellingPoints?.length || 0,
            painPointsAdded: mergedData.painPoints?.length || 0
          });
        }

      } catch (error: any) {
        logger.error(`迁移商品数据失败: ${productName}`, { 
          traceId, 
          error: error.message 
        });
      }
    }

    // 4. 输出迁移结果
    logger.info('竞品分析数据迁移完成', { 
      traceId,
      totalProducts: migrationResults.length,
      totalSellingPoints: migrationResults.reduce((sum, r) => sum + r.sellingPointsAdded, 0),
      totalPainPoints: migrationResults.reduce((sum, r) => sum + r.painPointsAdded, 0),
      targetAudienceUpdated: migrationResults.filter(r => r.hasTargetAudience).length
    });

    console.log('\n=== 迁移结果统计 ===');
    console.log(`迁移商品数量: ${migrationResults.length}`);
    console.log(`新增卖点总数: ${migrationResults.reduce((sum, r) => sum + r.sellingPointsAdded, 0)}`);
    console.log(`新增痛点总数: ${migrationResults.reduce((sum, r) => sum + r.painPointsAdded, 0)}`);
    console.log(`更新目标受众: ${migrationResults.filter(r => r.hasTargetAudience).length} 个商品`);
    
    console.log('\n=== 详细迁移记录 ===');
    migrationResults.forEach(result => {
      console.log(`- ${result.productName}: +${result.sellingPointsAdded}卖点, +${result.painPointsAdded}痛点${result.hasTargetAudience ? ', 更新目标受众' : ''}`);
    });

  } catch (error: any) {
    logger.error('竞品分析数据迁移失败', { traceId, error: error.message });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function mergeCompetitorData(dataList: CompetitorData[]): {
  sellingPoints: string[];
  painPoints: string[];
  targetAudience?: string;
} {
  const result = {
    sellingPoints: [] as string[],
    painPoints: [] as string[],
    targetAudience: undefined as string | undefined
  };

  for (const data of dataList) {
    // 处理卖点
    if (data.sellingPoints) {
      try {
        const sellingPoints = JSON.parse(data.sellingPoints);
        if (Array.isArray(sellingPoints)) {
          result.sellingPoints.push(...sellingPoints);
        }
      } catch (e) {
        // 如果不是JSON格式，当作单个字符串处理
        result.sellingPoints.push(data.sellingPoints);
      }
    }

    // 处理痛点（从marketingInfo中提取）
    if (data.marketingInfo) {
      try {
        const marketingInfo = JSON.parse(data.marketingInfo);
        if (marketingInfo.painPoints && Array.isArray(marketingInfo.painPoints)) {
          result.painPoints.push(...marketingInfo.painPoints);
        }
      } catch (e) {
        // 如果不是JSON格式，尝试从文本中提取痛点关键词
        const painKeywords = extractPainPointsFromText(data.marketingInfo);
        result.painPoints.push(...painKeywords);
      }
    }

    // 处理目标受众
    if (data.targetAudience && !result.targetAudience) {
      result.targetAudience = data.targetAudience;
    }
  }

  // 去重
  result.sellingPoints = Array.from(new Set(result.sellingPoints));
  result.painPoints = Array.from(new Set(result.painPoints));

  return result;
}

function extractPainPointsFromText(text: string): string[] {
  // 简单的痛点关键词提取
  const painKeywords = [
    '问题', '困难', '麻烦', '不便', '缺点', '不足', '缺陷', '困扰',
    '复杂', '难用', '慢', '贵', '差', '不好', '糟糕', '烂'
  ];

  const extracted = [];
  for (const keyword of painKeywords) {
    if (text.includes(keyword)) {
      extracted.push(keyword);
    }
  }

  return extracted;
}

// 执行迁移
if (require.main === module) {
  migrateCompetitorData()
    .then(() => {
      console.log('数据迁移完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('数据迁移失败:', error);
      process.exit(1);
    });
}

export { migrateCompetitorData };
