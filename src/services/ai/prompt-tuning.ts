// Minimal skeleton for prompt tuning (reverse engineering prompts)

export type TuningInput = {
  business: string
  requiredInfo: Record<string, any>
  expectedSample: any
}

export type TuningResult = {
  prompt: string
  notes?: string
}

export async function generateTunedPrompt(_input: TuningInput): Promise<TuningResult> {
  // Placeholder: hook to an AI that writes prompts; we can later add evaluation loop
  return {
    prompt: '请基于输入信息与期望样例，生成业务所需JSON输出的严格提示词（后续实现）',
    notes: 'TODO: implement real tuning'
  }
}


