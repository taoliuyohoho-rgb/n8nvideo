/**
 * 人设商品自动匹配服务
 * 基于规则匹配，根据人设特征自动推荐适合的商品和类目
 */

import { PrismaClient, Persona, Product } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 职业关键词映射表
 */
const OCCUPATION_RULES: Record<string, { categories: string[]; keywords: string[] }> = {
  // 烹饪相关
  '厨师|美食博主|厨|烹饪': {
    categories: ['厨具', '3C', '家庭日用'],
    keywords: ['电磁炉', '电炖锅', '锅', '炉', '厨房', '烹饪']
  },
  // 妈妈/家庭
  '妈妈|主妇|家庭': {
    categories: ['家庭日用', '厨具', '个护', '3C'],
    keywords: ['锅', '湿巾', '洗液', '安全', '实用', '家庭']
  },
  // 学生（优先便携类）
  '学生|大学生': {
    categories: ['家庭日用', '图书文具', '个护'],
    keywords: ['水杯', '便携', '实用', '性价比', '文具']
  },
  // 职场女性（优先美妆个护）
  '白领.*女|经理.*女|分析师.*女': {
    categories: ['美妆', '个护', '家庭日用'],
    keywords: ['精致', '品质', '护肤', '美妆', '高效']
  },
  // 职场男性（优先3C）
  '白领.*男|经理.*男|工程师|程序员|设计师': {
    categories: ['3C', '家庭日用'],
    keywords: ['水杯', '风扇', '高效', '品质', '智能']
  },
  // 运动健身
  '教练|健身|运动': {
    categories: ['家庭日用', '大健康'],
    keywords: ['水杯', '按摩', '健康', '运动', '保健']
  },
  // 退休老人
  '退休|老师': {
    categories: ['家庭日用', '大健康', '图书文具'],
    keywords: ['简单', '易用', '安全', '健康', '保健']
  },
  // 博主/时尚/美妆
  '博主|时尚|美妆|摄影': {
    categories: ['美妆', '个护', '家庭日用'],
    keywords: ['精致', '颜值', '时尚', '美', '护肤', '美妆']
  },
  // 会计/财务（女性居多）
  '会计|财务': {
    categories: ['个护', '美妆', '家庭日用'],
    keywords: ['实用', '品质', '安全']
  }
}

/**
 * 爱好关键词映射表
 */
const HOBBY_RULES: Record<string, { categories: string[]; keywords: string[] }> = {
  '烹饪|做饭|厨房|美食': {
    categories: ['3C', '厨具'],
    keywords: ['电磁炉', '电炖锅', '锅', '炉', '厨房']
  },
  '健身|运动|跑步|瑜伽': {
    categories: ['家庭日用', '大健康'],
    keywords: ['水杯', '按摩', '运动', '健康']
  },
  '美妆|护肤|化妆': {
    categories: ['美妆', '个护'],
    keywords: ['护肤', '美妆', '洗面奶', '精华', '防晒']
  },
  '阅读|读书|学习': {
    categories: ['图书文具', '家庭日用'],
    keywords: ['图书', '文具', '水杯', '安静']
  },
  '游戏|动漫|科技': {
    categories: ['3C'],
    keywords: ['风扇', '便携', '智能']
  }
}

/**
 * 年龄段规则
 */
const AGE_RULES = [
  {
    range: [18, 25],
    categories: ['3C', '家庭日用', '图书文具'],
    keywords: ['性价比', '颜值', '便携', '时尚']
  },
  {
    range: [26, 35],
    categories: ['3C', '家庭日用', '美妆', '个护'],
    keywords: ['品质', '高效', '精致']
  },
  {
    range: [36, 50],
    categories: ['3C', '家庭日用', '厨具', '大健康'],
    keywords: ['实用', '耐用', '安全', '家庭']
  },
  {
    range: [51, 100],
    categories: ['3C', '家庭日用', '大健康', '图书文具'],
    keywords: ['简单', '易用', '安全', '健康', '大屏']
  }
]

