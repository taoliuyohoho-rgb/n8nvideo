/**
 * 初始化预估模型池
 * 从 verified-models.json 和 ai-config.json 导入模型到 estimation_models 表
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// 模型默认配置
const DEFAULT_MODELS = [
  {
    provider: 'openai',
    modelName: 'gpt-4o',
    version: 'gpt-4o-2024-11-20',
    langs: ['zh', 'en', 'ms', 'id', 'th', 'vi'],
    maxContext: 128000,
    pricePer1kTokens: 0.0025,
    rateLimit: 10000,
    toolUseSupport: true,
    jsonModeSupport: true,
    status: 'active',
    staticCapability: {
      strengthTags: ['structured_output', 'multilingual', 'reasoning'],
    },
  },
  {
    provider: 'openai',
    modelName: 'gpt-4o-mini',
    version: 'gpt-4o-mini-2024-07-18',
    langs: ['zh', 'en', 'ms', 'id', 'th', 'vi'],
    maxContext: 128000,
    pricePer1kTokens: 0.00015,
    rateLimit: 10000,
    toolUseSupport: true,
    jsonModeSupport: true,
    status: 'active',
    staticCapability: {
      strengthTags: ['fast', 'affordable', 'structured_output'],
    },
  },
  {
    provider: 'doubao',
    modelName: 'doubao-pro-32k',
    version: null,
    langs: ['zh', 'en'],
    maxContext: 32000,
    pricePer1kTokens: 0.0008,
    rateLimit: 5000,
    toolUseSupport: false,
    jsonModeSupport: true,
    status: 'active',
    staticCapability: {
      strengthTags: ['chinese', 'affordable'],
    },
  },
  {
    provider: 'anthropic',
    modelName: 'claude-3-5-sonnet-20241022',
    version: null,
    langs: ['zh', 'en', 'ms', 'id', 'th', 'vi'],
    maxContext: 200000,
    pricePer1kTokens: 0.003,
    rateLimit: 4000,
    toolUseSupport: true,
    jsonModeSupport: true,
    status: 'active',
    staticCapability: {
      strengthTags: ['reasoning', 'long_context', 'multilingual'],
    },
  },
  {
    provider: 'openai',
    modelName: 'gpt-3.5-turbo',
    version: 'gpt-3.5-turbo-0125',
    langs: ['zh', 'en', 'ms', 'id', 'th', 'vi'],
    maxContext: 16385,
    pricePer1kTokens: 0.0005,
    rateLimit: 10000,
    toolUseSupport: true,
    jsonModeSupport: true,
    status: 'active',
    staticCapability: {
      strengthTags: ['fast', 'affordable'],
    },
  },
];

async function main() {
  console.log('Starting model pool initialization...');

  // Try to load from verified-models.json or ai-config.json
  let modelsFromFile = [];
  
  const verifiedModelsPath = path.join(process.cwd(), 'verified-models.json');
  const aiConfigPath = path.join(process.cwd(), 'ai-config.json');

  if (fs.existsSync(verifiedModelsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(verifiedModelsPath, 'utf8'));
      if (data.models && Array.isArray(data.models)) {
        modelsFromFile = data.models;
        console.log(`Loaded ${modelsFromFile.length} models from verified-models.json`);
      }
    } catch (error) {
      console.warn('Failed to parse verified-models.json:', error.message);
    }
  }

  if (modelsFromFile.length === 0 && fs.existsSync(aiConfigPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(aiConfigPath, 'utf8'));
      // Convert ai-config.json structure to model format (if applicable)
      // For now, skip and use defaults
    } catch (error) {
      console.warn('Failed to parse ai-config.json:', error.message);
    }
  }

  const modelsToImport = modelsFromFile.length > 0 ? modelsFromFile : DEFAULT_MODELS;

  let imported = 0;
  let updated = 0;

  for (const model of modelsToImport) {
    try {
      const existing = await prisma.estimationModel.findUnique({
        where: {
          provider_modelName: {
            provider: model.provider,
            modelName: model.modelName,
          },
        },
      });

      if (existing) {
        await prisma.estimationModel.update({
          where: { id: existing.id },
          data: {
            version: model.version,
            langs: JSON.stringify(model.langs),
            maxContext: model.maxContext,
            pricePer1kTokens: model.pricePer1kTokens,
            rateLimit: model.rateLimit,
            toolUseSupport: model.toolUseSupport ?? false,
            jsonModeSupport: model.jsonModeSupport ?? false,
            status: model.status ?? 'active',
            staticCapability: model.staticCapability ? JSON.stringify(model.staticCapability) : null,
            updatedAt: new Date(),
          },
        });
        updated++;
        console.log(`✓ Updated: ${model.provider}/${model.modelName}`);
      } else {
        await prisma.estimationModel.create({
          data: {
            provider: model.provider,
            modelName: model.modelName,
            version: model.version,
            langs: JSON.stringify(model.langs),
            maxContext: model.maxContext,
            pricePer1kTokens: model.pricePer1kTokens,
            rateLimit: model.rateLimit,
            toolUseSupport: model.toolUseSupport ?? false,
            jsonModeSupport: model.jsonModeSupport ?? false,
            status: model.status ?? 'active',
            staticCapability: model.staticCapability ? JSON.stringify(model.staticCapability) : null,
          },
        });
        imported++;
        console.log(`✓ Imported: ${model.provider}/${model.modelName}`);
      }
    } catch (error) {
      console.error(`✗ Failed to import ${model.provider}/${model.modelName}:`, error.message);
    }
  }

  console.log(`\nModel pool initialization complete!`);
  console.log(`- Imported: ${imported}`);
  console.log(`- Updated: ${updated}`);
  console.log(`- Total: ${imported + updated}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });














