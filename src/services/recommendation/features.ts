import type { RecommendRankRequest, CandidateItem } from './types'

export type FeatureVector = Record<string, number>

export function buildFeatures(req: RecommendRankRequest, c: CandidateItem): FeatureVector {
  const r = (c.reason as any) || {}
  const f: FeatureVector = {}

  // Base scores from upstream
  f.coarse = typeof c.coarseScore === 'number' ? c.coarseScore : 0
  f.fine = typeof c.fineScore === 'number' ? c.fineScore : f.coarse

  // Hard constraints as binary indicators
  f.langMatch = typeof r.langMatch === 'number' ? r.langMatch : (req.task.language ? 1 : 0.7)
  f.jsonSupport = typeof r.jsonSupport === 'number' ? r.jsonSupport : (req.constraints?.requireJsonMode ? 0 : 1)

  // Cost proxy (higher is better)
  f.price = typeof r.price === 'number' ? r.price : 0.5

  // Contextual hints (one-hot light)
  const channel = (req.context?.channel || '').toLowerCase()
  f.chn_tiktok = channel === 'tiktok' ? 1 : 0
  f.chn_facebook = channel === 'facebook' ? 1 : 0
  f.chn_web = channel === 'web' ? 1 : 0

  const contentType = (req.task.contentType || 'text').toLowerCase()
  f.ct_text = contentType === 'text' ? 1 : 0
  f.ct_vision = contentType === 'image' || contentType === 'video' || contentType === 'multimodal' ? 1 : 0

  // Budget tier
  const bt = req.task.budgetTier || req.context?.budgetTier
  f.budget_low = bt === 'low' ? 1 : 0
  f.budget_high = bt === 'high' ? 1 : 0

  return f
}

export function vectorize(features: FeatureVector, featureWeights: Record<string, number>, bias = 0): number {
  let s = bias
  for (const [k, w] of Object.entries(featureWeights)) {
    s += (features[k] ?? 0) * (typeof w === 'number' ? w : 0)
  }
  return s
}


