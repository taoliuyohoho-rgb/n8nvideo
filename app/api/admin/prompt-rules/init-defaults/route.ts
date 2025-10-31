import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { PromptRule, ApiResponse, BusinessModule } from '@/types/prompt-rule';

// POST /api/admin/prompt-rules/init-defaults - 初始化默认提示词规则
export async function POST(request: NextRequest) {
  try {
    const defaultRules: Array<{
      businessModule: BusinessModule;
      inputFormat: string;
      outputFormat: string;
      analysisMethod: string;
    }> = [
      // 商品分析规则
      {
        businessModule: 'product-analysis',
        inputFormat: '商品名称、类目、描述、目标市场、竞品内容（可选）',
        outputFormat: 'JSON格式，卖点/痛点各8-12字最多5个，目标受众8-12字',
        analysisMethod: '作为商品分析专家，重点关注用户痛点和产品优势，输出简洁明了'
      },
      // 人设分析规则
      {
        businessModule: 'persona-analysis',
        inputFormat: '目标受众描述、产品特点、使用场景、痛点信息',
        outputFormat: 'JSON格式，包含年龄、性别、职业、兴趣、痛点、需求等字段',
        analysisMethod: '作为人设分析专家，基于用户画像数据，生成精准的目标受众分析'
      },
      // 脚本生成规则
      {
        businessModule: 'video-script',
        inputFormat: '商品名称、卖点、目标受众、视频时长、风格偏好（可选）',
        outputFormat: 'JSON格式，包含hook、主体内容、CTA，每部分字数限制',
        analysisMethod: '作为视频脚本专家，注重吸引力和转化效果'
      },
      // AI反推规则
      {
        businessModule: 'ai-reverse-engineer',
        inputFormat: '参考实例、目标业务模块、实例类型',
        outputFormat: 'JSON格式，包含inputRequirements、outputRequirements、outputRules',
        analysisMethod: '作为Prompt工程专家，根据参考实例生成符合目标业务模块要求的三段式Prompt结构'
      }
    ];

    // 为每个业务模块创建规则
    const results: Array<PromptRule & { status: string }> = [];
    for (const ruleData of defaultRules) {
      // 检查是否已存在该业务模块的规则
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

    return NextResponse.json<ApiResponse<Array<PromptRule & { status: string }>>>({
      success: true,
      data: results,
      message: `成功初始化 ${results.filter(r => r.status === 'created').length} 个默认规则（共${defaultRules.length}个规则）`
    });
  } catch (error: unknown) {
    console.error('初始化默认提示词规则失败:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
