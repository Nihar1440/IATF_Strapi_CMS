import { NextRequest } from 'next/server'
import { verifyToken, createToken, readTokenPayload } from './token'
import { getSessionToken } from './cookie'

export { createToken }

/**
 * Route Handler auth check — reads the session token from the HttpOnly cookie
 * first, then falls back to the Authorization: Bearer header for backward
 * compatibility. Validates using iron-session's sealData/unsealData encryption.
 */
export async function isAuthenticatedFromRequest(req: NextRequest): Promise<boolean> {
  const token = getSessionToken(req)
  if (!token) return false
  return verifyToken(token)
}

export async function getAuthenticatedCodeFromRequest(req: NextRequest): Promise<string | null> {
  const token = getSessionToken(req)
  if (!token) return null
  const payload = await readTokenPayload(token)
  return payload?.code || null
}
