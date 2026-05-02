import { redis } from './redis'

export interface CacheOptions {
  ttl?: number
  prefix?: string
}

export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 60, prefix = 'cache' } = options
  const cacheKey = `${prefix}:${key}`

  try {
    const cached = await redis.get<T>(cacheKey)
    if (cached !== null) {
      return cached
    }
  } catch {
    // Redis hata verirse devam et
  }

  const data = await fetcher()

  try {
    await redis.setex(cacheKey, ttl, data)
  } catch {
    // Redis hata verirse sessizce devam et
  }

  return data
}

export async function invalidateCache(key: string, prefix: string = 'cache'): Promise<void> {
  try {
    await redis.del(`${prefix}:${key}`)
  } catch {
    // Sessizce devam et
  }
}

export async function invalidatePattern(pattern: string, prefix: string = 'cache'): Promise<void> {
  try {
    const keys = await redis.keys(`${prefix}:${pattern}*`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch {
    // Sessizce devam et
  }
}

// Convenience helpers
export async function invalidateDashboard(userId: string): Promise<void> {
  await invalidateCache(`dashboard:${userId}`)
}

export async function invalidatePatientList(userId: string): Promise<void> {
  await invalidateCache(`patients:${userId}`)
}

export async function invalidateAnalysis(analysisId: string): Promise<void> {
  await invalidateCache(`analysis:${analysisId}`)
}

export async function invalidateReports(userId: string): Promise<void> {
  await invalidateCache(`reports:${userId}`)
}
