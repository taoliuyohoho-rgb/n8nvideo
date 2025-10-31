import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

/**
 * 竞品URL抓取API
 * 抓取给定URL的页面内容，提取标题、描述、关键信息和图片
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: '缺少有效的URL参数' },
        { status: 400 }
      )
    }

    // 验证URL格式
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'URL格式不正确' },
        { status: 400 }
      )
    }

    // 抓取页面
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(10000) // 10秒超时
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `无法访问该链接 (HTTP ${response.status})` },
        { status: 502 }
      )
    }

    const html = await response.text()

    // 提取标题
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : ''

    // 提取meta描述
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    const description = descMatch ? descMatch[1].trim() : ''

    // 提取关键信息（简化版，提取前500字符的文本内容）
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    let keyInfo = ''
    if (bodyMatch) {
      // 移除script和style标签
      const bodyContent = bodyMatch[1]
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ') // 移除所有HTML标签
        .replace(/\s+/g, ' ') // 合并空白
        .trim()
      
      keyInfo = bodyContent.substring(0, 500)
    }

    // 提取图片URL（最多5张）
    const imgMatches = html.matchAll(/<img[^>]*src=["']([^"']+)["']/gi)
    const images: string[] = []
    for (const match of Array.from(imgMatches)) {
      if (images.length >= 5) break
      
      let imgUrl = match[1]
      // 处理相对路径
      if (imgUrl.startsWith('//')) {
        imgUrl = parsedUrl.protocol + imgUrl
      } else if (imgUrl.startsWith('/')) {
        imgUrl = `${parsedUrl.protocol}//${parsedUrl.host}${imgUrl}`
      } else if (!imgUrl.startsWith('http')) {
        continue // 跳过无效的相对路径
      }
      
      // 过滤掉小图标和跟踪像素
      if (imgUrl.includes('icon') || imgUrl.includes('logo') || imgUrl.includes('pixel')) {
        continue
      }
      
      images.push(imgUrl)
    }

    return NextResponse.json({
      success: true,
      data: {
        title,
        description,
        keyInfo,
        images
      }
    })

  } catch (error: any) {
    console.error('URL抓取失败:', error)
    
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return NextResponse.json(
        { success: false, error: '请求超时，请检查网络连接' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || '抓取失败' },
      { status: 500 }
    )
  }
}

