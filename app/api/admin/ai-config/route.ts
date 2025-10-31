import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
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
  
  // 默认配置
  return {
    videoScriptGeneration: 'gemini-2.5-flash',
    promptGeneration: 'gemini-2.5-flash',
    videoRanking: 'gemini-2.5-flash',
    productAnalysis: 'gemini-2.5-flash',
    videoAnalysis: 'gemini-2.5-flash',
    providers: {},
    // 新增：视频生成配置（模块化，支持不同供应商）
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

function getAIConfig() {
  return loadAIConfig()
}

function setAIConfig(config: any) {
  const currentConfig = loadAIConfig()
  const newConfig = { ...currentConfig, ...config }
  saveAIConfig(newConfig)
  console.log('AI配置已更新:', newConfig)
  return newConfig
}

// 获取AI配置
export async function GET(request: NextRequest) {
  try {
    // 从内存存储获取配置
    const config = getAIConfig()
    
    return NextResponse.json({
      success: true,
      data: config
    })
  } catch (error) {
    console.error('获取AI配置失败:', error)
    return NextResponse.json(
      { success: false, error: '获取AI配置失败' },
      { status: 500 }
    )
  }
}

// 保存AI配置
export async function POST(request: NextRequest) {
  try {
    const config = await request.json()

    // 保存配置到内存存储
    const savedConfig = setAIConfig(config)
    console.log('保存AI配置:', savedConfig)

    return NextResponse.json({
      success: true,
      message: 'AI配置保存成功',
      data: savedConfig
    })
  } catch (error) {
    console.error('保存AI配置失败:', error)
    return NextResponse.json(
      { success: false, error: '保存AI配置失败' },
      { status: 500 }
    )
  }
}
