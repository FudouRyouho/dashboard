export interface CacheEntry<T> {
  data: T;
  updatedAt: Date;
}

export interface CacheStore {
  get<T>(key: string): CacheEntry<T> | undefined;
  set<T>(key: string, data: T): void;
}

export function createMemoryCacheStore(): CacheStore {
  const store = new Map<string, CacheEntry<any>>();

  return {
    get<T>(key: string): CacheEntry<T> | undefined {
      return store.get(key) as CacheEntry<T> | undefined;
    },

    set<T>(key: string, data: T): void {
      const entry: CacheEntry<T> = {
        data,
        updatedAt: new Date(),
      };
      store.set(key, entry);
    },
  };
}
