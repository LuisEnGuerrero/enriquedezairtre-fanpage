// Cache en memoria simple y eficiente
type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const memoryCache = new Map<string, CacheEntry<any>>();

const DEFAULT_TTL = 1000 * 60 * 5; // 5 minutos

export function cacheSet<T>(key: string, value: T, ttl = DEFAULT_TTL) {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttl,
  });
}

export function cacheGet<T>(key: string): T | null {
  const entry = memoryCache.get(key);

  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return entry.value as T;
}

// Permite invalidar cachés cuando admin actualiza datos
export function cacheInvalidate(prefix: string) {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}
