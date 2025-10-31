import 'server-only'

export interface SearchResultItem {
  title: string
  url: string
  description: string
  images?: string[]
  publishedAt?: string
  source?: string
}

export interface SearchParams {
  query: string
  maxResults?: number
  language?: string
  region?: string
}

export class SearchService {
  static async search(params: SearchParams): Promise<SearchResultItem[]> {
    const provider = process.env.SEARCH_PROVIDER || 'tavily'
    if (provider === 'tavily') {
      return await this.tavilySearch(params)
    }
    // 默认返回空数组，绝不返回写死的模板
    return []
  }

  private static async tavilySearch(params: SearchParams): Promise<SearchResultItem[]> {
    const apiKey = process.env.TAVILY_API_KEY
    if (!apiKey) {
      return []
    }

    const body = {
      api_key: apiKey,
      query: params.query,
      search_depth: 'basic',
      include_answer: false,
      include_images: true,
      include_raw_content: false,
      max_results: Math.min(Math.max(params.maxResults ?? 6, 1), 10),
      // tavily 不直接支持 region/language 强约束，这里仅用于后续可扩展
    } as const

    try {
      const resp = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        // Tavily 使用 body 传 api_key，不写入日志
      })
      if (!resp.ok) {
        return []
      }
      const json = await resp.json().catch(() => null) as any
      const results = Array.isArray(json?.results) ? json.results : []
      return results.map((r: any) => ({
        title: String(r?.title || '').trim(),
        url: String(r?.url || '').trim(),
        description: String(r?.content || r?.snippet || '').trim(),
        images: Array.isArray(json?.images) ? json.images.slice(0, 3) : [],
        publishedAt: r?.published_date ? String(r.published_date) : undefined,
        source: r?.source || undefined,
      })).filter((x: SearchResultItem) => x.title && x.url)
    } catch {
      return []
    }
  }
}

export default SearchService


