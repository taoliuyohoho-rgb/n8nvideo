/**
 * 任务 → Prompt模板 推荐评分器
 * 
 * 场景：在需要AI生成内容时（如商品分析、竞品分析、视频脚本生成等），
 * 根据任务特征和上下文，从Prompt库中选择最合适的模板。
 */

import { PrismaClient } from '@prisma/client';
import type { 
  RecommendSubject, 
  RecommendCandidate, 
  RecommendContext, 
  ScoreResult 
} from '../types';

const prisma = new PrismaClient();

interface TaskSubject extends RecommendSubject {
  businessModule: string; // 业务模块：product-analysis, product-competitor, video-script, etc.
  taskType?: string; // 任务类型细分
  inputLength?: number; // 输入长度
  expectedOutputFormat?: string; // 期望输出格式
  complexity?: 'simple' | 'medium' | 'complex'; // 任务复杂度
  priority?: 'low' | 'medium' | 'high'; // 优先级
}

interface PromptCandidate extends RecommendCandidate {
  name: string;
  businessModule: string;
  content: string;
  variables?: string[]; // 需要的变量
  performance?: number; // 历史性能评分 0-1
  usageCount?: number; // 使用次数
  successRate?: number; // 成功率 0-1
  isDefault?: boolean; // 是否为默认模板
}

/**
 * 粗排：快速过滤和初步打分
 */
export async function coarseRank(
  subject: TaskSubject,
  candidates: PromptCandidate[],
  context: RecommendContext
): Promise<ScoreResult[]> {
  const results: ScoreResult[] = [];

  for (const candidate of candidates) {
    let score = 0;
    const reasons: string[] = [];
    let filtered = false;
    let filterReason = '';

    // 硬过滤：业务模块必须匹配
    if (candidate.businessModule !== subject.businessModule) {
      filtered = true;
      filterReason = `业务模块不匹配: ${candidate.businessModule} != ${subject.businessModule}`;
    }

    // 硬过滤：模板必须是激活状态
    if (!candidate.isActive) {
      filtered = true;
      filterReason = '模板未激活';
    }

    if (!filtered) {
      // 基础分：默认模板优先
      if (candidate.isDefault) {
        score += 30;
        reasons.push('默认模板+30');
      } else {
        score += 10;
      }

      // 历史性能分（0-40分）
      if (candidate.performance !== undefined && candidate.performance !== null) {
        const perfScore = candidate.performance * 40;
        score += perfScore;
        reasons.push(`历史性能+${perfScore.toFixed(1)}`);
      } else {
        score += 20; // 无历史数据，给予中等分数
        reasons.push('无历史数据+20');
      }

      // 成功率分（0-30分）
      if (candidate.successRate !== undefined && candidate.successRate !== null) {
        const successScore = candidate.successRate * 30;
        score += successScore;
        reasons.push(`成功率+${successScore.toFixed(1)}`);
      } else {
        score += 15; // 无历史数据，给予中等分数
        reasons.push('无成功率数据+15');
      }
    }

    results.push({
      candidateId: candidate.id,
      score: filtered ? 0 : score,
      reason: filtered ? filterReason : reasons.join('; '),
      filtered,
      filterReason: filtered ? filterReason : undefined
    });
  }

  return results;
}

/**
 * 精排：详细评分和排序
 */
export async function fineRank(
  subject: TaskSubject,
  candidates: PromptCandidate[],
  coarseResults: ScoreResult[],
  context: RecommendContext
): Promise<ScoreResult[]> {
  const results: ScoreResult[] = [];

  // 只对粗排通过的候选进行精排
  const passedCandidates = candidates.filter((c, i) => !coarseResults[i].filtered);
  const passedCoarseResults = coarseResults.filter(r => !r.filtered);

  for (let i = 0; i < passedCandidates.length; i++) {
    const candidate = passedCandidates[i];
    const coarseResult = passedCoarseResults[i];
    
    let score = coarseResult.score;
    const reasons: string[] = [coarseResult.reason];

    // 变量完整性匹配（0-15分）
    if (candidate.variables && context.availableVariables) {
      const requiredVars = candidate.variables;
      const availableVars = context.availableVariables as string[];
      const matchedVars = requiredVars.filter(v => availableVars.includes(v));
      const matchRate = matchedVars.length / requiredVars.length;
      const varScore = matchRate * 15;
      score += varScore;
      reasons.push(`变量匹配度${(matchRate * 100).toFixed(0)}%+${varScore.toFixed(1)}`);
    }

    // 使用频次加分（0-10分，热门但不过度）
    if (candidate.usageCount !== undefined) {
      const usageScore = Math.min(10, Math.log10(candidate.usageCount + 1) * 3);
      score += usageScore;
      reasons.push(`使用频次+${usageScore.toFixed(1)}`);
    }

    // 复杂度匹配（0-10分）
    if (subject.complexity && candidate.content) {
      const contentLength = candidate.content.length;
      let complexityScore = 5; // 默认中等

      if (subject.complexity === 'simple' && contentLength < 500) {
        complexityScore = 10;
        reasons.push('复杂度匹配(简单)+10');
      } else if (subject.complexity === 'medium' && contentLength >= 500 && contentLength < 1500) {
        complexityScore = 10;
        reasons.push('复杂度匹配(中等)+10');
      } else if (subject.complexity === 'complex' && contentLength >= 1500) {
        complexityScore = 10;
        reasons.push('复杂度匹配(复杂)+10');
      } else {
        reasons.push(`复杂度部分匹配+${complexityScore}`);
      }

      score += complexityScore;
    }

    // 优先级调整（0-5分）
    if (subject.priority === 'high' && candidate.successRate && candidate.successRate > 0.8) {
      score += 5;
      reasons.push('高优先级任务选择高成功率模板+5');
    }

    results.push({
      candidateId: candidate.id,
      score,
      reason: reasons.join('; '),
      filtered: false
    });
  }

  // 按分数降序排序
  results.sort((a, b) => b.score - a.score);

  return results;
}

/**
 * 探索策略：引入新模板或低频模板
 */
export function shouldExplore(
  candidate: PromptCandidate,
  explorationRate: number
): boolean {
  // 新模板（使用次数 < 10）
  if (candidate.usageCount === undefined || candidate.usageCount < 10) {
    return Math.random() < explorationRate * 2; // 新模板探索概率加倍
  }

  // 低频模板（使用次数 < 50）
  if (candidate.usageCount < 50) {
    return Math.random() < explorationRate * 1.5;
  }

  // 常规探索
  return Math.random() < explorationRate;
}

/**
 * 多样性检查：避免推荐过于相似的模板
 */
export function checkDiversity(
  selectedCandidates: PromptCandidate[]
): boolean {
  // 检查是否有不同风格/类型的模板
  const uniqueNames = new Set(selectedCandidates.map(c => c.name));
  const diversityRatio = uniqueNames.size / selectedCandidates.length;

  // 至少60%的模板名称不同
  return diversityRatio >= 0.6;
}

/**
 * 主评分入口
 */
export async function scoreTaskToPrompt(
  subject: TaskSubject,
  candidates: PromptCandidate[],
  context: RecommendContext
): Promise<{
  coarseResults: ScoreResult[];
  fineResults: ScoreResult[];
}> {
  // 粗排
  const coarseResults = await coarseRank(subject, candidates, context);

  // 精排
  const fineResults = await fineRank(subject, candidates, coarseResults, context);

  return {
    coarseResults,
    fineResults
  };
}

