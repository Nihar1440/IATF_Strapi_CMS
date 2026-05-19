import { getRedis } from './client'
import type { CsrRequirement } from '@/modules/csr/types'

const CSR_UPDATES_KEY = 'csr:ai_updates'
const CSR_UPDATES_TTL = 60 * 60 * 24 * 90 // 90 days

export interface StoredCsrUpdate {
  requirements: CsrRequirement[]
  storedAt: string
  sourceOems: string[]
}

/**
 * Persist AI-discovered CSR requirements to Redis.
 * Merges with any existing requirements, deduplicating by ID.
 */
export async function saveCsrUpdates(
  requirements: CsrRequirement[],
  oems: string[],
): Promise<void> {
  if (!requirements.length) return

  const redis = getRedis()

  // Merge with existing
  const existing = await getCsrUpdates()
  const merged = new Map<string, CsrRequirement>()

  for (const req of existing) {
    merged.set(req.id, req)
  }
  for (const req of requirements) {
    merged.set(req.id, req) // newer wins
  }

  const allOems = [...new Set([...oems])]

  const payload: StoredCsrUpdate = {
    requirements: Array.from(merged.values()),
    storedAt: new Date().toISOString(),
    sourceOems: allOems,
  }

  await redis.set(CSR_UPDATES_KEY, payload, { ex: CSR_UPDATES_TTL })
}

/**
 * Retrieve all AI-discovered CSR requirements from Redis.
 */
export async function getCsrUpdates(): Promise<CsrRequirement[]> {
  try {
    const redis = getRedis()
    const stored = await redis.get<StoredCsrUpdate>(CSR_UPDATES_KEY)
    return stored?.requirements ?? []
  } catch {
    // Redis unavailable — degrade gracefully
    return []
  }
}

/**
 * Clear all stored CSR updates from Redis.
 */
export async function clearCsrUpdates(): Promise<void> {
  const redis = getRedis()
  await redis.del(CSR_UPDATES_KEY)
}
