/**
 * 统一商品分析服务
 * 
 * 合并商品分析和竞品分析功能，提供统一的商品特征分析入口
 */

import { PrismaClient } from '@prisma/client';
import { recommendRank } from '../recommendation/recommend';
import { AiExecutor } from '../ai/AiExecutor';
import { logger } from '../logger/Logger';

const prisma = new PrismaClient();

export interface ProductAnalysisInput {
  productId: string;
  competitorContent?: string;
  images?: string[];
  isUrl?: boolean;
  chosenModelId?: string;
  chosenPromptId?: string;
}

export interface ProductAnalysisOutput {
  success: boolean;
  data: {
    sellingPoints: string[];
    painPoints: string[];
    targetAudience?: string;
    modelUsed: string;
    promptUsed: string;
    duplicates: {
      sellingPoints: string[];
      painPoints: string[];
      targetAudience: string[];
    };
  };
  error?: string;
}

export interface ManualContentInput {
  sellingPoints?: string[];
  painPoints?: string[];
  targetAudience?: string;
}

export class ProductAnalysisService {
  private aiExecutor: AiExecutor;

  constructor() {
    this.aiExecutor = new AiExecutor();
  }

  /**
   * 统一商品分析入口
   */
  async analyzeProduct(params: ProductAnalysisInput): Promise<ProductAnalysisOutput> {
    const { productId, competitorContent, images, isUrl, chosenModelId, chosenPromptId } = params;

    try {
      // 1. 获取商品信息
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          category: true,
          subcategory: true,
          description: true,
          sellingPoints: true,
          painPoints: true,
          targetAudience: true
        }
      });

      if (!product) {
        throw new Error('商品不存在');
      }

      // 2. 推荐AI模型和Prompt
      const recommendations = await this.getRecommendations({
        productId,
        competitorContent,
        images,
        isUrl
      });

      // 3. 选择使用的模型和Prompt
      const { chosenModel, chosenPrompt } = await this.selectModelAndPrompt(
        recommendations,
        chosenModelId,
        chosenPromptId
      );

      // 4. 调用AI分析
      const aiResult = await this.callAI(
        competitorContent || '',
        images,
        chosenModel,
        chosenPrompt,
        product
      );

      // 5. 去重处理
      const deduplicatedResult = this.deduplicateContent(aiResult, product);

      // 6. 更新商品数据
      await this.updateProductData(productId, deduplicatedResult);

      return {
        success: true,
        data: {
          sellingPoints: deduplicatedResult.sellingPoints,
          painPoints: deduplicatedResult.painPoints,
          targetAudience: deduplicatedResult.targetAudience,
          modelUsed: chosenModel.title,
          promptUsed: chosenPrompt.name,
          duplicates: deduplicatedResult.duplicates
        }
      };

    } catch (error: any) {
      logger.error('商品分析失败', { productId, error: error.message });
      return {
        success: false,
        data: {
          sellingPoints: [],
          painPoints: [],
          modelUsed: '',
          promptUsed: '',
          duplicates: {
            sellingPoints: [],
            painPoints: [],
            targetAudience: []
          }
        },
        error: error.message
      };
    }
  }

  /**
   * 获取推荐候选项
   */
  async getRecommendations(params: {
    productId: string;
    competitorContent?: string;
    images?: string[];
    isUrl?: boolean;
  }): Promise<{
    modelCandidates: Array<{
      id: string;
      title: string;
      score: number;
      reason: string;
      type: 'fine-top' | 'coarse-top' | 'explore';
    }>;
    promptCandidates: Array<{
      id: string;
      name: string;
      score: number;
      reason: string;
      type: 'fine-top' | 'coarse-top' | 'explore';
    }>;
  }> {
    // 检测输入类型
    const inputType = this.detectInputType(params.competitorContent, params.images);

    // 推荐AI模型
    const modelRecommendation = await recommendRank({
      scenario: 'task->model',
      task: {
        taskType: 'product-analysis',
        contentType: inputType,
        jsonRequirement: true
      },
      context: {
        region: 'zh',
        budgetTier: 'mid'
      },
      constraints: {
        requireJsonMode: true,
        maxLatencyMs: 30000
      }
    });

    // 推荐Prompt模板
    const promptRecommendation = await recommendRank({
      scenario: 'task->prompt',
      task: {
        taskType: 'product-analysis',
        contentType: inputType
      },
      context: {
        region: 'zh',
        budgetTier: 'mid'
      },
      constraints: {
        maxLatencyMs: 10000
      }
    });

    return {
      modelCandidates: modelRecommendation.candidates.map(c => ({
        id: c.id,
        title: c.title,
        score: c.fineScore || c.coarseScore || 0,
        reason: c.reason?.explanation || '',
        type: c.type || 'fine-top'
      })),
      promptCandidates: promptRecommendation.candidates.map(c => ({
        id: c.id,
        name: c.title,
        score: c.fineScore || c.coarseScore || 0,
        reason: c.reason?.explanation || '',
        type: c.type || 'fine-top'
      }))
    };
  }

  /**
   * 手动添加内容（带去重验证）
   */
  async addManualContent(productId: string, content: ManualContentInput): Promise<boolean> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          sellingPoints: true,
          painPoints: true,
          targetAudience: true
        }
      });

      if (!product) {
        throw new Error('商品不存在');
      }

      const deduplicatedContent = this.deduplicateContent(content, product);

      // 检查是否有重复内容被拒绝
      const hasRejectedContent = 
        (content.sellingPoints?.length || 0) > deduplicatedContent.sellingPoints.length ||
        (content.painPoints?.length || 0) > deduplicatedContent.painPoints.length ||
        (content.targetAudience && !deduplicatedContent.targetAudience);

      if (hasRejectedContent) {
        throw new Error('存在重复内容，已拒绝写入');
      }

      // 更新商品数据
      await this.updateProductData(productId, deduplicatedContent);

      return true;
    } catch (error: any) {
      logger.error('手动添加内容失败', { productId, error: error.message });
      throw error;
    }
  }

  /**
   * 检测输入类型
   */
  private detectInputType(text?: string, images?: string[]): 'text' | 'image' | 'multimodal' {
    if (images && images.length > 0) {
      return text ? 'multimodal' : 'image';
    }
    return 'text';
  }

  /**
   * 选择模型和Prompt
   */
  private async selectModelAndPrompt(
    recommendations: any,
    chosenModelId?: string,
    chosenPromptId?: string
  ) {
    let chosenModel = recommendations.modelCandidates[0];
    let chosenPrompt = recommendations.promptCandidates[0];

    // 如果用户指定了模型
    if (chosenModelId) {
      const selectedModel = recommendations.modelCandidates.find(c => c.id === chosenModelId);
      if (selectedModel) {
        chosenModel = selectedModel;
      }
    }

    // 如果用户指定了Prompt
    if (chosenPromptId) {
      const selectedPrompt = recommendations.promptCandidates.find(c => c.id === chosenPromptId);
      if (selectedPrompt) {
        chosenPrompt = selectedPrompt;
      }
    }

    return { chosenModel, chosenPrompt };
  }

  /**
   * 调用AI分析
   */
  private async callAI(
    text: string,
    images: string[] | undefined,
    chosenModel: any,
    chosenPrompt: any,
    product: any
  ): Promise<{
    sellingPoints: string[];
    painPoints: string[];
    targetAudience?: string;
  }> {
    // 构建Prompt内容
    const promptContent = this.buildPromptContent(chosenPrompt, product, text, images);

    // 调用AI
    const response = await this.aiExecutor.callWithSchema(
      chosenModel.provider,
      chosenModel.model,
      promptContent,
      {
        type: 'object',
        properties: {
          sellingPoints: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 5
          },
          painPoints: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 5
          },
          targetAudience: {
            type: 'string'
          }
        },
        required: ['sellingPoints', 'painPoints']
      }
    );

    return {
      sellingPoints: response.sellingPoints || [],
      painPoints: response.painPoints || [],
      targetAudience: response.targetAudience
    };
  }

  /**
   * 构建Prompt内容
   */
  private buildPromptContent(prompt: any, product: any, text: string, images?: string[]): string {
    let content = prompt.content;

    // 替换变量
    content = content.replace(/\{\{productName\}\}/g, product.name || '');
    content = content.replace(/\{\{productCategory\}\}/g, product.category || '');
    content = content.replace(/\{\{productDescription\}\}/g, product.description || '');
    content = content.replace(/\{\{targetMarket\}\}/g, '全球市场');
    content = content.replace(/\{\{competitorContent\}\}/g, text || '');

    // 处理图片
    if (images && images.length > 0) {
      content = content.replace(/\{\{hasImages\}\}/g, 'true');
      content = content.replace(/\{\{imageCount\}\}/g, images.length.toString());
    } else {
      content = content.replace(/\{\{hasImages\}\}/g, 'false');
    }

    return content;
  }

  /**
   * 去重处理
   */
  private deduplicateContent(
    newContent: {
      sellingPoints?: string[];
      painPoints?: string[];
      targetAudience?: string;
    },
    existingProduct: {
      sellingPoints: any;
      painPoints: any;
      targetAudience: any;
    }
  ): {
    sellingPoints: string[];
    painPoints: string[];
    targetAudience?: string;
    duplicates: {
      sellingPoints: string[];
      painPoints: string[];
      targetAudience: string[];
    };
  } {
    const existingSellingPoints = existingProduct.sellingPoints ? JSON.parse(existingProduct.sellingPoints as string) : [];
    const existingPainPoints = existingProduct.painPoints ? JSON.parse(existingProduct.painPoints as string) : [];
    const existingTargetAudience = existingProduct.targetAudience ? JSON.parse(existingProduct.targetAudience as string) : '';

    const result = {
      sellingPoints: [...existingSellingPoints],
      painPoints: [...existingPainPoints],
      targetAudience: existingTargetAudience,
      duplicates: {
        sellingPoints: [] as string[],
        painPoints: [] as string[],
        targetAudience: [] as string[]
      }
    };

    // 处理卖点
    if (newContent.sellingPoints) {
      for (const newPoint of newContent.sellingPoints) {
        if (this.isContentDuplicate(newPoint, existingSellingPoints)) {
          result.duplicates.sellingPoints.push(newPoint);
        } else {
          result.sellingPoints.push(newPoint);
        }
      }
    }

    // 处理痛点
    if (newContent.painPoints) {
      for (const newPoint of newContent.painPoints) {
        if (this.isContentDuplicate(newPoint, existingPainPoints)) {
          result.duplicates.painPoints.push(newPoint);
        } else {
          result.painPoints.push(newPoint);
        }
      }
    }

    // 处理目标受众
    if (newContent.targetAudience) {
      if (this.isContentDuplicate(newContent.targetAudience, [existingTargetAudience])) {
        result.duplicates.targetAudience.push(newContent.targetAudience);
      } else {
        result.targetAudience = newContent.targetAudience;
      }
    }

    return result;
  }

  /**
   * 检查内容是否重复
   */
  private isContentDuplicate(newContent: string, existingContent: string[]): boolean {
    const threshold = 70; // 70%相似度阈值

    for (const existing of existingContent) {
      if (this.calculateSimilarity(newContent, existing) >= threshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * 计算相似度
   */
  private calculateSimilarity(str1: string, str2: string): number {
    // 完全匹配
    if (str1 === str2) return 100;

    // 包含关系检查
    if (str1.includes(str2) || str2.includes(str1)) {
      const shorter = str1.length < str2.length ? str1 : str2;
      const longer = str1.length >= str2.length ? str1 : str2;
      return Math.round((shorter.length / longer.length) * 100);
    }

    // 词汇相似度（基于共同字符）
    const chars1 = new Set(str1.split(''));
    const chars2 = new Set(str2.split(''));
    const intersection = new Set([...chars1].filter(x => chars2.has(x)));
    const union = new Set([...chars1, ...chars2]);

    const charSimilarity = intersection.size / union.size;

    // 长度相似度
    const lengthDiff = Math.abs(str1.length - str2.length);
    const maxLength = Math.max(str1.length, str2.length);
    const lengthSimilarity = 1 - (lengthDiff / maxLength);

    // 语义关键词匹配
    const semanticKeywords = {
      '质量': ['质量', '品质', '材质'],
      '价格': ['价格', '价钱', '费用', '成本'],
      '外观': ['外观', '设计', '颜值', '样子'],
      '功能': ['功能', '性能', '作用', '效果'],
      '操作': ['操作', '使用', '体验', '感受'],
      '好': ['好', '优秀', '棒', '佳', '强'],
      '差': ['差', '不好', '糟糕', '烂', '弱'],
      '贵': ['贵', '高', '昂贵', '贵价'],
      '便宜': ['便宜', '实惠', '低价', '便宜'],
      '简单': ['简单', '容易', '方便', '便捷'],
      '复杂': ['复杂', '困难', '麻烦', '繁琐']
    };

    let semanticScore = 0;
    for (const [key, synonyms] of Object.entries(semanticKeywords)) {
      const hasKey1 = synonyms.some(syn => str1.includes(syn));
      const hasKey2 = synonyms.some(syn => str2.includes(syn));
      if (hasKey1 && hasKey2) {
        semanticScore += 0.3;
      } else if (hasKey1 || hasKey2) {
        semanticScore += 0.1;
      }
    }

    // 综合评分
    const finalScore = (charSimilarity * 0.4 + lengthSimilarity * 0.2 + semanticScore * 0.4) * 100;
    return Math.round(Math.min(100, finalScore));
  }

  /**
   * 更新商品数据
   */
  private async updateProductData(
    productId: string,
    content: {
      sellingPoints: string[];
      painPoints: string[];
      targetAudience?: string;
    }
  ) {
    await prisma.product.update({
      where: { id: productId },
      data: {
        sellingPoints: JSON.stringify(content.sellingPoints),
        painPoints: JSON.stringify(content.painPoints),
        targetAudience: content.targetAudience ? JSON.stringify(content.targetAudience) : null,
        updatedAt: new Date()
      }
    });
  }
}

export const productAnalysisService = new ProductAnalysisService();