/**
 * 价值观/需求关键词映射
 */
const VALUE_RULES: Record<string, { categories: string[]; keywords: string[] }> = {
  '性价比|便宜|实惠|省钱': {
    categories: ['3C', '家庭日用'],
    keywords: ['性价比', '实用', '耐用']
  },
  '品质|高端|奢侈|精致': {
    categories: ['美妆', '个护', '3C'],
    keywords: ['品质', '高端', '精致']
  },
  '健康|养生|保健': {
    categories: ['大健康', '个护', '家庭日用'],
    keywords: ['健康', '安全', '天然', '按摩', '生发']
  },
  '美|颜值|时尚|潮流': {
    categories: ['美妆', '个护', '家庭日用'],
    keywords: ['美妆', '护肤', '精致', '颜值']
  },
  '便利|方便|快捷|效率': {
    categories: ['3C', '家庭日用'],
    keywords: ['便携', '快速', '智能', '高效']
  }
}

/**
 * 提取人设关键词
 */
function extractPersonaKeywords(persona: Persona): {
  categories: Set<string>
  keywords: Set<string>
} {
  const categories = new Set<string>()
  const keywords = new Set<string>()

  try {
    // 1. 从职业提取
    const occupation = (persona.coreIdentity as any)?.occupation || ''
    for (const [pattern, rule] of Object.entries(OCCUPATION_RULES)) {
      const regex = new RegExp(pattern, 'i')
      if (regex.test(occupation)) {
        rule.categories.forEach(c => categories.add(c))
        rule.keywords.forEach(k => keywords.add(k))
      }
    }

    // 2. 从爱好提取
    const hobbies = (persona.context as any)?.hobbies || ''
    for (const [pattern, rule] of Object.entries(HOBBY_RULES)) {
      const regex = new RegExp(pattern, 'i')
      if (regex.test(hobbies)) {
        rule.categories.forEach(c => categories.add(c))
        rule.keywords.forEach(k => keywords.add(k))
      }
    }

    // 3. 从价值观提取
    const values = (persona.context as any)?.values || ''
    const frustrations = (persona.context as any)?.frustrations || ''
    const combinedValues = `${values} ${frustrations}`
    for (const [pattern, rule] of Object.entries(VALUE_RULES)) {
      const regex = new RegExp(pattern, 'i')
      if (regex.test(combinedValues)) {
        rule.categories.forEach(c => categories.add(c))
        rule.keywords.forEach(k => keywords.add(k))
      }
    }

    // 4. 从年龄提取
    const age = (persona.coreIdentity as any)?.age || 30
    for (const rule of AGE_RULES) {
      if (age >= rule.range[0] && age <= rule.range[1]) {
        rule.categories.forEach(c => categories.add(c))
        rule.keywords.forEach(k => keywords.add(k))
        break
      }
    }

    // 5. 从性别提取额外关键词
    const gender = (persona.coreIdentity as any)?.gender || ''
    if (gender === '女') {
      keywords.add('美妆')
      keywords.add('护肤')
      categories.add('美妆')
      categories.add('个护')
    }

  } catch (error) {
    console.error('[personaProductMatcher] 提取关键词失败:', error)
  }

  return { categories, keywords }
}

/**
 * 性别-类目适配规则
 * 用于调整不同性别对不同类目的倾向性
 */
const GENDER_CATEGORY_AFFINITY: Record<string, Record<string, number>> = {
  '女': {
    '美妆': 50,        // 女性对美妆高度偏好
    '个护': 40,        // 女性对个护高度偏好
    '家庭日用': 20,    // 女性对家庭日用有偏好
    '厨具': 15,        // 女性对厨具有一定偏好
    '大健康': 10,      // 女性对健康有一定偏好
    '3C': -20,         // 女性对3C偏好降低（除非职业相关）
    '图书文具': 5
  },
  '男': {
    '3C': 30,          // 男性对3C有偏好
    '大健康': 10,      // 男性对健康有一定偏好
    '家庭日用': 5,     // 男性对家庭日用偏好较低
    '厨具': 0,         // 男性对厨具中性
    '美妆': -30,       // 男性对美妆偏好很低
    '个护': -20,       // 男性对个护偏好降低
    '图书文具': 5
  }
}

