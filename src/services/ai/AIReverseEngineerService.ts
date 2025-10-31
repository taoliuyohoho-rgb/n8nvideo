/**
 * AI反推服务
 * 
 * 根据参考实例生成符合业务模块要求的三段式Prompt结构
 */

import { prisma } from '@/lib/prisma';
import { recommendRank } from '../recommendation/recommend';
import { AiExecutor } from './AiExecutor';
import { logger } from '../logger/Logger';


export interface ReverseEngineerInput {
  referenceExample: string | File;
  businessModule: string;
  exampleType: 'selling-points' | 'pain-points' | 'target-audience' | 'prompt-script' | 'video';
}

export interface ReverseEngineerOutput {
  success: boolean;
  data: {
    inputRequirements: string;
    outputRequirements: string;
    outputRules: string;
    suggestedTemplate: {
      name: string;
      content: string;
      businessModule: string;
    };
  };
  error?: string;
}

export interface BusinessModuleRequirements {
  inputRequirements: string;
  outputRequirements: string;
  outputRules: string;
}

export class AIReverseEngineerService {
  private aiExecutor: AiExecutor;

  constructor() {
    this.aiExecutor = new AiExecutor();
  }

  /**
   * 分析参考实例并推荐模型和Prompt
   */
  async analyzeReferenceAndRecommend(params: {
    referenceExample: string | File;
    businessModule: string;
    exampleType: 'selling-points' | 'pain-points' | 'target-audience' | 'prompt-script' | 'video';
  }): Promise<{
    modelCandidates: Array<{
      id: string;
      title: string;
      score: number;
      reason: string;
      type: 'fine-top' | 'coarse-top' | 'explore';
    }>;
    promptCandidates: Array<{
      id: string;
      name: string;
      score: number;
      reason: string;
      type: 'fine-top' | 'coarse-top' | 'explore';
    }>;
  }> {
    const { referenceExample, businessModule, exampleType } = params;

    // 检测输入类型
    const inputType = this.detectInputType(referenceExample);

    // 推荐AI模型
    const modelRecommendation = await recommendRank({
      scenario: 'task->model',
      task: {
        taskType: 'ai-reverse-engineer',
        contentType: inputType,
        jsonRequirement: true,
        inputType,
        exampleType
      },
      context: {
        region: 'zh',
        budgetTier: 'mid'
      },
      constraints: {
        requireJsonMode: true,
        maxLatencyMs: 30000
      }
    });

    // 推荐Prompt模板
    const promptRecommendation = await recommendRank({
      scenario: 'task->prompt',
      task: {
        taskType: 'ai-reverse-engineer',
        contentType: inputType,
        inputType,
        exampleType
      },
      context: {
        region: 'zh',
        budgetTier: 'mid'
      },
      constraints: {
        maxLatencyMs: 10000
      }
    });

    return {
      modelCandidates: modelRecommendation.topK.map(c => ({
        id: c.id,
        title: c.title || 'Unknown Model',
        score: c.fineScore || c.coarseScore || 0,
        reason: String(c.reason?.explanation || ''),
        type: (c.type || 'fine-top') as 'explore' | 'fine-top' | 'coarse-top'
      })),
      promptCandidates: promptRecommendation.topK.map(c => ({
        id: c.id,
        name: c.title || 'Unknown Prompt',
        score: c.fineScore || c.coarseScore || 0,
        reason: String(c.reason?.explanation || ''),
        type: (c.type || 'fine-top') as 'explore' | 'fine-top' | 'coarse-top'
      }))
    };
  }

  /**
   * 生成Prompt模板草稿
   */
  async generatePromptDraft(params: {
    referenceExample: string | File;
    businessModule: string;
    chosenModelId: string;
    chosenPromptId: string;
  }): Promise<{
    inputRequirements: string;
    outputRequirements: string;
    outputRules: string;
    suggestedTemplate: {
      name: string;
      content: string;
      businessModule: string;
    };
  }> {
    const { referenceExample, businessModule, chosenModelId, chosenPromptId } = params;

    try {
      // 获取业务模块要求
      const requirements = await this.getBusinessModuleRequirements(businessModule);

      // 获取选择的模型和Prompt
      const [model, prompt] = await Promise.all([
        prisma.estimationModel.findUnique({ where: { id: chosenModelId } }),
        prisma.promptTemplate.findUnique({ where: { id: chosenPromptId } })
      ]);

      if (!model || !prompt) {
        throw new Error('模型或Prompt模板不存在');
      }

      // 构建反推Prompt
      const reversePrompt = this.buildReversePrompt(referenceExample, businessModule, requirements);

      // 调用AI生成三段式结构（通过统一 contract 接口，支持降级）
      const response = await this.callWithFallback(reversePrompt, businessModule)

      // 验证生成的模板是否符合规则
      const validationResult = await this.validateGeneratedTemplate(
        businessModule,
        response.suggestedTemplate.content,
        response.inputRequirements,
        response.outputRequirements
      );

      if (!validationResult.isValid) {
        logger.warn('生成的模板不符合规则', { 
          businessModule, 
          errors: validationResult.errors,
          warnings: validationResult.warnings 
        });
      }

      return {
        inputRequirements: response.inputRequirements,
        outputRequirements: response.outputRequirements,
        outputRules: response.outputRules,
        suggestedTemplate: {
          name: response.suggestedTemplate.name,
          content: response.suggestedTemplate.content,
          businessModule
        }
      };

    } catch (error: any) {
      logger.error('AI反推生成失败', { businessModule, error: error.message });
      throw error;
    }
  }

