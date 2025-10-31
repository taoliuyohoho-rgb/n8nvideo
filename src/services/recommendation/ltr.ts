import fs from 'fs'
import path from 'path'
import type { RecommendRankRequest, CandidateItem } from './types'
import { buildFeatures, vectorize } from './features'

export type LTRModel = {
  version: string
  updatedAt: number
  bias: number
  weights: Record<string, number>
}

let cachedModel: { model: LTRModel | null; loadedAt: number } = { model: null, loadedAt: 0 }

export function loadLTRModel(): LTRModel | null {
  const ttlMs = 5 * 60 * 1000
  if (cachedModel.model && Date.now() - cachedModel.loadedAt < ttlMs) return cachedModel.model
  try {
    const file = path.join(process.cwd(), 'models', 'reco-ltr.json')
    if (!fs.existsSync(file)) return (cachedModel = { model: null, loadedAt: Date.now() }).model
    const raw = fs.readFileSync(file, 'utf8')
    const m = JSON.parse(raw) as LTRModel
    cachedModel = { model: m, loadedAt: Date.now() }
    return m
  } catch {
    cachedModel = { model: null, loadedAt: Date.now() }
    return null
  }
}

export function rerankWithLTR(req: RecommendRankRequest, items: CandidateItem[]): CandidateItem[] {
  const m = loadLTRModel()
  if (!m) return items
  return [...items].sort((a, b) => {
    const fa = buildFeatures(req, a)
    const fb = buildFeatures(req, b)
    const sa = vectorize(fa, m.weights, m.bias)
    const sb = vectorize(fb, m.weights, m.bias)
    return sb - sa
  })
}


