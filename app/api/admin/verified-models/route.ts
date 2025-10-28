import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const VERIFIED_MODELS_FILE = path.join(process.cwd(), 'verified-models.json')

// 保存已验证的模型状态
export async function POST(request: NextRequest) {
  try {
    const { models } = await request.json()

    if (!models || !Array.isArray(models)) {
      return NextResponse.json(
        { success: false, message: '无效的模型数据' },
        { status: 400 }
      )
    }

    // 校验：若要标记为 verified，则必须具备对应 Provider 的密钥
    const hasKey = (provider: string) => {
      const p = provider.toLowerCase()
      if (p.includes('google')) return !!process.env.GEMINI_API_KEY
      if (p.includes('openai')) return !!process.env.OPENAI_API_KEY
      if (p.includes('anthropic') || p.includes('claude')) return !!process.env.ANTHROPIC_API_KEY
      if (p.includes('deepseek')) return !!process.env.DEEPSEEK_API_KEY
      if (p.includes('字节') || p.includes('doubao') || p.includes('volc') || p.includes('byte')) return !!process.env.DOUBAO_API_KEY
      return false
    }

    for (const m of models) {
      const wantsVerified = m?.verified === true || m?.status === 'verified'
      if (wantsVerified && !hasKey(String(m.provider || ''))) {
        return NextResponse.json(
          { success: false, message: `Provider ${m.provider} 未配置密钥，不能标记为已验证` },
          { status: 400 }
        )
      }
    }

    // 保存到文件
    fs.writeFileSync(VERIFIED_MODELS_FILE, JSON.stringify(models, null, 2))
    console.log('已验证的模型状态已保存到文件:', VERIFIED_MODELS_FILE)
    console.log('已验证的模型:', models.filter(m => m.status === 'verified').map(m => m.name))

    return NextResponse.json({
      success: true,
      message: '已验证的模型状态保存成功'
    })
  } catch (error: any) {
    console.error('保存已验证的模型状态失败:', error)
    return NextResponse.json(
      { success: false, message: `保存失败: ${error.message}` },
      { status: 500 }
    )
  }
}

// 获取已验证的模型状态
export async function GET(request: NextRequest) {
  try {
    if (fs.existsSync(VERIFIED_MODELS_FILE)) {
      const data = fs.readFileSync(VERIFIED_MODELS_FILE, 'utf8')
      const models = JSON.parse(data)

      // 动态同步：根据环境变量自动校正 verified/status
      const hasKey = (provider: string) => {
        const p = provider.toLowerCase()
        if (p.includes('google')) return !!process.env.GEMINI_API_KEY
        if (p.includes('openai')) return !!process.env.OPENAI_API_KEY
        if (p.includes('anthropic') || p.includes('claude')) return !!process.env.ANTHROPIC_API_KEY
        if (p.includes('deepseek')) return !!process.env.DEEPSEEK_API_KEY
        if (p.includes('字节') || p.includes('doubao') || p.includes('volc') || p.includes('byte')) return !!process.env.DOUBAO_API_KEY
        return false
      }

      const synced = Array.isArray(models)
        ? models.map((m: any) => {
            const ok = hasKey(String(m.provider || ''))
            return {
              ...m,
              verified: ok,
              status: ok ? 'verified' : 'unverified'
            }
          })
        : models

      // 若与文件内容不一致，则落盘，保持文件与环境同步
      try {
        const original = JSON.stringify(models)
        const current = JSON.stringify(synced)
        if (original !== current) {
          fs.writeFileSync(VERIFIED_MODELS_FILE, JSON.stringify(synced, null, 2))
        }
      } catch {}
      
      return NextResponse.json({
        success: true,
        data: synced
      })
    } else {
      // 返回默认模型列表
      const defaultModels = [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', verified: false, status: 'unverified' },
        { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', verified: false, status: 'unverified' },
        { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', verified: false, status: 'unverified' },
        { id: 'doubao-seed-1-6-lite', name: '豆包 Seed 1.6 Lite', provider: '字节跳动', verified: false, status: 'unverified' },
        { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek', verified: false, status: 'unverified' }
      ]
      
      return NextResponse.json({
        success: true,
        data: defaultModels
      })
    }
  } catch (error: any) {
    console.error('获取已验证的模型状态失败:', error)
    return NextResponse.json(
      { success: false, message: `获取失败: ${error.message}` },
      { status: 500 }
    )
  }
}

