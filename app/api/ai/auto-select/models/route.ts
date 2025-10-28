/**
 * 预估模型 Models API
 * GET /api/ai/auto-select/models - 列出模型池
 */

import { NextRequest, NextResponse } from 'next/server';
import { getActiveModels } from '@/src/services/ai/estimation/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';

    // Get models (currently only supports active, can extend)
    const models = await getActiveModels();

    return NextResponse.json({
      models: models.map(m => ({
        id: m.id,
        provider: m.provider,
        modelName: m.modelName,
        version: m.version,
        langs: m.langs,
        maxContext: m.maxContext,
        pricePer1kTokens: m.pricePer1kTokens,
        rateLimit: m.rateLimit,
        toolUseSupport: m.toolUseSupport,
        jsonModeSupport: m.jsonModeSupport,
        status: m.status,
        staticCapability: m.staticCapability,
        dynamicMetrics: m.dynamicMetrics,
      })),
      total: models.length,
    });
  } catch (error) {
    console.error('Models API error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'COMMON_INTERNAL',
          message: 'Failed to fetch models',
          details: {},
        },
      },
      { status: 500 }
    );
  }
}














