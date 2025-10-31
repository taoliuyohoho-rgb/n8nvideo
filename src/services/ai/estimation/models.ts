/**
 * 预估模型 (Estimation Model) - 模型池管理
 * 管理候选B池（models表）的读写与能力画像
 */

import { prisma } from '@/lib/prisma';
import type { ModelRecord } from './types';


/**
 * 获取所有可用模型
 */
export async function getActiveModels(): Promise<ModelRecord[]> {
  const models = await prisma.estimationModel.findMany({
    where: { status: 'active' },
    orderBy: { createdAt: 'desc' },
  });

  return models.map(m => ({
    id: m.id,
    provider: m.provider,
    modelName: m.modelName,
    version: m.version,
    langs: JSON.parse(m.langs),
    maxContext: m.maxContext,
    pricePer1kTokens: m.pricePer1kTokens,
    rateLimit: m.rateLimit,
    toolUseSupport: m.toolUseSupport,
    jsonModeSupport: m.jsonModeSupport,
    status: m.status,
    staticCapability: m.staticCapability ? JSON.parse(m.staticCapability) : undefined,
    dynamicMetrics: m.dynamicMetrics ? JSON.parse(m.dynamicMetrics) : undefined,
  }));
}

/**
 * 根据ID获取模型
 */
export async function getModelById(modelId: string): Promise<ModelRecord | null> {
  const model = await prisma.estimationModel.findUnique({
    where: { id: modelId },
  });

  if (!model) return null;

  return {
    id: model.id,
    provider: model.provider,
    modelName: model.modelName,
    version: model.version,
    langs: JSON.parse(model.langs),
    maxContext: model.maxContext,
    pricePer1kTokens: model.pricePer1kTokens,
    rateLimit: model.rateLimit,
    toolUseSupport: model.toolUseSupport,
    jsonModeSupport: model.jsonModeSupport,
    status: model.status,
    staticCapability: model.staticCapability ? JSON.parse(model.staticCapability) : undefined,
    dynamicMetrics: model.dynamicMetrics ? JSON.parse(model.dynamicMetrics) : undefined,
  };
}

/**
 * 根据provider和modelName获取模型
 */
export async function getModelByName(provider: string, modelName: string): Promise<ModelRecord | null> {
  const model = await prisma.estimationModel.findUnique({
    where: { 
      provider_modelName: {
        provider,
        modelName,
      }
    },
  });

  if (!model) return null;

  return {
    id: model.id,
    provider: model.provider,
    modelName: model.modelName,
    version: model.version,
    langs: JSON.parse(model.langs),
    maxContext: model.maxContext,
    pricePer1kTokens: model.pricePer1kTokens,
    rateLimit: model.rateLimit,
    toolUseSupport: model.toolUseSupport,
    jsonModeSupport: model.jsonModeSupport,
    status: model.status,
    staticCapability: model.staticCapability ? JSON.parse(model.staticCapability) : undefined,
    dynamicMetrics: model.dynamicMetrics ? JSON.parse(model.dynamicMetrics) : undefined,
  };
}

/**
 * 创建或更新模型（Upsert）
 */
export async function upsertModel(data: {
  provider: string;
  modelName: string;
  version?: string;
  langs: string[];
  maxContext: number;
  pricePer1kTokens: number;
  rateLimit?: number;
  toolUseSupport?: boolean;
  jsonModeSupport?: boolean;
  status?: string;
  staticCapability?: Record<string, unknown>;
  dynamicMetrics?: Record<string, unknown>;
}): Promise<ModelRecord> {
  const model = await prisma.estimationModel.upsert({
    where: {
      provider_modelName: {
        provider: data.provider,
        modelName: data.modelName,
      },
    },
    create: {
      provider: data.provider,
      modelName: data.modelName,
      version: data.version,
      langs: JSON.stringify(data.langs),
      maxContext: data.maxContext,
      pricePer1kTokens: data.pricePer1kTokens,
      rateLimit: data.rateLimit,
      toolUseSupport: data.toolUseSupport ?? false,
      jsonModeSupport: data.jsonModeSupport ?? false,
      status: data.status ?? 'active',
      staticCapability: data.staticCapability ? JSON.stringify(data.staticCapability) : null,
      dynamicMetrics: data.dynamicMetrics ? JSON.stringify(data.dynamicMetrics) : null,
    },
    update: {
      version: data.version,
      langs: JSON.stringify(data.langs),
      maxContext: data.maxContext,
      pricePer1kTokens: data.pricePer1kTokens,
      rateLimit: data.rateLimit,
      toolUseSupport: data.toolUseSupport ?? false,
      jsonModeSupport: data.jsonModeSupport ?? false,
      status: data.status ?? 'active',
      staticCapability: data.staticCapability ? JSON.stringify(data.staticCapability) : null,
      dynamicMetrics: data.dynamicMetrics ? JSON.stringify(data.dynamicMetrics) : null,
      updatedAt: new Date(),
    },
  });

  return {
    id: model.id,
    provider: model.provider,
    modelName: model.modelName,
    version: model.version,
    langs: JSON.parse(model.langs),
    maxContext: model.maxContext,
    pricePer1kTokens: model.pricePer1kTokens,
    rateLimit: model.rateLimit,
    toolUseSupport: model.toolUseSupport,
    jsonModeSupport: model.jsonModeSupport,
    status: model.status,
    staticCapability: model.staticCapability ? JSON.parse(model.staticCapability) : undefined,
    dynamicMetrics: model.dynamicMetrics ? JSON.parse(model.dynamicMetrics) : undefined,
  };
}

/**
 * 更新模型状态
 */
export async function updateModelStatus(modelId: string, status: string): Promise<void> {
  await prisma.estimationModel.update({
    where: { id: modelId },
    data: { status, updatedAt: new Date() },
  });
}

/**
 * 更新模型动态指标
 */
export async function updateModelDynamicMetrics(
  modelId: string,
  dynamicMetrics: Record<string, unknown>
): Promise<void> {
  await prisma.estimationModel.update({
    where: { id: modelId },
    data: {
      dynamicMetrics: JSON.stringify(dynamicMetrics),
      updatedAt: new Date(),
    },
  });
}

/**
 * 批量获取模型（按ID列表）
 */
export async function getModelsByIds(modelIds: string[]): Promise<ModelRecord[]> {
  const models = await prisma.estimationModel.findMany({
    where: {
      id: { in: modelIds },
    },
  });

  return models.map(m => ({
    id: m.id,
    provider: m.provider,
    modelName: m.modelName,
    version: m.version,
    langs: JSON.parse(m.langs),
    maxContext: m.maxContext,
    pricePer1kTokens: m.pricePer1kTokens,
    rateLimit: m.rateLimit,
    toolUseSupport: m.toolUseSupport,
    jsonModeSupport: m.jsonModeSupport,
    status: m.status,
    staticCapability: m.staticCapability ? JSON.parse(m.staticCapability) : undefined,
    dynamicMetrics: m.dynamicMetrics ? JSON.parse(m.dynamicMetrics) : undefined,
  }));
}














