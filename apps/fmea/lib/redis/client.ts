import { Redis } from '@upstash/redis'

let redisInstance: Redis | null = null

/**
 * Lazy initialization of Redis client.
 * Ensures environment variables are available and creates the instance only once.
 */
export function getRedis(): Redis {
  if (!redisInstance) {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      throw new Error(
        'Missing Upstash Redis environment variables. ' +
        'Set KV_REST_API_URL / KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN',
      )
    }

    redisInstance = new Redis({ url, token })
  }
  
  return redisInstance
}

// Re-export function only — no eager initialisation at module scope.
// Callers should use getRedis() directly to avoid import-time crashes
// when Redis environment variables are not configured.
