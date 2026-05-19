import { randomBytes } from 'crypto'
import { storeCode } from '../redis/codeStore'
import { hashCode } from '../hashing/hash'
import { getRedis } from '../redis/client'

const MAX_COLLISION_RETRIES = 5

export async function generateCreditCodes({ toolId, planId, count, sessionId }: { toolId: string, planId?: string, count: number, sessionId: string }) {
  const codes: string[] = []
  const redis = getRedis()
  
  for (let i = 0; i < count; i++) {
    let code: string | null = null

    // Retry loop to guarantee uniqueness — regenerate on hash collision
    for (let attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt++) {
      const candidate = randomBytes(4).toString('hex').toUpperCase()
      const hash = hashCode(candidate)
      const existing = await redis.get(`code:${hash}`)

      if (!existing) {
        code = candidate
        break
      }

      console.warn(`[credits] Hash collision on attempt ${attempt + 1} for session ${sessionId}, regenerating...`)
    }

    if (!code) {
      throw new Error(`Failed to generate unique credit code after ${MAX_COLLISION_RETRIES} attempts`)
    }

    await storeCode(code, toolId, planId)
    codes.push(code)
  }
  
  return codes
}
