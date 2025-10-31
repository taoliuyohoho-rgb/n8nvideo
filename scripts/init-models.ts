/**
 * 初始化模型数据到数据库
 * 应用启动时执行一次
 */

import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';

async function initModels() {
  console.log('[init-models] 开始同步模型到数据库...');
  const startTime = Date.now();
  
  try {
    const verifiedFile = path.join(process.cwd(), 'verified-models.json');
    if (!fs.existsSync(verifiedFile)) {
      console.warn('[init-models] verified-models.json 不存在，跳过');
      return;
    }
    
    const raw = fs.readFileSync(verifiedFile, 'utf8');
    const list = JSON.parse(raw);
    
    let syncCount = 0;
    let skipCount = 0;
    
    if (Array.isArray(list)) {
      for (const item of list) {
        if (item.provider && item.models && Array.isArray(item.models)) {
          const provider = item.provider;
          for (const config of item.models) {
            if (config.modelName) {
              // 使用 upsert 而不是 findFirst + create
              await prisma.estimationModel.upsert({
                where: {
                  provider_modelName: {
                    provider,
                    modelName: config.modelName,
                  }
                },
                update: {
                  langs: JSON.stringify(config.langs),
                  maxContext: config.maxContext,
                  pricePer1kTokens: config.pricePer1kTokens,
                  toolUseSupport: config.toolUseSupport,
                  jsonModeSupport: config.jsonModeSupport,
                },
                create: {
                  provider,
                  modelName: config.modelName,
                  version: null,
                  langs: JSON.stringify(config.langs),
                  maxContext: config.maxContext,
                  pricePer1kTokens: config.pricePer1kTokens,
                  rateLimit: 10000,
                  toolUseSupport: config.toolUseSupport,
                  jsonModeSupport: config.jsonModeSupport,
                  status: 'active',
                  staticCapability: JSON.stringify({
                    strengthTags: ['verified', 'recommended']
                  }),
                },
              });
              syncCount++;
            }
          }
        }
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[init-models] 同步完成: ${syncCount} 个模型, 耗时 ${duration}ms`);
  } catch (error) {
    console.error('[init-models] 同步失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initModels()
    .then(() => {
      console.log('[init-models] 完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[init-models] 错误:', error);
      process.exit(1);
    });
}

export { initModels };

