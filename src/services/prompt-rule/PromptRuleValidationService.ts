import { prisma } from '@/lib/prisma';
import type { PromptRuleValidationResult, BusinessModule, ApiResponse } from '@/types/prompt-rule';

export class PromptRuleValidationService {
  /**
   * 验证提示词是否符合规则
   */
  static async validatePrompt(
    businessModule: BusinessModule,
    promptContent: string,
    variables?: string[],
    outputContent?: string
  ): Promise<ApiResponse<PromptRuleValidationResult>> {
    try {
      // 获取该业务模块的规则
      const rule = await prisma.promptRule.findUnique({
        where: { businessModule }
      });

      if (!rule) {
        return {
          success: true,
          data: {
            isValid: true,
            errors: [],
            warnings: ['该业务模块暂无规则配置']
          }
        };
      }

      const validationResults: PromptRuleValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
      };

      // 验证输入格式
      if (rule.inputFormat) {
        // 检查变量格式
        const variablePattern = /\{\{(\w+)\}\}/g;
        const foundVariables = promptContent.match(variablePattern);
        if (!foundVariables || foundVariables.length === 0) {
          validationResults.warnings.push('提示词中未发现变量占位符，建议使用{{变量名}}格式');
        }

        // 检查必需变量
        if (variables && variables.length > 0) {
          const missingVariables = variables.filter(
            variable => !promptContent.includes(`{{${variable}}}`)
          );
          
          if (missingVariables.length > 0) {
            validationResults.warnings.push(`建议包含变量: ${missingVariables.join(', ')}`);
          }
        }
      }

      // 验证输出格式
      if (rule.outputFormat && outputContent) {
        // 检查JSON格式
        if (rule.outputFormat.includes('JSON')) {
          try {
            JSON.parse(outputContent);
          } catch (error) {
            validationResults.isValid = false;
            validationResults.errors.push('输出内容不是有效的JSON格式');
          }
        }

        // 检查长度
        if (outputContent.length < 50) {
          validationResults.warnings.push('输出内容过短，建议提供更详细的信息');
        }
      }

      // 验证分析方法
      if (rule.analysisMethod) {
        // 检查内容长度
        if (promptContent.length < 100) {
          validationResults.warnings.push('提示词内容过短，建议提供更详细的指导');
        }

        // 检查关键词
        const requiredKeywords = ['分析', '输出', '格式'];
        const missingKeywords = requiredKeywords.filter(
          keyword => !promptContent.includes(keyword)
        );
        
        if (missingKeywords.length > 0) {
          validationResults.warnings.push(`建议包含关键词: ${missingKeywords.join(', ')}`);
        }

        // 检查禁用词
        const forbiddenWords = ['错误', '无法', '失败', '不能'];
        const foundForbiddenWords = forbiddenWords.filter(
          word => promptContent.includes(word)
        );
        
        if (foundForbiddenWords.length > 0) {
          validationResults.warnings.push(`建议避免使用: ${foundForbiddenWords.join(', ')}`);
        }
      }

      return {
        success: true,
        data: validationResults
      };
    } catch (error) {
      console.error('验证提示词规则失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 验证提示词内容质量
   */
  static validateContentQuality(content: string): {
    isValid: boolean;
    score: number;
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    let score = 100;

    // 长度检查
    if (content.length < 50) {
      suggestions.push('内容过短，建议提供更详细的信息');
      score -= 20;
    } else if (content.length > 2000) {
      suggestions.push('内容过长，建议精简表达');
      score -= 10;
    }

    // 结构检查
    if (!content.includes('{{') || !content.includes('}}')) {
      suggestions.push('建议使用变量占位符{{变量名}}');
      score -= 15;
    }

    // 关键词检查
    const requiredKeywords = ['分析', '输出', '格式'];
    const missingKeywords = requiredKeywords.filter(
      keyword => !content.includes(keyword)
    );
    
    if (missingKeywords.length > 0) {
      suggestions.push(`建议包含关键词: ${missingKeywords.join(', ')}`);
      score -= missingKeywords.length * 5;
    }

    // 禁用词检查
    const forbiddenWords = ['错误', '无法', '失败', '不能'];
    const foundForbiddenWords = forbiddenWords.filter(
      word => content.includes(word)
    );
    
    if (foundForbiddenWords.length > 0) {
      suggestions.push(`建议避免使用: ${foundForbiddenWords.join(', ')}`);
      score -= foundForbiddenWords.length * 10;
    }

    return {
      isValid: score >= 70,
      score: Math.max(0, score),
      suggestions
    };
  }
}
