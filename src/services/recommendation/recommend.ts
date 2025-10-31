import { prisma } from '@/lib/prisma';
import { getScorer } from './registry';
import type { RecommendRankRequest, RecommendRankResponse, CandidateItem } from './types';
import { decisionCache } from './cache';
import { recordRequest } from './metrics';
import { enqueueCandidateSet, enqueueCandidates, enqueueDecision } from './asyncWriter';
import { rerankWithBandit } from './bandit';
import { rerankWithLTR } from './ltr';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_K_FINE } from './constants';
import './index'; // 确保评分器被注册
import './monitor'; // 启动监控


function sample<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (copy.length > 0 && out.length < n) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return out;
}

function stableStringify(obj: any): string {
  const seen = new WeakSet();
  const stringify = (o: any): any => {
    if (o && typeof o === 'object') {
      if (seen.has(o)) return null;
      seen.add(o);
      if (Array.isArray(o)) return o.map(stringify);
      return Object.keys(o).sort().reduce((acc: any, k) => { acc[k] = stringify(o[k]); return acc; }, {});
    }
    return o;
  };
  return JSON.stringify(stringify(obj));
}

export async function recommendRank(req: RecommendRankRequest): Promise<RecommendRankResponse> {
  const startedAt = Date.now();
  const cacheKey = `decision:${req.scenario}:${stableStringify({
    task: {
      taskType: req.task.taskType,
      language: req.task.language,
      contentType: req.task.contentType,
      jsonRequirement: req.task.jsonRequirement,
      budgetTier: req.task.budgetTier,
      category: req.task.category,
    },
    context: req.context,
    constraints: req.constraints
  })}`;

  // 1) Try decision cache first (fast path) - unless explicitly bypassed
  if (!req.options?.bypassCache) {
    const cached = decisionCache.get(cacheKey) as RecommendRankResponse | undefined;
    if (cached) {
      recordRequest({ scenario: req.scenario, durationMs: Date.now() - startedAt, success: true, fromCache: true, fallback: false });
      return cached;
    }
  }
  const scorer = getScorer(req.scenario);
  if (!scorer) throw new Error(`No scorer registered for scenario ${req.scenario}`);

  // 2) scoring with hard timeout (use constraints or default 800ms)
  const hardTimeoutMs = Math.max(200, Math.min(req.constraints?.maxLatencyMs ?? 800, 5000));
  const timed = new Promise<{ topK: CandidateItem[]; coarseList: CandidateItem[]; fullPool: CandidateItem[] }>((resolve, reject) => {
    const to = setTimeout(() => reject(new Error(`RECO_TIMEOUT_${hardTimeoutMs}`)), hardTimeoutMs);
    scorer
      .rank(req)
      .then((r) => {
        clearTimeout(to);
        resolve(r);
      })
      .catch((e) => {
        clearTimeout(to);
        reject(e);
      });
  });

  let { topK, coarseList, fullPool } = await timed;
  // LTR offline rerank first, then Bandit micro-explore
  topK = rerankWithLTR(req, topK);
  topK = rerankWithBandit(topK);
  
  // 如果没有推荐结果，返回空（让前端使用默认配置）
  if (!topK || topK.length === 0) {
    console.warn(`[recommendRank] 场景 ${req.scenario} 没有推荐结果`);
    throw new Error(`没有找到适合的推荐结果，请检查是否有可用的${req.scenario === 'task->model' ? '模型' : 'Prompt'}配置`);
  }
  
  let chosen = topK[0];

  // alternatives: fineTop2, 2 coarse (not in topK), 2 OOP (not in coarse)
  const fineTop2 = topK[1];
  const coarseSet = coarseList.filter(c => !topK.find(k => k.id === c.id));
  const coarseExtras = sample(coarseSet, 2);
  const oopSet = fullPool.filter(c => !coarseList.find(m => m.id === c.id));
  const outOfPool = sample(oopSet, 2);

  // exploration: epsilon-greedy using RecommendationSetting
  let exploreFlags: any = null;
  try {
    const setting = await prisma.recommendationSetting.findUnique({ where: { scenario: req.scenario } });
    const epsilon = setting?.epsilon ?? 0.10;

    const altPool: CandidateItem[] = [];
    if (topK[1]) altPool.push(topK[1]);
    const coarseSet = coarseList.filter(c => !topK.find(k => k.id === c.id));
    const coarseExtras = sample(coarseSet, 2);
    altPool.push(...coarseExtras);
    const oopSet = fullPool.filter(c => !coarseList.find(m => m.id === c.id));
    const outOfPool = sample(oopSet, 2);
    altPool.push(...outOfPool);

    if (altPool.length > 0 && Math.random() < epsilon) {
      const picked = altPool[Math.floor(Math.random() * altPool.length)];
      if (picked) {
        chosen = picked;
        exploreFlags = {
          epsilon,
          explored: true,
          pickedId: picked.id,
          bucket: coarseExtras.find(c => c.id === picked.id)
            ? 'coarse'
            : (outOfPool.find(c => c.id === picked.id) ? 'oop' : 'fine'),
        };
      }
    }
  } catch {
    // ignore exploration errors
  }

  // persist (enqueue, generate ids beforehand)
  const candidateSetId = uuidv4();
  enqueueCandidateSet({
    id: candidateSetId,
    subjectType: req.task.subjectRef?.entityType || 'task',
    subjectId: req.task.subjectRef?.entityId || null,
    subjectSnapshot: JSON.stringify(req.task),
    targetType: req.scenario === 'product->persona' ? 'persona' : 
                req.scenario === 'product->script' ? 'script' :
                req.scenario === 'product->content-elements' ? 'content-element' :
                req.scenario === 'task->model' ? 'model' : 'prompt',
    contextSnapshot: req.context ? JSON.stringify(req.context) : null,
    createdAt: new Date(),
  });

  // save coarse candidates (M)
  enqueueCandidates(coarseList.map(c => ({
    candidateSetId,
    targetType: c.type,
    targetId: c.id,
    coarseScore: c.coarseScore ?? null,
    fineScore: c.fineScore ?? null,
    reason: c.reason ? JSON.stringify(c.reason) : null,
    createdAt: new Date(),
  })));

  // decision
  const decisionId = uuidv4();
  enqueueDecision({
    id: decisionId,
    candidateSetId,
    chosenTargetType: chosen.type,
    chosenTargetId: chosen.id,
    strategyVersion: req.options?.strategyVersion || 'v1',
    weightsSnapshot: JSON.stringify({ k: DEFAULT_K_FINE }),
    topK: topK.length,
    exploreFlags: exploreFlags ? JSON.stringify(exploreFlags) : null,
    createdAt: new Date(),
  });

  const result: RecommendRankResponse = {
    decisionId,
    candidateSetId,
    scenario: req.scenario,
    chosen,
    topK,
    alternatives: { fineTop2, coarseExtras, outOfPool },
  };

  // Put into decision cache for quick subsequent hits (unless bypassed)
  if (!req.options?.bypassCache) {
    decisionCache.set(cacheKey, result, 1 * 60 * 1000); // 1min
  }
  recordRequest({ scenario: req.scenario, durationMs: Date.now() - startedAt, success: true, fromCache: false, fallback: false });
  return result;
}