  /**
   * 保存Prompt模板到业务模块库
   */
  async savePromptTemplate(
    draft: {
      inputRequirements: string;
      outputRequirements: string;
      outputRules: string;
      suggestedTemplate: {
        name: string;
        content: string;
        businessModule: string;
      };
    },
    businessModule: string
  ): Promise<{
    id: string;
    name: string;
    businessModule: string;
  }> {
    try {
      const template = await prisma.promptTemplate.create({
        data: {
          name: draft.suggestedTemplate.name,
          businessModule,
          content: draft.suggestedTemplate.content,
          inputRequirements: draft.inputRequirements,
          outputRequirements: draft.outputRequirements,
          outputRules: draft.outputRules,
          variables: JSON.stringify([]),
          description: `AI反推生成的模板 - ${businessModule}`,
          performance: 0.8,
          successRate: 0.8,
          isActive: true,
          isDefault: false,
          createdBy: 'ai-reverse-engineer'
        }
      });

      return {
        id: template.id,
        name: template.name,
        businessModule: template.businessModule
      };

    } catch (error: any) {
      logger.error('保存Prompt模板失败', { businessModule, error: error.message });
      throw error;
    }
  }

  /**
   * 检测输入类型
   */
  private detectInputType(referenceExample: string | File): 'text' | 'image' | 'video' {
    if (referenceExample instanceof File) {
      const type = referenceExample.type;
      if (type.startsWith('image/')) return 'image';
      if (type.startsWith('video/')) return 'video';
      return 'text';
    }
    return 'text';
  }

  /**
   * 根据业务模块获取输入输出要求（从规则管理系统获取）
   */
  private async getBusinessModuleRequirements(businessModule: string): Promise<BusinessModuleRequirements> {
    try {
      // 从数据库获取该业务模块的规则
      const rule = await prisma.promptRule.findUnique({
        where: { businessModule }
      });

      if (rule) {
        return {
          inputRequirements: rule.inputFormat,
          outputRequirements: rule.outputFormat,
          outputRules: rule.analysisMethod
        };
      }

      // 如果没有找到规则，使用默认要求
      logger.warn('未找到业务模块规则，使用默认要求', { businessModule });
      return this.getDefaultRequirements(businessModule);
    } catch (error) {
      logger.error('获取业务模块规则失败，使用默认要求', { businessModule, error: error instanceof Error ? error.message : '未知错误' });
      return this.getDefaultRequirements(businessModule);
    }
  }

  /**
   * 获取默认的业务模块要求（兜底方案）
   */
  private getDefaultRequirements(businessModule: string): BusinessModuleRequirements {
    const requirements: Record<string, BusinessModuleRequirements> = {
      'product-analysis': {
        inputRequirements: '商品名称、类目、描述、目标市场、竞品内容（可选）',
        outputRequirements: 'JSON格式，卖点/痛点各8-12字最多5个，目标受众8-12字',
        outputRules: '作为商品分析专家，重点关注用户痛点和产品优势，输出简洁明了'
      },
      'video-script': {
        inputRequirements: '商品名称、卖点、目标受众、视频时长、风格偏好（可选）',
        outputRequirements: 'JSON格式，包含hook、主体内容、CTA，每部分字数限制',
        outputRules: '作为视频脚本专家，注重吸引力和转化效果'
      },
      'ai-reverse-engineer': {
        inputRequirements: '参考实例、目标业务模块、实例类型',
        outputRequirements: 'JSON格式，包含inputRequirements、outputRequirements、outputRules',
        outputRules: '作为Prompt工程专家，根据参考实例生成符合目标业务模块要求的三段式Prompt结构'
      }
    };

    return requirements[businessModule] || requirements['product-analysis'];
  }

