import { getRedis } from '@/lib/redis/client'
import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'

const WINDOW_SECONDS = 60
const MAX_REQUESTS = 5

/**
 * Sliding window rate limiter for the /api/redeem endpoint.
 * Keyed by IP address. Allows MAX_REQUESTS per WINDOW_SECONDS.
 * Returns true if the request should be allowed, false if rate limited.
 */
export async function checkRateLimit(request: NextRequest): Promise<boolean> {
  const redis = getRedis()
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const key = `rate-limit:redeem:${ip}`
  const now = Date.now()
  const windowStart = now - WINDOW_SECONDS * 1000

  const pipeline = redis.pipeline()
  pipeline.zremrangebyscore(key, 0, windowStart)
  pipeline.zadd(key, { score: now, member: `${now}:${randomUUID()}` })
  pipeline.zcard(key)
  pipeline.expire(key, WINDOW_SECONDS)

  const results = await pipeline.exec()
  const count = results[2] as number

  return count <= MAX_REQUESTS
}
