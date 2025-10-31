// Very lightweight Thompson Sampling bandit over candidate ids.
// In-memory only; periodic persistence could be added later.

type BetaParam = { a: number; b: number } // successes + 1, failures + 1
const betaParams = new Map<string, BetaParam>()

function get(id: string): BetaParam {
  let v = betaParams.get(id)
  if (!v) { v = { a: 1, b: 1 }; betaParams.set(id, v) }
  return v
}

function sampleBeta({ a, b }: BetaParam): number {
  // simple approx using Math.random() power transforms
  const x = Math.pow(Math.random(), 1 / a)
  const y = Math.pow(Math.random(), 1 / b)
  return x / (x + y)
}

export function rerankWithBandit<T extends { id: string }>(items: T[]): T[] {
  return [...items].sort((i1, i2) => sampleBeta(get(i2.id)) - sampleBeta(get(i1.id)))
}

export function recordFeedback(candidateId: string, opts: { success?: boolean; qualityScore?: number; rejected?: boolean; conversion?: boolean }) {
  const p = get(candidateId)
  const success = opts.success ?? (opts.conversion ? true : (opts.rejected ? false : (opts.qualityScore !== undefined ? opts.qualityScore >= 0.6 : false)))
  if (success) p.a += 1
  else p.b += 1
}