  /**
   * 验证生成的模板是否符合规则
   */
  private async validateGeneratedTemplate(
    businessModule: string,
    promptContent: string,
    inputRequirements: string,
    outputRequirements: string
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      // 调用规则验证API
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/prompt-rules/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessModule,
          promptContent,
          variables: this.extractVariablesFromPrompt(promptContent),
          outputContent: outputRequirements
        })
      });

      if (!response.ok) {
        throw new Error(`验证API调用失败: ${response.status}`);
      }

      const result = await response.json();
      return result.data || { isValid: true, errors: [], warnings: [] };

    } catch (error) {
      logger.error('模板验证失败', { businessModule, error: error instanceof Error ? error.message : String(error) });
      return { isValid: true, errors: [], warnings: ['验证服务不可用'] };
    }
  }

  /**
   * 从Prompt内容中提取变量
   */
  private extractVariablesFromPrompt(promptContent: string): string[] {
    const variablePattern = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variablePattern.exec(promptContent)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  }

  /**
   * 带降级策略的AI调用
   */
  private async callWithFallback(
    prompt: string, 
    businessModule: string
  ): Promise<{
    inputRequirements: string;
    outputRequirements: string;
    outputRules: string;
    suggestedTemplate: {
      name: string;
      content: string;
    };
  }> {
    const { callWithSchema } = await import('./contract')
    
    // 获取可用的模型列表（排除配额超限的）
    const availableModels = await this.getAvailableModels()
    
    // 按优先级尝试模型
    for (const model of availableModels) {
      try {
        logger.info(`尝试使用模型: ${model.provider}/${model.modelName}`)
        
        const response = await callWithSchema<{ inputRequirements: string; outputRequirements: string; outputRules: string; suggestedTemplate: { name: string; content: string } }>({
          prompt,
          needs: { vision: false, search: false },
          policy: { 
            allowFallback: false, 
            model: `${model.provider}/${model.modelName}`, 
            requireJsonMode: true 
          },
          validator: (text: string) => {
            try {
              const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
              const json = JSON.parse(cleaned)
              if (json && typeof json.inputRequirements === 'string' && typeof json.outputRequirements === 'string' && typeof json.outputRules === 'string' && json.suggestedTemplate && typeof json.suggestedTemplate.name === 'string' && typeof json.suggestedTemplate.content === 'string') {
                return json
              }
              return null
            } catch {
              return null
            }
          }
        })
        
        logger.info(`模型 ${model.provider}/${model.modelName} 调用成功`)
        return response
        
      } catch (error: any) {
        logger.warn(`模型 ${model.provider}/${model.modelName} 调用失败: ${error.message}`)
        
        // 如果是配额超限错误，继续尝试下一个模型
        if (error.name === 'QuotaExceededError' || error.status === 429) {
          continue
        }
        
        // 其他错误也继续尝试下一个模型
        continue
      }
    }
    
    // 所有模型都失败了
    throw new Error('所有可用模型都无法完成请求，请检查模型配置或稍后重试')
  }

  /**
   * 获取可用的模型列表
   */
  private async getAvailableModels(): Promise<Array<{ provider: string; modelName: string; id: string }>> {
    try {
      const models = await prisma.estimationModel.findMany({
        where: { 
          status: 'active',
          // 排除配额超限的模型
          NOT: { status: 'quota_exceeded' }
        },
        orderBy: [
          { provider: 'asc' },
          { pricePer1kTokens: 'asc' }
        ]
      })
      
      return models.map(m => ({
        provider: m.provider,
        modelName: m.modelName,
        id: m.id
      }))
    } catch (error) {
      logger.error('获取可用模型失败', { error: error instanceof Error ? error.message : String(error) })
      return []
    }
  }

  /**
   * 构建反推Prompt
   */
  private buildReversePrompt(
    referenceExample: string | File,
    businessModule: string,
    requirements: BusinessModuleRequirements
  ): string {
    const exampleContent = referenceExample instanceof File 
      ? `[文件: ${referenceExample.name}]` 
      : referenceExample;

    return `你是一个专业的Prompt工程专家。请根据以下参考实例，为"${businessModule}"业务模块生成三段式Prompt结构。

**参考实例：**
${exampleContent}

**目标业务模块：** ${businessModule}

**业务模块要求：**
- 输入要求：${requirements.inputRequirements}
- 输出要求：${requirements.outputRequirements}
- 输出规则：${requirements.outputRules}

**任务：**
请分析参考实例的特点和风格，生成符合目标业务模块要求的三段式Prompt结构：

1. **输入要求**：定义需要的输入变量和占位符
2. **输出要求**：定义输出格式和约束条件
3. **输出规则**：定义AI的角色定位和内容风格，尽量保持与参考实例相似的风格

**要求：**
- 输入要求必须与目标业务模块的规范一致
- 输出要求必须符合目标业务模块的格式要求
- 输出规则要体现参考实例的风格特点
- 生成的Prompt模板要实用且易于使用

请以JSON格式返回结果：
{
  "inputRequirements": "具体的输入要求描述",
  "outputRequirements": "具体的输出要求描述", 
  "outputRules": "具体的输出规则描述",
  "suggestedTemplate": {
    "name": "建议的模板名称",
    "content": "完整的Prompt模板内容"
  }
}`;
  }
}

export const aiReverseEngineerService = new AIReverseEngineerService();
