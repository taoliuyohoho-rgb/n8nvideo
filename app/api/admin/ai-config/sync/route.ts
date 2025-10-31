import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'

const VERIFIED_MODELS_FILE = path.join(process.cwd(), 'verified-models.json')

function getVerifiedProviders(): Set<string> {
  try {
    if (!fs.existsSync(VERIFIED_MODELS_FILE)) return new Set()
    const raw = fs.readFileSync(VERIFIED_MODELS_FILE, 'utf8')
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return new Set()
    const map: Record<string, string> = {
      'Google': 'gemini',
      'OpenAI': 'openai',
      'DeepSeek': 'deepseek',
      '字节跳动': 'doubao',
      'Anthropic': 'anthropic',
    }
    const set = new Set<string>()
    for (const m of arr) {
      if (m?.status === 'verified' && typeof m?.provider === 'string') {
        set.add(map[m.provider] || m.provider.toLowerCase())
      }
    }
    return set
  } catch {
    return new Set()
  }
}

export async function POST(request: NextRequest) {
  try {
    const { provider } = await request.json().catch(() => ({}))
    const verified = getVerifiedProviders()
    const providersToSync = provider ? [provider] : Array.from(verified)
    if (providersToSync.length === 0) {
      return NextResponse.json({ success: false, error: '无已验证的provider可同步' }, { status: 400 })
    }

    const results: any[] = []
    for (const p of providersToSync) {
      const list = await fetchProviderModels(p)
      for (const m of list) {
        const d = getDefaultsForProvider(p)
        const maxContext = typeof m.maxContext === 'number' ? m.maxContext : d.maxContext
        const pricePer1kTokens = typeof m.pricePer1kTokens === 'number' ? m.pricePer1kTokens : d.pricePer1kTokens
        const rateLimit = typeof m.rateLimit === 'number' ? m.rateLimit : d.rateLimit
        const langs = Array.isArray(m.langs) && m.langs.length > 0 ? m.langs : d.langs
        await prisma.estimationModel.upsert({
          where: { provider_modelName: { provider: p, modelName: m.modelName } },
          update: {
            version: m.version || null,
            langs: JSON.stringify(langs),
            maxContext,
            pricePer1kTokens,
            rateLimit,
            toolUseSupport: !!m.toolUseSupport,
            jsonModeSupport: !!m.jsonModeSupport,
            status: 'active',
            staticCapability: m.staticCapability ? JSON.stringify(m.staticCapability) : null,
            updatedAt: new Date(),
          },
          create: {
            provider: p,
            modelName: m.modelName,
            version: m.version || null,
            langs: JSON.stringify(langs),
            maxContext,
            pricePer1kTokens,
            rateLimit,
            toolUseSupport: !!m.toolUseSupport,
            jsonModeSupport: !!m.jsonModeSupport,
            status: 'active',
            staticCapability: m.staticCapability ? JSON.stringify(m.staticCapability) : null,
          }
        })
      }
      results.push({ provider: p, count: list.length })
    }

    return NextResponse.json({ success: true, results })
  } catch (e: any) {
    console.error('Sync provider models failed:', e)
    return NextResponse.json({ success: false, error: e?.message || 'sync failed' }, { status: 500 })
  }
}

async function fetchProviderModels(provider: string): Promise<Array<{
  modelName: string
  version?: string | null
  langs?: string[]
  maxContext?: number | null
  pricePer1kTokens?: number | null
  rateLimit?: number | null
  toolUseSupport?: boolean
  jsonModeSupport?: boolean
  staticCapability?: Record<string, unknown>
}>> {
  const p = provider.toLowerCase()
  switch (p) {
    case 'openai':
      try {
        const list = await fetchOpenAIModelsFromApi()
        if (list.length > 0) return list
      } catch {}
      return [
        { modelName: 'gpt-4o-mini', jsonModeSupport: true, toolUseSupport: true },
        { modelName: 'gpt-4o', jsonModeSupport: true, toolUseSupport: true },
        { modelName: 'gpt-4.1-mini', jsonModeSupport: true, toolUseSupport: true },
      ]
    case 'gemini':
      try {
        const list = await fetchGeminiModelsFromApi()
        if (list.length > 0) return list
      } catch {}
      return [
        { modelName: 'gemini-2.0-flash-exp', jsonModeSupport: true, toolUseSupport: true },
        { modelName: 'gemini-1.5-flash', jsonModeSupport: true, toolUseSupport: true },
        { modelName: 'gemini-1.5-pro', jsonModeSupport: true, toolUseSupport: true },
      ]
    case 'deepseek':
      try {
        const list = await fetchDeepseekModelsFromApi()
        if (list.length > 0) return list
      } catch {}
      return [
        { modelName: 'deepseek-chat', jsonModeSupport: true, toolUseSupport: false },
        { modelName: 'deepseek-reasoner', jsonModeSupport: true, toolUseSupport: false },
      ]
    case 'doubao':
      return [
        { modelName: 'doubao-seed-1-6-lite-251015', jsonModeSupport: true, toolUseSupport: false },
        { modelName: 'doubao-pro-32k', jsonModeSupport: true, toolUseSupport: false },
      ]
    case 'anthropic':
      return [
        { modelName: 'claude-3-5-sonnet-20241022', jsonModeSupport: true, toolUseSupport: true },
        { modelName: 'claude-3-5-haiku-20241022', jsonModeSupport: true, toolUseSupport: true },
      ]
    default:
      return []
  }
}

