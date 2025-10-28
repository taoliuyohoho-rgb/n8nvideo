/**
 * 获取段位指标
 */

import { NextRequest, NextResponse } from 'next/server';
import { aggregateBySegment } from '@/src/services/ai/estimation/metrics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '1', 10);

    const metrics = await aggregateBySegment(days);

    return NextResponse.json({
      metrics,
      count: metrics.length,
    });
  } catch (error) {
    console.error('Segment metrics API error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'COMMON_INTERNAL',
          message: 'Failed to fetch segment metrics',
          details: {},
        },
      },
      { status: 500 }
    );
  }
}














