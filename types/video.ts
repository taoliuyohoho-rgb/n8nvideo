export interface PersonaCoreIdentity {
  name: string
  age?: number
  gender?: string
  location?: string
  occupation?: string
}

export interface PersonaLook {
  generalAppearance?: string
  hair?: string
  clothingAesthetic?: string
  signatureDetails?: string
}

export interface PersonaVibe {
  traits?: string[]
  demeanor?: string
  communicationStyle?: string
}

export interface PersonaContext {
  hobbies?: string
  values?: string
  frustrations?: string
  homeEnvironment?: string
}

export interface PersonaSnapshot {
  id: string
  name?: string
  coreIdentity?: PersonaCoreIdentity | null
  look?: PersonaLook | null
  vibe?: PersonaVibe | null
  context?: PersonaContext | null
}

export interface ScriptLines {
  open: string
  main: string
  close: string
}

export interface ScriptShot {
  second: number
  camera: string
  action: string
  visibility: string
  audio: string
}

export interface ScriptTechnical {
  orientation: string
  filmingMethod: string
  dominantHand: string
  location: string
  audioEnv: string
}

export interface ScriptSnapshot {
  angle: string
  energy: string
  durationSec: number
  lines: ScriptLines
  shots: ScriptShot[]
  technical: ScriptTechnical
}

export interface VideoPromptBuilderInput {
  productName: string
  locale?: string
  platform?: 'tiktok' | 'douyin' | 'instagram' | 'youtube'
  persona?: PersonaSnapshot | null
  script: ScriptSnapshot
}