async function fetchGeminiModelsFromApi(): Promise<Array<{ modelName: string; jsonModeSupport?: boolean; toolUseSupport?: boolean }>> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return []
  const url = 'https://generativelanguage.googleapis.com/v1beta/models'
  const resp = await fetch(url, { headers: { 'x-goog-api-key': key } })
  if (!resp.ok) return []
  const data = await resp.json().catch(() => ({}))
  const models = Array.isArray(data?.models) ? data.models : []
  const out: Array<{ modelName: string; jsonModeSupport?: boolean; toolUseSupport?: boolean }> = []
  for (const m of models) {
    const name = m?.name || m?.displayName || ''
    if (typeof name !== 'string') continue
    if (!/^(models\/)?gemini[-\w\.]+/i.test(name)) continue
    const id = name.replace(/^models\//, '')
    // Heuristic: most chat models support JSON; mark true; tool use true for >=2.5 family
    const jsonModeSupport = true
    const toolUseSupport = /^gemini-2\.5/i.test(id)
    out.push({ modelName: id, jsonModeSupport, toolUseSupport })
  }
  return out
}

async function fetchOpenAIModelsFromApi(): Promise<Array<{ modelName: string; jsonModeSupport?: boolean; toolUseSupport?: boolean }>> {
  const key = process.env.OPENAI_API_KEY
  if (!key) return []
  const url = (process.env.OPENAI_BASE_URL || 'https://api.openai.com').replace(/\/+$/, '') + '/v1/models'
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${key}` } })
  if (!resp.ok) return []
  const data = await resp.json().catch(() => ({}))
  const arr = Array.isArray(data?.data) ? data.data : []
  const out: Array<{ modelName: string; jsonModeSupport?: boolean; toolUseSupport?: boolean }> = []
  for (const m of arr) {
    const id = typeof m?.id === 'string' ? m.id : ''
    if (!id) continue
    if (/^gpt-4o|^gpt-4\.1|^o3/i.test(id)) {
      out.push({ modelName: id, jsonModeSupport: true, toolUseSupport: true })
    }
  }
  return out
}

async function fetchDeepseekModelsFromApi(): Promise<Array<{ modelName: string; jsonModeSupport?: boolean; toolUseSupport?: boolean }>> {
  const key = process.env.DEEPSEEK_API_KEY
  if (!key) return []
  const base = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '')
  const url = `${base}/v1/models`
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${key}` } })
  if (!resp.ok) return []
  const data = await resp.json().catch(() => ({}))
  const arr = Array.isArray(data?.data) ? data.data : []
  const out: Array<{ modelName: string; jsonModeSupport?: boolean; toolUseSupport?: boolean }> = []
  for (const m of arr) {
    const id = typeof m?.id === 'string' ? m.id : ''
    if (!id) continue
    if (/^deepseek/i.test(id)) out.push({ modelName: id, jsonModeSupport: true, toolUseSupport: false })
  }
  return out
}

function getDefaultsForProvider(provider: string) {
  const p = provider.toLowerCase()
  switch (p) {
    case 'openai':
      return { maxContext: 128000, pricePer1kTokens: 0.0025, rateLimit: 10000, langs: ['zh','en'] }
    case 'gemini':
      return { maxContext: 100000, pricePer1kTokens: 0.0, rateLimit: 5000, langs: ['zh','en'] }
    case 'deepseek':
      return { maxContext: 32000, pricePer1kTokens: 0.0, rateLimit: 3000, langs: ['zh','en'] }
    case 'doubao':
      return { maxContext: 32000, pricePer1kTokens: 0.0008, rateLimit: 5000, langs: ['zh','en'] }
    case 'anthropic':
      return { maxContext: 200000, pricePer1kTokens: 0.003, rateLimit: 4000, langs: ['zh','en'] }
    default:
      return { maxContext: 32000, pricePer1kTokens: 0.0, rateLimit: 1000, langs: ['zh','en'] }
  }
}


