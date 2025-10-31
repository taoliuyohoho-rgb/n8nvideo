// Unified input normalization for AI tasks
// Supports URL, raw text, images (base64 or URLs), and video (URL)

export type UserInput = {
  url?: string
  rawText?: string
  images?: string[] // http(s) URLs or data URLs (base64)
  videoUrl?: string
}

export type Evidence = {
  kind: 'url' | 'text' | 'image' | 'video'
  content: string
  meta?: Record<string, any>
}

export class InputError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

function isHttpUrl(s?: string): boolean {
  if (!s) return false
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function normalizeUserInput(input: UserInput): Evidence[] {
  const evidences: Evidence[] = []

  if (isHttpUrl(input.url)) {
    evidences.push({ kind: 'url', content: input.url! })
  }

  if (input.rawText && input.rawText.trim().length > 0) {
    const text = input.rawText.trim()
    // cap extremely long text to control token usage (kept server-safe)
    evidences.push({ kind: 'text', content: text.slice(0, 50000) })
  }

  if (Array.isArray(input.images)) {
    input.images
      .map(s => s?.trim())
      .filter(Boolean)
      .forEach(img => evidences.push({ kind: 'image', content: img }))
  }

  if (isHttpUrl(input.videoUrl)) {
    evidences.push({ kind: 'video', content: input.videoUrl! })
  }

  return evidences
}

export function ensureUsableInput(input: UserInput, allowFallback: boolean): Evidence[] {
  const evidences = normalizeUserInput(input)
  if (evidences.length === 0) {
    throw new InputError('NO_INPUT', '未提供可用的输入（URL/文本/图片/视频）')
  }

  // If only URL present but not http(s), treat as invalid
  if (input.url && !isHttpUrl(input.url)) {
    if (!allowFallback && evidences.length === 0) {
      throw new InputError('UNPARSABLE_INPUT', '链接不可用，且未开启兜底模式')
    }
  }

  return evidences
}

// Helper to compose a short evidence summary for prompting
export function buildEvidenceSummary(evidences: Evidence[]): string {
  const parts: string[] = []
  for (const e of evidences) {
    if (e.kind === 'url') parts.push(`链接: ${e.content}`)
    if (e.kind === 'text') parts.push(`文本: ${e.content.slice(0, 500)}`)
    if (e.kind === 'image') {
      if (e.content.startsWith('data:')) {
        // 避免将整段base64塞进提示词，改为占位说明
        const mime = e.content.slice(5, e.content.indexOf(';')) || 'image/*'
        parts.push(`图片: [inline ${mime}]`)
      } else {
        parts.push(`图片URL: ${e.content.slice(0, 200)}`)
      }
    }
    if (e.kind === 'video') parts.push(`视频: ${e.content}`)
  }
  return parts.join('\n')
}


