export type RecommendationEventType =
  | 'expose'
  | 'auto_select'
  | 'select'
  | 'execute_start'
  | 'execute_complete'
  | 'implicit_positive'
  | 'implicit_negative'
  | 'explicit_feedback'
  | 'custom'

export interface ExposePayload {
  scenario: 'product->style' | 'task->model' | 'task->prompt'
  candidates: Array<{ id: string; bucket: 'top1' | 'fineTop2' | 'coarse' | 'oop'; coarseScore?: number; fineScore?: number }>
}

export interface SelectPayload { chosenId: string; prevId?: string }
export interface AutoSelectPayload { chosenId: string }

export interface ExecuteStartPayload { chosenId: string; targetType: 'model' | 'prompt' | 'style' }
export interface ExecuteCompletePayload {
  chosenId: string
  latencyMs?: number
  costActual?: number
  success?: boolean
}


