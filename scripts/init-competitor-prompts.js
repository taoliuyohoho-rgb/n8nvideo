const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('初始化竞品分析Prompt模板...')

  // 默认竞品分析Prompt
  const defaultPrompt = await prisma.promptTemplate.upsert({
    where: {
      id: 'competitor-analysis-default-v1'
    },
    update: {},
    create: {
      id: 'competitor-analysis-default-v1',
      name: '竞品分析-标准模板',
      businessModule: 'competitor-analysis',
      content: `你正在为以下商品进行竞品分析：

**商品信息：**
- 商品名称：{{productName}}
- 商品类目：{{productCategory}}{{#if productSubcategory}} / {{productSubcategory}}{{/if}}

**任务：** 请分析竞品信息，结合商品名称和类目，提取与该商品相关的关键信息：

1. 卖点（产品特性、优势、功能、材质、技术、设计等）- 必须
2. 痛点（用户问题、困扰、需求、缺点等）- 必须
3. 目标受众（用户画像、年龄段、职业、兴趣等）- 可选
4. 其他（使用场景、适用人群、注意事项等）- 可选

**要求：**
- 每个卖点/痛点必须与"{{productName}}"和"{{productCategory}}"类目相关
- 每个卖点/痛点独立成句，简洁明确（5-20字）
- 卖点至少提取{{minSellingPoints}}个，最多{{maxSellingPoints}}个
- 痛点至少提取{{minPainPoints}}个，最多{{maxPainPoints}}个
- 目标受众简洁描述（10-30字）
- 其他信息提炼重点（每条10-30字，最多{{maxOther}}条）
- 如果输入信息与商品不相关，返回空数组
- 以JSON格式返回：
{
  "sellingPoints": ["卖点1", "卖点2", ...],
  "painPoints": ["痛点1", "痛点2", ...],
  "targetAudience": "目标受众描述",
  "other": ["其他信息1", "其他信息2", ...]
}

{{#if text}}
**竞品文本：**
{{text}}
{{/if}}

{{#if hasImages}}
**包含 {{imageCount}} 张商品图片，请结合图片分析。**
{{/if}}

请直接返回JSON，不要有其他说明文字。`,
      variables: JSON.stringify({
        minSellingPoints: 3,
        maxSellingPoints: 10,
        minPainPoints: 1,
        maxPainPoints: 5,
        maxOther: 3
      }),
      description: '标准竞品分析模板，适用于大多数商品类目',
      performance: 0.85,
      successRate: 0.90,
      usageCount: 0,
      isActive: true,
      isDefault: true,
      createdBy: 'system'
    }
  })

  console.log('✅ 创建默认竞品分析Prompt:', defaultPrompt.id)

  // 简洁版Prompt（快速分析）
  const simplePrompt = await prisma.promptTemplate.upsert({
    where: {
      id: 'competitor-analysis-simple-v1'
    },
    update: {},
    create: {
      id: 'competitor-analysis-simple-v1',
      name: '竞品分析-快速版',
      businessModule: 'competitor-analysis',
      content: `你正在为"{{productName}}"（类目：{{productCategory}}）进行竞品分析。

**任务：** 提取与该商品相关的卖点和痛点
- 卖点（3-5个，每个5-15字）：产品特性、优势、功能等
- 痛点（1-3个，每个5-15字）：用户问题、需求等

**要求：**
- 必须与"{{productName}}"和"{{productCategory}}"类目相关
- 如果信息不相关，返回空数组

**竞品信息：**
{{text}}

{{#if hasImages}}（包含{{imageCount}}张图片）{{/if}}

**返回格式：** {"sellingPoints":["..."],"painPoints":["..."]}`,
      variables: JSON.stringify({
        minSellingPoints: 3,
        maxSellingPoints: 5,
        minPainPoints: 1,
        maxPainPoints: 3
      }),
      description: '简洁快速的竞品分析模板，适合简单商品',
      performance: 0.80,
      successRate: 0.88,
      usageCount: 0,
      isActive: true,
      isDefault: false,
      createdBy: 'system'
    }
  })

  console.log('✅ 创建快速竞品分析Prompt:', simplePrompt.id)

  console.log('\n✅ 竞品分析Prompt模板初始化完成！')
  console.log(`默认模板: ${defaultPrompt.name}`)
  console.log(`快速模板: ${simplePrompt.name}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ 初始化失败:', e)
    await prisma.$disconnect()
    process.exit(1)
  })

