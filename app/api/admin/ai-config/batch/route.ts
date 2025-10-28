import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const CONFIG_FILE = path.join(process.cwd(), 'ai-config.json')

function loadAIConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('加载AI配置文件失败:', error)
  }
  return {
    videoScriptGeneration: 'gemini-2.5-flash',
    promptGeneration: 'gemini-2.5-flash',
    videoRanking: 'gemini-2.5-flash',
    productAnalysis: 'gemini-2.5-flash',
    videoAnalysis: 'gemini-2.5-flash',
    providers: {},
    videoGeneration: {
      provider: '',
      modelName: '',
      baseUrl: '',
      defaults: {
        aspectRatio: '9:16',
        fps: 30,
        webhookUrl: ''
      }
    }
  }
}

function saveAIConfig(config: any) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
    console.log('AI配置已保存到文件:', CONFIG_FILE)
  } catch (error) {
    console.error('保存AI配置文件失败:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { configs } = await request.json()

    if (!configs) {
      return NextResponse.json({ success: false, message: '配置数据不能为空' }, { status: 400 })
    }

    const current = loadAIConfig()
    const merged = { ...current, ...configs }

    // 持久化保存
    saveAIConfig(merged)

    console.log('批量保存AI配置:', merged)

    return NextResponse.json({
      success: true,
      message: '所有业务模块AI配置保存成功',
      data: merged
    })
  } catch (error: any) {
    console.error('批量保存AI配置失败:', error)
    return NextResponse.json(
      { success: false, message: `批量保存失败: ${error.message}` },
      { status: 500 }
    )
  }
}
