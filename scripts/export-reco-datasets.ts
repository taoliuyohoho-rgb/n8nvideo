import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function exportLTRDataset(outDir: string) {
  const rows: any[] = []
  const candidateSets = await prisma.recommendationCandidateSet.findMany({
    include: {
      candidates: true,
      decisions: { include: { outcomes: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 10000
  })

  for (const cs of candidateSets) {
    const decision = cs.decisions?.[0]
    const chosenId = decision?.chosenTargetId
    const outcome = decision?.outcomes || null
    const labelChosen = outcome?.conversion ? 1 : (outcome?.qualityScore && outcome.qualityScore >= 0.8 ? 1 : undefined)
    for (const c of cs.candidates) {
      const isChosen = c.targetId === chosenId
      const label = isChosen ? (labelChosen ?? 1) : 0
      rows.push({
        decisionId: decision?.id,
        candidateSetId: cs.id,
        candidateId: c.targetId,
        targetType: c.targetType,
        label,
        coarseScore: c.coarseScore ?? null,
        fineScore: c.fineScore ?? null,
        createdAt: cs.createdAt.toISOString()
      })
    }
  }

  const out = path.join(outDir, `ltr_${Date.now()}.jsonl`)
  fs.writeFileSync(out, rows.map(r => JSON.stringify(r)).join('\n'), 'utf-8')
  console.log(`✅ LTR dataset exported: ${out} (${rows.length} rows)`) 
}

async function exportRerankerDataset(outDir: string) {
  const rows: any[] = []
  // 简化：将 taskSnapshot/contextSnapshot 作为 query 文本，候选的 reason/summary/content 作为候选文本
  const candidateSets = await prisma.recommendationCandidateSet.findMany({
    include: {
      candidates: true,
      decisions: { include: { outcomes: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 5000
  })

  for (const cs of candidateSets) {
    const decision = cs.decisions?.[0]
    const chosenId = decision?.chosenTargetId
    const outcome = decision?.outcomes || null
    const labelChosen = outcome?.conversion ? 1 : (outcome?.qualityScore && outcome.qualityScore >= 0.8 ? 1 : undefined)
    const queryText = buildQueryFromSnapshots(cs.subjectSnapshot, cs.contextSnapshot)
    for (const c of cs.candidates) {
      const isChosen = c.targetId === chosenId
      const label = isChosen ? (labelChosen ?? 1) : 0
      const candidateText = buildCandidateText(c)
      rows.push({ query: queryText, document: candidateText, label })
    }
  }

  const out = path.join(outDir, `reranker_${Date.now()}.jsonl`)
  fs.writeFileSync(out, rows.map(r => JSON.stringify(r)).join('\n'), 'utf-8')
  console.log(`✅ Reranker dataset exported: ${out} (${rows.length} rows)`) 
}

function buildQueryFromSnapshots(subjectSnapshot: string, contextSnapshot?: string | null): string {
  let body = ''
  try { body += subjectSnapshot } catch {}
  if (contextSnapshot) body += `\nCTX: ${contextSnapshot}`
  return body.slice(0, 5000)
}

function buildCandidateText(c: any): string {
  const reason = safeJson(c.reason)
  const details: string[] = []
  if (reason && typeof reason === 'object') {
    for (const k of Object.keys(reason)) {
      const v = (reason as any)[k]
      if (typeof v === 'string') details.push(`${k}: ${v}`)
    }
  }
  return [`ID:${c.targetId}`, `TYPE:${c.targetType}`, details.join(' | ')].filter(Boolean).join(' \n ')
}

function safeJson(s?: string | null): any {
  if (!s) return null
  try { return JSON.parse(s) } catch { return null }
}

async function main() {
  const outDir = process.argv[2] || './out'
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  await exportLTRDataset(outDir)
  await exportRerankerDataset(outDir)
}

main().then(() => prisma.$disconnect()).catch(err => { console.error(err); prisma.$disconnect() })