/**
 * 职业-类目强关联
 * 职业强相关时，可以覆盖性别偏好
 */
const OCCUPATION_STRONG_AFFINITY: Record<string, string[]> = {
  '厨师|美食博主|烹饪': ['3C', '厨具', '家庭日用'],
  '程序员|工程师|IT|科技': ['3C'],
  '博主|时尚|美妆': ['美妆', '个护', '家庭日用'],
  '健身教练|运动': ['家庭日用', '大健康'],
  '老师|教师|讲师': ['图书文具', '家庭日用', '3C']
}

/**
 * 计算商品与人设的相关性评分
 */
function calculateRelevanceScore(
  product: Product,
  persona: Persona,
  extractedCategories: Set<string>,
  extractedKeywords: Set<string>
): number {
  let score = 0
  const gender = (persona.coreIdentity as any)?.gender || ''
  const occupation = (persona.coreIdentity as any)?.occupation || ''

  // 1. 类目匹配（基础分: 40分）
  if (extractedCategories.has(product.category)) {
    score += 40
  }

  // 2. 性别-类目适配性调整（-30 ~ +50分）
  if (gender && GENDER_CATEGORY_AFFINITY[gender]) {
    const affinityScore = GENDER_CATEGORY_AFFINITY[gender][product.category] || 0
    
    // 检查是否职业强相关，如果是则减弱性别负面影响
    let hasStrongOccupationAffinity = false
    for (const [pattern, categories] of Object.entries(OCCUPATION_STRONG_AFFINITY)) {
      const regex = new RegExp(pattern, 'i')
      if (regex.test(occupation) && categories.includes(product.category)) {
        hasStrongOccupationAffinity = true
        break
      }
    }
    
    // 如果职业强相关，负面影响减半
    if (hasStrongOccupationAffinity && affinityScore < 0) {
      score += affinityScore * 0.5
    } else {
      score += affinityScore
    }
  }

  // 3. 子类目匹配（25分）
  if (product.subcategory && extractedKeywords.has(product.subcategory)) {
    score += 25
  }

  // 4. 商品名称关键词匹配（每个关键词 15分，最多45分）
  let nameMatchCount = 0
  for (const keyword of extractedKeywords) {
    if (product.name.includes(keyword)) {
      nameMatchCount++
      score += 15
    }
  }
  if (nameMatchCount > 0) {
    score = Math.min(score, score) // 不设上限，越多越好
  }

  // 5. 商品描述关键词匹配（每个关键词 8分，最多24分）
  if (product.description) {
    let descMatchCount = 0
    for (const keyword of extractedKeywords) {
      if (product.description.includes(keyword)) {
        descMatchCount++
        score += 8
      }
    }
  }

  // 6. 目标国家匹配（10分）
  const targetCountries = (persona.generatedContent as any)?.targetCountries || []
  if (product.country && Array.isArray(product.country)) {
    const hasCountryMatch = targetCountries.some((tc: string) => 
      product.country.includes(tc)
    )
    if (hasCountryMatch) {
      score += 10
    }
  }

  // 7. 惩罚：如果类目不在提取的类目中，大幅降分
  if (!extractedCategories.has(product.category)) {
    score -= 30
  }

  return Math.max(0, score) // 确保评分不为负数
}

/**
 * 基于规则匹配商品
 */
