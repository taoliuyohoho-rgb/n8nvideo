/**
 * 清空所有熔断状态
 */

import { NextRequest, NextResponse } from 'next/server';
import { clearAllCircuitBreakers } from '@/src/services/ai/estimation/fallback';

export async function POST(request: NextRequest) {
  try {
    clearAllCircuitBreakers();

    return NextResponse.json({
      success: true,
      message: 'All circuit breakers cleared',
    });
  } catch (error) {
    console.error('Clear circuit breakers API error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'COMMON_INTERNAL',
          message: 'Failed to clear circuit breakers',
          details: {},
        },
      },
      { status: 500 }
    );
  }
}














