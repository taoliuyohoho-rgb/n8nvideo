/**
 * 视频生成流程相关类型定义
 */

export interface Product {
  id: string
  name: string
  description: string | null
  category: string
  sellingPoints: string[]
  painPoints: string[]
  targetCountries: string[]
  targetAudience: string[]
}

export interface Top5 {
  sellingPoints: string[]
  painPoints: string[]
  reasons: string[]
}

export interface Persona {
  coreIdentity: {
    name: string
    age: number
    gender: string
    location: string
    occupation: string
  }
  look: {
    generalAppearance: string
    hair: string
    clothingAesthetic: string
    signatureDetails: string
  }
  vibe: {
    traits: string[]
    demeanor: string
    communicationStyle: string
  }
  context: {
    hobbies: string
    values: string
    frustrations: string
    homeEnvironment: string
  }
  why: string
}

export interface Script {
  angle: string
  energy: string
  durationSec: number
  lines: {
    open: string
    main: string
    close: string
  }
  shots: Array<{
    second: number
    camera: string
    action: string
    visibility: string
    audio: string
  }>
  technical: {
    orientation: string
    filmingMethod: string
    dominantHand: string
    location: string
    audioEnv: string
  }
}

export interface VideoJob {
  id: string
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled'
  progress: number
  errorMessage?: string
  result?: {
    fileUrl: string
    thumbnailUrl?: string
  }
}

