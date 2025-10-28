import { callModel, ModelNeeds, CallPolicy } from './rules'

export type SchemaValidator<T> = (text: string) => T | null

export async function callWithSchema<T>({
  prompt,
  needs,
  policy,
  validator,
  autoRepair = true,
  images
}: {
  prompt: string
  needs: ModelNeeds
  policy: CallPolicy
  validator: SchemaValidator<T>
  autoRepair?: boolean
  images?: string[]
}): Promise<T> {
  const raw = await callModel(prompt, needs, policy, images)
  const parsed = validator(raw)
  if (parsed) return parsed
  if (!autoRepair) throw new Error('AI输出不符合Schema')
  const repairPrompt = `${prompt}\n\n仅输出严格的JSON，勿包含任何额外说明。`
  const repaired = await callModel(repairPrompt, needs, policy, images)
  const reparsed = validator(repaired)
  if (!reparsed) throw new Error('AI输出不符合Schema')
  return reparsed
}

// 将证据模式拼接到提示词
export function evidenceMode(evidenceBlock: string, basePrompt: string): string {
  return basePrompt.replace('{evidence}', evidenceBlock)
}


