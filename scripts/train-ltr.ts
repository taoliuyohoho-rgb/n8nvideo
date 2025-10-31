/**
 * Offline LTR trainer (very lightweight)
 * - Collect recent decisions/outcomes + candidate reasons
 * - Build features using the same extractor
 * - Compute per-feature weight = mean(pos) - mean(neg) (normalized)
 * - Save to models/reco-ltr.json
 */

import fs from 'fs'
import path from 'path'
import { prisma } from '../lib/prisma'
import { buildFeatures, FeatureVector } from '../src/services/recommendation/features'

type Sample = { features: FeatureVector; label: number }

async function fetchSamples(limit = 2000): Promise<Sample[]> {
  const decisions = await prisma.recommendationDecision.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      candidateSet: true,
      outcomes: true,
    },
  })

  const samples: Sample[] = []
  for (const d of decisions) {
    const task = JSON.parse(d.candidateSet.subjectSnapshot || '{}')
    const context = d.candidateSet.contextSnapshot ? JSON.parse(d.candidateSet.contextSnapshot) : undefined
    const req: any = { scenario: 'task->model', task, context }
    const reason: any = {} // fallback; we don't rejoin candidates table for simplicity
    const candidate: any = { id: d.chosenTargetId, type: d.chosenTargetType, reason }
    const f = buildFeatures(req, candidate)

    // Label: prefer conversion or high qualityScore
    const y = d.outcomes?.qualityScore && d.outcomes.qualityScore > 0.7 ? 1 : (d.outcomes?.conversion ? 1 : 0)
    samples.push({ features: f, label: y ? 1 : 0 })
  }
  return samples
}

function trainWeights(samples: Sample[]) {
  const keys = new Set<string>()
  for (const s of samples) Object.keys(s.features).forEach(k => keys.add(k))
  const featList = Array.from(keys)

  const pos: Record<string, number> = {}
  const neg: Record<string, number> = {}
  let nPos = 0, nNeg = 0
  for (const s of samples) {
    if (s.label > 0) { nPos++; for (const k of featList) pos[k] = (pos[k] || 0) + (s.features[k] || 0) }
    else { nNeg++; for (const k of featList) neg[k] = (neg[k] || 0) + (s.features[k] || 0) }
  }
  const weights: Record<string, number> = {}
  for (const k of featList) {
    const mp = nPos ? (pos[k] || 0) / nPos : 0
    const mn = nNeg ? (neg[k] || 0) / nNeg : 0
    weights[k] = mp - mn
  }
  // normalize l2
  const l2 = Math.sqrt(Object.values(weights).reduce((s, v) => s + v * v, 0) || 1)
  for (const k of Object.keys(weights)) weights[k] /= l2
  const bias = nPos / Math.max(1, nPos + nNeg)
  return { weights, bias }
}

async function main() {
  console.log('[ltr] collecting samples...')
  const samples = await fetchSamples(2000)
  if (samples.length < 50) {
    console.warn('[ltr] not enough samples, skipping. collected:', samples.length)
    process.exit(0)
  }
  console.log('[ltr] training on', samples.length, 'samples')
  const model = trainWeights(samples)
  const out = {
    version: 'v1',
    updatedAt: Date.now(),
    bias: model.bias,
    weights: model.weights,
  }
  const dir = path.join(process.cwd(), 'models')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir)
  fs.writeFileSync(path.join(dir, 'reco-ltr.json'), JSON.stringify(out, null, 2))
  console.log('[ltr] model saved to models/reco-ltr.json')
}

main().catch((e) => { console.error(e); process.exit(1) })


