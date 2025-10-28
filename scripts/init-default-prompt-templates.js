const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('初始化默认Prompt模板库...');

  const defaultTemplates = [
    // ========== 商品分析 (product-analysis) - 20个模板 (4种实例类型 × 5个模板) ==========
    
    // 文本实例类型 - 5个模板
    {
      name: '商品分析-文本-标准模板',
      businessModule: 'product-analysis',
      instanceType: 'text',
      content: `# 输入要求
请提供以下信息：
- 商品名称：{{productName}}
- 商品类目：{{productCategory}}{{#if productSubcategory}} / {{productSubcategory}}{{/if}}
- 商品描述：{{productDescription}}
- 目标市场：{{targetMarket}}
- 竞品内容（可选）：{{competitorContent}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "sellingPoints": ["卖点1", "卖点2", "卖点3", "卖点4", "卖点5"],
  "painPoints": ["痛点1", "痛点2", "痛点3", "痛点4", "痛点5"],
  "targetAudience": "目标受众描述"
}

输出规范：
- 卖点：最多5个，每个8-12字，突出产品优势
- 痛点：最多5个，每个8-12字，挖掘用户困扰
- 目标受众：8-12字，精准定位用户群体
- 所有内容必须与商品名称和类目相关
- 如果输入信息不足或与商品不相关，返回空数组

# 输出规则
作为商品分析专家，你需要：
1. 深入分析商品特征和用户需求
2. 重点关注产品优势和用户痛点
3. 输出简洁明了，避免冗余
4. 确保每个卖点/痛点都有实际价值
5. 目标受众描述要精准且具体

{{#if hasImages}}
注意：包含 {{imageCount}} 张商品图片，请结合图片内容进行分析。
{{/if}}`,
      inputRequirements: '商品名称、类目、描述、目标市场、竞品内容（可选）',
      outputRequirements: 'JSON格式，卖点/痛点各8-12字最多5个，目标受众8-12字',
      outputRules: '作为商品分析专家，重点关注用户痛点和产品优势，输出简洁明了',
      isDefault: true,
      performance: 0.85,
      successRate: 0.90
    },
    {
      name: '商品分析-文本-快速模板',
      businessModule: 'product-analysis',
      instanceType: 'text',
      content: `# 输入要求
请提供以下信息：
- 商品名称：{{productName}}
- 商品类目：{{productCategory}}
- 商品描述：{{productDescription}}
- 目标市场：{{targetMarket}}
- 竞品内容（可选）：{{competitorContent}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "sellingPoints": ["卖点1", "卖点2", "卖点3"],
  "painPoints": ["痛点1", "痛点2"],
  "targetAudience": "目标受众描述"
}

输出规范：
- 卖点：3个，每个8-12字，突出核心优势
- 痛点：2个，每个8-12字，主要用户困扰
- 目标受众：8-12字，核心用户群体
- 快速提取，避免过度分析

# 输出规则
作为商品分析专家，你需要：
1. 快速识别核心特征
2. 提取最重要的卖点和痛点
3. 输出简洁直接，避免冗余
4. 确保内容与商品高度相关
5. 适合快速决策场景`,
      inputRequirements: '商品名称、类目、描述、目标市场、竞品内容（可选）',
      outputRequirements: 'JSON格式，卖点/痛点各8-12字最多5个，目标受众8-12字',
      outputRules: '作为商品分析专家，快速提取核心特征，输出简洁明了',
      isDefault: false,
      performance: 0.80,
      successRate: 0.88
    },
    {
      name: '商品分析-文本-深度模板',
      businessModule: 'product-analysis',
      instanceType: 'text',
      content: `# 输入要求
请提供以下信息：
- 商品名称：{{productName}}
- 商品类目：{{productCategory}}
- 商品描述：{{productDescription}}
- 目标市场：{{targetMarket}}
- 竞品内容（可选）：{{competitorContent}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "sellingPoints": ["卖点1", "卖点2", "卖点3", "卖点4", "卖点5"],
  "painPoints": ["痛点1", "痛点2", "痛点3", "痛点4", "痛点5"],
  "targetAudience": "目标受众描述"
}

输出规范：
- 卖点：5个，每个8-12字，突出差异化优势
- 痛点：5个，每个8-12字，深入挖掘用户困扰
- 目标受众：8-12字，精准定位用户群体
- 基于多维度分析：功能特性、用户体验、市场竞争、用户需求

# 输出规则
作为资深商品分析专家，你需要：
1. 深入分析商品的功能特性和用户体验
2. 从市场竞争角度挖掘差异化优势
3. 深入挖掘用户真实需求和潜在困扰
4. 输出专业且全面的分析结果
5. 确保每个卖点/痛点都有深度价值
6. 目标受众描述要精准且具有商业价值`,
      inputRequirements: '商品名称、类目、描述、目标市场、竞品内容（可选）',
      outputRequirements: 'JSON格式，卖点/痛点各8-12字最多5个，目标受众8-12字',
      outputRules: '作为资深商品分析专家，深入挖掘产品特征和用户需求，输出专业且全面',
      isDefault: false,
      performance: 0.90,
      successRate: 0.85
    },
    {
      name: '商品分析-文本-电商专用模板',
      businessModule: 'product-analysis',
      instanceType: 'text',
      content: `# 输入要求
请提供以下信息：
- 商品名称：{{productName}}
- 商品类目：{{productCategory}}
- 商品描述：{{productDescription}}
- 目标市场：{{targetMarket}}
- 竞品内容（可选）：{{competitorContent}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "sellingPoints": ["卖点1", "卖点2", "卖点3", "卖点4", "卖点5"],
  "painPoints": ["痛点1", "痛点2", "痛点3", "痛点4", "痛点5"],
  "targetAudience": "目标受众描述"
}

输出规范：
- 卖点：5个，每个8-12字，突出电商平台优势（价格、服务、品质）
- 痛点：5个，每个8-12字，关注购买和使用过程中的问题
- 目标受众：8-12字，基于电商用户特征
- 重点分析：价格竞争力、功能实用性、用户评价反馈、购买决策因素

# 输出规则
作为电商分析专家，你需要：
1. 专注电商平台特点和用户行为
2. 突出价格竞争力和服务优势
3. 关注购买决策和使用体验
4. 基于电商用户特征分析目标受众
5. 确保卖点/痛点符合电商场景
6. 输出要具有电商营销价值`,
      inputRequirements: '商品名称、类目、描述、目标市场、竞品内容（可选）',
      outputRequirements: 'JSON格式，卖点/痛点各8-12字最多5个，目标受众8-12字',
      outputRules: '作为电商分析专家，专注电商平台特点，突出价格和服务优势',
      isDefault: false,
      performance: 0.82,
      successRate: 0.87
    },
    {
      name: '商品分析-文本-B2B专用模板',
      businessModule: 'product-analysis',
      instanceType: 'text',
      content: `# 输入要求
请提供以下信息：
- 商品名称：{{productName}}
- 商品类目：{{productCategory}}
- 商品描述：{{productDescription}}
- 目标市场：{{targetMarket}}
- 竞品内容（可选）：{{competitorContent}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "sellingPoints": ["卖点1", "卖点2", "卖点3", "卖点4", "卖点5"],
  "painPoints": ["痛点1", "痛点2", "痛点3", "痛点4", "痛点5"],
  "targetAudience": "目标受众描述"
}

输出规范：
- 卖点：5个，每个8-12字，突出企业价值和效率提升
- 痛点：5个，每个8-12字，关注企业级应用中的问题
- 目标受众：8-12字，基于企业用户特征
- 重点分析：企业级功能、ROI和效率提升、集成和扩展性、安全性和稳定性

# 输出规则
作为B2B产品专家，你需要：
1. 专注企业级应用场景和需求
2. 突出企业价值和效率提升
3. 关注ROI和投资回报
4. 考虑集成性和扩展性
5. 重视安全性和稳定性
6. 确保卖点/痛点符合企业决策逻辑
7. 目标受众要精准定位企业用户`,
      inputRequirements: '商品名称、类目、描述、目标市场、竞品内容（可选）',
      outputRequirements: 'JSON格式，卖点/痛点各8-12字最多5个，目标受众8-12字',
      outputRules: '作为B2B产品专家，专注企业级应用，突出价值和效率',
      isDefault: false,
      performance: 0.88,
      successRate: 0.89
    },

    // 图片实例类型 - 5个模板
    {
      name: '商品分析-图片-标准模板',
      businessModule: 'product-analysis',
      instanceType: 'image',
      content: `# 输入要求
请提供以下信息：
- 商品名称：{{productName}}
- 商品类目：{{productCategory}}{{#if productSubcategory}} / {{productSubcategory}}{{/if}}
- 商品描述：{{productDescription}}
- 目标市场：{{targetMarket}}
- 商品图片：{{skuImages}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "sellingPoints": ["卖点1", "卖点2", "卖点3", "卖点4", "卖点5"],
  "painPoints": ["痛点1", "痛点2", "痛点3", "痛点4", "痛点5"],
  "targetAudience": "目标受众描述"
}

输出规范：
- 卖点：最多5个，每个8-12字，基于图片内容分析产品优势
- 痛点：最多5个，每个8-12字，基于图片内容分析用户困扰
- 目标受众：8-12字，基于图片风格和内容定位用户群体
- 所有内容必须与商品名称、类目和图片内容相关

# 输出规则
作为商品分析专家，你需要：
1. 深入分析商品图片的视觉特征和设计元素
2. 从图片中提取产品的外观、功能、品质信息
3. 重点关注图片展示的产品优势和用户价值
4. 输出简洁明了，避免冗余
5. 确保每个卖点/痛点都有实际价值
6. 目标受众描述要精准且具体`,
      inputRequirements: '商品名称、类目、描述、目标市场、商品图片',
      outputRequirements: 'JSON格式，卖点/痛点各8-12字最多5个，目标受众8-12字',
      outputRules: '作为商品分析专家，基于图片内容分析产品特征，输出简洁明了',
      isDefault: false,
      performance: 0.85,
      successRate: 0.90
    },
    {
      name: '商品分析-图片-快速模板',
      businessModule: 'product-analysis',
      instanceType: 'image',
      content: `# 输入要求
请提供以下信息：
- 商品名称：{{productName}}
- 商品类目：{{productCategory}}
- 商品描述：{{productDescription}}
- 目标市场：{{targetMarket}}
- 商品图片：{{skuImages}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "sellingPoints": ["卖点1", "卖点2", "卖点3"],
  "painPoints": ["痛点1", "痛点2"],
  "targetAudience": "目标受众描述"
}

输出规范：
- 卖点：3个，每个8-12字，基于图片快速识别核心优势
- 痛点：2个，每个8-12字，基于图片快速识别主要困扰
- 目标受众：8-12字，基于图片风格快速定位用户群体
- 快速提取，避免过度分析

# 输出规则
作为商品分析专家，你需要：
1. 快速识别图片中的核心特征
2. 提取最重要的卖点和痛点
3. 输出简洁直接，避免冗余
4. 确保内容与商品高度相关
5. 适合快速决策场景`,
      inputRequirements: '商品名称、类目、描述、目标市场、商品图片',
      outputRequirements: 'JSON格式，卖点/痛点各8-12字最多5个，目标受众8-12字',
      outputRules: '作为商品分析专家，基于图片快速提取核心特征，输出简洁明了',
      isDefault: false,
      performance: 0.80,
      successRate: 0.88
    },
    {
      name: '商品分析-图片-深度模板',
      businessModule: 'product-analysis',
      instanceType: 'image',
      content: `# 输入要求
请提供以下信息：
- 商品名称：{{productName}}
- 商品类目：{{productCategory}}
- 商品描述：{{productDescription}}
- 目标市场：{{targetMarket}}
- 商品图片：{{skuImages}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "sellingPoints": ["卖点1", "卖点2", "卖点3", "卖点4", "卖点5"],
  "painPoints": ["痛点1", "痛点2", "痛点3", "痛点4", "痛点5"],
  "targetAudience": "目标受众描述"
}

输出规范：
- 卖点：5个，每个8-12字，基于图片深入分析差异化优势
- 痛点：5个，每个8-12字，基于图片深入挖掘用户困扰
- 目标受众：8-12字，基于图片风格和内容精准定位用户群体
- 基于多维度分析：视觉设计、功能展示、用户体验、市场定位

# 输出规则
作为资深商品分析专家，你需要：
1. 深入分析商品图片的视觉设计和功能展示
2. 从图片中挖掘产品的差异化优势和独特价值
3. 深入分析图片传达的用户体验和情感价值
4. 输出专业且全面的分析结果
5. 确保每个卖点/痛点都有深度价值
6. 目标受众描述要精准且具有商业价值`,
      inputRequirements: '商品名称、类目、描述、目标市场、商品图片',
      outputRequirements: 'JSON格式，卖点/痛点各8-12字最多5个，目标受众8-12字',
      outputRules: '作为资深商品分析专家，基于图片深入挖掘产品特征和用户需求，输出专业且全面',
      isDefault: false,
      performance: 0.90,
      successRate: 0.85
    },
    {
      name: '商品分析-图片-电商专用模板',
      businessModule: 'product-analysis',
      instanceType: 'image',
      content: `# 输入要求
请提供以下信息：
- 商品名称：{{productName}}
- 商品类目：{{productCategory}}
- 商品描述：{{productDescription}}
- 目标市场：{{targetMarket}}
- 商品图片：{{skuImages}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "sellingPoints": ["卖点1", "卖点2", "卖点3", "卖点4", "卖点5"],
  "painPoints": ["痛点1", "痛点2", "痛点3", "痛点4", "痛点5"],
  "targetAudience": "目标受众描述"
}

输出规范：
- 卖点：5个，每个8-12字，基于图片突出电商平台优势（价格、服务、品质）
- 痛点：5个，每个8-12字，基于图片关注购买和使用过程中的问题
- 目标受众：8-12字，基于图片风格和内容分析电商用户特征
- 重点分析：价格竞争力、功能实用性、用户评价反馈、购买决策因素

# 输出规则
作为电商分析专家，你需要：
1. 专注电商平台特点和用户行为
2. 基于图片突出价格竞争力和服务优势
3. 关注购买决策和使用体验
4. 基于图片风格分析电商用户特征
5. 确保卖点/痛点符合电商场景
6. 输出要具有电商营销价值`,
      inputRequirements: '商品名称、类目、描述、目标市场、商品图片',
      outputRequirements: 'JSON格式，卖点/痛点各8-12字最多5个，目标受众8-12字',
      outputRules: '作为电商分析专家，基于图片专注电商平台特点，突出价格和服务优势',
      isDefault: false,
      performance: 0.82,
      successRate: 0.87
    },
    {
      name: '商品分析-图片-B2B专用模板',
      businessModule: 'product-analysis',
      instanceType: 'image',
      content: `# 输入要求
请提供以下信息：
- 商品名称：{{productName}}
- 商品类目：{{productCategory}}
- 商品描述：{{productDescription}}
- 目标市场：{{targetMarket}}
- 商品图片：{{skuImages}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "sellingPoints": ["卖点1", "卖点2", "卖点3", "卖点4", "卖点5"],
  "painPoints": ["痛点1", "痛点2", "痛点3", "痛点4", "痛点5"],
  "targetAudience": "目标受众描述"
}

输出规范：
- 卖点：5个，每个8-12字，基于图片突出企业价值和效率提升
- 痛点：5个，每个8-12字，基于图片关注企业级应用中的问题
- 目标受众：8-12字，基于图片风格和内容分析企业用户特征
- 重点分析：企业级功能、ROI和效率提升、集成和扩展性、安全性和稳定性

# 输出规则
作为B2B产品专家，你需要：
1. 专注企业级应用场景和需求
2. 基于图片突出企业价值和效率提升
3. 关注ROI和投资回报
4. 考虑集成性和扩展性
5. 重视安全性和稳定性
6. 确保卖点/痛点符合企业决策逻辑
7. 目标受众要精准定位企业用户`,
      inputRequirements: '商品名称、类目、描述、目标市场、商品图片',
      outputRequirements: 'JSON格式，卖点/痛点各8-12字最多5个，目标受众8-12字',
      outputRules: '作为B2B产品专家，基于图片专注企业级应用，突出价值和效率',
      isDefault: false,
      performance: 0.88,
      successRate: 0.89
    },

    // 视频实例类型 - 5个模板
    {
      name: '商品分析-视频-标准模板',
      businessModule: 'product-analysis',
      instanceType: 'video',
      content: `# 输入要求
请提供以下信息：
- 商品名称：{{productName}}
- 商品类目：{{productCategory}}{{#if productSubcategory}} / {{productSubcategory}}{{/if}}
- 商品描述：{{productDescription}}
- 目标市场：{{targetMarket}}
- 商品视频：{{videoContent}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "sellingPoints": ["卖点1", "卖点2", "卖点3", "卖点4", "卖点5"],
  "painPoints": ["痛点1", "痛点2", "痛点3", "痛点4", "痛点5"],
  "targetAudience": "目标受众描述"
}

输出规范：
- 卖点：最多5个，每个8-12字，基于视频内容分析产品优势
- 痛点：最多5个，每个8-12字，基于视频内容分析用户困扰
- 目标受众：8-12字，基于视频风格和内容定位用户群体
- 所有内容必须与商品名称、类目和视频内容相关

# 输出规则
作为商品分析专家，你需要：
1. 深入分析商品视频的展示内容和表达方式
2. 从视频中提取产品的功能、使用场景、用户体验信息
3. 重点关注视频展示的产品优势和用户价值
4. 输出简洁明了，避免冗余
5. 确保每个卖点/痛点都有实际价值
6. 目标受众描述要精准且具体`,
      inputRequirements: '商品名称、类目、描述、目标市场、商品视频',
      outputRequirements: 'JSON格式，卖点/痛点各8-12字最多5个，目标受众8-12字',
      outputRules: '作为商品分析专家，基于视频内容分析产品特征，输出简洁明了',
      isDefault: false,
      performance: 0.85,
      successRate: 0.90
    },
    {
      name: '商品分析-视频-快速模板',
      businessModule: 'product-analysis',
      instanceType: 'video',
      content: `# 输入要求
请提供以下信息：
- 商品名称：{{productName}}
- 商品类目：{{productCategory}}
- 商品描述：{{productDescription}}
- 目标市场：{{targetMarket}}
- 商品视频：{{videoContent}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "sellingPoints": ["卖点1", "卖点2", "卖点3"],
  "painPoints": ["痛点1", "痛点2"],
  "targetAudience": "目标受众描述"
}

输出规范：
- 卖点：3个，每个8-12字，基于视频快速识别核心优势
- 痛点：2个，每个8-12字，基于视频快速识别主要困扰
- 目标受众：8-12字，基于视频风格快速定位用户群体
- 快速提取，避免过度分析

# 输出规则
作为商品分析专家，你需要：
1. 快速识别视频中的核心特征
2. 提取最重要的卖点和痛点
3. 输出简洁直接，避免冗余
4. 确保内容与商品高度相关
5. 适合快速决策场景`,
      inputRequirements: '商品名称、类目、描述、目标市场、商品视频',
      outputRequirements: 'JSON格式，卖点/痛点各8-12字最多5个，目标受众8-12字',
      outputRules: '作为商品分析专家，基于视频快速提取核心特征，输出简洁明了',
      isDefault: false,
      performance: 0.80,
      successRate: 0.88
    },
    {
      name: '商品分析-视频-深度模板',
      businessModule: 'product-analysis',
      instanceType: 'video',
      content: `# 输入要求
请提供以下信息：
- 商品名称：{{productName}}
- 商品类目：{{productCategory}}
- 商品描述：{{productDescription}}
- 目标市场：{{targetMarket}}
- 商品视频：{{videoContent}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "sellingPoints": ["卖点1", "卖点2", "卖点3", "卖点4", "卖点5"],
  "painPoints": ["痛点1", "痛点2", "痛点3", "痛点4", "痛点5"],
  "targetAudience": "目标受众描述"
}

输出规范：
- 卖点：5个，每个8-12字，基于视频深入分析差异化优势
- 痛点：5个，每个8-12字，基于视频深入挖掘用户困扰
- 目标受众：8-12字，基于视频风格和内容精准定位用户群体
- 基于多维度分析：视频内容、表达方式、用户体验、市场定位

# 输出规则
作为资深商品分析专家，你需要：
1. 深入分析商品视频的内容和表达方式
2. 从视频中挖掘产品的差异化优势和独特价值
3. 深入分析视频传达的用户体验和情感价值
4. 输出专业且全面的分析结果
5. 确保每个卖点/痛点都有深度价值
6. 目标受众描述要精准且具有商业价值`,
      inputRequirements: '商品名称、类目、描述、目标市场、商品视频',
      outputRequirements: 'JSON格式，卖点/痛点各8-12字最多5个，目标受众8-12字',
      outputRules: '作为资深商品分析专家，基于视频深入挖掘产品特征和用户需求，输出专业且全面',
      isDefault: false,
      performance: 0.90,
      successRate: 0.85
    },
    {
      name: '商品分析-视频-电商专用模板',
      businessModule: 'product-analysis',
      instanceType: 'video',
      content: `# 输入要求
请提供以下信息：
- 商品名称：{{productName}}
- 商品类目：{{productCategory}}
- 商品描述：{{productDescription}}
- 目标市场：{{targetMarket}}
- 商品视频：{{videoContent}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "sellingPoints": ["卖点1", "卖点2", "卖点3", "卖点4", "卖点5"],
  "painPoints": ["痛点1", "痛点2", "痛点3", "痛点4", "痛点5"],
  "targetAudience": "目标受众描述"
}

输出规范：
- 卖点：5个，每个8-12字，基于视频突出电商平台优势（价格、服务、品质）
- 痛点：5个，每个8-12字，基于视频关注购买和使用过程中的问题
- 目标受众：8-12字，基于视频风格和内容分析电商用户特征
- 重点分析：价格竞争力、功能实用性、用户评价反馈、购买决策因素

# 输出规则
作为电商分析专家，你需要：
1. 专注电商平台特点和用户行为
2. 基于视频突出价格竞争力和服务优势
3. 关注购买决策和使用体验
4. 基于视频风格分析电商用户特征
5. 确保卖点/痛点符合电商场景
6. 输出要具有电商营销价值`,
      inputRequirements: '商品名称、类目、描述、目标市场、商品视频',
      outputRequirements: 'JSON格式，卖点/痛点各8-12字最多5个，目标受众8-12字',
      outputRules: '作为电商分析专家，基于视频专注电商平台特点，突出价格和服务优势',
      isDefault: false,
      performance: 0.82,
      successRate: 0.87
    },
    {
      name: '商品分析-视频-B2B专用模板',
      businessModule: 'product-analysis',
      instanceType: 'video',
      content: `# 输入要求
请提供以下信息：
- 商品名称：{{productName}}
- 商品类目：{{productCategory}}
- 商品描述：{{productDescription}}
- 目标市场：{{targetMarket}}
- 商品视频：{{videoContent}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "sellingPoints": ["卖点1", "卖点2", "卖点3", "卖点4", "卖点5"],
  "painPoints": ["痛点1", "痛点2", "痛点3", "痛点4", "痛点5"],
  "targetAudience": "目标受众描述"
}

输出规范：
- 卖点：5个，每个8-12字，基于视频突出企业价值和效率提升
- 痛点：5个，每个8-12字，基于视频关注企业级应用中的问题
- 目标受众：8-12字，基于视频风格和内容分析企业用户特征
- 重点分析：企业级功能、ROI和效率提升、集成和扩展性、安全性和稳定性

# 输出规则
作为B2B产品专家，你需要：
1. 专注企业级应用场景和需求
2. 基于视频突出企业价值和效率提升
3. 关注ROI和投资回报
4. 考虑集成性和扩展性
5. 重视安全性和稳定性
6. 确保卖点/痛点符合企业决策逻辑
7. 目标受众要精准定位企业用户`,
      inputRequirements: '商品名称、类目、描述、目标市场、商品视频',
      outputRequirements: 'JSON格式，卖点/痛点各8-12字最多5个，目标受众8-12字',
      outputRules: '作为B2B产品专家，基于视频专注企业级应用，突出价值和效率',
      isDefault: false,
      performance: 0.88,
      successRate: 0.89
    },

    // 通用实例类型 - 5个模板
    {
      name: '商品分析-通用-标准模板',
      businessModule: 'product-analysis',
      instanceType: 'general',
      content: `# 输入要求
请提供以下信息：
- 商品名称：{{productName}}
- 商品类目：{{productCategory}}{{#if productSubcategory}} / {{productSubcategory}}{{/if}}
- 商品描述：{{productDescription}}
- 目标市场：{{targetMarket}}
- 参考内容：{{referenceContent}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "sellingPoints": ["卖点1", "卖点2", "卖点3", "卖点4", "卖点5"],
  "painPoints": ["痛点1", "痛点2", "痛点3", "痛点4", "痛点5"],
  "targetAudience": "目标受众描述"
}

输出规范：
- 卖点：最多5个，每个8-12字，基于参考内容分析产品优势
- 痛点：最多5个，每个8-12字，基于参考内容分析用户困扰
- 目标受众：8-12字，基于参考内容定位用户群体
- 所有内容必须与商品名称、类目和参考内容相关

# 输出规则
作为商品分析专家，你需要：
1. 深入分析参考内容的特点和价值
2. 从参考内容中提取产品的核心信息
3. 重点关注参考内容展示的产品优势和用户价值
4. 输出简洁明了，避免冗余
5. 确保每个卖点/痛点都有实际价值
6. 目标受众描述要精准且具体`,
      inputRequirements: '商品名称、类目、描述、目标市场、参考内容',
      outputRequirements: 'JSON格式，卖点/痛点各8-12字最多5个，目标受众8-12字',
      outputRules: '作为商品分析专家，基于参考内容分析产品特征，输出简洁明了',
      isDefault: false,
      performance: 0.85,
      successRate: 0.90
    },
    {
      name: '商品分析-通用-快速模板',
      businessModule: 'product-analysis',
      instanceType: 'general',
      content: `# 输入要求
请提供以下信息：
- 商品名称：{{productName}}
- 商品类目：{{productCategory}}
- 商品描述：{{productDescription}}
- 目标市场：{{targetMarket}}
- 参考内容：{{referenceContent}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "sellingPoints": ["卖点1", "卖点2", "卖点3"],
  "painPoints": ["痛点1", "痛点2"],
  "targetAudience": "目标受众描述"
}

输出规范：
- 卖点：3个，每个8-12字，基于参考内容快速识别核心优势
- 痛点：2个，每个8-12字，基于参考内容快速识别主要困扰
- 目标受众：8-12字，基于参考内容快速定位用户群体
- 快速提取，避免过度分析

# 输出规则
作为商品分析专家，你需要：
1. 快速识别参考内容中的核心特征
2. 提取最重要的卖点和痛点
3. 输出简洁直接，避免冗余
4. 确保内容与商品高度相关
5. 适合快速决策场景`,
      inputRequirements: '商品名称、类目、描述、目标市场、参考内容',
      outputRequirements: 'JSON格式，卖点/痛点各8-12字最多5个，目标受众8-12字',
      outputRules: '作为商品分析专家，基于参考内容快速提取核心特征，输出简洁明了',
      isDefault: false,
      performance: 0.80,
      successRate: 0.88
    },
    {
      name: '商品分析-通用-深度模板',
      businessModule: 'product-analysis',
      instanceType: 'general',
      content: `# 输入要求
请提供以下信息：
- 商品名称：{{productName}}
- 商品类目：{{productCategory}}
- 商品描述：{{productDescription}}
- 目标市场：{{targetMarket}}
- 参考内容：{{referenceContent}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "sellingPoints": ["卖点1", "卖点2", "卖点3", "卖点4", "卖点5"],
  "painPoints": ["痛点1", "痛点2", "痛点3", "痛点4", "痛点5"],
  "targetAudience": "目标受众描述"
}

输出规范：
- 卖点：5个，每个8-12字，基于参考内容深入分析差异化优势
- 痛点：5个，每个8-12字，基于参考内容深入挖掘用户困扰
- 目标受众：8-12字，基于参考内容精准定位用户群体
- 基于多维度分析：内容特点、表达方式、用户体验、市场定位

# 输出规则
作为资深商品分析专家，你需要：
1. 深入分析参考内容的特点和价值
2. 从参考内容中挖掘产品的差异化优势和独特价值
3. 深入分析参考内容传达的用户体验和情感价值
4. 输出专业且全面的分析结果
5. 确保每个卖点/痛点都有深度价值
6. 目标受众描述要精准且具有商业价值`,
      inputRequirements: '商品名称、类目、描述、目标市场、参考内容',
      outputRequirements: 'JSON格式，卖点/痛点各8-12字最多5个，目标受众8-12字',
      outputRules: '作为资深商品分析专家，基于参考内容深入挖掘产品特征和用户需求，输出专业且全面',
      isDefault: false,
      performance: 0.90,
      successRate: 0.85
    },
    {
      name: '商品分析-通用-电商专用模板',
      businessModule: 'product-analysis',
      instanceType: 'general',
      content: `# 输入要求
请提供以下信息：
- 商品名称：{{productName}}
- 商品类目：{{productCategory}}
- 商品描述：{{productDescription}}
- 目标市场：{{targetMarket}}
- 参考内容：{{referenceContent}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "sellingPoints": ["卖点1", "卖点2", "卖点3", "卖点4", "卖点5"],
  "painPoints": ["痛点1", "痛点2", "痛点3", "痛点4", "痛点5"],
  "targetAudience": "目标受众描述"
}

输出规范：
- 卖点：5个，每个8-12字，基于参考内容突出电商平台优势（价格、服务、品质）
- 痛点：5个，每个8-12字，基于参考内容关注购买和使用过程中的问题
- 目标受众：8-12字，基于参考内容分析电商用户特征
- 重点分析：价格竞争力、功能实用性、用户评价反馈、购买决策因素

# 输出规则
作为电商分析专家，你需要：
1. 专注电商平台特点和用户行为
2. 基于参考内容突出价格竞争力和服务优势
3. 关注购买决策和使用体验
4. 基于参考内容分析电商用户特征
5. 确保卖点/痛点符合电商场景
6. 输出要具有电商营销价值`,
      inputRequirements: '商品名称、类目、描述、目标市场、参考内容',
      outputRequirements: 'JSON格式，卖点/痛点各8-12字最多5个，目标受众8-12字',
      outputRules: '作为电商分析专家，基于参考内容专注电商平台特点，突出价格和服务优势',
      isDefault: false,
      performance: 0.82,
      successRate: 0.87
    },
    {
      name: '商品分析-通用-B2B专用模板',
      businessModule: 'product-analysis',
      instanceType: 'general',
      content: `# 输入要求
请提供以下信息：
- 商品名称：{{productName}}
- 商品类目：{{productCategory}}
- 商品描述：{{productDescription}}
- 目标市场：{{targetMarket}}
- 参考内容：{{referenceContent}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "sellingPoints": ["卖点1", "卖点2", "卖点3", "卖点4", "卖点5"],
  "painPoints": ["痛点1", "痛点2", "痛点3", "痛点4", "痛点5"],
  "targetAudience": "目标受众描述"
}

输出规范：
- 卖点：5个，每个8-12字，基于参考内容突出企业价值和效率提升
- 痛点：5个，每个8-12字，基于参考内容关注企业级应用中的问题
- 目标受众：8-12字，基于参考内容分析企业用户特征
- 重点分析：企业级功能、ROI和效率提升、集成和扩展性、安全性和稳定性

# 输出规则
作为B2B产品专家，你需要：
1. 专注企业级应用场景和需求
2. 基于参考内容突出企业价值和效率提升
3. 关注ROI和投资回报
4. 考虑集成性和扩展性
5. 重视安全性和稳定性
6. 确保卖点/痛点符合企业决策逻辑
7. 目标受众要精准定位企业用户`,
      inputRequirements: '商品名称、类目、描述、目标市场、参考内容',
      outputRequirements: 'JSON格式，卖点/痛点各8-12字最多5个，目标受众8-12字',
      outputRules: '作为B2B产品专家，基于参考内容专注企业级应用，突出价值和效率',
      isDefault: false,
      performance: 0.88,
      successRate: 0.89
    },

    // ========== 视频脚本生成 (video-script) - 20个模板 (4种实例类型 × 5个模板) ==========
    
    // 文本实例类型 - 5个模板
    {
      name: '视频脚本-文本-产品介绍模板',
      businessModule: 'video-script',
      instanceType: 'text',
      content: `生成产品介绍视频脚本：

**产品信息：**
- 产品名称：{{productName}}
- 核心卖点：{{sellingPoints}}
- 目标受众：{{targetAudience}}
- 视频时长：{{duration}}秒
- 风格偏好：{{stylePreference}}

**脚本结构：**
1. Hook（前3秒吸引注意）
2. 产品介绍（核心卖点展示）
3. 使用场景（实际应用）
4. CTA（行动召唤）

**要求：**
- 语言生动有趣
- 突出产品价值
- 符合目标受众喜好
- 时长控制在{{duration}}秒内

JSON输出：{"hook": "...", "mainContent": "...", "cta": "..."}`,
      inputRequirements: '商品名称、卖点、目标受众、视频时长、风格偏好（可选）',
      outputRequirements: 'JSON格式，包含hook、主体内容、CTA，每部分字数限制',
      outputRules: '作为视频脚本专家，注重吸引力和转化效果，语言生动有趣',
      isDefault: true,
      performance: 0.85,
      successRate: 0.90
    },
    {
      name: '视频脚本-文本-对比评测模板',
      businessModule: 'video-script',
      instanceType: 'text',
      content: `生成产品对比评测视频脚本：

**产品信息：**
{{productName}} vs 竞品
卖点：{{sellingPoints}}
受众：{{targetAudience}}
时长：{{duration}}秒

**对比维度：**
- 功能对比
- 价格对比
- 使用体验对比
- 优缺点分析

**脚本要求：**
- 客观公正
- 数据支撑
- 结论明确
- 引导购买

JSON输出。`,
      inputRequirements: '商品名称、卖点、目标受众、视频时长、风格偏好（可选）',
      outputRequirements: 'JSON格式，包含hook、主体内容、CTA，每部分字数限制',
      outputRules: '作为评测专家，客观公正，数据支撑，结论明确',
      isDefault: false,
      performance: 0.82,
      successRate: 0.87
    },
    {
      name: '视频脚本-文本-使用教程模板',
      businessModule: 'video-script',
      instanceType: 'text',
      content: `生成产品使用教程视频脚本：

**产品：** {{productName}}
**卖点：** {{sellingPoints}}
**受众：** {{targetAudience}}
**时长：** {{duration}}秒

**教程结构：**
1. 开场介绍（产品简介）
2. 步骤演示（详细操作）
3. 注意事项（重要提醒）
4. 总结收尾（价值强调）

**要求：**
- 步骤清晰
- 操作简单
- 重点突出
- 易于跟随

JSON输出。`,
      inputRequirements: '商品名称、卖点、目标受众、视频时长、风格偏好（可选）',
      outputRequirements: 'JSON格式，包含hook、主体内容、CTA，每部分字数限制',
      outputRules: '作为教程专家，步骤清晰，操作简单，易于跟随',
      isDefault: false,
      performance: 0.88,
      successRate: 0.92
    },
    {
      name: '视频脚本-文本-情感营销模板',
      businessModule: 'video-script',
      instanceType: 'text',
      content: `生成情感营销视频脚本：

**产品：** {{productName}}
**卖点：** {{sellingPoints}}
**受众：** {{targetAudience}}
**时长：** {{duration}}秒

**情感营销要素：**
- 故事化叙述
- 情感共鸣
- 生活场景
- 价值传递

**脚本要求：**
- 情感丰富
- 故事性强
- 引发共鸣
- 自然植入

JSON输出。`,
      inputRequirements: '商品名称、卖点、目标受众、视频时长、风格偏好（可选）',
      outputRequirements: 'JSON格式，包含hook、主体内容、CTA，每部分字数限制',
      outputRules: '作为情感营销专家，故事化叙述，引发情感共鸣',
      isDefault: false,
      performance: 0.83,
      successRate: 0.86
    },
    {
      name: '视频脚本-文本-数据展示模板',
      businessModule: 'video-script',
      instanceType: 'text',
      content: `生成数据展示视频脚本：

**产品：** {{productName}}
**卖点：** {{sellingPoints}}
**受众：** {{targetAudience}}
**时长：** {{duration}}秒

**数据展示重点：**
- 核心数据
- 对比分析
- 趋势变化
- 价值证明

**脚本要求：**
- 数据准确
- 可视化强
- 逻辑清晰
- 说服力强

JSON输出。`,
      inputRequirements: '商品名称、卖点、目标受众、视频时长、风格偏好（可选）',
      outputRequirements: 'JSON格式，包含hook、主体内容、CTA，每部分字数限制',
      outputRules: '作为数据专家，数据准确，逻辑清晰，说服力强',
      isDefault: false,
      performance: 0.86,
      successRate: 0.89
    },

    // 图片实例类型 - 5个模板
    {
      name: '视频脚本-图片-产品介绍模板',
      businessModule: 'video-script',
      instanceType: 'image',
      content: `# 输入要求
请提供以下信息：
- 产品名称：{{productName}}
- 核心卖点：{{sellingPoints}}
- 目标受众：{{targetAudience}}
- 视频时长：{{videoDuration}}秒
- 风格偏好：{{stylePreference}}
- 产品图片：{{productImages}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "hook": "开场Hook（前3秒吸引注意）",
  "mainContent": "产品介绍主体内容（核心卖点展示）",
  "cta": "行动召唤（引导用户行动）"
}

输出规范：
- hook：3-5秒，语言生动有趣，基于图片内容吸引注意
- mainContent：主体部分，突出产品价值，基于图片展示卖点
- cta：行动召唤，符合目标受众喜好，基于图片风格设计
- 时长控制在{{videoDuration}}秒内

# 输出规则
作为视频脚本专家，你需要：
1. 基于产品图片分析视觉特点和卖点
2. 从图片中提取产品的外观、功能、使用场景信息
3. 重点关注图片展示的产品优势和用户价值
4. 语言生动有趣，注重吸引力和转化效果
5. 确保脚本与图片内容高度相关
6. 适合视频制作和拍摄`,
      inputRequirements: '产品名称、卖点、目标受众、视频时长、风格偏好、产品图片',
      outputRequirements: 'JSON格式，包含hook、主体内容、CTA，每部分字数限制',
      outputRules: '作为视频脚本专家，基于图片内容注重吸引力和转化效果，语言生动有趣',
      isDefault: false,
      performance: 0.85,
      successRate: 0.90
    },
    {
      name: '视频脚本-图片-对比评测模板',
      businessModule: 'video-script',
      instanceType: 'image',
      content: `# 输入要求
请提供以下信息：
- 产品名称：{{productName}}
- 核心卖点：{{sellingPoints}}
- 目标受众：{{targetAudience}}
- 视频时长：{{videoDuration}}秒
- 风格偏好：{{stylePreference}}
- 对比图片：{{comparisonImages}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "hook": "开场Hook（前3秒吸引注意）",
  "mainContent": "对比评测主体内容（功能、价格、体验对比）",
  "cta": "行动召唤（引导用户选择）"
}

输出规范：
- hook：3-5秒，基于对比图片吸引注意
- mainContent：客观公正的对比分析，基于图片数据支撑
- cta：明确结论，引导购买决策
- 时长控制在{{videoDuration}}秒内

# 输出规则
作为评测专家，你需要：
1. 基于对比图片分析产品差异
2. 从图片中提取功能、价格、外观对比信息
3. 客观公正，数据支撑，结论明确
4. 确保评测内容与图片高度相关
5. 适合视频制作和拍摄`,
      inputRequirements: '产品名称、卖点、目标受众、视频时长、风格偏好、对比图片',
      outputRequirements: 'JSON格式，包含hook、主体内容、CTA，每部分字数限制',
      outputRules: '作为评测专家，基于图片内容客观公正，数据支撑，结论明确',
      isDefault: false,
      performance: 0.82,
      successRate: 0.87
    },
    {
      name: '视频脚本-图片-使用教程模板',
      businessModule: 'video-script',
      instanceType: 'image',
      content: `# 输入要求
请提供以下信息：
- 产品名称：{{productName}}
- 核心卖点：{{sellingPoints}}
- 目标受众：{{targetAudience}}
- 视频时长：{{videoDuration}}秒
- 风格偏好：{{stylePreference}}
- 教程图片：{{tutorialImages}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "hook": "开场介绍（产品简介）",
  "mainContent": "步骤演示（详细操作，基于图片）",
  "cta": "总结收尾（价值强调）"
}

输出规范：
- hook：产品简介，基于图片快速介绍
- mainContent：步骤清晰，操作简单，基于图片易于跟随
- cta：重点突出，价值强调
- 时长控制在{{videoDuration}}秒内

# 输出规则
作为教程专家，你需要：
1. 基于教程图片分析操作步骤
2. 从图片中提取详细的操作流程
3. 步骤清晰，操作简单，易于跟随
4. 确保教程内容与图片高度相关
5. 适合视频制作和拍摄`,
      inputRequirements: '产品名称、卖点、目标受众、视频时长、风格偏好、教程图片',
      outputRequirements: 'JSON格式，包含hook、主体内容、CTA，每部分字数限制',
      outputRules: '作为教程专家，基于图片内容步骤清晰，操作简单，易于跟随',
      isDefault: false,
      performance: 0.88,
      successRate: 0.92
    },
    {
      name: '视频脚本-图片-情感营销模板',
      businessModule: 'video-script',
      instanceType: 'image',
      content: `# 输入要求
请提供以下信息：
- 产品名称：{{productName}}
- 核心卖点：{{sellingPoints}}
- 目标受众：{{targetAudience}}
- 视频时长：{{videoDuration}}秒
- 风格偏好：{{stylePreference}}
- 情感图片：{{emotionalImages}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "hook": "故事开场（情感引入）",
  "mainContent": "情感营销主体（故事化叙述，基于图片）",
  "cta": "情感召唤（引发共鸣）"
}

输出规范：
- hook：情感引入，基于图片故事化开场
- mainContent：故事化叙述，基于图片引发情感共鸣
- cta：情感丰富，自然植入产品价值
- 时长控制在{{videoDuration}}秒内

# 输出规则
作为情感营销专家，你需要：
1. 基于情感图片分析故事元素
2. 从图片中提取情感表达和生活场景
3. 故事化叙述，引发情感共鸣
4. 确保营销内容与图片高度相关
5. 适合视频制作和拍摄`,
      inputRequirements: '产品名称、卖点、目标受众、视频时长、风格偏好、情感图片',
      outputRequirements: 'JSON格式，包含hook、主体内容、CTA，每部分字数限制',
      outputRules: '作为情感营销专家，基于图片内容故事化叙述，引发情感共鸣',
      isDefault: false,
      performance: 0.83,
      successRate: 0.86
    },
    {
      name: '视频脚本-图片-数据展示模板',
      businessModule: 'video-script',
      instanceType: 'image',
      content: `# 输入要求
请提供以下信息：
- 产品名称：{{productName}}
- 核心卖点：{{sellingPoints}}
- 目标受众：{{targetAudience}}
- 视频时长：{{videoDuration}}秒
- 风格偏好：{{stylePreference}}
- 数据图片：{{dataImages}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "hook": "数据开场（核心数据引入）",
  "mainContent": "数据展示主体（对比分析，基于图片）",
  "cta": "价值证明（说服力强）"
}

输出规范：
- hook：数据引入，基于图片核心数据开场
- mainContent：数据准确，基于图片可视化强
- cta：逻辑清晰，说服力强
- 时长控制在{{videoDuration}}秒内

# 输出规则
作为数据专家，你需要：
1. 基于数据图片分析核心信息
2. 从图片中提取关键数据和对比信息
3. 数据准确，逻辑清晰，说服力强
4. 确保展示内容与图片高度相关
5. 适合视频制作和拍摄`,
      inputRequirements: '产品名称、卖点、目标受众、视频时长、风格偏好、数据图片',
      outputRequirements: 'JSON格式，包含hook、主体内容、CTA，每部分字数限制',
      outputRules: '作为数据专家，基于图片内容数据准确，逻辑清晰，说服力强',
      isDefault: false,
      performance: 0.86,
      successRate: 0.89
    },

    // 视频实例类型 - 5个模板
    {
      name: '视频脚本-视频-产品介绍模板',
      businessModule: 'video-script',
      instanceType: 'video',
      content: `# 输入要求
请提供以下信息：
- 产品名称：{{productName}}
- 核心卖点：{{sellingPoints}}
- 目标受众：{{targetAudience}}
- 视频时长：{{videoDuration}}秒
- 风格偏好：{{stylePreference}}
- 参考视频：{{referenceVideo}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "hook": "开场Hook（前3秒吸引注意）",
  "mainContent": "产品介绍主体内容（核心卖点展示）",
  "cta": "行动召唤（引导用户行动）"
}

输出规范：
- hook：3-5秒，语言生动有趣，基于视频内容吸引注意
- mainContent：主体部分，突出产品价值，基于视频展示卖点
- cta：行动召唤，符合目标受众喜好，基于视频风格设计
- 时长控制在{{videoDuration}}秒内

# 输出规则
作为视频脚本专家，你需要：
1. 基于参考视频分析拍摄风格和节奏
2. 从视频中提取产品展示方式和卖点表达
3. 重点关注视频中的产品优势和用户价值
4. 语言生动有趣，注重吸引力和转化效果
5. 确保脚本与视频内容高度相关
6. 适合视频制作和拍摄`,
      inputRequirements: '产品名称、卖点、目标受众、视频时长、风格偏好、参考视频',
      outputRequirements: 'JSON格式，包含hook、主体内容、CTA，每部分字数限制',
      outputRules: '作为视频脚本专家，基于视频内容注重吸引力和转化效果，语言生动有趣',
      isDefault: false,
      performance: 0.85,
      successRate: 0.90
    },
    {
      name: '视频脚本-视频-对比评测模板',
      businessModule: 'video-script',
      instanceType: 'video',
      content: `# 输入要求
请提供以下信息：
- 产品名称：{{productName}}
- 核心卖点：{{sellingPoints}}
- 目标受众：{{targetAudience}}
- 视频时长：{{videoDuration}}秒
- 风格偏好：{{stylePreference}}
- 对比视频：{{comparisonVideo}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "hook": "开场Hook（前3秒吸引注意）",
  "mainContent": "对比评测主体内容（功能、价格、体验对比）",
  "cta": "行动召唤（引导用户选择）"
}

输出规范：
- hook：3-5秒，基于对比视频吸引注意
- mainContent：客观公正的对比分析，基于视频数据支撑
- cta：明确结论，引导购买决策
- 时长控制在{{videoDuration}}秒内

# 输出规则
作为评测专家，你需要：
1. 基于对比视频分析产品差异
2. 从视频中提取功能、价格、外观对比信息
3. 客观公正，数据支撑，结论明确
4. 确保评测内容与视频高度相关
5. 适合视频制作和拍摄`,
      inputRequirements: '产品名称、卖点、目标受众、视频时长、风格偏好、对比视频',
      outputRequirements: 'JSON格式，包含hook、主体内容、CTA，每部分字数限制',
      outputRules: '作为评测专家，基于视频内容客观公正，数据支撑，结论明确',
      isDefault: false,
      performance: 0.82,
      successRate: 0.87
    },
    {
      name: '视频脚本-视频-使用教程模板',
      businessModule: 'video-script',
      instanceType: 'video',
      content: `# 输入要求
请提供以下信息：
- 产品名称：{{productName}}
- 核心卖点：{{sellingPoints}}
- 目标受众：{{targetAudience}}
- 视频时长：{{videoDuration}}秒
- 风格偏好：{{stylePreference}}
- 教程视频：{{tutorialVideo}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "hook": "开场介绍（产品简介）",
  "mainContent": "步骤演示（详细操作，基于视频）",
  "cta": "总结收尾（价值强调）"
}

输出规范：
- hook：产品简介，基于视频快速介绍
- mainContent：步骤清晰，操作简单，基于视频易于跟随
- cta：重点突出，价值强调
- 时长控制在{{videoDuration}}秒内

# 输出规则
作为教程专家，你需要：
1. 基于教程视频分析操作步骤
2. 从视频中提取详细的操作流程
3. 步骤清晰，操作简单，易于跟随
4. 确保教程内容与视频高度相关
5. 适合视频制作和拍摄`,
      inputRequirements: '产品名称、卖点、目标受众、视频时长、风格偏好、教程视频',
      outputRequirements: 'JSON格式，包含hook、主体内容、CTA，每部分字数限制',
      outputRules: '作为教程专家，基于视频内容步骤清晰，操作简单，易于跟随',
      isDefault: false,
      performance: 0.88,
      successRate: 0.92
    },
    {
      name: '视频脚本-视频-情感营销模板',
      businessModule: 'video-script',
      instanceType: 'video',
      content: `# 输入要求
请提供以下信息：
- 产品名称：{{productName}}
- 核心卖点：{{sellingPoints}}
- 目标受众：{{targetAudience}}
- 视频时长：{{videoDuration}}秒
- 风格偏好：{{stylePreference}}
- 情感视频：{{emotionalVideo}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "hook": "故事开场（情感引入）",
  "mainContent": "情感营销主体（故事化叙述，基于视频）",
  "cta": "情感召唤（引发共鸣）"
}

输出规范：
- hook：情感引入，基于视频故事化开场
- mainContent：故事化叙述，基于视频引发情感共鸣
- cta：情感丰富，自然植入产品价值
- 时长控制在{{videoDuration}}秒内

# 输出规则
作为情感营销专家，你需要：
1. 基于情感视频分析故事元素
2. 从视频中提取情感表达和生活场景
3. 故事化叙述，引发情感共鸣
4. 确保营销内容与视频高度相关
5. 适合视频制作和拍摄`,
      inputRequirements: '产品名称、卖点、目标受众、视频时长、风格偏好、情感视频',
      outputRequirements: 'JSON格式，包含hook、主体内容、CTA，每部分字数限制',
      outputRules: '作为情感营销专家，基于视频内容故事化叙述，引发情感共鸣',
      isDefault: false,
      performance: 0.83,
      successRate: 0.86
    },
    {
      name: '视频脚本-视频-数据展示模板',
      businessModule: 'video-script',
      instanceType: 'video',
      content: `# 输入要求
请提供以下信息：
- 产品名称：{{productName}}
- 核心卖点：{{sellingPoints}}
- 目标受众：{{targetAudience}}
- 视频时长：{{videoDuration}}秒
- 风格偏好：{{stylePreference}}
- 数据视频：{{dataVideo}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "hook": "数据开场（核心数据引入）",
  "mainContent": "数据展示主体（对比分析，基于视频）",
  "cta": "价值证明（说服力强）"
}

输出规范：
- hook：数据引入，基于视频核心数据开场
- mainContent：数据准确，基于视频可视化强
- cta：逻辑清晰，说服力强
- 时长控制在{{videoDuration}}秒内

# 输出规则
作为数据专家，你需要：
1. 基于数据视频分析核心信息
2. 从视频中提取关键数据和对比信息
3. 数据准确，逻辑清晰，说服力强
4. 确保展示内容与视频高度相关
5. 适合视频制作和拍摄`,
      inputRequirements: '产品名称、卖点、目标受众、视频时长、风格偏好、数据视频',
      outputRequirements: 'JSON格式，包含hook、主体内容、CTA，每部分字数限制',
      outputRules: '作为数据专家，基于视频内容数据准确，逻辑清晰，说服力强',
      isDefault: false,
      performance: 0.86,
      successRate: 0.89
    },

    // 通用实例类型 - 5个模板
    {
      name: '视频脚本-通用-产品介绍模板',
      businessModule: 'video-script',
      instanceType: 'general',
      content: `# 输入要求
请提供以下信息：
- 产品名称：{{productName}}
- 核心卖点：{{sellingPoints}}
- 目标受众：{{targetAudience}}
- 视频时长：{{videoDuration}}秒
- 风格偏好：{{stylePreference}}
- 参考内容：{{referenceContent}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "hook": "开场Hook（前3秒吸引注意）",
  "mainContent": "产品介绍主体内容（核心卖点展示）",
  "cta": "行动召唤（引导用户行动）"
}

输出规范：
- hook：3-5秒，语言生动有趣，基于参考内容吸引注意
- mainContent：主体部分，突出产品价值，基于参考内容展示卖点
- cta：行动召唤，符合目标受众喜好，基于参考内容风格设计
- 时长控制在{{videoDuration}}秒内

# 输出规则
作为视频脚本专家，你需要：
1. 基于参考内容分析表达方式和卖点
2. 从参考内容中提取产品优势和用户价值
3. 重点关注参考内容中的产品展示方式
4. 语言生动有趣，注重吸引力和转化效果
5. 确保脚本与参考内容高度相关
6. 适合视频制作和拍摄`,
      inputRequirements: '产品名称、卖点、目标受众、视频时长、风格偏好、参考内容',
      outputRequirements: 'JSON格式，包含hook、主体内容、CTA，每部分字数限制',
      outputRules: '作为视频脚本专家，基于参考内容注重吸引力和转化效果，语言生动有趣',
      isDefault: false,
      performance: 0.85,
      successRate: 0.90
    },
    {
      name: '视频脚本-通用-对比评测模板',
      businessModule: 'video-script',
      instanceType: 'general',
      content: `# 输入要求
请提供以下信息：
- 产品名称：{{productName}}
- 核心卖点：{{sellingPoints}}
- 目标受众：{{targetAudience}}
- 视频时长：{{videoDuration}}秒
- 风格偏好：{{stylePreference}}
- 参考内容：{{referenceContent}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "hook": "开场Hook（前3秒吸引注意）",
  "mainContent": "对比评测主体内容（功能、价格、体验对比）",
  "cta": "行动召唤（引导用户选择）"
}

输出规范：
- hook：3-5秒，基于参考内容吸引注意
- mainContent：客观公正的对比分析，基于参考内容数据支撑
- cta：明确结论，引导购买决策
- 时长控制在{{videoDuration}}秒内

# 输出规则
作为评测专家，你需要：
1. 基于参考内容分析产品差异
2. 从参考内容中提取功能、价格、外观对比信息
3. 客观公正，数据支撑，结论明确
4. 确保评测内容与参考内容高度相关
5. 适合视频制作和拍摄`,
      inputRequirements: '产品名称、卖点、目标受众、视频时长、风格偏好、参考内容',
      outputRequirements: 'JSON格式，包含hook、主体内容、CTA，每部分字数限制',
      outputRules: '作为评测专家，基于参考内容客观公正，数据支撑，结论明确',
      isDefault: false,
      performance: 0.82,
      successRate: 0.87
    },
    {
      name: '视频脚本-通用-使用教程模板',
      businessModule: 'video-script',
      instanceType: 'general',
      content: `# 输入要求
请提供以下信息：
- 产品名称：{{productName}}
- 核心卖点：{{sellingPoints}}
- 目标受众：{{targetAudience}}
- 视频时长：{{videoDuration}}秒
- 风格偏好：{{stylePreference}}
- 参考内容：{{referenceContent}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "hook": "开场介绍（产品简介）",
  "mainContent": "步骤演示（详细操作，基于参考内容）",
  "cta": "总结收尾（价值强调）"
}

输出规范：
- hook：产品简介，基于参考内容快速介绍
- mainContent：步骤清晰，操作简单，基于参考内容易于跟随
- cta：重点突出，价值强调
- 时长控制在{{videoDuration}}秒内

# 输出规则
作为教程专家，你需要：
1. 基于参考内容分析操作步骤
2. 从参考内容中提取详细的操作流程
3. 步骤清晰，操作简单，易于跟随
4. 确保教程内容与参考内容高度相关
5. 适合视频制作和拍摄`,
      inputRequirements: '产品名称、卖点、目标受众、视频时长、风格偏好、参考内容',
      outputRequirements: 'JSON格式，包含hook、主体内容、CTA，每部分字数限制',
      outputRules: '作为教程专家，基于参考内容步骤清晰，操作简单，易于跟随',
      isDefault: false,
      performance: 0.88,
      successRate: 0.92
    },
    {
      name: '视频脚本-通用-情感营销模板',
      businessModule: 'video-script',
      instanceType: 'general',
      content: `# 输入要求
请提供以下信息：
- 产品名称：{{productName}}
- 核心卖点：{{sellingPoints}}
- 目标受众：{{targetAudience}}
- 视频时长：{{videoDuration}}秒
- 风格偏好：{{stylePreference}}
- 参考内容：{{referenceContent}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "hook": "故事开场（情感引入）",
  "mainContent": "情感营销主体（故事化叙述，基于参考内容）",
  "cta": "情感召唤（引发共鸣）"
}

输出规范：
- hook：情感引入，基于参考内容故事化开场
- mainContent：故事化叙述，基于参考内容引发情感共鸣
- cta：情感丰富，自然植入产品价值
- 时长控制在{{videoDuration}}秒内

# 输出规则
作为情感营销专家，你需要：
1. 基于参考内容分析故事元素
2. 从参考内容中提取情感表达和生活场景
3. 故事化叙述，引发情感共鸣
4. 确保营销内容与参考内容高度相关
5. 适合视频制作和拍摄`,
      inputRequirements: '产品名称、卖点、目标受众、视频时长、风格偏好、参考内容',
      outputRequirements: 'JSON格式，包含hook、主体内容、CTA，每部分字数限制',
      outputRules: '作为情感营销专家，基于参考内容故事化叙述，引发情感共鸣',
      isDefault: false,
      performance: 0.83,
      successRate: 0.86
    },
    {
      name: '视频脚本-通用-数据展示模板',
      businessModule: 'video-script',
      instanceType: 'general',
      content: `# 输入要求
请提供以下信息：
- 产品名称：{{productName}}
- 核心卖点：{{sellingPoints}}
- 目标受众：{{targetAudience}}
- 视频时长：{{videoDuration}}秒
- 风格偏好：{{stylePreference}}
- 参考内容：{{referenceContent}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "hook": "数据开场（核心数据引入）",
  "mainContent": "数据展示主体（对比分析，基于参考内容）",
  "cta": "价值证明（说服力强）"
}

输出规范：
- hook：数据引入，基于参考内容核心数据开场
- mainContent：数据准确，基于参考内容可视化强
- cta：逻辑清晰，说服力强
- 时长控制在{{videoDuration}}秒内

# 输出规则
作为数据专家，你需要：
1. 基于参考内容分析核心信息
2. 从参考内容中提取关键数据和对比信息
3. 数据准确，逻辑清晰，说服力强
4. 确保展示内容与参考内容高度相关
5. 适合视频制作和拍摄`,
      inputRequirements: '产品名称、卖点、目标受众、视频时长、风格偏好、参考内容',
      outputRequirements: 'JSON格式，包含hook、主体内容、CTA，每部分字数限制',
      outputRules: '作为数据专家，基于参考内容数据准确，逻辑清晰，说服力强',
      isDefault: false,
      performance: 0.86,
      successRate: 0.89
    },

    // ========== AI反推 (ai-reverse-engineer) - 20个模板 (4种实例类型 × 5个模板) ==========
    
    // 文本实例类型 - 5个模板
    {
      name: 'AI反推-文本-标准反推模板',
      businessModule: 'ai-reverse-engineer',
      instanceType: 'text',
      content: `# 输入要求
请提供以下信息：
- 参考实例：{{referenceExample}}
- 目标业务模块：{{targetBusinessModule}}
- 实例类型：{{exampleType}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "inputRequirements": "输入要求描述",
  "outputRequirements": "输出要求描述", 
  "outputRules": "输出规则描述",
  "suggestedTemplate": {
    "name": "模板名称",
    "businessModule": "目标业务模块",
    "content": "完整的Prompt模板内容",
    "variables": "[]",
    "description": "模板描述",
    "performance": 0.85,
    "successRate": 0.88,
    "isActive": true,
    "isDefault": false,
    "createdBy": "ai-reverse-engineer",
    "inputRequirements": "输入要求描述",
    "outputRequirements": "输出要求描述",
    "outputRules": "输出规则描述"
  }
}

输出规范：
- inputRequirements：定义输入变量，必须符合目标业务模块的标准
- outputRequirements：定义输出格式，必须符合目标业务模块的标准
- outputRules：定义AI角色和风格，这是模板的主要区别点
- suggestedTemplate：生成完整的Prompt模板，包含所有必要字段：
  * name：模板名称
  * businessModule：目标业务模块
  * content：完整的Prompt模板内容（三段式结构）
  * variables：变量数组（JSON字符串格式）
  * description：模板描述
  * performance：性能评分（0-1）
  * successRate：成功率（0-1）
  * isActive：是否激活（true/false）
  * isDefault：是否默认模板（true/false）
  * createdBy：创建者（ai-reverse-engineer）
  * inputRequirements：输入要求描述
  * outputRequirements：输出要求描述
  * outputRules：输出规则描述

# 输出规则
作为Prompt工程专家，你需要：
1. 深入分析参考文本的特点和风格
2. 提取关键要素和结构特征
3. 生成符合目标业务模块标准的三段式Prompt
4. 保持原文本的风格特征和表达方式
5. 确保输入输出要求符合业务模块规范
6. 输出规则要体现原文本的独特价值
7. 生成的suggestedTemplate必须包含所有必要字段，确保可以直接保存到数据库
8. content字段必须是完整的三段式Prompt结构（输入要求、输出要求、输出规则）`,
      inputRequirements: '参考实例、目标业务模块、实例类型',
      outputRequirements: 'JSON格式，包含inputRequirements、outputRequirements、outputRules、suggestedTemplate',
      outputRules: '作为Prompt工程专家，根据文本特点生成符合业务模块要求的三段式结构',
      isDefault: true,
      performance: 0.85,
      successRate: 0.88
    },
    {
      name: 'AI反推-文本-快速反推模板',
      businessModule: 'ai-reverse-engineer',
      instanceType: 'text',
      content: `# 输入要求
请提供以下信息：
- 参考实例：{{referenceExample}}
- 目标业务模块：{{targetBusinessModule}}
- 实例类型：{{exampleType}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "inputRequirements": "输入要求描述",
  "outputRequirements": "输出要求描述", 
  "outputRules": "输出规则描述",
  "suggestedTemplate": {
    "name": "模板名称",
    "businessModule": "目标业务模块",
    "content": "完整的Prompt模板内容",
    "variables": "[]",
    "description": "模板描述",
    "performance": 0.85,
    "successRate": 0.88,
    "isActive": true,
    "isDefault": false,
    "createdBy": "ai-reverse-engineer",
    "inputRequirements": "输入要求描述",
    "outputRequirements": "输出要求描述",
    "outputRules": "输出规则描述"
  }
}

输出规范：
- inputRequirements：定义输入变量，必须符合目标业务模块的标准
- outputRequirements：定义输出格式，必须符合目标业务模块的标准
- outputRules：定义AI角色和风格，这是模板的主要区别点
- suggestedTemplate：生成完整的Prompt模板，包含所有必要字段：
  * name：模板名称
  * businessModule：目标业务模块
  * content：完整的Prompt模板内容（三段式结构）
  * variables：变量数组（JSON字符串格式）
  * description：模板描述
  * performance：性能评分（0-1）
  * successRate：成功率（0-1）
  * isActive：是否激活（true/false）
  * isDefault：是否默认模板（true/false）
  * createdBy：创建者（ai-reverse-engineer）
  * inputRequirements：输入要求描述
  * outputRequirements：输出要求描述
  * outputRules：输出规则描述

# 输出规则
作为Prompt工程专家，你需要：
1. 快速分析参考文本的核心特征
2. 提取关键要素和表达方式
3. 生成简洁高效的三段式Prompt
4. 保持原文本的简洁风格
5. 确保输入输出要求符合业务模块规范
6. 输出规则要体现原文本的快速高效特点`,
      inputRequirements: '参考实例、目标业务模块、实例类型',
      outputRequirements: 'JSON格式，包含inputRequirements、outputRequirements、outputRules、suggestedTemplate',
      outputRules: '作为Prompt工程专家，根据文本特点快速生成符合业务模块要求的三段式结构',
      isDefault: false,
      performance: 0.82,
      successRate: 0.85
    },
    {
      name: 'AI反推-文本-深度反推模板',
      businessModule: 'ai-reverse-engineer',
      instanceType: 'text',
      content: `# 输入要求
请提供以下信息：
- 参考实例：{{referenceExample}}
- 目标业务模块：{{targetBusinessModule}}
- 实例类型：{{exampleType}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "inputRequirements": "输入要求描述",
  "outputRequirements": "输出要求描述", 
  "outputRules": "输出规则描述",
  "suggestedTemplate": {
    "name": "模板名称",
    "businessModule": "目标业务模块",
    "content": "完整的Prompt模板内容",
    "variables": "[]",
    "description": "模板描述",
    "performance": 0.85,
    "successRate": 0.88,
    "isActive": true,
    "isDefault": false,
    "createdBy": "ai-reverse-engineer",
    "inputRequirements": "输入要求描述",
    "outputRequirements": "输出要求描述",
    "outputRules": "输出规则描述"
  }
}

输出规范：
- inputRequirements：定义输入变量，必须符合目标业务模块的标准
- outputRequirements：定义输出格式，必须符合目标业务模块的标准
- outputRules：定义AI角色和风格，这是模板的主要区别点
- suggestedTemplate：生成完整的Prompt模板，包含所有必要字段：
  * name：模板名称
  * businessModule：目标业务模块
  * content：完整的Prompt模板内容（三段式结构）
  * variables：变量数组（JSON字符串格式）
  * description：模板描述
  * performance：性能评分（0-1）
  * successRate：成功率（0-1）
  * isActive：是否激活（true/false）
  * isDefault：是否默认模板（true/false）
  * createdBy：创建者（ai-reverse-engineer）
  * inputRequirements：输入要求描述
  * outputRequirements：输出要求描述
  * outputRules：输出规则描述

# 输出规则
作为Prompt工程专家，你需要：
1. 深度分析参考文本的细节特征
2. 提取复杂要素和深层结构
3. 生成详细完整的三段式Prompt
4. 保持原文本的深度和复杂性
5. 确保输入输出要求符合业务模块规范
6. 输出规则要体现原文本的深度分析特点`,
      inputRequirements: '参考实例、目标业务模块、实例类型',
      outputRequirements: 'JSON格式，包含inputRequirements、outputRequirements、outputRules、suggestedTemplate',
      outputRules: '作为Prompt工程专家，根据文本特点深度生成符合业务模块要求的三段式结构',
      isDefault: false,
      performance: 0.88,
      successRate: 0.90
    },
    {
      name: 'AI反推-文本-创意反推模板',
      businessModule: 'ai-reverse-engineer',
      instanceType: 'text',
      content: `# 输入要求
请提供以下信息：
- 参考实例：{{referenceExample}}
- 目标业务模块：{{targetBusinessModule}}
- 实例类型：{{exampleType}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "inputRequirements": "输入要求描述",
  "outputRequirements": "输出要求描述", 
  "outputRules": "输出规则描述",
  "suggestedTemplate": {
    "name": "模板名称",
    "businessModule": "目标业务模块",
    "content": "完整的Prompt模板内容",
    "variables": "[]",
    "description": "模板描述",
    "performance": 0.85,
    "successRate": 0.88,
    "isActive": true,
    "isDefault": false,
    "createdBy": "ai-reverse-engineer",
    "inputRequirements": "输入要求描述",
    "outputRequirements": "输出要求描述",
    "outputRules": "输出规则描述"
  }
}

输出规范：
- inputRequirements：定义输入变量，必须符合目标业务模块的标准
- outputRequirements：定义输出格式，必须符合目标业务模块的标准
- outputRules：定义AI角色和风格，这是模板的主要区别点
- suggestedTemplate：生成完整的Prompt模板，包含所有必要字段：
  * name：模板名称
  * businessModule：目标业务模块
  * content：完整的Prompt模板内容（三段式结构）
  * variables：变量数组（JSON字符串格式）
  * description：模板描述
  * performance：性能评分（0-1）
  * successRate：成功率（0-1）
  * isActive：是否激活（true/false）
  * isDefault：是否默认模板（true/false）
  * createdBy：创建者（ai-reverse-engineer）
  * inputRequirements：输入要求描述
  * outputRequirements：输出要求描述
  * outputRules：输出规则描述

# 输出规则
作为Prompt工程专家，你需要：
1. 分析参考文本的创意特征
2. 提取创新要素和独特表达
3. 生成富有创意的三段式Prompt
4. 保持原文本的创意和独特性
5. 确保输入输出要求符合业务模块规范
6. 输出规则要体现原文本的创意表达特点`,
      inputRequirements: '参考实例、目标业务模块、实例类型',
      outputRequirements: 'JSON格式，包含inputRequirements、outputRequirements、outputRules、suggestedTemplate',
      outputRules: '作为Prompt工程专家，根据文本特点创意生成符合业务模块要求的三段式结构',
      isDefault: false,
      performance: 0.83,
      successRate: 0.87
    },
    {
      name: 'AI反推-文本-专业反推模板',
      businessModule: 'ai-reverse-engineer',
      instanceType: 'text',
      content: `# 输入要求
请提供以下信息：
- 参考实例：{{referenceExample}}
- 目标业务模块：{{targetBusinessModule}}
- 实例类型：{{exampleType}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "inputRequirements": "输入要求描述",
  "outputRequirements": "输出要求描述", 
  "outputRules": "输出规则描述",
  "suggestedTemplate": {
    "name": "模板名称",
    "businessModule": "目标业务模块",
    "content": "完整的Prompt模板内容",
    "variables": "[]",
    "description": "模板描述",
    "performance": 0.85,
    "successRate": 0.88,
    "isActive": true,
    "isDefault": false,
    "createdBy": "ai-reverse-engineer",
    "inputRequirements": "输入要求描述",
    "outputRequirements": "输出要求描述",
    "outputRules": "输出规则描述"
  }
}

输出规范：
- inputRequirements：定义输入变量，必须符合目标业务模块的标准
- outputRequirements：定义输出格式，必须符合目标业务模块的标准
- outputRules：定义AI角色和风格，这是模板的主要区别点
- suggestedTemplate：生成完整的Prompt模板，包含所有必要字段：
  * name：模板名称
  * businessModule：目标业务模块
  * content：完整的Prompt模板内容（三段式结构）
  * variables：变量数组（JSON字符串格式）
  * description：模板描述
  * performance：性能评分（0-1）
  * successRate：成功率（0-1）
  * isActive：是否激活（true/false）
  * isDefault：是否默认模板（true/false）
  * createdBy：创建者（ai-reverse-engineer）
  * inputRequirements：输入要求描述
  * outputRequirements：输出要求描述
  * outputRules：输出规则描述

# 输出规则
作为Prompt工程专家，你需要：
1. 分析参考文本的专业特征
2. 提取专业要素和术语表达
3. 生成专业严谨的三段式Prompt
4. 保持原文本的专业性和权威性
5. 确保输入输出要求符合业务模块规范
6. 输出规则要体现原文本的专业表达特点`,
      inputRequirements: '参考实例、目标业务模块、实例类型',
      outputRequirements: 'JSON格式，包含inputRequirements、outputRequirements、outputRules、suggestedTemplate',
      outputRules: '作为Prompt工程专家，根据文本特点专业生成符合业务模块要求的三段式结构',
      isDefault: false,
      performance: 0.86,
      successRate: 0.89
    },
    {
      name: 'AI反推-图片反推模板',
      businessModule: 'ai-reverse-engineer',
      content: `AI反推图片内容生成Prompt：

**参考图片：** {{referenceExample}}
**目标业务模块：** {{targetBusinessModule}}
**实例类型：** {{exampleType}}

**图片分析重点：**
- 视觉风格
- 内容结构
- 信息层次
- 表达方式

**反推要求：**
- 结合图片特点
- 适配业务模块
- 保持视觉风格
- 生成实用Prompt

JSON格式输出。`,
      inputRequirements: '参考实例、目标业务模块、实例类型',
      outputRequirements: 'JSON格式，包含inputRequirements、outputRequirements、outputRules',
      outputRules: '作为视觉分析专家，结合图片特点生成符合业务模块的Prompt结构',
      isDefault: false,
      performance: 0.82,
      successRate: 0.85
    },
    {
      name: 'AI反推-视频反推模板',
      businessModule: 'ai-reverse-engineer',
      content: `AI反推视频内容生成Prompt：

**参考视频：** {{referenceExample}}
**目标业务模块：** {{targetBusinessModule}}
**实例类型：** {{exampleType}}

**视频分析重点：**
- 叙事结构
- 节奏把控
- 视觉呈现
- 情感表达

**反推要求：**
- 分析视频特点
- 提取核心要素
- 适配业务需求
- 生成实用模板

JSON格式输出。`,
      inputRequirements: '参考实例、目标业务模块、实例类型',
      outputRequirements: 'JSON格式，包含inputRequirements、outputRequirements、outputRules',
      outputRules: '作为视频分析专家，分析视频特点生成符合业务模块的Prompt结构',
      isDefault: false,
      performance: 0.80,
      successRate: 0.83
    },
    {
      name: 'AI反推-文档反推模板',
      businessModule: 'ai-reverse-engineer',
      content: `AI反推文档内容生成Prompt：

**参考文档：** {{referenceExample}}
**目标业务模块：** {{targetBusinessModule}}
**实例类型：** {{exampleType}}

**文档分析重点：**
- 结构层次
- 语言风格
- 信息密度
- 表达方式

**反推要求：**
- 分析文档结构
- 提取关键信息
- 适配业务模块
- 保持原有风格

JSON格式输出。`,
      inputRequirements: '参考实例、目标业务模块、实例类型',
      outputRequirements: 'JSON格式，包含inputRequirements、outputRequirements、outputRules',
      outputRules: '作为文档分析专家，分析文档结构生成符合业务模块的Prompt结构',
      isDefault: false,
      performance: 0.84,
      successRate: 0.87
    },
    {
      name: 'AI反推-通用反推模板',
      businessModule: 'ai-reverse-engineer',
      content: `AI通用反推生成Prompt：

**参考实例：** {{referenceExample}}
**目标业务模块：** {{targetBusinessModule}}
**实例类型：** {{exampleType}}

**通用分析维度：**
- 内容特点
- 表达风格
- 结构特征
- 适用场景

**反推策略：**
- 多维度分析
- 灵活适配
- 保持特色
- 实用导向

JSON格式输出。`,
      inputRequirements: '参考实例、目标业务模块、实例类型',
      outputRequirements: 'JSON格式，包含inputRequirements、outputRequirements、outputRules',
      outputRules: '作为通用分析专家，多维度分析参考实例生成符合业务模块的Prompt结构',
      isDefault: false,
      performance: 0.81,
      successRate: 0.84
    },

    // 图片实例类型 - 4个模板
    {
      name: 'AI反推-图片-标准反推模板',
      businessModule: 'ai-reverse-engineer',
      instanceType: 'image',
      content: `# 输入要求
请提供以下信息：
- 参考图片：{{referenceExample}}
- 目标业务模块：{{targetBusinessModule}}
- 实例类型：{{exampleType}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "inputRequirements": "输入要求描述",
  "outputRequirements": "输出要求描述", 
  "outputRules": "输出规则描述",
  "suggestedTemplate": {
    "name": "模板名称",
    "businessModule": "目标业务模块",
    "content": "完整的Prompt模板内容",
    "variables": "[]",
    "description": "模板描述",
    "performance": 0.85,
    "successRate": 0.88,
    "isActive": true,
    "isDefault": false,
    "createdBy": "ai-reverse-engineer",
    "inputRequirements": "输入要求描述",
    "outputRequirements": "输出要求描述",
    "outputRules": "输出规则描述"
  }
}

输出规范：
- inputRequirements：定义输入变量，必须符合目标业务模块的标准
- outputRequirements：定义输出格式，必须符合目标业务模块的标准
- outputRules：定义AI角色和风格，这是模板的主要区别点
- suggestedTemplate：生成完整的Prompt模板，包含所有必要字段：
  * name：模板名称
  * businessModule：目标业务模块
  * content：完整的Prompt模板内容（三段式结构）
  * variables：变量数组（JSON字符串格式）
  * description：模板描述
  * performance：性能评分（0-1）
  * successRate：成功率（0-1）
  * isActive：是否激活（true/false）
  * isDefault：是否默认模板（true/false）
  * createdBy：创建者（ai-reverse-engineer）
  * inputRequirements：输入要求描述
  * outputRequirements：输出要求描述
  * outputRules：输出规则描述

# 输出规则
作为视觉分析专家，你需要：
1. 深入分析参考图片的视觉特征和设计元素
2. 提取关键视觉要素和表达方式
3. 生成符合目标业务模块标准的三段式Prompt
4. 保持原图片的视觉风格和表达特征
5. 确保输入输出要求符合业务模块规范
6. 输出规则要体现原图片的视觉分析特点
7. 生成的suggestedTemplate必须包含所有必要字段，确保可以直接保存到数据库
8. content字段必须是完整的三段式Prompt结构（输入要求、输出要求、输出规则）`,
      inputRequirements: '参考图片、目标业务模块、实例类型',
      outputRequirements: 'JSON格式，包含inputRequirements、outputRequirements、outputRules、suggestedTemplate',
      outputRules: '作为视觉分析专家，根据图片特点生成符合业务模块要求的三段式结构',
      isDefault: false,
      performance: 0.85,
      successRate: 0.88
    },
    {
      name: 'AI反推-图片-快速反推模板',
      businessModule: 'ai-reverse-engineer',
      instanceType: 'image',
      content: `# 输入要求
请提供以下信息：
- 参考图片：{{referenceExample}}
- 目标业务模块：{{targetBusinessModule}}
- 实例类型：{{exampleType}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "inputRequirements": "输入要求描述",
  "outputRequirements": "输出要求描述", 
  "outputRules": "输出规则描述",
  "suggestedTemplate": {
    "name": "模板名称",
    "businessModule": "目标业务模块",
    "content": "完整的Prompt模板内容",
    "variables": "[]",
    "description": "模板描述",
    "performance": 0.85,
    "successRate": 0.88,
    "isActive": true,
    "isDefault": false,
    "createdBy": "ai-reverse-engineer",
    "inputRequirements": "输入要求描述",
    "outputRequirements": "输出要求描述",
    "outputRules": "输出规则描述"
  }
}

输出规范：
- inputRequirements：定义输入变量，必须符合目标业务模块的标准
- outputRequirements：定义输出格式，必须符合目标业务模块的标准
- outputRules：定义AI角色和风格，这是模板的主要区别点
- suggestedTemplate：生成完整的Prompt模板，包含所有必要字段：
  * name：模板名称
  * businessModule：目标业务模块
  * content：完整的Prompt模板内容（三段式结构）
  * variables：变量数组（JSON字符串格式）
  * description：模板描述
  * performance：性能评分（0-1）
  * successRate：成功率（0-1）
  * isActive：是否激活（true/false）
  * isDefault：是否默认模板（true/false）
  * createdBy：创建者（ai-reverse-engineer）
  * inputRequirements：输入要求描述
  * outputRequirements：输出要求描述
  * outputRules：输出规则描述

# 输出规则
作为视觉分析专家，你需要：
1. 快速分析参考图片的核心视觉特征
2. 提取关键视觉要素和表达方式
3. 生成简洁高效的三段式Prompt
4. 保持原图片的简洁视觉风格
5. 确保输入输出要求符合业务模块规范
6. 输出规则要体现原图片的快速视觉分析特点`,
      inputRequirements: '参考图片、目标业务模块、实例类型',
      outputRequirements: 'JSON格式，包含inputRequirements、outputRequirements、outputRules、suggestedTemplate',
      outputRules: '作为视觉分析专家，根据图片特点快速生成符合业务模块要求的三段式结构',
      isDefault: false,
      performance: 0.82,
      successRate: 0.85
    },
    {
      name: 'AI反推-图片-深度反推模板',
      businessModule: 'ai-reverse-engineer',
      instanceType: 'image',
      content: `# 输入要求
请提供以下信息：
- 参考图片：{{referenceExample}}
- 目标业务模块：{{targetBusinessModule}}
- 实例类型：{{exampleType}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "inputRequirements": "输入要求描述",
  "outputRequirements": "输出要求描述", 
  "outputRules": "输出规则描述",
  "suggestedTemplate": {
    "name": "模板名称",
    "businessModule": "目标业务模块",
    "content": "完整的Prompt模板内容",
    "variables": "[]",
    "description": "模板描述",
    "performance": 0.85,
    "successRate": 0.88,
    "isActive": true,
    "isDefault": false,
    "createdBy": "ai-reverse-engineer",
    "inputRequirements": "输入要求描述",
    "outputRequirements": "输出要求描述",
    "outputRules": "输出规则描述"
  }
}

输出规范：
- inputRequirements：定义输入变量，必须符合目标业务模块的标准
- outputRequirements：定义输出格式，必须符合目标业务模块的标准
- outputRules：定义AI角色和风格，这是模板的主要区别点
- suggestedTemplate：生成完整的Prompt模板，包含所有必要字段：
  * name：模板名称
  * businessModule：目标业务模块
  * content：完整的Prompt模板内容（三段式结构）
  * variables：变量数组（JSON字符串格式）
  * description：模板描述
  * performance：性能评分（0-1）
  * successRate：成功率（0-1）
  * isActive：是否激活（true/false）
  * isDefault：是否默认模板（true/false）
  * createdBy：创建者（ai-reverse-engineer）
  * inputRequirements：输入要求描述
  * outputRequirements：输出要求描述
  * outputRules：输出规则描述

# 输出规则
作为视觉分析专家，你需要：
1. 深度分析参考图片的细节视觉特征
2. 提取复杂视觉要素和深层结构
3. 生成详细完整的三段式Prompt
4. 保持原图片的深度和复杂性
5. 确保输入输出要求符合业务模块规范
6. 输出规则要体现原图片的深度视觉分析特点`,
      inputRequirements: '参考图片、目标业务模块、实例类型',
      outputRequirements: 'JSON格式，包含inputRequirements、outputRequirements、outputRules、suggestedTemplate',
      outputRules: '作为视觉分析专家，根据图片特点深度生成符合业务模块要求的三段式结构',
      isDefault: false,
      performance: 0.88,
      successRate: 0.90
    },
    {
      name: 'AI反推-图片-创意反推模板',
      businessModule: 'ai-reverse-engineer',
      instanceType: 'image',
      content: `# 输入要求
请提供以下信息：
- 参考图片：{{referenceExample}}
- 目标业务模块：{{targetBusinessModule}}
- 实例类型：{{exampleType}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "inputRequirements": "输入要求描述",
  "outputRequirements": "输出要求描述", 
  "outputRules": "输出规则描述",
  "suggestedTemplate": {
    "name": "模板名称",
    "businessModule": "目标业务模块",
    "content": "完整的Prompt模板内容",
    "variables": "[]",
    "description": "模板描述",
    "performance": 0.85,
    "successRate": 0.88,
    "isActive": true,
    "isDefault": false,
    "createdBy": "ai-reverse-engineer",
    "inputRequirements": "输入要求描述",
    "outputRequirements": "输出要求描述",
    "outputRules": "输出规则描述"
  }
}

输出规范：
- inputRequirements：定义输入变量，必须符合目标业务模块的标准
- outputRequirements：定义输出格式，必须符合目标业务模块的标准
- outputRules：定义AI角色和风格，这是模板的主要区别点
- suggestedTemplate：生成完整的Prompt模板，包含所有必要字段：
  * name：模板名称
  * businessModule：目标业务模块
  * content：完整的Prompt模板内容（三段式结构）
  * variables：变量数组（JSON字符串格式）
  * description：模板描述
  * performance：性能评分（0-1）
  * successRate：成功率（0-1）
  * isActive：是否激活（true/false）
  * isDefault：是否默认模板（true/false）
  * createdBy：创建者（ai-reverse-engineer）
  * inputRequirements：输入要求描述
  * outputRequirements：输出要求描述
  * outputRules：输出规则描述

# 输出规则
作为视觉分析专家，你需要：
1. 分析参考图片的创意视觉特征
2. 提取创新视觉要素和独特表达
3. 生成富有创意的三段式Prompt
4. 保持原图片的创意和独特性
5. 确保输入输出要求符合业务模块规范
6. 输出规则要体现原图片的创意视觉表达特点`,
      inputRequirements: '参考图片、目标业务模块、实例类型',
      outputRequirements: 'JSON格式，包含inputRequirements、outputRequirements、outputRules、suggestedTemplate',
      outputRules: '作为视觉分析专家，根据图片特点创意生成符合业务模块要求的三段式结构',
      isDefault: false,
      performance: 0.83,
      successRate: 0.87
    },

    // 视频实例类型 - 4个模板
    {
      name: 'AI反推-视频-标准反推模板',
      businessModule: 'ai-reverse-engineer',
      instanceType: 'video',
      content: `# 输入要求
请提供以下信息：
- 参考视频：{{referenceExample}}
- 目标业务模块：{{targetBusinessModule}}
- 实例类型：{{exampleType}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "inputRequirements": "输入要求描述",
  "outputRequirements": "输出要求描述", 
  "outputRules": "输出规则描述",
  "suggestedTemplate": {
    "name": "模板名称",
    "businessModule": "目标业务模块",
    "content": "完整的Prompt模板内容",
    "variables": "[]",
    "description": "模板描述",
    "performance": 0.85,
    "successRate": 0.88,
    "isActive": true,
    "isDefault": false,
    "createdBy": "ai-reverse-engineer",
    "inputRequirements": "输入要求描述",
    "outputRequirements": "输出要求描述",
    "outputRules": "输出规则描述"
  }
}

输出规范：
- inputRequirements：定义输入变量，必须符合目标业务模块的标准
- outputRequirements：定义输出格式，必须符合目标业务模块的标准
- outputRules：定义AI角色和风格，这是模板的主要区别点
- suggestedTemplate：生成完整的Prompt模板，包含所有必要字段：
  * name：模板名称
  * businessModule：目标业务模块
  * content：完整的Prompt模板内容（三段式结构）
  * variables：变量数组（JSON字符串格式）
  * description：模板描述
  * performance：性能评分（0-1）
  * successRate：成功率（0-1）
  * isActive：是否激活（true/false）
  * isDefault：是否默认模板（true/false）
  * createdBy：创建者（ai-reverse-engineer）
  * inputRequirements：输入要求描述
  * outputRequirements：输出要求描述
  * outputRules：输出规则描述

# 输出规则
作为视频分析专家，你需要：
1. 深入分析参考视频的叙事结构和表达方式
2. 提取关键视频要素和节奏特征
3. 生成符合目标业务模块标准的三段式Prompt
4. 保持原视频的叙事风格和表达特征
5. 确保输入输出要求符合业务模块规范
6. 输出规则要体现原视频的视频分析特点
7. 生成的suggestedTemplate必须包含所有必要字段，确保可以直接保存到数据库
8. content字段必须是完整的三段式Prompt结构（输入要求、输出要求、输出规则）`,
      inputRequirements: '参考视频、目标业务模块、实例类型',
      outputRequirements: 'JSON格式，包含inputRequirements、outputRequirements、outputRules、suggestedTemplate',
      outputRules: '作为视频分析专家，根据视频特点生成符合业务模块要求的三段式结构',
      isDefault: false,
      performance: 0.85,
      successRate: 0.88
    },
    {
      name: 'AI反推-视频-快速反推模板',
      businessModule: 'ai-reverse-engineer',
      instanceType: 'video',
      content: `# 输入要求
请提供以下信息：
- 参考视频：{{referenceExample}}
- 目标业务模块：{{targetBusinessModule}}
- 实例类型：{{exampleType}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "inputRequirements": "输入要求描述",
  "outputRequirements": "输出要求描述", 
  "outputRules": "输出规则描述",
  "suggestedTemplate": {
    "name": "模板名称",
    "businessModule": "目标业务模块",
    "content": "完整的Prompt模板内容",
    "variables": "[]",
    "description": "模板描述",
    "performance": 0.85,
    "successRate": 0.88,
    "isActive": true,
    "isDefault": false,
    "createdBy": "ai-reverse-engineer",
    "inputRequirements": "输入要求描述",
    "outputRequirements": "输出要求描述",
    "outputRules": "输出规则描述"
  }
}

输出规范：
- inputRequirements：定义输入变量，必须符合目标业务模块的标准
- outputRequirements：定义输出格式，必须符合目标业务模块的标准
- outputRules：定义AI角色和风格，这是模板的主要区别点
- suggestedTemplate：生成完整的Prompt模板，包含所有必要字段：
  * name：模板名称
  * businessModule：目标业务模块
  * content：完整的Prompt模板内容（三段式结构）
  * variables：变量数组（JSON字符串格式）
  * description：模板描述
  * performance：性能评分（0-1）
  * successRate：成功率（0-1）
  * isActive：是否激活（true/false）
  * isDefault：是否默认模板（true/false）
  * createdBy：创建者（ai-reverse-engineer）
  * inputRequirements：输入要求描述
  * outputRequirements：输出要求描述
  * outputRules：输出规则描述

# 输出规则
作为视频分析专家，你需要：
1. 快速分析参考视频的核心叙事特征
2. 提取关键视频要素和表达方式
3. 生成简洁高效的三段式Prompt
4. 保持原视频的简洁叙事风格
5. 确保输入输出要求符合业务模块规范
6. 输出规则要体现原视频的快速视频分析特点`,
      inputRequirements: '参考视频、目标业务模块、实例类型',
      outputRequirements: 'JSON格式，包含inputRequirements、outputRequirements、outputRules、suggestedTemplate',
      outputRules: '作为视频分析专家，根据视频特点快速生成符合业务模块要求的三段式结构',
      isDefault: false,
      performance: 0.82,
      successRate: 0.85
    },
    {
      name: 'AI反推-视频-深度反推模板',
      businessModule: 'ai-reverse-engineer',
      instanceType: 'video',
      content: `# 输入要求
请提供以下信息：
- 参考视频：{{referenceExample}}
- 目标业务模块：{{targetBusinessModule}}
- 实例类型：{{exampleType}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "inputRequirements": "输入要求描述",
  "outputRequirements": "输出要求描述", 
  "outputRules": "输出规则描述",
  "suggestedTemplate": {
    "name": "模板名称",
    "businessModule": "目标业务模块",
    "content": "完整的Prompt模板内容",
    "variables": "[]",
    "description": "模板描述",
    "performance": 0.85,
    "successRate": 0.88,
    "isActive": true,
    "isDefault": false,
    "createdBy": "ai-reverse-engineer",
    "inputRequirements": "输入要求描述",
    "outputRequirements": "输出要求描述",
    "outputRules": "输出规则描述"
  }
}

输出规范：
- inputRequirements：定义输入变量，必须符合目标业务模块的标准
- outputRequirements：定义输出格式，必须符合目标业务模块的标准
- outputRules：定义AI角色和风格，这是模板的主要区别点
- suggestedTemplate：生成完整的Prompt模板，包含所有必要字段：
  * name：模板名称
  * businessModule：目标业务模块
  * content：完整的Prompt模板内容（三段式结构）
  * variables：变量数组（JSON字符串格式）
  * description：模板描述
  * performance：性能评分（0-1）
  * successRate：成功率（0-1）
  * isActive：是否激活（true/false）
  * isDefault：是否默认模板（true/false）
  * createdBy：创建者（ai-reverse-engineer）
  * inputRequirements：输入要求描述
  * outputRequirements：输出要求描述
  * outputRules：输出规则描述

# 输出规则
作为视频分析专家，你需要：
1. 深度分析参考视频的细节叙事特征
2. 提取复杂视频要素和深层结构
3. 生成详细完整的三段式Prompt
4. 保持原视频的深度和复杂性
5. 确保输入输出要求符合业务模块规范
6. 输出规则要体现原视频的深度视频分析特点`,
      inputRequirements: '参考视频、目标业务模块、实例类型',
      outputRequirements: 'JSON格式，包含inputRequirements、outputRequirements、outputRules、suggestedTemplate',
      outputRules: '作为视频分析专家，根据视频特点深度生成符合业务模块要求的三段式结构',
      isDefault: false,
      performance: 0.88,
      successRate: 0.90
    },
    {
      name: 'AI反推-视频-创意反推模板',
      businessModule: 'ai-reverse-engineer',
      instanceType: 'video',
      content: `# 输入要求
请提供以下信息：
- 参考视频：{{referenceExample}}
- 目标业务模块：{{targetBusinessModule}}
- 实例类型：{{exampleType}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "inputRequirements": "输入要求描述",
  "outputRequirements": "输出要求描述", 
  "outputRules": "输出规则描述",
  "suggestedTemplate": {
    "name": "模板名称",
    "businessModule": "目标业务模块",
    "content": "完整的Prompt模板内容",
    "variables": "[]",
    "description": "模板描述",
    "performance": 0.85,
    "successRate": 0.88,
    "isActive": true,
    "isDefault": false,
    "createdBy": "ai-reverse-engineer",
    "inputRequirements": "输入要求描述",
    "outputRequirements": "输出要求描述",
    "outputRules": "输出规则描述"
  }
}

输出规范：
- inputRequirements：定义输入变量，必须符合目标业务模块的标准
- outputRequirements：定义输出格式，必须符合目标业务模块的标准
- outputRules：定义AI角色和风格，这是模板的主要区别点
- suggestedTemplate：生成完整的Prompt模板，包含所有必要字段：
  * name：模板名称
  * businessModule：目标业务模块
  * content：完整的Prompt模板内容（三段式结构）
  * variables：变量数组（JSON字符串格式）
  * description：模板描述
  * performance：性能评分（0-1）
  * successRate：成功率（0-1）
  * isActive：是否激活（true/false）
  * isDefault：是否默认模板（true/false）
  * createdBy：创建者（ai-reverse-engineer）
  * inputRequirements：输入要求描述
  * outputRequirements：输出要求描述
  * outputRules：输出规则描述

# 输出规则
作为视频分析专家，你需要：
1. 分析参考视频的创意叙事特征
2. 提取创新视频要素和独特表达
3. 生成富有创意的三段式Prompt
4. 保持原视频的创意和独特性
5. 确保输入输出要求符合业务模块规范
6. 输出规则要体现原视频的创意视频表达特点`,
      inputRequirements: '参考视频、目标业务模块、实例类型',
      outputRequirements: 'JSON格式，包含inputRequirements、outputRequirements、outputRules、suggestedTemplate',
      outputRules: '作为视频分析专家，根据视频特点创意生成符合业务模块要求的三段式结构',
      isDefault: false,
      performance: 0.83,
      successRate: 0.87
    },

    // 通用实例类型 - 4个模板
    {
      name: 'AI反推-通用-标准反推模板',
      businessModule: 'ai-reverse-engineer',
      instanceType: 'general',
      content: `# 输入要求
请提供以下信息：
- 参考实例：{{referenceExample}}
- 目标业务模块：{{targetBusinessModule}}
- 实例类型：{{exampleType}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "inputRequirements": "输入要求描述",
  "outputRequirements": "输出要求描述", 
  "outputRules": "输出规则描述",
  "suggestedTemplate": {
    "name": "模板名称",
    "businessModule": "目标业务模块",
    "content": "完整的Prompt模板内容",
    "variables": "[]",
    "description": "模板描述",
    "performance": 0.85,
    "successRate": 0.88,
    "isActive": true,
    "isDefault": false,
    "createdBy": "ai-reverse-engineer",
    "inputRequirements": "输入要求描述",
    "outputRequirements": "输出要求描述",
    "outputRules": "输出规则描述"
  }
}

输出规范：
- inputRequirements：定义输入变量，必须符合目标业务模块的标准
- outputRequirements：定义输出格式，必须符合目标业务模块的标准
- outputRules：定义AI角色和风格，这是模板的主要区别点
- suggestedTemplate：生成完整的Prompt模板，包含所有必要字段：
  * name：模板名称
  * businessModule：目标业务模块
  * content：完整的Prompt模板内容（三段式结构）
  * variables：变量数组（JSON字符串格式）
  * description：模板描述
  * performance：性能评分（0-1）
  * successRate：成功率（0-1）
  * isActive：是否激活（true/false）
  * isDefault：是否默认模板（true/false）
  * createdBy：创建者（ai-reverse-engineer）
  * inputRequirements：输入要求描述
  * outputRequirements：输出要求描述
  * outputRules：输出规则描述

# 输出规则
作为通用分析专家，你需要：
1. 深入分析参考实例的特点和风格
2. 提取关键要素和结构特征
3. 生成符合目标业务模块标准的三段式Prompt
4. 保持原实例的风格特征和表达方式
5. 确保输入输出要求符合业务模块规范
6. 输出规则要体现原实例的通用分析特点
7. 生成的suggestedTemplate必须包含所有必要字段，确保可以直接保存到数据库
8. content字段必须是完整的三段式Prompt结构（输入要求、输出要求、输出规则）`,
      inputRequirements: '参考实例、目标业务模块、实例类型',
      outputRequirements: 'JSON格式，包含inputRequirements、outputRequirements、outputRules、suggestedTemplate',
      outputRules: '作为通用分析专家，根据实例特点生成符合业务模块要求的三段式结构',
      isDefault: false,
      performance: 0.85,
      successRate: 0.88
    },
    {
      name: 'AI反推-通用-快速反推模板',
      businessModule: 'ai-reverse-engineer',
      instanceType: 'general',
      content: `# 输入要求
请提供以下信息：
- 参考实例：{{referenceExample}}
- 目标业务模块：{{targetBusinessModule}}
- 实例类型：{{exampleType}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "inputRequirements": "输入要求描述",
  "outputRequirements": "输出要求描述", 
  "outputRules": "输出规则描述",
  "suggestedTemplate": {
    "name": "模板名称",
    "businessModule": "目标业务模块",
    "content": "完整的Prompt模板内容",
    "variables": "[]",
    "description": "模板描述",
    "performance": 0.85,
    "successRate": 0.88,
    "isActive": true,
    "isDefault": false,
    "createdBy": "ai-reverse-engineer",
    "inputRequirements": "输入要求描述",
    "outputRequirements": "输出要求描述",
    "outputRules": "输出规则描述"
  }
}

输出规范：
- inputRequirements：定义输入变量，必须符合目标业务模块的标准
- outputRequirements：定义输出格式，必须符合目标业务模块的标准
- outputRules：定义AI角色和风格，这是模板的主要区别点
- suggestedTemplate：生成完整的Prompt模板，包含所有必要字段：
  * name：模板名称
  * businessModule：目标业务模块
  * content：完整的Prompt模板内容（三段式结构）
  * variables：变量数组（JSON字符串格式）
  * description：模板描述
  * performance：性能评分（0-1）
  * successRate：成功率（0-1）
  * isActive：是否激活（true/false）
  * isDefault：是否默认模板（true/false）
  * createdBy：创建者（ai-reverse-engineer）
  * inputRequirements：输入要求描述
  * outputRequirements：输出要求描述
  * outputRules：输出规则描述

# 输出规则
作为通用分析专家，你需要：
1. 快速分析参考实例的核心特征
2. 提取关键要素和表达方式
3. 生成简洁高效的三段式Prompt
4. 保持原实例的简洁风格
5. 确保输入输出要求符合业务模块规范
6. 输出规则要体现原实例的快速分析特点`,
      inputRequirements: '参考实例、目标业务模块、实例类型',
      outputRequirements: 'JSON格式，包含inputRequirements、outputRequirements、outputRules、suggestedTemplate',
      outputRules: '作为通用分析专家，根据实例特点快速生成符合业务模块要求的三段式结构',
      isDefault: false,
      performance: 0.82,
      successRate: 0.85
    },
    {
      name: 'AI反推-通用-深度反推模板',
      businessModule: 'ai-reverse-engineer',
      instanceType: 'general',
      content: `# 输入要求
请提供以下信息：
- 参考实例：{{referenceExample}}
- 目标业务模块：{{targetBusinessModule}}
- 实例类型：{{exampleType}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "inputRequirements": "输入要求描述",
  "outputRequirements": "输出要求描述", 
  "outputRules": "输出规则描述",
  "suggestedTemplate": {
    "name": "模板名称",
    "businessModule": "目标业务模块",
    "content": "完整的Prompt模板内容",
    "variables": "[]",
    "description": "模板描述",
    "performance": 0.85,
    "successRate": 0.88,
    "isActive": true,
    "isDefault": false,
    "createdBy": "ai-reverse-engineer",
    "inputRequirements": "输入要求描述",
    "outputRequirements": "输出要求描述",
    "outputRules": "输出规则描述"
  }
}

输出规范：
- inputRequirements：定义输入变量，必须符合目标业务模块的标准
- outputRequirements：定义输出格式，必须符合目标业务模块的标准
- outputRules：定义AI角色和风格，这是模板的主要区别点
- suggestedTemplate：生成完整的Prompt模板，包含所有必要字段：
  * name：模板名称
  * businessModule：目标业务模块
  * content：完整的Prompt模板内容（三段式结构）
  * variables：变量数组（JSON字符串格式）
  * description：模板描述
  * performance：性能评分（0-1）
  * successRate：成功率（0-1）
  * isActive：是否激活（true/false）
  * isDefault：是否默认模板（true/false）
  * createdBy：创建者（ai-reverse-engineer）
  * inputRequirements：输入要求描述
  * outputRequirements：输出要求描述
  * outputRules：输出规则描述

# 输出规则
作为通用分析专家，你需要：
1. 深度分析参考实例的细节特征
2. 提取复杂要素和深层结构
3. 生成详细完整的三段式Prompt
4. 保持原实例的深度和复杂性
5. 确保输入输出要求符合业务模块规范
6. 输出规则要体现原实例的深度分析特点`,
      inputRequirements: '参考实例、目标业务模块、实例类型',
      outputRequirements: 'JSON格式，包含inputRequirements、outputRequirements、outputRules、suggestedTemplate',
      outputRules: '作为通用分析专家，根据实例特点深度生成符合业务模块要求的三段式结构',
      isDefault: false,
      performance: 0.88,
      successRate: 0.90
    },
    {
      name: 'AI反推-通用-创意反推模板',
      businessModule: 'ai-reverse-engineer',
      instanceType: 'general',
      content: `# 输入要求
请提供以下信息：
- 参考实例：{{referenceExample}}
- 目标业务模块：{{targetBusinessModule}}
- 实例类型：{{exampleType}}

# 输出要求
请严格按照以下JSON格式输出，不要包含任何其他文字：
{
  "inputRequirements": "输入要求描述",
  "outputRequirements": "输出要求描述", 
  "outputRules": "输出规则描述",
  "suggestedTemplate": {
    "name": "模板名称",
    "businessModule": "目标业务模块",
    "content": "完整的Prompt模板内容",
    "variables": "[]",
    "description": "模板描述",
    "performance": 0.85,
    "successRate": 0.88,
    "isActive": true,
    "isDefault": false,
    "createdBy": "ai-reverse-engineer",
    "inputRequirements": "输入要求描述",
    "outputRequirements": "输出要求描述",
    "outputRules": "输出规则描述"
  }
}

输出规范：
- inputRequirements：定义输入变量，必须符合目标业务模块的标准
- outputRequirements：定义输出格式，必须符合目标业务模块的标准
- outputRules：定义AI角色和风格，这是模板的主要区别点
- suggestedTemplate：生成完整的Prompt模板，包含所有必要字段：
  * name：模板名称
  * businessModule：目标业务模块
  * content：完整的Prompt模板内容（三段式结构）
  * variables：变量数组（JSON字符串格式）
  * description：模板描述
  * performance：性能评分（0-1）
  * successRate：成功率（0-1）
  * isActive：是否激活（true/false）
  * isDefault：是否默认模板（true/false）
  * createdBy：创建者（ai-reverse-engineer）
  * inputRequirements：输入要求描述
  * outputRequirements：输出要求描述
  * outputRules：输出规则描述

# 输出规则
作为通用分析专家，你需要：
1. 分析参考实例的创意特征
2. 提取创新要素和独特表达
3. 生成富有创意的三段式Prompt
4. 保持原实例的创意和独特性
5. 确保输入输出要求符合业务模块规范
6. 输出规则要体现原实例的创意表达特点`,
      inputRequirements: '参考实例、目标业务模块、实例类型',
      outputRequirements: 'JSON格式，包含inputRequirements、outputRequirements、outputRules、suggestedTemplate',
      outputRules: '作为通用分析专家，根据实例特点创意生成符合业务模块要求的三段式结构',
      isDefault: false,
      performance: 0.83,
      successRate: 0.87
    }
  ];

  console.log(`准备创建 ${defaultTemplates.length} 个默认模板...`);

  for (const template of defaultTemplates) {
    try {
      await prisma.promptTemplate.upsert({
        where: {
          id: `${template.businessModule}-${template.name.replace(/\s+/g, '-').toLowerCase()}`
        },
        update: {
          content: template.content,
          inputRequirements: template.inputRequirements,
          outputRequirements: template.outputRequirements,
          outputRules: template.outputRules,
          performance: template.performance,
          successRate: template.successRate,
          isDefault: template.isDefault
        },
        create: {
          id: `${template.businessModule}-${template.name.replace(/\s+/g, '-').toLowerCase()}`,
          name: template.name,
          businessModule: template.businessModule,
          content: template.content,
          inputRequirements: template.inputRequirements,
          outputRequirements: template.outputRequirements,
          outputRules: template.outputRules,
          variables: JSON.stringify([]),
          description: `默认${template.businessModule}模板`,
          performance: template.performance,
          successRate: template.successRate,
          isActive: true,
          isDefault: template.isDefault,
          createdBy: 'system'
        }
      });
      console.log(`✅ 创建模板: ${template.name}`);
    } catch (error) {
      console.error(`❌ 创建模板失败: ${template.name}`, error.message);
    }
  }

  console.log('默认模板库初始化完成！');
}

main()
  .catch((e) => {
    console.error('初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
 