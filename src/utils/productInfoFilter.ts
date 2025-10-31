/**
 * 商品信息筛选工具
 * 用于从商品信息中筛选出最匹配的前5个痛点、卖点、目标受众
 */

import { productInfoMatcher, type ProductInfoItem, type ProductContext } from '@/src/services/recommendation/scorers/productInfoMatcher';

export interface ProductInfoFilterOptions {
  maxSellingPoints?: number;
  maxPainPoints?: number;
  maxTargetAudience?: number;
  enableDeduplication?: boolean;
  enableRelevanceScoring?: boolean;
}

export interface FilteredProductInfo {
  sellingPoints: string[];
  painPoints: string[];
  targetAudience: string[];
  scores?: {
    sellingPoints: Array<{ content: string; score: number }>;
    painPoints: Array<{ content: string; score: number }>;
    targetAudience: Array<{ content: string; score: number }>;
  };
}

/**
 * 商品信息筛选器
 */
export class ProductInfoFilter {
  private options: Required<ProductInfoFilterOptions>;
  
  constructor(options: ProductInfoFilterOptions = {}) {
    this.options = {
      maxSellingPoints: options.maxSellingPoints || 5,
      maxPainPoints: options.maxPainPoints || 5,
      maxTargetAudience: options.maxTargetAudience || 5,
      enableDeduplication: options.enableDeduplication !== false,
      enableRelevanceScoring: options.enableRelevanceScoring !== false
    };
  }
  
  /**
   * 筛选商品信息
   */
  async filterProductInfo(
    rawSellingPoints: string[],
    rawPainPoints: string[],
    rawTargetAudience: string[],
    context: ProductContext,
    options?: Partial<ProductInfoFilterOptions>
  ): Promise<FilteredProductInfo> {
    const finalOptions = { ...this.options, ...options };
    
    // 1. 预处理数据
    const sellingPoints = this.preprocessItems(rawSellingPoints, 'sellingPoint');
    const painPoints = this.preprocessItems(rawPainPoints, 'painPoint');
    const targetAudience = this.preprocessItems(rawTargetAudience, 'targetAudience');
    
    // 2. 去重（如果启用）
    const deduplicatedSellingPoints = finalOptions.enableDeduplication 
      ? this.deduplicateItems(sellingPoints)
      : sellingPoints;
    const deduplicatedPainPoints = finalOptions.enableDeduplication 
      ? this.deduplicateItems(painPoints)
      : painPoints;
    const deduplicatedTargetAudience = finalOptions.enableDeduplication 
      ? this.deduplicateItems(targetAudience)
      : targetAudience;
    
    // 3. 使用推荐引擎筛选最匹配的项目
    const [filteredSellingPoints, filteredPainPoints, filteredTargetAudience] = await Promise.all([
      this.filterItemsByType(deduplicatedSellingPoints, context, 'sellingPoint', finalOptions.maxSellingPoints),
      this.filterItemsByType(deduplicatedPainPoints, context, 'painPoint', finalOptions.maxPainPoints),
      this.filterItemsByType(deduplicatedTargetAudience, context, 'targetAudience', finalOptions.maxTargetAudience)
    ]);
    
    // 4. 提取内容
    const result: FilteredProductInfo = {
      sellingPoints: filteredSellingPoints.map(item => item.content),
      painPoints: filteredPainPoints.map(item => item.content),
      targetAudience: filteredTargetAudience.map(item => item.content)
    };
    
    // 5. 添加分数信息（如果启用）
    if (finalOptions.enableRelevanceScoring) {
      result.scores = {
        sellingPoints: filteredSellingPoints.map(item => ({
          content: item.content,
          score: (item as any).matchScore || 0
        })),
        painPoints: filteredPainPoints.map(item => ({
          content: item.content,
          score: (item as any).matchScore || 0
        })),
        targetAudience: filteredTargetAudience.map(item => ({
          content: item.content,
          score: (item as any).matchScore || 0
        }))
      };
    }
    
    return result;
  }
  
  /**
   * 预处理项目
   */
  private preprocessItems(items: string[], type: 'sellingPoint' | 'painPoint' | 'targetAudience'): ProductInfoItem[] {
    return items
      .filter(item => item && typeof item === 'string' && item.trim().length > 0)
      .map((item, index) => ({
        id: `${type}-${index}-${Date.now()}`,
        content: item.trim(),
        type
      }));
  }
  
  /**
   * 去重
   */
  private deduplicateItems(items: ProductInfoItem[]): ProductInfoItem[] {
    const seen = new Set<string>();
    const result: ProductInfoItem[] = [];
    
    for (const item of items) {
      const normalized = item.content.toLowerCase().trim();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        result.push(item);
      }
    }
    
    return result;
  }
  
  /**
   * 按类型筛选项目
   */
  private async filterItemsByType(
    items: ProductInfoItem[],
    context: ProductContext,
    type: 'sellingPoint' | 'painPoint' | 'targetAudience',
    maxItems: number
  ): Promise<ProductInfoItem[]> {
    if (items.length === 0) {
      return [];
    }
    
    // 如果项目数量不超过限制，直接返回
    if (items.length <= maxItems) {
      return items;
    }
    
    // 使用推荐引擎筛选
    const filteredItems = await productInfoMatcher.matchTopItems({
      items,
      context,
      maxItems,
      type
    });
    
    return filteredItems;
  }
  
  /**
   * 快速筛选（不使用推荐引擎）
   */
  async quickFilter(
    rawSellingPoints: string[],
    rawPainPoints: string[],
    rawTargetAudience: string[],
    options?: Partial<ProductInfoFilterOptions>
  ): Promise<FilteredProductInfo> {
    const finalOptions = { ...this.options, ...options };
    
    // 简单筛选：去重 + 长度过滤 + 数量限制
    const sellingPoints = this.quickFilterItems(rawSellingPoints, finalOptions.maxSellingPoints);
    const painPoints = this.quickFilterItems(rawPainPoints, finalOptions.maxPainPoints);
    const targetAudience = this.quickFilterItems(rawTargetAudience, finalOptions.maxTargetAudience);
    
    return {
      sellingPoints,
      painPoints,
      targetAudience
    };
  }
  
  /**
   * 快速筛选单个类型
   */
  private quickFilterItems(items: string[], maxItems: number): string[] {
    return items
      .filter(item => item && typeof item === 'string' && item.trim().length > 0)
      .map(item => item.trim())
      .filter((item, index, arr) => arr.indexOf(item) === index) // 去重
      .filter(item => item.length >= 2 && item.length <= 50) // 长度过滤
      .slice(0, maxItems); // 数量限制
  }
}

// 导出单例实例
export const productInfoFilter = new ProductInfoFilter();

// 导出便捷函数
export async function filterProductInfo(
  sellingPoints: string[],
  painPoints: string[],
  targetAudience: string[],
  context: ProductContext,
  options?: ProductInfoFilterOptions
): Promise<FilteredProductInfo> {
  return productInfoFilter.filterProductInfo(sellingPoints, painPoints, targetAudience, context, options);
}

export async function quickFilterProductInfo(
  sellingPoints: string[],
  painPoints: string[],
  targetAudience: string[],
  options?: ProductInfoFilterOptions
): Promise<FilteredProductInfo> {
  return productInfoFilter.quickFilter(sellingPoints, painPoints, targetAudience, options);
}
