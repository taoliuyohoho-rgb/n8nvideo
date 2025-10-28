import { PrismaClient } from '@prisma/client';
import { getScorer } from './registry';
import { RecommendRankRequest, RecommendRankResponse, CandidateItem } from './types';
import { DEFAULT_K_FINE } from './constants';
import './index'; // 确保评分器被注册

const prisma = new PrismaClient();

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

export async function recommendRank(req: RecommendRankRequest): Promise<RecommendRankResponse> {
  const scorer = getScorer(req.scenario);
  if (!scorer) throw new Error(`No scorer registered for scenario ${req.scenario}`);

  // scoring
  const { topK, coarseList, fullPool } = await scorer.rank(req);
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

  // persist candidate set
  const candidateSet = await prisma.recommendationCandidateSet.create({
    data: {
      subjectType: req.task.subjectRef?.entityType || 'task',
      subjectId: req.task.subjectRef?.entityId || null,
      subjectSnapshot: JSON.stringify(req.task),
      targetType: req.scenario === 'product->style' ? 'style' : (req.scenario === 'task->model' ? 'model' : 'prompt'),
      contextSnapshot: req.context ? JSON.stringify(req.context) : null,
    },
  });

  // save coarse candidates (M)
  await prisma.recommendationCandidate.createMany({
    data: coarseList.map(c => ({
      candidateSetId: candidateSet.id,
      targetType: c.type,
      targetId: c.id,
      coarseScore: c.coarseScore ?? null,
      fineScore: c.fineScore ?? null,
      reason: c.reason ? JSON.stringify(c.reason) : null,
    })),
  });

  // decision
  const decision = await prisma.recommendationDecision.create({
    data: {
      candidateSetId: candidateSet.id,
      chosenTargetType: chosen.type,
      chosenTargetId: chosen.id,
      strategyVersion: req.options?.strategyVersion || 'v1',
      weightsSnapshot: JSON.stringify({ k: DEFAULT_K_FINE }),
      topK: topK.length,
      exploreFlags: exploreFlags ? JSON.stringify(exploreFlags) : null,
    },
  });

  return {
    decisionId: decision.id,
    candidateSetId: candidateSet.id,
    scenario: req.scenario,
    chosen,
    topK,
    alternatives: {
      fineTop2,
      coarseExtras,
      outOfPool,
    },
  };
}
