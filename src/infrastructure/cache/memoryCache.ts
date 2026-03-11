interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class MemoryCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return undefined;
    }

    return entry.data;
  }

  set(key: string, value: T, ttlMs: number): void {
    this.store.set(key, {
      data: value,
      expiry: Date.now() + ttlMs,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  clear(): void {
    this.store.clear();
  }
}
