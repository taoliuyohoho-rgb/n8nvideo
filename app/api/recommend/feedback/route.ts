import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type OutcomeInput = {
  latencyMs?: number
  costActual?: number
  qualityScore?: number
  conversion?: boolean
  rejected?: boolean
  editDistance?: number
  notes?: string
}

function badRequest(message: string) {
  return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message } }, { status: 400 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      decisionId,
      userChoice,
      type,
      reason,
      eventType,
      payload,
      // outcome shortcut fields
      latencyMs,
      costActual,
      qualityScore,
      conversion,
      rejected,
      editDistance,
      notes,
    } = body || {}

    if (!decisionId) return badRequest('decisionId is required')

    // Optional explicit feedback row
    let feedback: any = null
    if (userChoice && type) {
      feedback = await prisma.recommendationFeedback.create({
        data: {
          decisionId,
          feedbackType: String(type),
          chosenCandidateId: String(userChoice),
          reason: reason || null,
        }
      })
    }

    // Event logging (expose/select/auto_select/execute_* / implicit_*)
    const ev = await prisma.recommendationEvent.create({
      data: {
        decisionId,
        eventType: eventType || (feedback ? 'explicit_feedback' : 'custom'),
        payload: payload ? JSON.stringify(payload) : null,
      }
    })

    // Outcome upsert (if any outcome-related fields provided)
    const outcomeInput: OutcomeInput = { latencyMs, costActual, qualityScore, conversion, rejected, editDistance, notes }
    const hasOutcome = Object.values(outcomeInput).some(v => v !== undefined && v !== null)
    let outcome: any = null
    if (hasOutcome) {
      const existing = await prisma.recommendationOutcome.findUnique({ where: { decisionId } })
      if (existing) {
        outcome = await prisma.recommendationOutcome.update({
          where: { decisionId },
          data: {
            latencyMs: latencyMs ?? existing.latencyMs,
            costActual: costActual ?? existing.costActual,
            qualityScore: qualityScore ?? existing.qualityScore,
            conversion: conversion ?? existing.conversion,
            rejected: rejected ?? existing.rejected,
            editDistance: editDistance ?? existing.editDistance,
            notes: notes ?? existing.notes,
          }
        })
      } else {
        outcome = await prisma.recommendationOutcome.create({
          data: {
            decisionId,
            latencyMs: latencyMs ?? null,
            costActual: costActual ?? null,
            qualityScore: qualityScore ?? null,
            conversion: conversion ?? null,
            rejected: rejected ?? null,
            editDistance: editDistance ?? null,
            notes: notes ?? null,
          }
        })
      }
    }

    return NextResponse.json({ success: true, data: { feedback, event: ev, outcome } })
  } catch (error: any) {
    console.error('[API]/recommend/feedback error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error?.message || 'Unknown error' } },
      { status: 500 }
    )
  }
}
