/**
 * Task → Prompt 推荐适配器
 * 
 * 将通用的推荐请求适配到 taskToPrompt scorer
 */

import { PrismaClient } from '@prisma/client';
import type { Scorer } from '../registry';
import type { RecommendRankRequest, CandidateItem } from '../types';
import { 
  scoreTaskToPrompt,
  shouldExplore,
  checkDiversity,
  type TaskSubject,
  type PromptCandidate
} from '../scorers/taskToPrompt';

const prisma = new PrismaClient();

export class TaskToPromptScorer implements Scorer {
  async rank(req: RecommendRankRequest): Promise<{
    topK: CandidateItem[];
    coarseList: CandidateItem[];
    fullPool: CandidateItem[];
  }> {
    const { task, context, constraints } = req;

    // 1. 确定业务模块
    const businessModule = task.taskType || 'product-analysis';
    
    // 验证业务模块是否支持
    const supportedModules = [
      'product-analysis', 
      'video-script', 
      'ai-reverse-engineer', 
      'product-painpoint',
      'video-quality',
      'style-matching',
      'persona.generate'
    ];
    if (!supportedModules.includes(businessModule)) {
      throw new Error(`不支持的业务模块: ${businessModule}`);
    }

    // 2. 构建 subject
    const subject: TaskSubject = {
      type: 'task',
      id: task.subjectRef?.entityId || `task-${Date.now()}`,
      isActive: true,
      businessModule,
      taskType: task.taskType,
      complexity: this.inferComplexity(task),
      priority: task.budgetTier === 'high' ? 'high' : 'medium'
    };

    // 3. 获取所有候选 Prompt 模板
    const prompts = await prisma.promptTemplate.findMany({
      where: {
        businessModule,
        isActive: true
      },
      orderBy: [
        { isDefault: 'desc' },
        { performance: 'desc' }
      ]
    });

    if (prompts.length === 0) {
      throw new Error(`没有找到业务模块 ${businessModule} 的可用Prompt模板`);
    }

    // 4. 转换为 PromptCandidate
    const candidates: PromptCandidate[] = prompts.map(p => ({
      id: p.id,
      type: 'prompt_template',
      isActive: p.isActive,
      name: p.name,
      businessModule: p.businessModule,
      content: p.content,
      variables: p.variables ? (typeof p.variables === 'string' ? p.variables.split(',').map(v => v.trim()) : p.variables) : [],
      performance: p.performance || undefined,
      usageCount: p.usageCount || 0,
      successRate: p.successRate || undefined,
      isDefault: p.isDefault
    }));

    // 5. 调用评分器
    const { coarseResults, fineResults } = await scoreTaskToPrompt(
      subject,
      candidates,
      {
        region: context?.region,
        channel: context?.channel,
        budgetTier: context?.budgetTier,
        availableVariables: (task as any).availableVariables || []
      }
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
    const toCandidateItem = (result: any, candidate: PromptCandidate): CandidateItem => ({
      id: result.candidateId,
      type: 'prompt_template',
      title: candidate.name,
      summary: candidate.description || `业务模块: ${candidate.businessModule}`,
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

