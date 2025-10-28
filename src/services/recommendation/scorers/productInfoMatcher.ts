/**
 * 商品信息匹配推荐模型
 * 用于筛选出最匹配的前5个痛点、卖点、目标受众
 */

import type { RecommendRankRequest, CandidateItem } from '../types';

export interface ProductInfoItem {
  id: string;
  content: string;
  type: 'sellingPoint' | 'painPoint' | 'targetAudience';
  relevanceScore?: number;
  qualityScore?: number;
  recencyScore?: number;
}

export interface ProductContext {
  productName: string;
  category: string;
  subcategory?: string;
  description?: string;
  targetCountries?: string[];
  existingSellingPoints?: string[];
  existingPainPoints?: string[];
  existingTargetAudience?: string[];
}

export interface ProductInfoMatchRequest {
  items: ProductInfoItem[];
  context: ProductContext;
  maxItems: number; // 最多返回多少个
  type: 'sellingPoint' | 'painPoint' | 'targetAudience';
}

/**
 * 商品信息匹配推荐器
 */
export class ProductInfoMatcher {
  /**
   * 匹配最相关的前N个商品信息项
   */
  async matchTopItems(request: ProductInfoMatchRequest): Promise<ProductInfoItem[]> {
    const { items, context, maxItems, type } = request;
    
    // 1. 过滤出指定类型的项目
    const filteredItems = items.filter(item => item.type === type);
    
    if (filteredItems.length === 0) {
      return [];
    }
    
    // 2. 计算每个项目的匹配分数
    const scoredItems = filteredItems.map(item => ({
      ...item,
      matchScore: this.calculateMatchScore(item, context, type)
    }));
    
    // 3. 按分数排序
    scoredItems.sort((a, b) => b.matchScore - a.matchScore);
    
    // 4. 返回前N个
    return scoredItems.slice(0, maxItems);
  }
  
  /**
   * 计算匹配分数
   */
  private calculateMatchScore(
    item: ProductInfoItem, 
    context: ProductContext, 
    type: 'sellingPoint' | 'painPoint' | 'targetAudience'
  ): number {
    let score = 0;
    
    // 1. 相关性分数 (0-40分)
    const relevanceScore = this.calculateRelevanceScore(item.content, context, type);
    score += relevanceScore * 0.4;
    
    // 2. 质量分数 (0-30分)
    const qualityScore = this.calculateQualityScore(item.content, type);
    score += qualityScore * 0.3;
    
    // 3. 新颖性分数 (0-20分)
    const noveltyScore = this.calculateNoveltyScore(item, context, type);
    score += noveltyScore * 0.2;
    
    // 4. 长度适宜性分数 (0-10分)
    const lengthScore = this.calculateLengthScore(item.content, type);
    score += lengthScore * 0.1;
    
    return Math.min(100, Math.max(0, score));
  }
  
  /**
   * 计算相关性分数
   */
  private calculateRelevanceScore(
    content: string, 
    context: ProductContext, 
    type: 'sellingPoint' | 'painPoint' | 'targetAudience'
  ): number {
    let score = 0;
    const lowerContent = content.toLowerCase();
    const lowerProductName = context.productName.toLowerCase();
    const lowerCategory = context.category.toLowerCase();
    
    // 商品名称匹配 (0-20分)
    if (lowerContent.includes(lowerProductName)) {
      score += 20;
    } else {
      // 部分匹配
      const productWords = lowerProductName.split(/\s+/);
      const matchedWords = productWords.filter(word => 
        word.length > 2 && lowerContent.includes(word)
      );
      score += (matchedWords.length / productWords.length) * 15;
    }
    
    // 类目匹配 (0-15分)
    if (lowerContent.includes(lowerCategory)) {
      score += 15;
    } else {
      const categoryWords = lowerCategory.split(/\s+/);
      const matchedWords = categoryWords.filter(word => 
        word.length > 2 && lowerContent.includes(word)
      );
      score += (matchedWords.length / categoryWords.length) * 10;
    }
    
    // 描述匹配 (0-10分)
    if (context.description) {
      const lowerDescription = context.description.toLowerCase();
      const descriptionWords = lowerDescription.split(/\s+/).filter(w => w.length > 3);
      const matchedWords = descriptionWords.filter(word => 
        lowerContent.includes(word)
      );
      score += (matchedWords.length / descriptionWords.length) * 10;
    }
    
    // 类型特定匹配
    if (type === 'sellingPoint') {
      score += this.calculateSellingPointRelevance(lowerContent, context);
    } else if (type === 'painPoint') {
      score += this.calculatePainPointRelevance(lowerContent, context);
    } else if (type === 'targetAudience') {
      score += this.calculateTargetAudienceRelevance(lowerContent, context);
    }
    
    return Math.min(100, score);
  }
  
  /**
   * 计算卖点相关性
   */
  private calculateSellingPointRelevance(content: string, context: ProductContext): number {
    let score = 0;
    
    // 卖点关键词匹配
    const sellingKeywords = [
      '优势', '特点', '功能', '性能', '质量', '设计', '材质', '技术',
      '创新', '独特', '高效', '便捷', '安全', '耐用', '美观', '实用',
      'advantage', 'feature', 'quality', 'design', 'performance', 'innovative'
    ];
    
    const matchedKeywords = sellingKeywords.filter(keyword => 
      content.includes(keyword.toLowerCase())
    );
    score += matchedKeywords.length * 2;
    
    // 避免重复现有卖点
    if (context.existingSellingPoints) {
      const isDuplicate = context.existingSellingPoints.some(existing => 
        this.calculateSimilarity(content, existing) > 0.8
      );
      if (isDuplicate) {
        score -= 20; // 重复扣分
      }
    }
    
    return Math.min(30, score);
  }
  
