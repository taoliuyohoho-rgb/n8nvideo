/**
 * product->persona 评分器
 * 根据商品特征推荐最适合的人设
 */

import { prisma } from '@/lib/prisma';
import { inferCountryFromLocation, isCountryMatch } from '@/src/utils/geo';
import { poolCache } from '../cache';
import type { Scorer } from '../registry';
import type { RecommendRankRequest, CandidateItem } from '../types';
import { DEFAULT_M_COARSE, DEFAULT_K_FINE } from '../constants';

/**
 * 硬约束：必须满足的条件
 */
function applyHardConstraints(persona: Record<string, unknown>, req: RecommendRankRequest): boolean {
  // 1. 如果指定了商品ID，优先匹配相同商品的人设
  if (req.task.subjectRef?.entityId) {
    // 不在这里过滤，让所有人设都参与评分
  }

  // 2. 如果指定了目标市场，检查人设的目标市场/地点是否匹配（国家级）
  if (req.context?.region) {
    const desired = String(req.context.region);
    const explicit = (persona as Record<string, unknown>).targetCountry as string | undefined;
    const gc = (persona as Record<string, unknown>).generatedContent as any;
    const gcFirst = Array.isArray(gc?.targetCountries) ? gc.targetCountries[0] : undefined;
    const coreLoc = (persona as Record<string, unknown>).coreIdentity?.location as string | undefined;
    const genLoc = gc?.basicInfo?.location as string | undefined;

    const personaCountry = explicit || gcFirst || inferCountryFromLocation(coreLoc) || inferCountryFromLocation(genLoc);

    if (personaCountry && !isCountryMatch(personaCountry, desired) && !isCountryMatch(personaCountry, 'global')) {
      return false;
    }
  }

  return true;
}

/**
 * 粗排评分：基于静态特征快速筛选
 */
