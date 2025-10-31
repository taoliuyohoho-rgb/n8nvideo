import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { aiExecutor } from '@/src/services/ai/AiExecutor'

// Coerce analysis JSON
function coerceVideoAnalysis(text: string) {
  try {
    let jsonCandidate = text
    const m = text.match(/```(?:json)?\n([\s\S]*?)\n```/i)
    if (m && m[1]) jsonCandidate = m[1]
    const obj = JSON.parse(jsonCandidate)
    return {
      brief: (obj.brief || obj.summary || '').toString().trim().slice(0, 200),
      keyScenes: Array.isArray(obj.keyScenes) ? obj.keyScenes : [],
      actions: Array.isArray(obj.actions) ? obj.actions : [],
      sellingPoints: Array.isArray(obj.sellingPoints) ? obj.sellingPoints : []
    }
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, images = [], prompt } = await request.json()
    if (!videoUrl && (!images || images.length === 0)) {
      return NextResponse.json({ success: false, error: '请提供视频URL或图片' }, { status: 400 })
    }

    const defaultPrompt = `你是视频分析助手。请根据提供的视频/图片进行理解，输出JSON：
{
  "brief": "一句话总结",
  "keyScenes": ["关键镜头1","关键镜头2"],
  "actions": ["核心动作/节奏"],
  "sellingPoints": ["可转化为卖点的信息"]
}
只输出JSON，勿添加其他说明。`

    const text = await aiExecutor.enqueue(() => aiExecutor.execute({
      provider: 'gemini',
      prompt: prompt || defaultPrompt + `\n视频: ${videoUrl || ''}`,
      useSearch: false,
      images: Array.isArray(images) ? images : []
    }))

    const parsed = coerceVideoAnalysis(text)
    if (!parsed) {
      return NextResponse.json({ success: false, error: 'AI未返回有效分析结果' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: parsed })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '分析失败' }, { status: 500 })
  }
}


