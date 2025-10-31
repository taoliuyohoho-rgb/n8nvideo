import { prisma } from '@/lib/prisma'

type PendingEvent = {
  table: 'reco_candidate_sets' | 'reco_candidates' | 'reco_decisions' | 'reco_events' | 'reco_feedback' | 'reco_outcomes'
  payload: any
}

const queue: PendingEvent[] = []
let flushing = false

function push(table: PendingEvent['table'], payload: any) {
  queue.push({ table, payload })
  if (queue.length > 200) flush().catch(() => {})
}

export function enqueueCandidateSet(payload: any) { push('reco_candidate_sets', payload) }
export function enqueueCandidates(payloads: any[]) { for (const p of payloads) push('reco_candidates', p) }
export function enqueueDecision(payload: any) { push('reco_decisions', payload) }
export function enqueueEvent(payload: any) { push('reco_events', payload) }
export function enqueueFeedback(payload: any) { push('reco_feedback', payload) }
export function enqueueOutcome(payload: any) { push('reco_outcomes', payload) }

export async function flush() {
  if (flushing) return
  flushing = true
  try {
    const batch = queue.splice(0, 500)
    if (batch.length === 0) return
    // group by table
    const byTable: Record<string, any[]> = {}
    for (const item of batch) {
      if (!byTable[item.table]) byTable[item.table] = []
      byTable[item.table].push(item.payload)
    }

    // candidates and others
    if (byTable['reco_candidate_sets']) {
      await prisma.recommendationCandidateSet.createMany({ data: byTable['reco_candidate_sets'] })
    }
    if (byTable['reco_candidates']) {
      await prisma.recommendationCandidate.createMany({ data: byTable['reco_candidates'] })
    }
    if (byTable['reco_decisions']) {
      await prisma.recommendationDecision.createMany({ data: byTable['reco_decisions'] })
    }
    if (byTable['reco_events']) {
      await prisma.recommendationEvent.createMany({ data: byTable['reco_events'] })
    }
    if (byTable['reco_feedback']) {
      await prisma.recommendationFeedback.createMany({ data: byTable['reco_feedback'] })
    }
    if (byTable['reco_outcomes']) {
      // createMany for outcomes may violate unique(decisionId); do upsert-like per row
      for (const o of byTable['reco_outcomes']) {
        await prisma.recommendationOutcome.upsert({
          where: { decisionId: o.decisionId },
          update: { ...o },
          create: { ...o },
        })
      }
    }
  } catch (e) {
    console.error('[reco.asyncWriter] flush failed', e)
  } finally {
    flushing = false
  }
}

let started = false
export function startAsyncWriter() {
  if (started) return
  started = true
  // flush every 2s
  setInterval(() => flush().catch(() => {}), 2000).unref?.()
}

// auto start on import in server env
try { startAsyncWriter() } catch {}


