/**
 * 预估模型 (Estimation Model) - 主排序服务
 * 整合粗排、精排、探索、回退，提供统一Rank接口
 */

import { prisma } from '@/lib/prisma';
import type { RankRequest, RankResponse} from './types';
import { CandidateItem } from './types';
import {
  DEFAULT_TOP_K,
  DEFAULT_EXPLORE_ENABLED,
  DEFAULT_STRATEGY_VERSION,
  DEFAULT_WEIGHTS_VERSION,
  buildSegmentKey,
  DEFAULT_COARSE_WEIGHTS,
  DEFAULT_FINE_WEIGHTS,
  DEFAULT_EXPLORE_CONFIG,
} from './constants';
import { RANK_BAD_REQUEST, RANK_NO_CANDIDATE } from './errors';
import { getActiveModels, getModelById } from './models';
import { getFeaturesByRef } from './features';
import { filterModels } from './filters';
import { coarseRank } from './coarse';
import { fineRank } from './fine';
import { epsilonGreedyExplore, shouldForceOffExplore } from './explore';
import { filterCircuitBrokenModels, getLKG, setLKG } from './fallback';
import { getSegmentMetrics } from './metrics';


/**
 * 主Rank函数
 */
export async function rank(request: RankRequest): Promise<RankResponse> {
  const startTime = Date.now();

  // 1. 参数校验
  validateRankRequest(request);

  const { task, context, constraints, options } = request;
  const topK = options?.topK ?? DEFAULT_TOP_K;
  const explore = options?.explore ?? DEFAULT_EXPLORE_ENABLED;
  const strategyVersion = options?.strategyVersion ?? DEFAULT_STRATEGY_VERSION;
  const weightsVersion = DEFAULT_WEIGHTS_VERSION;
  const requestId = options?.requestId ?? `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 检查幂等
  if (options?.requestId) {
    const existing = await prisma.estimationDecision.findUnique({
      where: { requestId: options.requestId },
      include: {
        candidateSet: {
          include: {
            candidates: true,
          },
        },
      },
    });

    if (existing) {
      // 返回已有决策（简化，实际需重建响应）
      const chosen = await getModelById(existing.chosenModelId);
      if (chosen) {
        return {
          decisionId: existing.id,
          candidateSetId: existing.candidateSetId,
          strategyVersion: existing.strategyVersion,
          weightsVersion: weightsVersion,
          chosen: {
            modelId: chosen.id,
            provider: chosen.provider,
            modelName: chosen.modelName,
            expectedCost: existing.expectedCost ?? undefined,
            expectedLatency: existing.expectedLatency ?? undefined,
          },
          candidates: [],
          warnings: ['Returned from idempotent cache'],
        };
      }
    }
  }

  const segmentKey = buildSegmentKey(task.category, context?.region, context?.channel);

  // 2. 获取任务特征（如果有subjectRef）
  let taskFeatures = undefined;
  if (task.subjectRef) {
    taskFeatures = await getFeaturesByRef(task.subjectRef) ?? undefined;
  }

  // 3. 获取候选模型池（去除熔断）
  let allModels = await getActiveModels();
  allModels = filterCircuitBrokenModels(allModels);

  if (allModels.length === 0) {
    throw RANK_NO_CANDIDATE('No active models available after circuit breaker filter', {});
  }

  // 4. 硬过滤
  const { passed: filteredModels, filtered } = filterModels(allModels, task, constraints);

  if (filteredModels.length === 0) {
    // 回退到LKG
    const lkgModelId = getLKG(segmentKey);
    if (lkgModelId) {
      const lkgModel = await getModelById(lkgModelId);
      if (lkgModel) {
        const candidateSet = await saveCandidateSet(task, context);
        const decision = await saveDecision(candidateSet.id, lkgModel.id, segmentKey, requestId, strategyVersion, weightsVersion, true);
        
        return {
          decisionId: decision.id,
          candidateSetId: candidateSet.id,
          strategyVersion,
          weightsVersion,
          chosen: {
            modelId: lkgModel.id,
            provider: lkgModel.provider,
            modelName: lkgModel.modelName,
          },
          candidates: [],
          fallbackUsed: true,
          warnings: ['No candidates passed filters, used LKG'],
        };
      }
    }

    throw RANK_NO_CANDIDATE('No candidates passed filters and no LKG available', { filtered });
  }

  // 5. 粗排
  const coarseStartTime = Date.now();
  const coarseResults = coarseRank(filteredModels, task, taskFeatures, DEFAULT_COARSE_WEIGHTS, topK);
  const coarseMs = Date.now() - coarseStartTime;

  // 6. 精排
  const fineStartTime = Date.now();
  const fineResults = await fineRank(coarseResults, task, context, DEFAULT_FINE_WEIGHTS);
  const fineMs = Date.now() - fineStartTime;

  // 7. 探索决策
  let chosen = fineResults[0];
  let exploreFlag = false;

  if (explore && fineResults.length > 1) {
    const segmentMetrics = await getSegmentMetrics(segmentKey);
    const forceOff = shouldForceOffExplore(segmentMetrics ?? undefined, DEFAULT_EXPLORE_CONFIG);

    if (!forceOff) {
      const exploreResult = epsilonGreedyExplore(
        fineResults.map(r => ({ model: r.model, fineScore: r.fineScore })),
        DEFAULT_EXPLORE_CONFIG
      );
      chosen = fineResults.find(r => r.model.id === exploreResult.chosen.model.id) || fineResults[0];
      exploreFlag = exploreResult.explore;
    }
  }

  // 8. 保存候选集与决策
  const candidateSet = await saveCandidateSet(task, context, fineResults);
  const decision = await saveDecision(
    candidateSet.id,
    chosen.model.id,
    segmentKey,
    requestId,
    strategyVersion,
    weightsVersion,
    false,
    chosen.model.pricePer1kTokens * 2, // 粗略估算
    3000, // 粗略延迟
    exploreFlag
  );

  // 9. 更新LKG（仅当非探索时）
  if (!exploreFlag) {
    setLKG(segmentKey, chosen.model.id);
  }

  const totalMs = Date.now() - startTime;

  // 10. 构造响应
  return {
    decisionId: decision.id,
    candidateSetId: candidateSet.id,
    strategyVersion,
    weightsVersion,
    chosen: {
      modelId: chosen.model.id,
      provider: chosen.model.provider,
      modelName: chosen.model.modelName,
      coarseScore: chosen.coarseScore,
      fineScore: chosen.fineScore,
      expectedCost: chosen.model.pricePer1kTokens * 2,
      expectedLatency: 3000,
    },
    candidates: fineResults.slice(0, topK).map(r => ({
      modelId: r.model.id,
      provider: r.model.provider,
      modelName: r.model.modelName,
      coarseScore: r.coarseScore,
      fineScore: r.fineScore,
    })),
    timings: {
      coarseMs,
      fineMs,
      totalMs,
    },
  };
}

// ========== 辅助函数 ==========

function validateRankRequest(request: RankRequest): void {
  if (!request.task) {
    throw RANK_BAD_REQUEST('task is required', {});
  }
  if (!request.task.lang) {
    throw RANK_BAD_REQUEST('task.lang is required', {});
  }
}

async function saveCandidateSet(task: any, context: any, candidates?: any[]): Promise<any> {
  const candidateSet = await prisma.estimationCandidateSet.create({
    data: {
      taskSnapshot: JSON.stringify(task),
      contextSnapshot: context ? JSON.stringify(context) : null,
    },
  });

  if (candidates) {
    await prisma.estimationCandidate.createMany({
      data: candidates.map((c: any) => ({
        candidateSetId: candidateSet.id,
        modelId: c.model.id,
        coarseScore: c.coarseScore,
        fineScore: c.fineScore,
        reason: JSON.stringify(c.features),
        filtered: false,
      })),
    });
  }

  return candidateSet;
}

async function saveDecision(
  candidateSetId: string,
  chosenModelId: string,
  segmentKey: string,
  requestId: string,
  strategyVersion: string,
  weightsVersion: string,
  fallbackUsed: boolean,
  expectedCost?: number,
  expectedLatency?: number,
  explore?: boolean
): Promise<any> {
  return await prisma.estimationDecision.create({
    data: {
      candidateSetId,
      chosenModelId,
      strategyVersion,
      weightsSnapshot: JSON.stringify({ weightsVersion, fallbackUsed, explore }),
      segmentKey,
      requestId,
      expectedCost,
      expectedLatency,
      exploreFlags: explore ? JSON.stringify({ explore: true }) : null,
    },
  });
}














