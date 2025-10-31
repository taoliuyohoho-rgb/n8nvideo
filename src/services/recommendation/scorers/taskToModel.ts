import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { poolCache } from '../cache';
import type { Scorer } from '../registry';
import type { RecommendRankRequest, CandidateItem } from '../types';
import { DEFAULT_M_COARSE, DEFAULT_K_FINE } from '../constants';


function applyHardConstraints(model: any, req: RecommendRankRequest): boolean {
  // language
  if (req.task.language) {
    try {
      const langs = JSON.parse(model.langs || '[]');
      if (Array.isArray(langs) && langs.length > 0) {
        if (!langs.includes(req.task.language)) return false;
      }
    } catch {}
  }
  // json-mode
  if (req.constraints?.requireJsonMode && !model.jsonModeSupport) return false;
  // budget (coarse estimate)
  if (req.constraints?.maxCostUSD && model.pricePer1kTokens) {
    const est = model.pricePer1kTokens * 2; // rough 2k tokens
    if (est > req.constraints.maxCostUSD) return false;
  }
  // provider allow/deny
  if (req.constraints?.allowProviders && req.constraints.allowProviders.length > 0) {
    if (!req.constraints.allowProviders.includes(model.provider)) return false;
  }
  if (req.constraints?.denyProviders && req.constraints.denyProviders.includes(model.provider)) return false;

  // taskType/contentType hint
  if (req.task.taskType === 'vision') {
    // require toolUseSupport or special provider hint (placeholder)
    if (!model.toolUseSupport) return false;
  }
  
  // 支持新的业务模块
  if (req.task.taskType === 'product-analysis' || req.task.taskType === 'video-script' || req.task.taskType === 'ai-reverse-engineer') {
    // 需要支持JSON模式
    if (req.task.jsonRequirement && !model.jsonModeSupport) return false;
    // 需要支持中文
    try {
      const langs = JSON.parse(model.langs || '[]');
      if (Array.isArray(langs) && langs.length > 0) {
        if (!langs.includes('zh')) return false;
      }
    } catch {}
  }
  return true;
}

export const taskToModelScorer: Scorer = {
  async rank(req: RecommendRankRequest) {
    const m = DEFAULT_M_COARSE;
    const k = DEFAULT_K_FINE;

    // 注意：模型数据应该在应用启动时已经同步到数据库
    // 如果没有模型数据，请运行: npm run init-models
    
    const models = await poolCache.getOrSet(
      'modelPool:active',
      () => prisma.estimationModel.findMany({ where: { status: 'active' } }),
      5 * 60 * 1000 // 5min TTL
    );
    // 仅使用已验证的 provider 的模型作为候选
    const verifiedFile = path.join(process.cwd(), 'verified-models.json');
    let verifiedProviders: Set<string> | null = null;
    try {
      if (fs.existsSync(verifiedFile)) {
        const raw = fs.readFileSync(verifiedFile, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const providerMap: Record<string, string> = {
            'Google': 'gemini',
            'OpenAI': 'openai',
            'DeepSeek': 'deepseek',
            '字节跳动': 'doubao',
            'Anthropic': 'anthropic',
          };
          const set = new Set<string>();
          for (const m of list) {
            if (m?.status === 'verified' && typeof m?.provider === 'string') {
              const p = providerMap[m.provider] || m.provider.toLowerCase();
              set.add(p);
            }
          }
          verifiedProviders = set;
        }
      }
    } catch {}

    // 读取 verified-models.json，只使用 status 为 verified 且 verified 为 true 的 provider
    let activeVerifiedProviders = new Set<string>();
    try {
      const verifiedPath = path.join(process.cwd(), 'verified-models.json');
      if (fs.existsSync(verifiedPath)) {
        const raw = fs.readFileSync(verifiedPath, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const providerMap: Record<string, string> = {
            'Google': 'gemini',
            'OpenAI': 'openai',
            'DeepSeek': 'deepseek',
            '字节跳动': 'doubao',
            'Anthropic': 'anthropic',
          };
          for (const item of list) {
            // 只有 status === 'verified' 且 verified === true 且没有 quotaError 的才算 active
            if (item?.status === 'verified' && item?.verified === true && !item?.quotaError && typeof item?.provider === 'string') {
              const normalizedProvider = providerMap[item.provider] || item.provider.toLowerCase();
              activeVerifiedProviders.add(normalizedProvider);
              console.log(`[taskToModel] 可用provider: ${normalizedProvider}`);
            } else if (item?.provider) {
              const normalizedProvider = providerMap[item.provider] || item.provider.toLowerCase();
              console.log(`[taskToModel] 过滤不可用provider: ${normalizedProvider} (status: ${item.status}, verified: ${item.verified}, hasQuotaError: ${!!item.quotaError})`);
            }
          }
        }
      }
    } catch (e) {
      console.warn('[taskToModel] 无法读取 verified-models.json:', e);
    }

    const pool: CandidateItem[] = [];
    for (const model of models) {
      // 只使用 activeVerifiedProviders 中的 provider
      const modelProvider = (model.provider || '').toLowerCase();
      if (activeVerifiedProviders.size > 0 && !activeVerifiedProviders.has(modelProvider)) {
        console.log(`[taskToModel] 跳过不可用模型: ${model.provider}/${model.modelName}`);
        continue;
      }
      
      if (!applyHardConstraints(model, req)) continue;
      // coarse features
      const f: Record<string, number> = {};
      f.langMatch = req.task.language ? 1 : 0.7;
      f.jsonSupport = model.jsonModeSupport ? 1 : 0;
      f.price = model.pricePer1kTokens ? 1 - Math.min(1, model.pricePer1kTokens / 0.1) : 0.5;
      // simple score
      const score = (f.langMatch * 1.0 + f.jsonSupport * 0.6 + f.price * 0.5) / 2.1;
      pool.push({
        id: model.id,
        type: 'model',
        title: `${model.provider}/${model.modelName}`,
        name: `${model.provider.toLowerCase()}/${model.modelName}`, // 实际调用时使用的名称
        coarseScore: score,
        reason: f,
      });
    }

    pool.sort((a, b) => (b.coarseScore || 0) - (a.coarseScore || 0));
    const coarseTopM = pool.slice(0, m);

    const fineList = coarseTopM.map((c) => ({ ...c, fineScore: (c.coarseScore || 0) * 0.8 + 0.2 }));
    fineList.sort((a, b) => (b.fineScore || 0) - (a.fineScore || 0));
    const topK = fineList.slice(0, Math.min(k, fineList.length));

    return { topK, coarseList: coarseTopM, fullPool: pool };
  },
};
