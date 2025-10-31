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
import type { Persona, Product, Prisma } from '@prisma/client';

// 定义 Persona 与 Product 关联的类型（使用 Prisma 的 include 结果类型）
type PersonaWithProductSelect = {
  id: string;
  name: string;
  description: string | null;
  productId: string | null;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
  coreIdentity: Prisma.JsonValue | null;
  generatedContent: Prisma.JsonValue;
  product: {
    id: string;
    name: string;
    category: string;
    subcategory: string | null;
  } | null;
};

// JSON 字段的类型定义
interface GeneratedContent {
  targetCountries?: string[];
  basicInfo?: {
    location?: string;
  };
}

interface CoreIdentity {
  location?: string;
}

// 类型守卫函数
function isGeneratedContent(value: unknown): value is GeneratedContent {
  return typeof value === 'object' && value !== null;
}

function isCoreIdentity(value: unknown): value is CoreIdentity {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * 硬约束：必须满足的条件
 */
function applyHardConstraints(persona: PersonaWithProductSelect, req: RecommendRankRequest): boolean {
  // 1. 如果指定了商品ID，优先匹配相同商品的人设
  if (req.task.subjectRef?.entityId) {
    // 不在这里过滤，让所有人设都参与评分
  }

  // 2. 如果指定了目标市场，检查人设的目标市场/地点是否匹配（国家级）
  if (req.context?.region) {
    const desired = String(req.context.region);
    
    // 安全访问 generatedContent
    const gc = persona.generatedContent;
    const generatedContent = isGeneratedContent(gc) ? gc : null;
    const gcFirst = Array.isArray(generatedContent?.targetCountries) 
      ? generatedContent.targetCountries[0] 
      : undefined;
    
    // 安全访问 coreIdentity
    const coreIdentity = persona.coreIdentity;
    const coreId = isCoreIdentity(coreIdentity) ? coreIdentity : null;
    const coreLoc = isString(coreId?.location) ? coreId.location : undefined;
    
    // 安全访问 generatedContent.basicInfo.location
    const genLoc = isString(generatedContent?.basicInfo?.location) 
      ? generatedContent.basicInfo.location 
      : undefined;

    const personaCountry = 
      gcFirst || 
      inferCountryFromLocation(coreLoc) || 
      inferCountryFromLocation(genLoc);

    if (personaCountry && !isCountryMatch(personaCountry, desired) && !isCountryMatch(personaCountry, 'global')) {
      return false;
    }
  }

  return true;
}

/**
 * 粗排评分：基于静态特征快速筛选
 */
function computeCoarseScore(persona: PersonaWithProductSelect, req: RecommendRankRequest): number {
  let score = 0;
  const productId = req.task.subjectRef?.entityId;
  const category = req.task.category;
  const subcategory = 'subcategory' in req.task && typeof req.task.subcategory === 'string'
    ? req.task.subcategory
    : undefined;

  // 1. 商品ID完全匹配（最高优先级，+50分）
  if (productId && persona.productId === productId) {
    score += 50;
  }

  // 2. 商品名称匹配（+50分，与productId同等优先级）
  if (productId && persona.product?.name) {
    const productName = 'productName' in req.task && typeof req.task.productName === 'string'
      ? req.task.productName
      : undefined;
    if (productName && persona.product.name === productName) {
      score += 50;
    }
  }

  // 3. 子类目匹配（+30分）
  if (subcategory && persona.product?.subcategory === subcategory) {
    score += 30;
  }

  // 4. 类目匹配（+25分）
  if (category && persona.product?.category) {
    if (persona.product.category === category) {
      score += 25;
    } else if (category.includes(persona.product.category)) {
      score += 15; // 部分匹配
    }
  }

  // 5. 目标市场匹配（+15分，按国家归一化匹配）
  if (req.context?.region) {
    const desired = String(req.context.region);
    const gc = persona.generatedContent;
    const generatedContent = isGeneratedContent(gc) ? gc : null;
    const gcFirst = Array.isArray(generatedContent?.targetCountries)
      ? generatedContent.targetCountries[0]
      : undefined;
    const coreIdentity = persona.coreIdentity;
    const coreId = isCoreIdentity(coreIdentity) ? coreIdentity : null;
    const coreLoc = isString(coreId?.location) ? coreId.location : undefined;
    const genLoc = isString(generatedContent?.basicInfo?.location)
      ? generatedContent.basicInfo.location
      : undefined;
    const personaCountry = gcFirst || inferCountryFromLocation(coreLoc) || inferCountryFromLocation(genLoc);
    if (personaCountry && isCountryMatch(personaCountry, desired)) {
      score += 15;
    }
  }

  // 7. 人设活跃度（基于创建时间，越新越好，0-10分）
  if (persona.createdAt) {
    const createdAtDate = persona.createdAt instanceof Date
      ? persona.createdAt
      : new Date(persona.createdAt);
    const daysSinceCreation = (Date.now() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24);
    const freshnessScore = Math.max(0, 10 - daysSinceCreation / 30); // 每30天衰减1分
    score += freshnessScore;
  }

  return score;
}

/**
 * 精排评分：基于历史效果数据精细排序
 */
function computeFineScore(persona: PersonaWithProductSelect, req: RecommendRankRequest, coarseScore: number): number {
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
  const subcategory = 'subcategory' in req.task && typeof req.task.subcategory === 'string'
    ? req.task.subcategory
    : undefined;
  const productName = 'productName' in req.task && typeof req.task.productName === 'string'
    ? req.task.productName
    : undefined;

  const whereConditions: Prisma.PersonaWhereInput[] = [];

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
  const where: Prisma.PersonaWhereInput = whereConditions.length > 0 ? { OR: whereConditions } : {};

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
  const passedHard = allPersonas.filter((p) => applyHardConstraints(p as unknown as PersonaWithProductSelect, req));
  console.log(`[productToPersona] 通过硬约束: ${passedHard.length}`);

  if (passedHard.length === 0) {
    return { coarsePool: [], finePool: [], chosen: null };
  }

  // 3. 粗排
  const coarseScored = passedHard.map((欲望) => ({
    persona: p as unknown as PersonaWithProductSelect体内,
    score: computeCoarseScore(p as unknown as PersonaWithProductSelect, req),
  }));

  coarseScored.sort((a, b) => b.score - a.score);
  const M = Math.min(DEFAULT_M_COARSE, coarseScored.length);
  const coarsePool = coarseScored.slice(0, M);

  console.log(`[productToPersona] 粗排Top ${M}:`, coarsePool.map((c) => ({ 
    id: c.persona.id, 
    name: (c.persona as PersonaWithProductSelect).name, 
    score: c.score 
  })));

  // 4. 精排
  const fineScored = coarsePool.map((c) => ({
    persona: c.persona as PersonaWithProductSelect,
    score: computeFineScore(c.persona as PersonaWithProductSelect, req, c.score),
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

  console.log(`[productToPersona] 精排结果（第1个固定，其他${finePool.length > 0 ? finePool.length - 1 : 0}个随机）:`, finePool.map((f) => ({ 
    id: f.persona.id, 
    name: (f.persona as PersonaWithProductSelect).name, 
    score: f.score 
  })));

  // 5. 转换为 CandidateItem
  const coarseCandidates: CandidateItem[] = coarsePool.map((c) => {
    const p = c.persona as PersonaWithProductSelect;
    return {
      id: p.id,
      type: 'persona' as const,
      title: p.name || `人设 ${p.id}`,
      name: p.name,
      summary: p.description || '',
      coarseScore: c.score,
    };
  });

  const fineCandidates: CandidateItem[] = finePool.map((f) => {
    const p = f.persona as PersonaWithProductSelect;
    return {
      id: p.id,
      type: 'persona' as const,
      title: p.name || `人设 ${p.id}`,
      name: p.name,
      summary: p.description || '',
      coarseScore: coarsePool.find((c) => c.persona.id === p.id)?.score || 0,
      fineScore: f.score,
    };
  });

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
