// 模板相似度检测和去重
export interface TemplateSimilarity {
  template1: string
  template2: string
  similarity: number
  reason: string[]
}

export function calculateTemplateSimilarity(template1: any, template2: any): { similarity: number; reasons: string[] } {
  let similarity = 0
  const reasons: string[] = []

  // 1. 脚本结构相似度 (权重: 30%)
  if (template1.structure === template2.structure) {
    similarity += 30
    reasons.push('脚本结构相同')
  }

  // 2. Hook池相似度 (权重: 20%)
  const hook1 = template1.hookPool?.split(',').map((h: string) => h.trim()) || []
  const hook2 = template2.hookPool?.split(',').map((h: string) => h.trim()) || []
  const hookSimilarity = calculateArraySimilarity(hook1, hook2)
  similarity += hookSimilarity * 20
  if (hookSimilarity > 0.5) {
    reasons.push('Hook池高度相似')
  }

  // 3. 视频风格池相似度 (权重: 20%)
  const style1 = template1.videoStylePool?.split(',').map((s: string) => s.trim()) || []
  const style2 = template2.videoStylePool?.split(',').map((s: string) => s.trim()) || []
  const styleSimilarity = calculateArraySimilarity(style1, style2)
  similarity += styleSimilarity * 20
  if (styleSimilarity > 0.5) {
    reasons.push('视频风格池相似')
  }

  // 4. 语调池相似度 (权重: 15%)
  const tone1 = template1.tonePool?.split(',').map((t: string) => t.trim()) || []
  const tone2 = template2.tonePool?.split(',').map((t: string) => t.trim()) || []
  const toneSimilarity = calculateArraySimilarity(tone1, tone2)
  similarity += toneSimilarity * 15
  if (toneSimilarity > 0.5) {
    reasons.push('语调池相似')
  }

  // 5. 推荐类目相似度 (权重: 10%)
  const category1 = template1.recommendedCategories?.split(',').map((c: string) => c.trim()) || []
  const category2 = template2.recommendedCategories?.split(',').map((c: string) => c.trim()) || []
  const categorySimilarity = calculateArraySimilarity(category1, category2)
  similarity += categorySimilarity * 10
  if (categorySimilarity > 0.5) {
    reasons.push('推荐类目相似')
  }

  // 6. 目标国家相似度 (权重: 5%)
  const country1 = template1.targetCountries?.split(',').map((c: string) => c.trim()) || []
  const country2 = template2.targetCountries?.split(',').map((c: string) => c.trim()) || []
  const countrySimilarity = calculateArraySimilarity(country1, country2)
  similarity += countrySimilarity * 5
  if (countrySimilarity > 0.5) {
    reasons.push('目标国家相似')
  }

  return {
    similarity: Math.round(similarity),
    reasons
  }
}

function calculateArraySimilarity(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 && arr2.length === 0) return 1
  if (arr1.length === 0 || arr2.length === 0) return 0

  const set1 = new Set(arr1)
  const set2 = new Set(arr2)
  const intersection = new Set(Array.from(set1).filter(x => set2.has(x)))
  const union = new Set([...Array.from(set1), ...Array.from(set2)])

  return intersection.size / union.size
}

export function detectDuplicateTemplates(templates: any[], threshold: number = 80): TemplateSimilarity[] {
  const duplicates: TemplateSimilarity[] = []

  for (let i = 0; i < templates.length; i++) {
    for (let j = i + 1; j < templates.length; j++) {
      const { similarity, reasons } = calculateTemplateSimilarity(templates[i], templates[j])
      
      if (similarity >= threshold) {
        duplicates.push({
          template1: templates[i].templateId,
          template2: templates[j].templateId,
          similarity: similarity,
          reason: reasons
        })
      }
    }
  }

  return duplicates
}

export function mergeSimilarTemplates(template1: any, template2: any): any {
  // 合并逻辑：保留更完整的模板，合并差异部分
  const merged = { ...template1 }

  // 合并Hook池
  const hooks1 = template1.hookPool?.split(',').map((h: string) => h.trim()) || []
  const hooks2 = template2.hookPool?.split(',').map((h: string) => h.trim()) || []
  const mergedHooks = Array.from(new Set([...hooks1, ...hooks2]))
  merged.hookPool = mergedHooks.join(', ')

  // 合并视频风格池
  const styles1 = template1.videoStylePool?.split(',').map((s: string) => s.trim()) || []
  const styles2 = template2.videoStylePool?.split(',').map((s: string) => s.trim()) || []
  const mergedStyles = Array.from(new Set([...styles1, ...styles2]))
  merged.videoStylePool = mergedStyles.join(', ')

  // 合并语调池
  const tones1 = template1.tonePool?.split(',').map((t: string) => t.trim()) || []
  const tones2 = template2.tonePool?.split(',').map((t: string) => t.trim()) || []
  const mergedTones = Array.from(new Set([...tones1, ...tones2]))
  merged.tonePool = mergedTones.join(', ')

  // 合并推荐类目
  const categories1 = template1.recommendedCategories?.split(',').map((c: string) => c.trim()) || []
  const categories2 = template2.recommendedCategories?.split(',').map((c: string) => c.trim()) || []
  const mergedCategories = Array.from(new Set([...categories1, ...categories2]))
  merged.recommendedCategories = mergedCategories.join(', ')

  // 合并目标国家
  const countries1 = template1.targetCountries?.split(',').map((c: string) => c.trim()) || []
  const countries2 = template2.targetCountries?.split(',').map((c: string) => c.trim()) || []
  const mergedCountries = Array.from(new Set([...countries1, ...countries2]))
  merged.targetCountries = mergedCountries.join(', ')

  return merged
}
