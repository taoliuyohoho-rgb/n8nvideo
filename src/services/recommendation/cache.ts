// Simple in-memory LRU cache with TTL, process-scoped.
// This is intentionally lightweight to avoid extra deps.

type CacheValue<T> = { value: T; expireAt: number };

export class SimpleTTLCache<T = unknown> {
  private maxEntries: number;
  private store: Map<string, CacheValue<T>> = new Map();

  constructor(maxEntries = 500) {
    this.maxEntries = Math.max(50, maxEntries);
  }

  get(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expireAt > 0 && hit.expireAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    // LRU: refresh order
    this.store.delete(key);
    this.store.set(key, hit);
    return hit.value;
  }

  set(key: string, value: T, ttlMs = 0) {
    if (this.store.size >= this.maxEntries) {
      // delete oldest
      const first = this.store.keys().next().value;
      if (first) this.store.delete(first);
    }
    this.store.set(key, { value, expireAt: ttlMs > 0 ? Date.now() + ttlMs : 0 });
  }

  getOrSet(key: string, producer: () => Promise<T>, ttlMs = 0): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) return Promise.resolve(cached);
    return producer().then((val) => {
      this.set(key, val, ttlMs);
      return val;
    });
  }
}

// Global caches (process-wide)
export const decisionCache = new SimpleTTLCache<any>(500); // cache final decisions
export const poolCache = new SimpleTTLCache<any>(300); // cache model/prompt pools


