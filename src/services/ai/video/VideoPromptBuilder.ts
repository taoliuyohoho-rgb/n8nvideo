import type { PersonaSnapshot, ScriptSnapshot } from '@/types/video'
import { resolveLanguages, type ResolvedLanguages } from './language'

export interface BuildVideoPromptParams {
  providerName?: string
  productName: string
  targetCountries?: string[]
  script: ScriptSnapshot
  persona?: PersonaSnapshot | null
  templateContent?: string
  overrideVoiceoverLang?: string
}

export interface BuiltVideoPrompt {
  prompt: string
  languages: ResolvedLanguages
}

export function buildVideoPrompt(params: BuildVideoPromptParams): BuiltVideoPrompt {
  const { providerName, productName } = params
  const targetCountries = Array.isArray(params.targetCountries) ? params.targetCountries : []
  const languages = resolveLanguages(providerName, targetCountries)
  if (params.overrideVoiceoverLang) {
    (languages as any).voiceoverLang = params.overrideVoiceoverLang
    ;(languages as any).screenTextLang = params.overrideVoiceoverLang
  }

  const personaParts: string[] = []
  if (params.persona?.coreIdentity) {
    const ci = params.persona.coreIdentity
    const basics: string[] = []
    if (ci.name) basics.push(ci.name)
    if (ci.age) basics.push(`${ci.age}y`)
    if (ci.gender) basics.push(ci.gender)
    if (ci.location) basics.push(ci.location)
    if (ci.occupation) basics.push(ci.occupation)
    if (basics.length > 0) personaParts.push(`Persona: ${basics.join(', ')}`)
  }
  if (params.persona?.vibe) {
    const v = params.persona.vibe
    const traits = Array.isArray(v.traits) && v.traits.length > 0 ? v.traits.join(', ') : undefined
    const pieces = [traits, v.demeanor, v.communicationStyle].filter(Boolean)
    if (pieces.length > 0) personaParts.push(`Persona vibe & voice: ${pieces.join('; ')}`)
  }
  if (params.persona?.look) {
    const lk = params.persona.look
    const pieces = [lk.generalAppearance, lk.hair, lk.clothingAesthetic, lk.signatureDetails].filter(Boolean)
    if (pieces.length > 0) personaParts.push(`Persona look: ${pieces.join('; ')}`)
  }

  // Prepare shots (fallback if missing)
  const safeShots = Array.isArray((params.script as any).shots) && (params.script as any).shots.length > 0
    ? (params.script as any).shots
    : [
        { second: 0, camera: 'close-up', action: 'show product clearly', visibility: 'product visible', audio: 'voiceover + bgm' },
        { second: Math.max(1, Math.floor((params.script.durationSec || 12) / 2)), camera: 'handheld mid', action: 'demonstrate core action', visibility: 'key info readable', audio: 'voiceover' },
        { second: Math.max(2, (params.script.durationSec || 12) - 3), camera: 'close-up', action: 'hero + benefit tag', visibility: 'cta safe area', audio: 'voiceover' },
      ]

  // Shots formatting (instruction language)
  const shotLines: string[] = []
  for (const shot of safeShots) {
    const s = [
      `t=${shot.second}s`,
      `camera=${shot.camera}`,
      `action=${shot.action}`,
      `visibility=${shot.visibility}`,
      `audio=${shot.audio}`,
    ].join(' | ')
    shotLines.push(`- ${s}`)
  }

  // Lines (voiceover language in quotes). We ask the model not to translate quoted lines
  const quoted = (text: string) => `"${text}"`

  const linesBlock = [
    `Hook (${languages.voiceoverLang}): ${quoted(params.script.lines.open)}`,
    `Main (${languages.voiceoverLang}): ${quoted(params.script.lines.main)}`,
    `Close (${languages.voiceoverLang}): ${quoted(params.script.lines.close)}`,
  ]

  const tech = (params.script as any).technical || {
    orientation: 'vertical',
    filmingMethod: 'handheld',
    dominantHand: 'right',
    location: 'indoor',
    audioEnv: 'quiet',
  }
  // Try to map orientation to resolution if missing; leave to caller to pass resolution
  const durationSec = params.script.durationSec

  const header = [
    `Task: Generate a ${durationSec}s vertical UGC ad for ${quoted(productName)}.`,
    `Instruction language: ${languages.instructionLang}. Voiceover/screen text: ${languages.voiceoverLang}.`,
    `Do not translate quoted dialogue; keep it exactly as provided.`,
  ]

  const personaBlock = personaParts.length > 0 ? [`${personaParts.join('\n')}`] : []

  const providerHints: string[] = []
  const p = (providerName || '').toLowerCase()
  if (p.includes('sora') || p.includes('runway') || p.includes('luma') || p.includes('pika')) {
    providerHints.push('Use natural language camera directions. Keep motions smooth; avoid hard cuts.')
  }
  if (p.includes('doubao')) {
    providerHints.push('Prefer concise Chinese instructions; keep shot list compact.')
  }

  const techBlock = [
    `Technical: orientation=${tech.orientation}; filming=${tech.filmingMethod}; dominantHand=${tech.dominantHand}; location=${tech.location}; audioEnv=${tech.audioEnv}.`,
    `Platform constraints: 9:16 vertical, clear product visibility, safe area for captions; subtitles in ${languages.screenTextLang}.`,
  ]

  const shotsBlock = [
    'Shots:',
    ...shotLines,
  ]

  const promptParts: string[] = [
    header.join('\n'),
    personaBlock.join('\n'),
    providerHints.join('\n'),
    linesBlock.join('\n'),
    shotsBlock.join('\n'),
    techBlock.join('\n'),
  ].filter(Boolean)

  const fallbackPrompt = promptParts.join('\n\n').trim()

  // If a template is provided, render with placeholders. Otherwise return fallback.
  if (!params.templateContent) {
    return { prompt: fallbackPrompt, languages }
  }

  // Prepare variables for replacement
  const personaName = params.persona?.coreIdentity?.name || params.persona?.name || 'Host'
  const personaAge = params.persona?.coreIdentity?.age
  const personaGender = params.persona?.coreIdentity?.gender
  const personaOccupation = params.persona?.coreIdentity?.occupation
  const personaTraits = Array.isArray(params.persona?.vibe?.traits) ? params.persona?.vibe?.traits?.join(', ') : undefined
  const personaCommunicationStyle = params.persona?.vibe?.communicationStyle

  // ✅ 使用 safeShots 而不是直接访问 params.script.shots
  const shotsList = safeShots
    .map((shot) => `- t=${shot.second}s | camera=${shot.camera} | action=${shot.action} | visibility=${shot.visibility} | audio=${shot.audio}`)
    .join('\n')

  const replacements: Record<string, string> = {
    '{{instructionLang}}': languages.instructionLang,
    '{{voiceoverLang}}': languages.voiceoverLang,
    '{{screenTextLang}}': languages.screenTextLang,
    '{{productName}}': productName,
    '{{personaName}}': String(personaName),
    '{{personaAge}}': personaAge !== undefined ? String(personaAge) : '',
    '{{personaGender}}': personaGender || '',
    '{{personaOccupation}}': personaOccupation || '',
    '{{personaTraits}}': personaTraits || '',
    '{{personaCommunicationStyle}}': personaCommunicationStyle || '',
    '{{script_open}}': params.script.lines.open,
    '{{script_main}}': params.script.lines.main,
    '{{script_close}}': params.script.lines.close,
    '{{shots_list}}': shotsList,
    '{{durationSec}}': String(params.script.durationSec),
    // ✅ 使用 tech 变量（已包含fallback）而不是直接访问
    '{{tech_orientation}}': tech.orientation,
    '{{tech_filmingMethod}}': tech.filmingMethod,
    '{{tech_dominantHand}}': tech.dominantHand,
    '{{tech_location}}': tech.location,
    '{{tech_audioEnv}}': tech.audioEnv,
  }

  let rendered = params.templateContent
  for (const [key, value] of Object.entries(replacements)) {
    rendered = rendered.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value)
  }

  // 检测是否还有未替换的占位符（说明模板不适配），回退到 fallback
  const unreplacedPlaceholders = rendered.match(/\{\{[^}]+\}\}/g)
  if (unreplacedPlaceholders && unreplacedPlaceholders.length > 0) {
    console.warn('[buildVideoPrompt] 模板包含未替换的占位符，回退到 fallback:', unreplacedPlaceholders)
    return { prompt: fallbackPrompt, languages }
  }

  // Append safety lines if the template didn't include them
  if (!/Do not translate quoted dialogue/i.test(rendered)) {
    rendered += `\n\nDo not translate quoted dialogue; keep it exactly as provided.`
  }

  return { prompt: rendered.trim(), languages }
}


