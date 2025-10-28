import { aiExecutor } from './AiExecutor' // reuse existing executor

export type ModelNeeds = {
  search?: boolean
  vision?: boolean
  asr?: boolean
  // 新增能力分类
  videoUnderstanding?: boolean
  videoGeneration?: boolean
}

export type CallPolicy = {
  allowFallback: boolean
  model: 'auto' | string
  // 当需要严格JSON时，优先具备JSON模式的provider
  requireJsonMode?: boolean
  idempotencyKey?: string
}

export async function chooseModel(needs: ModelNeeds, model: 'auto' | string): Promise<string> {
  if (model !== 'auto') return model
  // 路由优先级（可配置化）：视频生成 > 视觉/视频理解 > 搜索 > 文本
  if (needs.videoGeneration) {
    // 豆包视频生成（可在环境变量覆盖）
    return process.env.DOUBAO_VIDEO_GEN_MODEL || 'Doubao-Seedance-1.0-pro'
  }
  if (needs.vision || needs.videoUnderstanding) {
    // 豆包视觉理解优先；无则回退到 Gemini 视觉
    return process.env.DOUBAO_VISION_MODEL || 'Doubao-Seed-1.6-vision'
  }
  if (needs.search) return 'gemini-2.5-flash'
  // 文本默认
  return 'gemini-2.5-flash'
}

// in-memory single-flight registry
const g: any = global as any
if (!g.__AI_SINGLE_FLIGHT__) g.__AI_SINGLE_FLIGHT__ = new Map<string, Promise<string>>()
const singleFlight: Map<string, Promise<string>> = g.__AI_SINGLE_FLIGHT__

export async function callModel(params: {
  prompt: string;
  task: string;
  evidenceMode?: boolean;
  schema?: any;
}): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  modelUsed?: { provider: string; model: string };
}> {
  const { prompt, task, evidenceMode = false, schema } = params;
  
  // 根据任务类型确定需求
  const needs: ModelNeeds = {
    vision: task.includes('persona') || task.includes('script'),
    videoUnderstanding: task.includes('video'),
    search: evidenceMode,
  };
  
  const policy: CallPolicy = {
    allowFallback: true,
    model: 'auto',
    requireJsonMode: !!schema,
  };

  try {
    const modelId = await chooseModel(needs, policy.model);
    
    if (needs.videoGeneration) {
      throw new Error('视频生成暂未通过文本执行器提供，请使用视频生成服务入口');
    }

    let result: string;
    
    // 根据模型选择执行
    if (needs.vision && process.env.DOUBAO_API_KEY) {
      const { default: DoubaoAIService } = await import('./DoubaoAIService');
      const doubao = new DoubaoAIService(process.env.DOUBAO_API_KEY as string);
      const model = process.env.DOUBAO_VISION_MODEL_ID || process.env.DOUBAO_VISION_MODEL || 'doubao-seed-1-6-vision-250815';
      result = await doubao.generateVision(prompt, [], { model });
    } else if (needs.vision && process.env.DEEPSEEK_API_KEY) {
      const { default: DeepseekAIService } = await import('./DeepseekAIService');
      const deepseek = new DeepseekAIService(process.env.DEEPSEEK_API_KEY as string);
      const content = evidenceMode ? `${prompt}\n\n证据模式：请基于提供的证据生成内容，不要臆造信息。` : prompt;
      result = await deepseek.generateText(content, { model: process.env.DEEPSEEK_VISION_MODEL || 'deepseek-vl' });
    } else {
      // 使用 Gemini 作为默认
      result = await aiExecutor.enqueue(() => 
        aiExecutor.execute({ 
          provider: 'gemini', 
          prompt: evidenceMode ? `${prompt}\n\n证据模式：请基于提供的证据生成内容，不要臆造信息。` : prompt, 
          useSearch: !!needs.search 
        })
      );
    }

    // 如果有 schema，尝试解析 JSON
    if (schema) {
      try {
        const jsonData = JSON.parse(result);
        return {
          success: true,
          data: jsonData,
          modelUsed: { provider: 'gemini', model: modelId },
        };
      } catch (parseError) {
        // 尝试自动修复 JSON
        try {
          const fixedJson = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const jsonData = JSON.parse(fixedJson);
          return {
            success: true,
            data: jsonData,
            modelUsed: { provider: 'gemini', model: modelId },
          };
        } catch (fixError) {
          return {
            success: false,
            error: 'JSON 解析失败',
          };
        }
      }
    }

    return {
      success: true,
      data: result,
      modelUsed: { provider: 'gemini', model: modelId },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

// 保留原有函数以兼容现有代码
export async function callModelLegacy(prompt: string, needs: ModelNeeds, policy: CallPolicy, images?: string[]): Promise<string> {
  const modelId = await chooseModel(needs, policy.model)
  if (needs.videoGeneration) {
    // 视频生成不走当前文本执行器（后续接视频生成服务）
    throw new Error('视频生成暂未通过文本执行器提供，请使用视频生成服务入口')
  }

  // 若要求严格JSON，优先走具备JSON模式的provider（Gemini/OpenAI）
  if (policy.requireJsonMode) {
    if (needs.vision) {
      return aiExecutor.enqueue(() => aiExecutor.execute({ provider: 'gemini', prompt, useSearch: !!needs.search, images }))
    }
    if (process.env.OPENAI_API_KEY) {
      return aiExecutor.enqueue(() => aiExecutor.execute({ provider: 'openai', prompt, useSearch: !!needs.search }))
    }
    return aiExecutor.enqueue(() => aiExecutor.execute({ provider: 'gemini', prompt, useSearch: !!needs.search }))
  }

  // vision 任务优先豆包，其次回退 Gemini/DeepSeek
  if (needs.vision && process.env.DOUBAO_API_KEY) {
    // 走豆包视觉：通过文本接口携带图片URL/提示词（简化方案）
    const { default: DoubaoAIService } = await import('./DoubaoAIService')
    const doubao = new DoubaoAIService(process.env.DOUBAO_API_KEY as string)
    // 优先使用模型ID，其次使用模型名，最后默认回退
    const model = process.env.DOUBAO_VISION_MODEL_ID || process.env.DOUBAO_VISION_MODEL || 'doubao-seed-1-6-vision-250815'
    try { console.log('[AI] Vision provider=doubao model=', model) } catch {}
    const text = await doubao.generateVision(prompt, images || [], { model })
    return text
  }
  // 次优先：DeepSeek 视觉，如果配置了Key
  if (needs.vision && process.env.DEEPSEEK_API_KEY) {
    const { default: DeepseekAIService } = await import('./DeepseekAIService')
    const deepseek = new DeepseekAIService(process.env.DEEPSEEK_API_KEY as string)
    const imageLines2 = (images || []).map(u => `证据图片：${u}`).join('\n')
    const content2 = `${prompt}\n\n${imageLines2}`
    const text2 = await deepseek.generateText(content2, { model: process.env.DEEPSEEK_VISION_MODEL || 'deepseek-vl' })
    return text2
  }
  const exec = () => aiExecutor.enqueue(() => aiExecutor.execute({ provider: 'gemini', prompt, useSearch: !!needs.search, images: needs.vision ? images : undefined }))
  if (policy.idempotencyKey) {
    const key = `${modelId}:${policy.idempotencyKey}`
    if (singleFlight.has(key)) return singleFlight.get(key) as Promise<string>
    const p = exec().finally(() => singleFlight.delete(key))
    singleFlight.set(key, p)
    return p
  }
  return exec()
}


