// Output schema validation and coercion

export type CompetitorOutput = {
  description: string
  sellingPoints: string[]
  targetAudience?: string
}

export function coerceCompetitorOutput(text: string): CompetitorOutput | null {
  try {
    // extract JSON block if present
    let jsonCandidate = text
    const m = text.match(/```(?:json)?\n([\s\S]*?)\n```/i)
    if (m && m[1]) jsonCandidate = m[1]
    const obj = JSON.parse(jsonCandidate)
    const description = (obj.description || obj.desc || obj.summary || '').toString().trim().slice(0, 20)
    const arr = Array.isArray(obj.sellingPoints || obj.selling_points || obj.points || obj.bullets)
      ? (obj.sellingPoints || obj.selling_points || obj.points || obj.bullets)
      : []
    const sellingPoints = arr.map((x: any) => (typeof x === 'string' ? x.trim() : '')).filter((s: string) => s).slice(0, 12)
    const targetAudience = (obj.targetAudience || obj.target_audience || obj.audience || '').toString().trim().slice(0, 50)
    if (!description && sellingPoints.length === 0) return null
    return { 
      description, 
      sellingPoints, 
      targetAudience: targetAudience || undefined 
    }
  } catch {
    return null
  }
}


