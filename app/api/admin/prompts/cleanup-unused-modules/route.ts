import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/admin/prompts/cleanup-unused-modules - 清理未使用的业务模块
export async function DELETE(request: NextRequest) {
  try {
    // 定义需要删除的未使用模块
    const unusedModules = [
      'video-quality',
      'product-painpoint', 
      'competitor-analysis',
      'script-generation' // 合并到 video-script
    ];

    // 删除这些模块的所有模板
    const deleteResult = await prisma.promptTemplate.deleteMany({
      where: {
        businessModule: {
          in: unusedModules
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `成功清理了 ${deleteResult.count} 个未使用的提示词模板`,
      deletedCount: deleteResult.count,
      removedModules: unusedModules
    });
  } catch (error: any) {
    console.error('清理未使用模块失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
