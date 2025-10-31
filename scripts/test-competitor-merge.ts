/*
 Minimal offline test to verify sellingPoints/painPoints merge logic used by
 app/api/competitor/analyze/route.ts without DB/AI. Run:
   npm run -s type-check && npx tsx scripts/test-competitor-merge.ts
*/

type ProductLike = {
  id: string
  name: string
  category: string
  sellingPoints?: unknown
  painPoints?: unknown
}

function normalizeArrayField(field: unknown): string[] {
  try {
    if (Array.isArray(field)) return field.filter(Boolean).map(v => String(v))
    if (typeof field === 'string' && field.trim()) return JSON.parse(field)
  } catch {}
  return []
}

function mergePoints(existing: string[], incoming: string[]): { merged: string[]; added: number } {
  const set = new Set(existing.map(s => s.trim().toLowerCase()))
  let added = 0
  const out = [...existing]
  for (const p of incoming) {
    const n = String(p || '').trim()
    if (!n) continue
    const key = n.toLowerCase()
    if (!set.has(key)) {
      out.push(n)
      set.add(key)
      added++
    }
  }
  return { merged: out, added }
}

function runTest() {
  const product: ProductLike = {
    id: 'test-folding-pot',
    name: '折叠锅',
    category: '电子产品',
    sellingPoints: [],
    painPoints: [
      '烧水速度慢',
      '等待时间长',
    ]
  }

  // 假定AI返回（模拟 deepseek/doubao 返回）
  const aiRoot = {
    sellingPoints: [
      '折叠结构稳定牢靠，使用更安心',
      '折叠处不藏污纳垢，清洗更方便',
      '加热效率高（电折叠锅专用底盘）',
    ],
    painPoints: [
      '容量偏小，做饭受限',
    ],
    targetAudience: '经常户外露营/野餐人群'
  }

  const existingSP = normalizeArrayField(product.sellingPoints)
  const existingPP = normalizeArrayField(product.painPoints)
  const sp = normalizeArrayField(aiRoot.sellingPoints)
  const pp = normalizeArrayField(aiRoot.painPoints)

  const spRes = mergePoints(existingSP, sp)
  const ppRes = mergePoints(existingPP, pp)

  const updateData: any = { updatedAt: new Date() }
  if (spRes.added > 0) updateData.sellingPoints = spRes.merged
  if (ppRes.added > 0) updateData.painPoints = ppRes.merged
  if (aiRoot.targetAudience && String(aiRoot.targetAudience).trim()) {
    updateData.targetAudience = [String(aiRoot.targetAudience).trim()]
  }

  console.log('\n--- Test: 折叠锅 合并结果 ---')
  console.log('AI 提取 卖点数:', sp.length, '痛点数:', pp.length)
  console.log('新增 卖点:', spRes.added, '新增 痛点:', ppRes.added)
  console.log('更新 payload:', JSON.stringify(updateData, null, 2))
}

runTest()


