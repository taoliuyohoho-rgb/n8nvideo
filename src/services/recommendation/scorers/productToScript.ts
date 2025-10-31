/**
 * product->script 评分器
 * 根据商品特征推荐最适合的脚本
 */

import { prisma } from '@/lib/prisma';
import { poolCache } from '../cache';
import type { Scorer } from '../registry';
import type { RecommendRankRequest, CandidateItem } from '../types';
import { DEFAULT_M_COARSE, DEFAULT_K_FINE } from '../constants';

function applyHardConstraints(script: any, req: RecommendRankRequest): boolean {
  // 目标市场匹配
  if (req.context?.region && script.targetCountry) {
    if (script.targetCountry !== req.context.region && script.targetCountry !== 'global') {
      return false;
    }
  }

  // 渠道匹配
  if (req.context?.channel && script.channel) {
    if (script.channel !== req.context.channel && script.channel !== 'all') {
      return false;
    }
  }

  return true;
}

function computeCoarseScore(script: any, req: RecommendRankRequest): number {
  let score = 0;
  const productId = req.task.subjectRef?.entityId;
  const category = req.task.category;
  const subcategory = (req.task as any).subcategory;

  // 1. 商品ID/名称匹配（+50分）
  if (productId && script.productId === productId) {
    score += 50;
  }

  // 2. 子类目匹配（+30分）
  if (subcategory && script.product?.subcategory === subcategory) {
    score += 30;
  }

  // 3. 类目匹配（+25分）
  if (category && script.product?.category === category) {
    score += 25;
  }

  // 4. 目标市场匹配（+15分）
  if (req.context?.region && script.targetCountry === req.context.region) {
    score += 15;
  }

  // 5. 渠道匹配（+10分）
  if (req.context?.channel && script.channel === req.context.channel) {
    score += 10;
  }

  // 6. 语气/风格匹配（+10分）
  const requestedTone = (req.task as any).tone;
  if (requestedTone && script.tone === requestedTone) {
    score += 10;
  }

  // 7. 新鲜度（0-10分）
  if (script.createdAt) {
    const daysSinceCreation = (Date.now() - new Date(script.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const freshnessScore = Math.max(0, 10 - daysSinceCreation / 30);
    score += freshnessScore;
  }

  return score;
}

function computeFineScore(script: any, req: RecommendRankRequest, coarseScore: number): number {
  let score = coarseScore;

  // TODO: 从 outcome 表获取历史效果数据
  // 1. 视频完播率（+20分）
  // 2. 转化率（+20分）
  // 3. 观看时长（+10分）
  // 4. 互动率（评论/点赞）（+10分）

  return score;
}

async function rankScripts(req: RecommendRankRequest) {
  const cacheKey = `product->script:${req.task.subjectRef?.entityId}:${req.task.category}:${req.context?.region}`;
  
  const cached = poolCache.get(cacheKey);
  if (cached) {
    console.log('[productToScript] 使用缓存结果');
    return cached;
  }

  // 1. 从数据库获取所有候选脚本
  const productId = req.task.subjectRef?.entityId;
  const category = req.task.category;

  const whereConditions: any[] = [];

  if (productId) {
    whereConditions.push({ productId });
  }
  if (category) {
    whereConditions.push({ product: { category } });
  }

  const where = whereConditions.length > 0 ? { OR: whereConditions } : {};

  const allScripts = await prisma.script.findMany({
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
      persona: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
    take: 100,
  });

  console.log(`[productToScript] 查询到 ${allScripts.length} 个候选脚本`);

  // 2. 应用硬约束
  const passedHard = allScripts.filter((s) => applyHardConstraints(s, req));
  console.log(`[productToScript] 通过硬约束: ${passedHard.length}`);

  if (passedHard.length === 0) {
    const result = {
      coarsePool: [],
      finePool: [],
      chosen: null,
    };
    poolCache.set(cacheKey, result, 300);
    return result;
  }

  // 3. 粗排
  const coarseScored = passedHard.map((s) => ({
    script: s,
    score: computeCoarseScore(s, req),
  }));

  coarseScored.sort((a, b) => b.score - a.score);
  const M = Math.min(DEFAULT_M_COARSE, coarseScored.length);
  const coarsePool = coarseScored.slice(0, M);

  console.log(`[productToScript] 粗排Top ${M}:`, coarsePool.map((c) => ({ id: c.script.id, angle: c.script.angle, score: c.score })));

  // 4. 精排
  const fineScored = coarsePool.map((c) => ({
    script: c.script,
    score: computeFineScore(c.script, req, c.score),
  }));

  fineScored.sort((a, b) => b.score - a.score);
  const K = Math.min(DEFAULT_K_FINE, fineScored.length);
  const finePool = fineScored.slice(0, K);

  console.log(`[productToScript] 精排Top ${K}:`, finePool.map((f) => ({ id: f.script.id, angle: f.script.angle, score: f.score })));

  // 5. 转换为 CandidateItem
  const coarseCandidates: CandidateItem[] = coarsePool.map((c) => ({
    id: c.script.id,
    type: 'script',
    title: `${c.script.angle} (${c.script.durationSec}s)`,
    name: c.script.angle,
    summary: `角度: ${c.script.angle}, 时长: ${c.script.durationSec}s`,
    coarseScore: c.score,
  }));

  const fineCandidates: CandidateItem[] = finePool.map((f) => ({
    id: f.script.id,
    type: 'script',
    title: `${f.script.angle} (${f.script.durationSec}s)`,
    name: f.script.angle,
    summary: `角度: ${f.script.angle}, 时长: ${f.script.durationSec}s`,
    coarseScore: coarsePool.find((c) => c.script.id === f.script.id)?.score || 0,
    fineScore: f.score,
  }));

  const result = {
    topK: fineCandidates,
    coarseList: coarseCandidates,
    fullPool: coarseCandidates,
  };

  poolCache.set(cacheKey, result, 300);
  return result;
}

export const productToScriptScorer: Scorer = {
  rank: rankScripts,
};

