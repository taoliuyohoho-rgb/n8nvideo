/**
 * 预估模型 Rank API
 * POST /api/ai/auto-select/rank
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rank } from '@/src/services/ai/estimation/rank';
import { EstimationErrorClass, formatErrorResponse, isSoftError } from '@/src/services/ai/estimation/errors';
import type { RankRequest } from '@/src/services/ai/estimation/types';

// Zod schema for request validation
const SubjectRefSchema = z.object({
  entityType: z.enum(['product', 'style', 'video', 'model', 'prompt_template']),
  entityId: z.string(),
});

const TaskInputSchema = z.object({
  subjectRef: SubjectRefSchema.optional(),
  category: z.string().optional(),
  style: z.string().optional(),
  styleTags: z.array(z.string()).optional(),
  lang: z.string(),
  structure: z.string().optional(),
  lengthHint: z.enum(['short', 'medium', 'long']).optional(),
  sensitive: z.boolean().optional(),
  priceTier: z.enum(['low', 'mid', 'high']).optional(),
  audience: z.string().optional(),
});

const ContextInputSchema = z.object({
  festival: z.string().optional(),
  region: z.string().optional(),
  channel: z.string().optional(),
  audience: z.string().optional(),
  budgetTier: z.enum(['low', 'mid', 'high']).optional(),
  maxLatencyMs: z.number().optional(),
  concurrencyLevel: z.number().optional(),
  regulatoryFlags: z.array(z.string()).optional(),
});

const ConstraintsSchema = z.object({
  maxCostUSD: z.number().optional(),
  maxLatencyMs: z.number().optional(),
  allowProviders: z.array(z.string()).optional(),
  denyProviders: z.array(z.string()).optional(),
  requireJsonMode: z.boolean().optional(),
  minSafetyLevel: z.enum(['low', 'medium', 'high']).optional(),
});

const RankOptionsSchema = z.object({
  topK: z.number().optional(),
  explore: z.boolean().optional(),
  strategyVersion: z.string().nullable().optional(),
  requestId: z.string().optional(),
});

const RankRequestSchema = z.object({
  task: TaskInputSchema,
  context: ContextInputSchema.optional(),
  constraints: ConstraintsSchema.optional(),
  options: RankOptionsSchema.optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validationResult = RankRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'RANK_BAD_REQUEST',
            message: 'Invalid request parameters',
            details: validationResult.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const rankRequest = validationResult.data as RankRequest;

    // Call rank service
    const response = await rank(rankRequest);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // Handle EstimationError
    if (error instanceof EstimationErrorClass) {
      const statusCode = isSoftError(error) ? 200 : error.statusCode;
      return NextResponse.json(formatErrorResponse(error), { status: statusCode });
    }

    // Unknown error
    console.error('Rank API error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'COMMON_INTERNAL',
          message: 'Internal server error',
          details: {},
        },
      },
      { status: 500 }
    );
  }
}














