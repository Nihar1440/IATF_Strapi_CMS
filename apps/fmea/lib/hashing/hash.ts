import { createHmac } from 'crypto'

/**
 * Deterministically hashes an access code using HMAC-SHA256 + secret pepper.
 * The plaintext code is never stored.
 * Throws at call-time (not module-load-time) if CODE_HASH_PEPPER is missing.
 */
export function hashCode(rawCode: string): string {
  const pepper = process.env.CODE_HASH_PEPPER
  if (!pepper) {
    throw new Error('Missing environment variable: CODE_HASH_PEPPER')
  }
  return createHmac('sha256', pepper)
    .update(rawCode.trim().toUpperCase())
    .digest('hex')
}
