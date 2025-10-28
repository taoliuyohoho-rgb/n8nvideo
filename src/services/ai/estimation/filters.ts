// Lightweight placeholder filters to satisfy imports
import type { RankRequest } from './types'

export function filterModels(models: any[], task: RankRequest['task'], constraints?: RankRequest['constraints']): { passed: any[]; filtered: any[] } {
  const passed: any[] = []
  const filtered: any[] = []

  for (const m of models) {
    let ok = true
    if (constraints?.requireJsonMode && !m.jsonModeSupport) ok = false
    if (constraints?.maxCostUSD && m.pricePer1kTokens) {
      const est = m.pricePer1kTokens * 2
      if (est > constraints.maxCostUSD) ok = false
    }
    ;(ok ? passed : filtered).push(m)
  }

  return { passed, filtered }
}


