import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { enqueueEvent, enqueueFeedback, enqueueOutcome, flush } from '@/src/services/recommendation/asyncWriter'
import { recordFeedback as banditRecord } from '@/src/services/recommendation/bandit'


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
    // 检查请求体是否为空
    const text = await request.text()
    if (!text || text.trim() === '') {
      console.warn('[API]/recommend/feedback 收到空请求体')
      return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'Empty request body' } }, { status: 400 })
    }
    
    let body
    try {
      body = JSON.parse(text)
    } catch (parseError) {
      console.error('[API]/recommend/feedback JSON解析失败:', parseError, '原始内容:', text.substring(0, 200))
      return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON format' } }, { status: 400 })
    }
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

    // Optional explicit feedback row (enqueue)
    let feedback: any = null
    if (userChoice && type) {
      feedback = { decisionId, feedbackType: String(type), chosenCandidateId: String(userChoice), reason: reason || null }
      enqueueFeedback(feedback)
      // Update bandit immediately (success if explicit accept)
      if (type === 'accept' || type === 'select') banditRecord(String(userChoice), { success: true })
      if (type === 'reject') banditRecord(String(userChoice), { success: false })
    }

    // Event logging (expose/select/auto_select/execute_* / implicit_*)
    const ev = { decisionId, eventType: eventType || (feedback ? 'explicit_feedback' : 'custom'), payload: payload ? JSON.stringify(payload) : null }
    enqueueEvent(ev)

    // Outcome upsert (if any outcome-related fields provided)
    const outcomeInput: OutcomeInput = { latencyMs, costActual, qualityScore, conversion, rejected, editDistance, notes }
    const hasOutcome = Object.values(outcomeInput).some(v => v !== undefined && v !== null)
    let outcome: any = null
    if (hasOutcome) {
      outcome = { decisionId, latencyMs: latencyMs ?? null, costActual: costActual ?? null, qualityScore: qualityScore ?? null, conversion: conversion ?? null, rejected: rejected ?? null, editDistance: editDistance ?? null, notes: notes ?? null }
      enqueueOutcome(outcome)
      // Bandit reward update
      if (userChoice) banditRecord(String(userChoice), { conversion, qualityScore, rejected })
    }

    // Fire and forget flush
    setTimeout(() => flush().catch(() => {}), 0)
    return NextResponse.json({ success: true, data: { feedback, event: ev, outcome } })
  } catch (error: any) {
    console.error('[API]/recommend/feedback error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error?.message || 'Unknown error' } },
      { status: 500 }
    )
  }
}
