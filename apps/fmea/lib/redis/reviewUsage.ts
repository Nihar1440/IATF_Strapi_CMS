import { hashCode } from '@/lib/hashing/hash'
import { getRedis } from './client'

const REVIEW_USAGE_PREFIX = 'fmea:review:consumed:'
const DEFAULT_REVIEW_USAGE_TTL_SECONDS = 60 * 60 * 24 * 30

export async function consumeFmeaReviewCredit(
  rawCode: string,
  ttlSeconds = DEFAULT_REVIEW_USAGE_TTL_SECONDS,
): Promise<boolean> {
  const redis = getRedis()
  const key = `${REVIEW_USAGE_PREFIX}${hashCode(rawCode)}`
  const result = await redis.set(
    key,
    { consumedAt: new Date().toISOString(), toolId: 'tool_fmea' },
    { nx: true, ex: ttlSeconds },
  )

  return result !== null
}