function computeCoarseScore(persona: Record<string, unknown>, req: RecommendRankRequest): number {
  let score = 0;
  const productId = req.task.subjectRef?.entityId;
  const category = req.task.category;
  const subcategory = (req.task as Record<string, unknown>).subcategory;

  // 1. 商品ID完全匹配（最高优先级，+50分）
  if (productId && persona.productId === productId) {
    score += 50;
  }

  // 2. 商品名称匹配（+50分，与productId同等优先级）
  if (productId && persona.product?.name) {
    const productName = (req.task as Record<string, unknown>).productName;
    if (productName && persona.product.name === productName) {
      score += 50;
    }
  }

  // 3. 子类目匹配（+30分）
  if (subcategory && persona.product?.subcategory === subcategory) {
    score += 30;
  }

  // 4. 类目匹配（+25分）
  if (category) {
    if (persona.product?.category === category) {
      score += 25;
    } else if (persona.product?.category && category.includes(persona.product.category)) {
      score += 15; // 部分匹配
    }
  }

  // 5. 目标市场匹配（+15分，按国家归一化匹配）
  if (req.context?.region) {
    const desired = String(req.context.region);
    const explicit = (persona as Record<string, unknown>).targetCountry as string | undefined;
    const gc = (persona as Record<string, unknown>).generatedContent as any;
    const gcFirst = Array.isArray(gc?.targetCountries) ? gc.targetCountries[0] : undefined;
    const coreLoc = (persona as Record<string, unknown>).coreIdentity?.location as string | undefined;
    const genLoc = gc?.basicInfo?.location as string | undefined;
    const personaCountry = explicit || gcFirst || inferCountryFromLocation(coreLoc) || inferCountryFromLocation(genLoc);
    if (personaCountry && isCountryMatch(personaCountry, desired)) {
      score += 15;
    }
  }

  // 6. 渠道匹配（+10分）
  if (req.context?.channel && persona.channel === req.context.channel) {
    score += 10;
  }

  // 7. 人设活跃度（基于创建时间，越新越好，0-10分）
  if (persona.createdAt) {
    const daysSinceCreation = (Date.now() - new Date(persona.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const freshnessScore = Math.max(0, 10 - daysSinceCreation / 30); // 每30天衰减1分
    score += freshnessScore;
  }

  return score;
}

/**
 * 精排评分：基于历史效果数据精细排序
 */
function computeFineScore(persona: Record<string, unknown>, req: RecommendRankRequest, coarseScore: number): number {
  let score = coarseScore;

  // TODO: 从 outcome 表获取历史效果数据
  // 1. 视频完播率（+20分）
  // 2. 点击率（+15分）
  // 3. 转化率（+15分）
  // 4. 用户反馈评分（+10分）

  // 当前使用粗排分数作为基础
  return score;
}

/**
 * product->persona 评分器实现
 */
async function rankPersonas(req: RecommendRankRequest) {
  const cacheKey = `product->persona:${req.task.subjectRef?.entityId}:${req.task.category}:${req.context?.region}`;
  
  // 检查缓存
  const cached = poolCache.get(cacheKey);
  if (cached) {
    console.log('[productToPersona] 使用缓存结果');
    return cached;
  }

  // 1. 从数据库获取所有候选人设
  const productId = req.task.subjectRef?.entityId;
  const category = req.task.category;
  const subcategory = (req.task as Record<string, unknown>).subcategory;
  const productName = (req.task as Record<string, unknown>).productName;

  const whereConditions: Record<string, unknown>[] = [];

  // 构建查询条件（OR关系）
  if (productId) {
    whereConditions.push({ productId });
  }
  if (productName) {
    whereConditions.push({ product: { name: productName } });
  }
  if (subcategory) {
    whereConditions.push({ product: { subcategory } });
  }
  if (category) {
    whereConditions.push({ product: { category } });
  }

  // 如果没有任何条件，查询所有人设
  const where = whereConditions.length > 0 ? { OR: whereConditions } : {};

  const allPersonas = await prisma.persona.findMany({
    where,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          category: true,
          subcategory: true,
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
    take: 100, // 限制数量，避免查询过多
  });

  console.log(`[productToPersona] 查询参数:`, {
    productId,
    productName,
    category,
    subcategory
  });
  console.log(`[productToPersona] 查询条件:`, JSON.stringify(where, null, 2));
  console.log(`[productToPersona] 查询到 ${allPersonas.length} 个候选人设`);
  
  if (allPersonas.length === 0) {
    console.warn('[productToPersona] ⚠️ 数据库中没有匹配的人设！');
    console.warn('[productToPersona] 建议：1) 生成新人设 2) 检查数据库是否有人设数据');
  } else {
    console.log(`[productToPersona] 前3个人设:`, allPersonas.slice(0, 3).map(p => ({
      id: p.id,
      productId: p.productId,
      productName: p.product?.name,
      category: p.product?.category,
      subcategory: p.product?.subcategory
    })));
  }

  // 2. 应用硬约束
  const passedHard = allPersonas.filter((p) => applyHardConstraints(p, req));
  console.log(`[productToPersona] 通过硬约束: ${passedHard.length}`);

  if (passedHard.length === 0) {
    return { coarsePool: [], finePool: [], chosen: null };
  }

  // 3. 粗排
  const coarseScored = passedHard.map((p) => ({
    persona: p,
    score: computeCoarseScore(p, req),
  }));

  coarseScored.sort((a, b) => b.score - a.score);
  const M = Math.min(DEFAULT_M_COARSE, coarseScored.length);
  const coarsePool = coarseScored.slice(0, M);

  console.log(`[productToPersona] 粗排Top ${M}:`, coarsePool.map((c) => ({ 
    id: c.persona.id, 
    name: (c.persona as any).name, 
    score: c.score 
  })));

  // 4. 精排
  const fineScored = coarsePool.map((c) => ({
    persona: c.persona,
    score: computeFineScore(c.persona, req, c.score),
  }));

  fineScored.sort((a, b) => b.score - a.score);
  
  // 🎲 改进：第1个固定（最佳匹配），其他的从候选池随机选择
  const finePool: typeof fineScored = [];
  
  if (fineScored.length > 0) {
    // 第一个：最佳匹配（固定）
    finePool.push(fineScored[0]);
    
    // 其他的：从剩余候选中随机选择
    const remaining = fineScored.slice(1);
    const additionalCount = Math.min(DEFAULT_K_FINE - 1, remaining.length);
    
    // 随机选择（不重复）
    const shuffled = [...remaining].sort(() => Math.random() - 0.5);
    finePool.push(...shuffled.slice(0, additionalCount));
  }

  console.log(`[productToPersona] 精排结果（第1个固定，其他${finePool.length - 1}个随机）:`, finePool.map((f) => ({ 
    id: f.persona.id, 
    name: (f.persona as any).name, 
    score: f.score 
  })));

  // 5. 转换为 CandidateItem
  const coarseCandidates: CandidateItem[] = coarsePool.map((c) => ({
    id: c.persona.id,
    type: 'persona',
    title: (c.persona as any).name || `人设 ${c.persona.id}`,
    name: (c.persona as any).name,
    summary: (c.persona as any).description || '',
    coarseScore: c.score,
  }));

  const fineCandidates: CandidateItem[] = finePool.map((f) => ({
    id: f.persona.id,
    type: 'persona',
    title: (f.persona as any).name || `人设 ${f.persona.id}`,
    name: (f.persona as any).name,
    summary: (f.persona as any).description || '',
    coarseScore: coarsePool.find((c) => c.persona.id === f.persona.id)?.score || 0,
    fineScore: f.score,
  }));

  const result = {
    topK: fineCandidates,
    coarseList: coarseCandidates,
    fullPool: coarseCandidates,
  };

  // 缓存结果（1分钟）
  poolCache.set(cacheKey, result, 60);

  return result;
}

/**
 * 导出符合 Scorer 接口的对象
 */
export const productToPersonaScorer: Scorer = {
  rank: rankPersonas,
};

