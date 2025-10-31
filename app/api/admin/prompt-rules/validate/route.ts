import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { PromptRuleValidationResult, ApiResponse, BusinessModule } from '@/types/prompt-rule';

// POST /api/admin/prompt-rules/validate - 验证提示词是否符合规则
export async function POST(request: NextRequest) {
  try {
    const body: {
      businessModule: BusinessModule;
      promptContent: string;
      variables?: string[];
      outputContent?: string;
    } = await request.json();
    
    const { businessModule, promptContent, variables, outputContent } = body;

    if (!businessModule || !promptContent) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: '缺少必需参数: businessModule, promptContent' },
        { status: 400 }
      );
    }

    // 获取该业务模块的规则
    const rule = await prisma.promptRule.findUnique({
      where: { businessModule }
    });

    if (!rule) {
      return NextResponse.json<ApiResponse<PromptRuleValidationResult>>({
        success: true,
        data: {
          isValid: true,
          errors: [],
          warnings: ['该业务模块暂无规则配置']
        }
      });
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

    return NextResponse.json<ApiResponse<PromptRuleValidationResult>>({
      success: true,
      data: validationResults
    });
  } catch (error: unknown) {
    console.error('验证提示词规则失败:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}