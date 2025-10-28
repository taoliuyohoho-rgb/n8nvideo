/**
 * 人物画像相关类型定义
 */

export interface Persona {
  id: string
  productId: string
  version: number
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
  createdBy: string | null
  createdAt: string
  updatedAt: string
  modelUsed: any
  product?: {
    id: string
    name: string
    category: string
  }
}

