/**
 * Task → Prompt 推荐适配器
 * 
 * 将通用的推荐请求适配到 taskToPrompt scorer
 */

import { prisma } from '@/lib/prisma';
import { poolCache } from '../cache';
import type { Scorer } from '../registry';
import type { RecommendRankRequest, CandidateItem } from '../types';
import { 
  scoreTaskToPrompt,
  shouldExplore,
  checkDiversity
} from '../scorers/taskToPrompt';


type TaskSubject = {
  businessModule: string;
  taskType?: string;
  inputLength?: number;
  expectedOutputFormat?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  priority?: 'low' | 'medium' | 'high';
}

type PromptCandidate = {
  id: string;
  name: string;
  businessModule: string;
  content: string;
  variables?: string[];
  performance?: number;
  usageCount?: number;
  successRate?: number;
  isActive?: boolean;
}

export class TaskToPromptScorer implements Scorer {
  async rank(req: RecommendRankRequest): Promise<{
    topK: CandidateItem[];
    coarseList: CandidateItem[];
    fullPool: CandidateItem[];
  }> {
    const { task, context, constraints } = req;

    // 1. 确定业务模块（优先使用 context.businessModule，否则用 task.taskType）
    const businessModule = context?.businessModule || task.taskType || 'product-analysis';
    
    // 验证业务模块是否支持
    const supportedModules = [
      'product-analysis', 
      'competitor-analysis',
      'video-script',
      'video-generation',
      'video-prompt',
      'ai-reverse-engineer', 
      'persona.generate'
    ];
    
    // 统一业务模块名称（向后兼容）
    let normalizedModule = businessModule
    if (businessModule === 'persona-generation') {
      normalizedModule = 'persona.generate'
    }
    if (businessModule === 'product-competitor') {
      normalizedModule = 'competitor-analysis'
    }
    if (businessModule === 'style-matching') {
      normalizedModule = 'video-generation'
    }
    
    if (!supportedModules.includes(normalizedModule)) {
      throw new Error(`不支持的业务模块: ${normalizedModule} (原始: ${businessModule})`);
    }

    // 2. 构建 subject（使用统一的模块名称）
    const subject: TaskSubject = {
      businessModule: normalizedModule,
      taskType: task.taskType,
      complexity: this.inferComplexity(task),
      priority: task.budgetTier === 'high' ? 'high' : 'medium'
    };

    // 3. 获取所有候选 Prompt 模板（使用统一的模块名称）
    const prompts = await poolCache.getOrSet(
      `prompts:${normalizedModule}`,
      () => prisma.promptTemplate.findMany({
        where: {
          businessModule: normalizedModule,
          isActive: true
        },
        orderBy: [
          { isDefault: 'desc' },
          { performance: 'desc' }
        ]
      }),
      10 * 60 * 1000 // 10min TTL
    );

    if (prompts.length === 0) {
      console.warn(`[taskToPrompt] 没有找到业务模块 ${normalizedModule} 的可用Prompt模板，返回空结果`);
      // 返回空结果而不是抛错，让系统使用默认配置
      return {
        topK: [],
        coarseList: [],
        fullPool: []
      };
    }

    // 4. 转换为 PromptCandidate
    const candidates: PromptCandidate[] = prompts.map((p: any) => ({
      id: p.id,
      isActive: Boolean(p.isActive),
      name: p.name,
      businessModule: p.businessModule,
      content: p.content,
      variables: p.variables ? (typeof p.variables === 'string' ? p.variables.split(',').map((v: any) => v.trim()) : p.variables) : [],
      performance: p.performance || undefined,
      usageCount: p.usageCount || 0,
      successRate: p.successRate || undefined,
      isDefault: p.isDefault
    }));

    // 5. 调用评分器
    const { coarseResults, fineResults } = await scoreTaskToPrompt(
      subject,
      candidates as any,
      {
        region: context?.region,
        channel: context?.channel,
        budgetTier: context?.budgetTier
      } as any
    );

    // 6. 构建结果
    // coarseList: 粗排 Top M (默认 M=10)
    const coarseTopM = coarseResults
      .filter(r => !r.filtered)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // fineList: 精排 Top K (默认 K=3)
    const fineTopK = fineResults.slice(0, 3);

    // fullPool: 所有通过硬约束的候选
    const fullPool = coarseResults.filter(r => !r.filtered);

    // 转换为 CandidateItem
    const toCandidateItem = (result: any, candidate: any): CandidateItem => ({
      id: result.candidateId,
      type: 'prompt',
      title: candidate.name,
      summary: `业务模块: ${candidate.businessModule}`,
      coarseScore: coarseResults.find(r => r.candidateId === result.candidateId)?.score,
      fineScore: result.score,
      reason: {
        explanation: result.reason,
        usageCount: candidate.usageCount,
        successRate: candidate.successRate,
        isDefault: candidate.isDefault
      }
    });

    const topKItems = fineTopK.map(r => {
      const candidate = candidates.find(c => c.id === r.candidateId)!;
      return toCandidateItem(r, candidate);
    });

    const coarseListItems = coarseTopM.map(r => {
      const candidate = candidates.find(c => c.id === r.candidateId)!;
      return toCandidateItem(r, candidate);
    });

    const fullPoolItems = fullPool.map(r => {
      const candidate = candidates.find(c => c.id === r.candidateId)!;
      return toCandidateItem(r, candidate);
    });

    return {
      topK: topKItems,
      coarseList: coarseListItems,
      fullPool: fullPoolItems
    };
  }

  private inferComplexity(task: any): 'simple' | 'medium' | 'complex' {
    // 根据任务特征推断复杂度
    if (task.jsonRequirement || task.contentType === 'structured') {
      return 'complex';
    }
    if (task.contentType === 'vision') {
      return 'complex';
    }
    if (task.taskType === 'classify' || task.taskType === 'summarize') {
      return 'simple';
    }
    return 'medium';
  }
}