export async function matchProductsByRules(
  persona: Persona
): Promise<{ product: Product; score: number }[]> {
  console.log(`[personaProductMatcher] 开始为人设 "${persona.name}" 匹配商品...`)

  // 1. 提取关键词和类目
  const { categories, keywords } = extractPersonaKeywords(persona)
  console.log(`[personaProductMatcher] 提取的类目:`, Array.from(categories))
  console.log(`[personaProductMatcher] 提取的关键词:`, Array.from(keywords))

  // 2. 构建查询条件（OR 关系）
  const whereConditions: any[] = []

  // 类目匹配
  if (categories.size > 0) {
    whereConditions.push({
      category: {
        in: Array.from(categories)
      }
    })
  }

  // 关键词匹配（商品名称或描述）
  if (keywords.size > 0) {
    const keywordArray = Array.from(keywords)
    whereConditions.push({
      OR: keywordArray.map(keyword => ({
        OR: [
          { name: { contains: keyword } },
          { description: { contains: keyword } },
          { subcategory: { contains: keyword } }
        ]
      }))
    })
  }

  // 如果没有任何条件，返回空
  if (whereConditions.length === 0) {
    console.warn(`[personaProductMatcher] 未能提取有效匹配条件`)
    return []
  }

  // 3. 查询商品
  const products = await prisma.product.findMany({
    where: {
      OR: whereConditions
    },
    take: 50 // 限制数量，避免过多
  })

  console.log(`[personaProductMatcher] 查询到 ${products.length} 个候选商品`)

  // 4. 计算相关性评分
  const scoredProducts = products.map(product => ({
    product,
    score: calculateRelevanceScore(product, persona, categories, keywords)
  }))

  // 5. 按评分排序
  scoredProducts.sort((a, b) => b.score - a.score)

  console.log(`[personaProductMatcher] Top 5 匹配结果:`, 
    scoredProducts.slice(0, 5).map(sp => ({
      name: sp.product.name,
      category: sp.product.category,
      score: sp.score
    }))
  )

  return scoredProducts
}

/**
 * 自动匹配并更新人设的商品关联
 */
export async function autoMatchAndUpdatePersona(personaId: string): Promise<{
  success: boolean
  matchedCount: number
  topProduct?: Product
  error?: string
}> {
  try {
    // 1. 查询人设
    const persona = await prisma.persona.findUnique({
      where: { id: personaId }
    })

    if (!persona) {
      return { success: false, matchedCount: 0, error: '人设不存在' }
    }

    // 2. 匹配商品
    const matchedProducts = await matchProductsByRules(persona)

    if (matchedProducts.length === 0) {
      return { success: false, matchedCount: 0, error: '未找到匹配的商品' }
    }

    // 3. 取 Top 1 作为主商品
    const topProduct = matchedProducts[0].product

    // 4. 取 Top 5 保存到 generatedContent
    const top5Products = matchedProducts.slice(0, 5).map(sp => ({
      id: sp.product.id,
      name: sp.product.name,
      category: sp.product.category,
      subcategory: sp.product.subcategory,
      score: sp.score
    }))

    // 5. 查找类目ID
    const category = await prisma.category.findFirst({
      where: {
        name: topProduct.category
      }
    })

    if (!category) {
      console.warn(`[personaProductMatcher] 未找到类目: ${topProduct.category}`)
      return { success: false, matchedCount: 0, error: `未找到类目: ${topProduct.category}` }
    }

    // 6. 更新人设
    await prisma.persona.update({
      where: { id: personaId },
      data: {
        productId: topProduct.id,
        categoryId: category.id,
        generatedContent: {
          ...(persona.generatedContent as any),
          matchedProducts: top5Products,
          lastAutoMatchedAt: new Date().toISOString()
        }
      }
    })

    console.log(`[personaProductMatcher] ✅ 成功为人设 "${persona.name}" 匹配商品:`, {
      topProduct: topProduct.name,
      category: topProduct.category,
      matchedCount: matchedProducts.length
    })

    return {
      success: true,
      matchedCount: matchedProducts.length,
      topProduct
    }
  } catch (error) {
    console.error('[personaProductMatcher] 自动匹配失败:', error)
    return {
      success: false,
      matchedCount: 0,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

