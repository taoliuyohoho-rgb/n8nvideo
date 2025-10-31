import { prisma } from '@/lib/prisma';
import type { PromptRule, PromptRuleFormData, BusinessModule, ApiResponse } from '@/types/prompt-rule';

export class PromptRuleService {
  /**
   * 获取所有规则
   */
  static async getAllRules(): Promise<ApiResponse<PromptRule[]>> {
    try {
      const rules = await prisma.promptRule.findMany({
        orderBy: { businessModule: 'asc' }
      });
      
      return {
        success: true,
        data: rules
      };
    } catch (error) {
      console.error('获取所有规则失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 根据业务模块获取规则
   */
  static async getRuleByModule(businessModule: BusinessModule): Promise<ApiResponse<PromptRule | null>> {
    try {
      const rule = await prisma.promptRule.findUnique({
        where: { businessModule }
      });
      
      return {
        success: true,
        data: rule
      };
    } catch (error) {
      console.error('获取业务模块规则失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 创建规则
   */
  static async createRule(ruleData: PromptRuleFormData): Promise<ApiResponse<PromptRule>> {
    try {
      const rule = await prisma.promptRule.create({
        data: ruleData
      });
      
      return {
        success: true,
        data: rule
      };
    } catch (error) {
      console.error('创建规则失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 更新规则
   */
  static async updateRule(id: string, ruleData: PromptRuleFormData): Promise<ApiResponse<PromptRule>> {
    try {
      const rule = await prisma.promptRule.update({
        where: { id },
        data: ruleData
      });
      
      return {
        success: true,
        data: rule
      };
    } catch (error) {
      console.error('更新规则失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 删除规则
   */
  static async deleteRule(id: string): Promise<ApiResponse<never>> {
    try {
      await prisma.promptRule.delete({
        where: { id }
      });
      
      return {
        success: true,
        message: '规则已删除'
      };
    } catch (error) {
      console.error('删除规则失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 初始化默认规则
   */
  static async initDefaultRules(): Promise<ApiResponse<Array<PromptRule & { status: string }>>> {
    try {
      const defaultRules: Array<{
        businessModule: BusinessModule;
        inputFormat: string;
        outputFormat: string;
        analysisMethod: string;
      }> = [
        {
          businessModule: 'product-analysis',
          inputFormat: '商品名称、类目、描述、目标市场、竞品内容（可选）',
          outputFormat: 'JSON格式，卖点/痛点各8-12字最多5个，目标受众8-12字',
          analysisMethod: '作为商品分析专家，重点关注用户痛点和产品优势，输出简洁明了'
        },
        {
          businessModule: 'competitor-analysis',
          inputFormat: '竞品URL、竞品名称、类目、参考内容（视频/图片/文案）、评论数据（可选）',
          outputFormat: 'JSON格式，包含sellingPoints、visualStyle、scriptStructure、targetAudience、priceStrategy等字段',
          analysisMethod: '作为竞品分析专家，从多维度深入分析竞品的核心要素，提取卖点、视觉风格、文案结构、受众定位和价格策略'
        },
        {
          businessModule: 'persona-analysis',
          inputFormat: '目标受众描述、产品特点、使用场景、痛点信息',
          outputFormat: 'JSON格式，包含年龄、性别、职业、兴趣、痛点、需求等字段',
          analysisMethod: '作为人设分析专家，基于用户画像数据，生成精准的目标受众分析'
        },
        {
          businessModule: 'persona.generate',
          inputFormat: '产品信息、目标市场、用户痛点、使用场景、竞品受众（可选）',
          outputFormat: 'JSON格式，包含persona名称、demographics（年龄/性别/职业/收入）、psychographics（价值观/生活方式/兴趣）、goals、painPoints、behaviors、媒体习惯',
          analysisMethod: '作为用户画像生成专家，结合产品特性和市场数据，创建详细的用户角色模型，包含人口统计、心理特征、目标动机和行为习惯'
        },
        {
          businessModule: 'video-script',
          inputFormat: '商品名称、卖点、目标受众、视频时长、风格偏好（可选）',
          outputFormat: 'JSON格式，包含hook、主体内容、CTA，每部分字数限制',
          analysisMethod: '作为视频脚本专家，注重吸引力和转化效果'
        },
        {
          businessModule: 'video-generation',
          inputFormat: '商品名称、卖点、脚本内容、人设信息、选用模板/风格、目标受众、使用场景（可选）',
          outputFormat: '直接输出文本格式的视频生成Prompt（80-250字），不需要JSON格式，包含场景描述、视觉风格、镜头运动、氛围、色调等',
          analysisMethod: '作为视频Prompt生成专家，综合商品、脚本、人设和风格信息，生成适用于Sora/Runway/Pika等视频生成AI的完整Prompt，突出商品卖点和目标受众喜好，保持画面感和简洁性'
        },
        {
          businessModule: 'ai-reverse-engineer',
          inputFormat: '参考实例、目标业务模块、实例类型',
          outputFormat: 'JSON格式，包含inputRequirements、outputRequirements、outputRules',
          analysisMethod: '作为Prompt工程专家，根据参考实例生成符合目标业务模块要求的三段式Prompt结构'
        }
      ];

      const results: Array<PromptRule & { status: string }> = [];
      for (const ruleData of defaultRules) {
        const existing = await prisma.promptRule.findUnique({
          where: { businessModule: ruleData.businessModule }
        });

        if (!existing) {
          const created = await prisma.promptRule.create({
            data: ruleData
          });
          results.push({ ...created, status: 'created' });
        } else {
          results.push({ ...existing, status: 'already_exists' });
        }
      }

      return {
        success: true,
        data: results,
        message: `成功初始化 ${results.filter(r => r.status === 'created').length} 个默认规则`
      };
    } catch (error) {
      console.error('初始化默认规则失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
}