  /**
   * 计算痛点相关性
   */
  private calculatePainPointRelevance(content: string, context: ProductContext): number {
    let score = 0;
    
    // 痛点关键词匹配
    const painKeywords = [
      '问题', '困扰', '痛点', '缺点', '不足', '困难', '挑战', '烦恼',
      '担心', '顾虑', '不满意', '失望', '麻烦', '复杂', '昂贵', '耗时',
      'problem', 'issue', 'concern', 'worry', 'difficulty', 'challenge'
    ];
    
    const matchedKeywords = painKeywords.filter(keyword => 
      content.includes(keyword.toLowerCase())
    );
    score += matchedKeywords.length * 2;
    
    // 避免重复现有痛点
    if (context.existingPainPoints) {
      const isDuplicate = context.existingPainPoints.some(existing => 
        this.calculateSimilarity(content, existing) > 0.8
      );
      if (isDuplicate) {
        score -= 20; // 重复扣分
      }
    }
    
    return Math.min(30, score);
  }
  
  /**
   * 计算目标受众相关性
   */
  private calculateTargetAudienceRelevance(content: string, context: ProductContext): number {
    let score = 0;
    
    // 受众关键词匹配
    const audienceKeywords = [
      '用户', '消费者', '客户', '人群', '年龄', '性别', '职业', '收入',
      '兴趣', '爱好', '需求', '偏好', '习惯', '生活方式', '场景',
      'user', 'consumer', 'customer', 'audience', 'demographic'
    ];
    
    const matchedKeywords = audienceKeywords.filter(keyword => 
      content.includes(keyword.toLowerCase())
    );
    score += matchedKeywords.length * 2;
    
    // 避免重复现有目标受众
    if (context.existingTargetAudience) {
      const isDuplicate = context.existingTargetAudience.some(existing => 
        this.calculateSimilarity(content, existing) > 0.8
      );
      if (isDuplicate) {
        score -= 20; // 重复扣分
      }
    }
    
    return Math.min(30, score);
  }
  
  /**
   * 计算质量分数
   */
  private calculateQualityScore(content: string, type: 'sellingPoint' | 'painPoint' | 'targetAudience'): number {
    let score = 0;
    
    // 长度适宜性 (5-20字为最佳)
    const length = content.length;
    if (length >= 5 && length <= 20) {
      score += 20;
    } else if (length >= 3 && length <= 30) {
      score += 15;
    } else if (length >= 1 && length <= 50) {
      score += 10;
    } else {
      score += 5;
    }
    
    // 语言质量
    if (this.isWellFormed(content)) {
      score += 15;
    } else {
      score += 5;
    }
    
    // 信息密度
    const wordCount = content.split(/\s+/).length;
    if (wordCount >= 2 && wordCount <= 8) {
      score += 15;
    } else {
      score += 8;
    }
    
    return Math.min(100, score);
  }
  
  /**
   * 计算新颖性分数
   */
  private calculateNoveltyScore(
    item: ProductInfoItem, 
    context: ProductContext, 
    type: 'sellingPoint' | 'painPoint' | 'targetAudience'
  ): number {
    let score = 0;
    
    // 基于时间的新颖性
    if (item.relevanceScore && item.relevanceScore > 0.8) {
      score += 10;
    }
    
    // 基于质量的新颖性
    if (item.qualityScore && item.qualityScore > 0.7) {
      score += 10;
    }
    
    return Math.min(20, score);
  }
  
  /**
   * 计算长度适宜性分数
   */
  private calculateLengthScore(content: string, type: 'sellingPoint' | 'painPoint' | 'targetAudience'): number {
    const length = content.length;
    
    // 不同类型的最佳长度
    const optimalLengths = {
      sellingPoint: { min: 5, max: 15 },
      painPoint: { min: 4, max: 12 },
      targetAudience: { min: 6, max: 20 }
    };
    
    const optimal = optimalLengths[type];
    
    if (length >= optimal.min && length <= optimal.max) {
      return 10;
    } else if (length >= optimal.min - 2 && length <= optimal.max + 5) {
      return 7;
    } else if (length >= 2 && length <= 30) {
      return 5;
    } else {
      return 2;
    }
  }
  
  /**
   * 计算文本相似度
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
    const union = new Set([...Array.from(set1), ...Array.from(set2)]);
    
    return intersection.size / union.size;
  }
  
  /**
   * 检查文本是否格式良好
   */
  private isWellFormed(content: string): boolean {
    // 基本格式检查
    if (content.trim().length === 0) return false;
    if (content.includes('undefined') || content.includes('null')) return false;
    if (/^[0-9\s\-_]+$/.test(content)) return false; // 纯数字或符号
    
    // 包含有效字符
    return /[a-zA-Z\u4e00-\u9fa5]/.test(content);
  }
}

// 导出单例实例
export const productInfoMatcher = new ProductInfoMatcher();
