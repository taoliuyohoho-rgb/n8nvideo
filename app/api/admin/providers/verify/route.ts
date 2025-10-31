import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

type Provider = 'gemini' | 'doubao' | 'openai' | 'deepseek' | 'claude'

function mask(s: string) {
  if (!s) return ''
  return s.length <= 8 ? '****' : `${s.slice(0, 3)}***${s.slice(-3)}`
}

async function testKey(provider: Provider, apiKey: string, baseUrl?: string, modelId?: string): Promise<void> {
  switch (provider) {
    case 'gemini': {
      const base = (baseUrl || process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com').replace(/\/+$/, '')
      // preflight: list models to validate key & project entitlement
      try {
        const list = await fetch(`${base}/v1beta/models`, {
          headers: { 'x-goog-api-key': apiKey }
        })
        if (!list.ok) {
          const t = await list.text().catch(() => '')
          throw new Error(`Gemini list models ${list.status}: ${t}`)
        }
      } catch (e: any) {
        throw new Error(e?.message || 'Gemini 预检失败')
      }
      const models = [
        modelId || 'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
      ]
      let ok = false
      let lastErr: any
      for (const mid of models) {
        const endpoint = `${base}/v1beta/models/${encodeURIComponent(mid)}:generateContent`
        const resp = await fetch(endpoint, {
        method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'ping' }] }],
            generationConfig: { temperature: 0.0, maxOutputTokens: 1, response_mime_type: 'application/json' }
          })
        })
        if (resp.ok) { ok = true; break } else {
          const tx = await resp.text().catch(() => '')
          lastErr = new Error(`Gemini HTTP ${resp.status}: ${tx}`)
        }
      }
      if (!ok) throw lastErr || new Error('Gemini 验证失败')
      return
    }
    case 'doubao': {
      const base = (baseUrl || 'https://ark.cn-beijing.volces.com/api/v3').replace(/\/+$/, '')
      const resp = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'doubao-seed-1-6-lite-251015', messages: [{ role: 'user', content: 'ping' }], temperature: 0.0, max_tokens: 1 })
      })
      if (!resp.ok) throw new Error(`Doubao HTTP ${resp.status}`)
      return
    }
    case 'deepseek': {
      const base = (baseUrl || 'https://api.deepseek.com').replace(/\/+$/, '')
      const resp = await fetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: 'ping' }], temperature: 0.0, max_tokens: 1 })
      })
      if (!resp.ok) throw new Error(`Deepseek HTTP ${resp.status}`)
      return
    }
    case 'openai': {
      const base = (baseUrl || 'https://api.openai.com').replace(/\/+$/, '')
      const resp = await fetch(`${base}/v1/models`, { headers: { Authorization: `Bearer ${apiKey}` } })
      if (!resp.ok) throw new Error(`OpenAI HTTP ${resp.status}`)
      return
    }
    case 'claude': {
      const base = (baseUrl || 'https://api.anthropic.com').replace(/\/+$/, '')
      const resp = await fetch(`${base}/v1/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-3-5-haiku-20241022', messages: [{ role: 'user', content: 'ping' }], temperature: 0.0, max_tokens: 1 })
      })
      if (!resp.ok) throw new Error(`Claude HTTP ${resp.status}`)
      return
    }
  }
}

function providerToEnv(provider: Provider): string | null {
  switch (provider) {
    case 'gemini': return 'GEMINI_API_KEY'
    case 'doubao': return 'DOUBAO_API_KEY'
    case 'deepseek': return 'DEEPSEEK_API_KEY'
    case 'openai': return 'OPENAI_API_KEY'
    case 'claude': return 'ANTHROPIC_API_KEY'
    default: return null
  }
}

function providerToDisplay(provider: Provider): string {
  switch (provider) {
    case 'gemini': return 'Google'
    case 'doubao': return '字节跳动'
    case 'deepseek': return 'DeepSeek'
    case 'openai': return 'OpenAI'
    case 'claude': return 'Anthropic'
  }
}

function upsertVerifiedModels(provider: Provider, verified: boolean) {
  const file = path.join(process.cwd(), 'verified-models.json')
  const disp = providerToDisplay(provider)
  let list: any[] = []
  if (fs.existsSync(file)) {
    try { list = JSON.parse(fs.readFileSync(file, 'utf8')) } catch {}
  }
  if (!Array.isArray(list)) list = []
  const idx = list.findIndex((m: any) => m?.provider === disp)
  const base = { id: provider, name: disp, provider: disp }
  if (idx >= 0) list[idx] = { ...list[idx], ...base, verified, status: verified ? 'verified' : 'unverified' }
  else list.push({ ...base, verified, status: verified ? 'verified' : 'unverified' })
  fs.writeFileSync(file, JSON.stringify(list, null, 2))
}

function writeEnvLocal(key: string, value: string) {
  // dev-only persistence
  if (process.env.NODE_ENV === 'production') return
  const envPath = path.join(process.cwd(), '.env.local')
  let content = ''
  if (fs.existsSync(envPath)) content = fs.readFileSync(envPath, 'utf8')
  const lines = content.split(/\r?\n/)
  const prefix = `${key}=`
  let found = false
  const next = lines.map((line) => {
    if (line.startsWith(prefix)) { found = true; return `${key}=${value}` }
    return line
  })
  if (!found) next.push(`${key}=${value}`)
  fs.writeFileSync(envPath, next.join('\n'))
}

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey, baseUrl, modelId } = await req.json()
    if (!provider || !apiKey) return NextResponse.json({ success: false, message: 'provider 与 apiKey 必填' }, { status: 400 })
    const p = String(provider).toLowerCase() as Provider
    await testKey(p, apiKey, baseUrl, modelId)

    // set runtime env for immediate availability
    const envName = providerToEnv(p)
    if (envName) (process.env as any)[envName] = apiKey

    // persist for dev
    if (envName) writeEnvLocal(envName, apiKey)

    // mark verified
    upsertVerifiedModels(p, true)

    // trigger candidate pool sync for this provider (best-effort)
    try {
      const origin = new URL(req.url).origin
      await fetch(`${origin}/api/admin/ai-config/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: p })
      })
    } catch {}

    return NextResponse.json({ success: true, data: { provider: p, applied: true, keyPreview: mask(apiKey) } })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || '验证失败' }, { status: 400 })
  }
}


