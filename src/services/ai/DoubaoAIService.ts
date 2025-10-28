// 豆包AI服务类
export class DoubaoAIService {
  private apiKey: string
  private baseUrl: string = 'https://ark.cn-beijing.volces.com/api/v3'
  private defaultModel: string = 'doubao-seed-1-6-lite-251015'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  // 生成文本内容
  async generateText(prompt: string, options: {
    model?: string
    maxTokens?: number
    temperature?: number
  } = {}): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: options.model || this.defaultModel,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: options.maxTokens || 2000,
          temperature: options.temperature || 0.7
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`豆包API调用失败: ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content || '豆包返回空内容'

    } catch (error) {
      console.error('豆包AI服务错误:', error)
      throw error
    }
  }

  // 视觉理解：按照方舟 OpenAI-兼容的 chat/completions，多模态 content 数组
  async generateVision(prompt: string, images: string[], options: {
    model?: string
    maxTokens?: number
    temperature?: number
  } = {}): Promise<string> {
    const parts: any[] = [{ type: 'text', text: prompt }]
    for (const img of images || []) {
      // 仅在是URL时使用image_url；dataURL在部分环境不支持，仍尝试传递
      if (img.startsWith('data:')) {
        parts.push({ type: 'image_url', image_url: { url: img } })
      } else {
        parts.push({ type: 'image_url', image_url: { url: img } })
      }
    }

    const body = {
      model: options.model || this.defaultModel,
      messages: [
        {
          role: 'user',
          content: parts
        }
      ],
      max_tokens: options.maxTokens || 1500,
      temperature: options.temperature ?? 0.2
    }

    const resp = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    })
    if (!resp.ok) {
      const t = await resp.text().catch(() => '')
      throw new Error(`豆包API调用失败: ${t}`)
    }
    const json = await resp.json()
    return json?.choices?.[0]?.message?.content || ''
  }

  // 生成视频脚本
  async generateVideoScript(productInfo: {
    name: string
    category: string
    sellingPoints: string[]
    targetAudience: string
    targetCountry: string
  }): Promise<string> {
    const prompt = `请为以下产品生成一个吸引人的视频脚本：

产品名称：${productInfo.name}
产品类别：${productInfo.category}
卖点：${productInfo.sellingPoints.join(', ')}
目标受众：${productInfo.targetAudience}
目标国家：${productInfo.targetCountry}

请生成一个30秒的视频脚本，包含：
1. 开头吸引注意力的hook
2. 产品介绍和卖点展示
3. 行动号召

脚本要符合${productInfo.targetCountry}的营销习惯和语言风格。`

    return await this.generateText(prompt, {
      maxTokens: 1500,
      temperature: 0.8
    })
  }

  // 生成营销文案
  async generateMarketingCopy(productInfo: {
    name: string
    description: string
    targetAudience: string
    platform: string
  }): Promise<string> {
    const prompt = `请为以下产品生成${productInfo.platform}平台的营销文案：

产品名称：${productInfo.name}
产品描述：${productInfo.description}
目标受众：${productInfo.targetAudience}
发布平台：${productInfo.platform}

请生成：
1. 吸引人的标题
2. 产品介绍文案
3. 行动号召

文案要符合${productInfo.platform}平台的特点和用户习惯。`

    return await this.generateText(prompt, {
      maxTokens: 1000,
      temperature: 0.7
    })
  }

  // 分析用户痛点
  async analyzePainPoints(comments: string[]): Promise<{
    painPoints: string[]
    severity: 'low' | 'medium' | 'high'
    recommendations: string[]
  }> {
    const prompt = `请分析以下用户评论中的痛点：

${comments.join('\n')}

请提供：
1. 主要痛点列表
2. 痛点严重程度评估（low/medium/high）
3. 改进建议

请用JSON格式返回结果。`

    const result = await this.generateText(prompt, {
      maxTokens: 1500,
      temperature: 0.5
    })

    try {
      return JSON.parse(result)
    } catch {
      // 如果解析失败，返回默认结构
      return {
        painPoints: ['解析失败，请手动分析'],
        severity: 'medium' as const,
        recommendations: ['请检查评论内容格式']
      }
    }
  }

  // 测试连接
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.generateText('你好，请回复"连接成功"', {
        maxTokens: 10,
        temperature: 0.1
      })
      return result.includes('连接成功')
    } catch {
      return false
    }
  }
}

// 导出默认实例
export default DoubaoAIService
