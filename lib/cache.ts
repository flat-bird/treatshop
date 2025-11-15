const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 180 * 1000; // 180 seconds

export function getCache(key: string) {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  return null;
}

export function setCache(key: string, data: any, ttl: number = CACHE_TTL) {
  cache.set(key, {
    data,
    expires: Date.now() + ttl,
  });
}

export function clearCache(key: string) {
  cache.delete(key);
}

export function clearAllCache() {
  cache.clear();
}

