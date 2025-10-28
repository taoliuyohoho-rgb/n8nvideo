/**
 * 预估模型 (Estimation Model) - 回退与熔断
 * LKG缓存、熔断状态管理、降级策略
 */

import { ModelRecord, CircuitBreakerState, LKGCache } from './types';
import {
  CIRCUIT_BREAKER_DURATION_MS,
  CIRCUIT_BREAKER_SEVERE_DURATION_MS,
  LKG_CACHE_TTL_MS,
} from './constants';

// 内存存储（生产环境应使用Redis）
const circuitBreakers: Map<string, CircuitBreakerState> = new Map();
const lkgCache: Map<string, LKGCache> = new Map();

/**
 * 检查模型/provider是否被熔断
 */
export function isCircuitOpen(provider: string, modelId?: string): boolean {
  const key = modelId || provider;
  const state = circuitBreakers.get(key);
  
  if (!state) return false;
  
  // 检查是否过期
  if (new Date() > state.breakUntil) {
    circuitBreakers.delete(key);
    return false;
  }
  
  return true;
}

/**
 * 触发熔断
 */
export function openCircuit(
  provider: string,
  reason: string,
  modelId?: string,
  severe: boolean = false
): void {
  const key = modelId || provider;
  const durationMs = severe ? CIRCUIT_BREAKER_SEVERE_DURATION_MS : CIRCUIT_BREAKER_DURATION_MS;
  const breakUntil = new Date(Date.now() + durationMs);
  
  circuitBreakers.set(key, {
    provider,
    modelId,
    breakUntil,
    reason,
  });
  
  console.warn(`Circuit breaker opened for ${key}: ${reason}, until ${breakUntil.toISOString()}`);
}

/**
 * 手动关闭熔断（半开/恢复）
 */
export function closeCircuit(provider: string, modelId?: string): void {
  const key = modelId || provider;
  circuitBreakers.delete(key);
  console.info(`Circuit breaker closed for ${key}`);
}

/**
 * 获取LKG（Last Known Good）模型
 */
export function getLKG(segmentKey: string): string | null {
  const cached = lkgCache.get(segmentKey);
  
  if (!cached) return null;
  
  // 检查是否过期
  if (new Date() > cached.expiresAt) {
    lkgCache.delete(segmentKey);
    return null;
  }
  
  return cached.modelId;
}

/**
 * 设置LKG缓存
 */
export function setLKG(segmentKey: string, modelId: string, ttlMs: number = LKG_CACHE_TTL_MS): void {
  const expiresAt = new Date(Date.now() + ttlMs);
  lkgCache.set(segmentKey, { segmentKey, modelId, expiresAt });
  console.info(`LKG set for ${segmentKey}: ${modelId}, expires ${expiresAt.toISOString()}`);
}

/**
 * 过滤被熔断的模型
 */
export function filterCircuitBrokenModels(models: ModelRecord[]): ModelRecord[] {
  return models.filter(model => {
    // 检查provider级熔断
    if (isCircuitOpen(model.provider)) {
      return false;
    }
    
    // 检查模型级熔断
    if (isCircuitOpen(model.provider, model.id)) {
      return false;
    }
    
    return true;
  });
}

/**
 * 构建回退链（primary → fallbacks → LKG）
 */
export function buildFallbackChain(
  primary: ModelRecord,
  fallbacks: ModelRecord[],
  segmentKey: string
): string[] {
  const chain: string[] = [primary.id];
  
  // 添加可用的回退模型
  for (const fallback of fallbacks) {
    if (!isCircuitOpen(fallback.provider, fallback.id)) {
      chain.push(fallback.id);
    }
  }
  
  // 添加LKG作为最后兜底
  const lkg = getLKG(segmentKey);
  if (lkg && !chain.includes(lkg)) {
    chain.push(lkg);
  }
  
  return chain;
}

/**
 * 获取所有熔断状态（调试用）
 */
export function getCircuitBreakerStates(): CircuitBreakerState[] {
  return Array.from(circuitBreakers.values());
}

/**
 * 清空所有熔断（仅测试用）
 */
export function clearAllCircuitBreakers(): void {
  circuitBreakers.clear();
  console.info('All circuit breakers cleared');
}














