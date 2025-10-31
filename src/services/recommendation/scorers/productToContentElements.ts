/**
 * product->content-elements 评分器
 * 从商品的卖点/痛点/目标受众中选择最适合视频的 Top 5
 */

import { poolCache } from '../cache';
import type { Scorer } from '../registry';
import type { RecommendRankRequest, CandidateItem } from '../types';
import { DEFAULT_K_FINE } from '../constants';

/**
 * 评分逻辑：基于历史效果和内容特征
 */
function computeScore(element: string, elementType: string, req: RecommendRankRequest): number {
  let score = 50; // 基础分

  // 1. 文本长度评分（不要太长，10-30字最佳）
  const length = element.length;
  if (length >= 10 && length <= 30) {
    score += 15;
  } else if (length > 30 && length <= 50) {
    score += 10;
  } else if (length < 10) {
    score += 5;
  }

  // 2. 关键词密度（包含目标市场相关词汇）
  if (req.context?.region) {
    const regionKeywords: Record<string, string[]> = {
      'MY': ['马来', '大马', '吉隆坡', '穆斯林'],
      'TH': ['泰国', '曼谷', '泰式'],
      'VN': ['越南', '河内', '西贡'],
      'ID': ['印尼', '雅加达', '巴厘岛'],
      'PH': ['菲律宾', '马尼拉'],
      'SG': ['新加坡', '狮城'],
    };
    const keywords = regionKeywords[req.context.region] || [];
    if (keywords.some((kw) => element.includes(kw))) {
      score += 10;
    }
  }

  // 3. 情感强度（积极词汇）
  const positiveWords = ['高效', '便捷', '省心', '实惠', '优质', '专业', '安全', '放心', '满意', '推荐'];
  const negativeWords = ['烦恼', '困扰', '麻烦', '担心', '问题', '难题'];
  
  if (elementType === 'selling-point') {
    // 卖点更看重积极词汇
    const positiveCount = positiveWords.filter((w) => element.includes(w)).length;
    score += positiveCount * 5;
  } else if (elementType === 'pain-point') {
    // 痛点更看重负面词汇（引起共鸣）
    const negativeCount = negativeWords.filter((w) => element.includes(w)).length;
    score += negativeCount * 5;
  }

  // 4. 可视化程度（易于视频展示）
  const visualWords = ['外观', '颜色', '设计', '尺寸', '材质', '包装', '效果', '对比'];
  if (visualWords.some((w) => element.includes(w))) {
    score += 8;
  }

  // 5. 具体性（包含数字更具体）
  if (/\d+/.test(element)) {
    score += 5;
  }

  // TODO: 从 outcome 表获取历史效果数据
  // 6. 历史点击率（+20分）
  // 7. 历史转化率（+20分）
  // 8. 用户反馈（+10分）

  return score;
}

/**
 * product->content-elements 评分器实现
 */
async function rankContentElements(req: RecommendRankRequest) {
  const elementType = (req.task as any).elementType; // 'selling-point' | 'pain-point' | 'target-audience'
  const elements = (req.task as any).elements || []; // 候选元素数组

  if (!elementType || !Array.isArray(elements) || elements.length === 0) {
    console.log('[productToContentElements] 缺少 elementType 或 elements');
    return { coarsePool: [], finePool: [], chosen: null };
  }

  const cacheKey = `product->content-elements:${req.task.subjectRef?.entityId}:${elementType}:${req.context?.region}`;
  
  const cached = poolCache.get(cacheKey);
  if (cached) {
    console.log('[productToContentElements] 使用缓存结果');
    return cached;
  }

  console.log(`[productToContentElements] 评分 ${elements.length} 个 ${elementType}`);

  // 评分所有元素
  const scored = elements.map((element: string, index: number) => ({
    element,
    index,
    score: computeScore(element, elementType, req),
  }));

  // 按分数降序排序
  scored.sort((a, b) => b.score - a.score);

  // 取Top K（默认5个）
  const K = Math.min((req as any).topK || DEFAULT_K_FINE + 2, scored.length); // Top 5
  const topK = scored.slice(0, K);

  console.log(`[productToContentElements] Top ${K}:`, topK.map((t) => ({ element: t.element, score: t.score })));

  // 转换为 CandidateItem
  const candidates: CandidateItem[] = topK.map((t) => ({
    id: `${req.task.subjectRef?.entityId}_${elementType}_${t.index}`,
    type: elementType,
    title: t.element,
    name: t.element,
    summary: '',
    coarseScore: t.score,
    fineScore: t.score,
  }));

  const result = {
    coarsePool: candidates,
    finePool: candidates,
    chosen: candidates[0] || null,
  };

  // 缓存结果（10分钟）
  poolCache.set(cacheKey, result, 600);

  return result;
}

export const productToContentElementsScorer: Scorer = {
  rank: rankContentElements,
};

