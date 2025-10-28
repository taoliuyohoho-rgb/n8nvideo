/**
 * 预估模型 Feedback API
 * POST /api/ai/auto-select/feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { EstimationErrorClass, FBK_BAD_REQUEST, FBK_STORE_ERROR, formatErrorResponse } from '@/src/services/ai/estimation/errors';
import { DEFAULT_FEEDBACK_SOURCE } from '@/src/services/ai/estimation/constants';

const prisma = new PrismaClient();

// Zod schema
const AutoEvalSchema = z.object({
  structuredRate: z.number().optional(),
  toxicityFlag: z.boolean().optional(),
  styleConsistency: z.number().optional(),
  factualProbeScore: z.number().optional(),
});

const FeedbackRequestSchema = z.object({
  decisionId: z.string(),
  qualityScore: z.number().min(0).max(1).optional(),
  editDistance: z.number().min(0).max(1).optional(),
  rejected: z.boolean().optional(),
  conversion: z.union([z.boolean(), z.number()]).optional(),
  latencyMs: z.number().optional(),
  costActual: z.number().optional(),
  tokensInput: z.number().optional(),
  tokensOutput: z.number().optional(),
  autoEval: AutoEvalSchema.optional(),
  reviewTags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  feedbackSource: z.enum(['human', 'auto', 'system']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate
    const validationResult = FeedbackRequestSchema.safeParse(body);
    if (!validationResult.success) {
      throw FBK_BAD_REQUEST('Invalid feedback parameters', validationResult.error.format());
    }

    const feedback = validationResult.data;

    // Check at least one signal is provided
    if (
      feedback.qualityScore === undefined &&
      feedback.editDistance === undefined &&
      feedback.rejected === undefined &&
      feedback.conversion === undefined
    ) {
      throw FBK_BAD_REQUEST('At least one feedback signal required (qualityScore, editDistance, rejected, or conversion)', {});
    }

    // Check decision exists
    const decision = await prisma.estimationDecision.findUnique({
      where: { id: feedback.decisionId },
    });

    if (!decision) {
      throw FBK_BAD_REQUEST(`Decision ${feedback.decisionId} not found`, {});
    }

    // Check if outcome already exists (idempotent)
    const existing = await prisma.estimationOutcome.findUnique({
      where: { decisionId: feedback.decisionId },
    });

    if (existing) {
      // Update existing
      await prisma.estimationOutcome.update({
        where: { decisionId: feedback.decisionId },
        data: {
          qualityScore: feedback.qualityScore ?? existing.qualityScore,
          editDistance: feedback.editDistance ?? existing.editDistance,
          rejected: feedback.rejected ?? existing.rejected,
          conversion: typeof feedback.conversion === 'boolean' ? feedback.conversion : existing.conversion,
          latencyMs: feedback.latencyMs ?? existing.latencyMs,
          costActual: feedback.costActual ?? existing.costActual,
          tokensInput: feedback.tokensInput ?? existing.tokensInput,
          tokensOutput: feedback.tokensOutput ?? existing.tokensOutput,
          autoEval: feedback.autoEval ? JSON.stringify(feedback.autoEval) : existing.autoEval,
          recordedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Feedback updated (idempotent)',
        decisionId: feedback.decisionId,
      });
    }

    // Create new outcome
    await prisma.estimationOutcome.create({
      data: {
        decisionId: feedback.decisionId,
        qualityScore: feedback.qualityScore ?? null,
        editDistance: feedback.editDistance ?? null,
        rejected: feedback.rejected ?? null,
        conversion: typeof feedback.conversion === 'boolean' ? feedback.conversion : null,
        latencyMs: feedback.latencyMs ?? null,
        costActual: feedback.costActual ?? null,
        tokensInput: feedback.tokensInput ?? null,
        tokensOutput: feedback.tokensOutput ?? null,
        autoEval: feedback.autoEval ? JSON.stringify(feedback.autoEval) : null,
        recordedAt: new Date(),
      },
    });

    // Optionally log feedback event
    if (feedback.reviewTags || feedback.notes) {
      await prisma.estimationFeedbackEvent.create({
        data: {
          decisionId: feedback.decisionId,
          eventType: feedback.feedbackSource ?? DEFAULT_FEEDBACK_SOURCE,
          payload: JSON.stringify({
            reviewTags: feedback.reviewTags,
            notes: feedback.notes,
          }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded',
      decisionId: feedback.decisionId,
    });
  } catch (error) {
    if (error instanceof EstimationErrorClass) {
      return NextResponse.json(formatErrorResponse(error), { status: error.statusCode });
    }

    console.error('Feedback API error:', error);
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














