import { sealData, unsealData } from 'iron-session'

interface TokenPayload {
  isAuthenticated: boolean
  code?: string
}

const SESSION_TTL_SECONDS = parseInt(process.env.SESSION_TTL_SECONDS || '86400', 10)

function getPassword(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      'SESSION_SECRET must be set and at least 32 characters long. ' +
      'Generate one with: openssl rand -base64 32',
    )
  }
  return secret
}

export async function createToken(code?: string): Promise<string> {
  const payload: TokenPayload = { isAuthenticated: true, code }
  return sealData(payload, { password: getPassword(), ttl: SESSION_TTL_SECONDS })
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    // unsealData throws if the seal's built-in TTL has expired.
    // Do NOT pass ttl here — iron-session maps it to timestampSkewSec
    // (extra clock skew), not to the actual expiration check.
    const data = await unsealData<TokenPayload>(token, {
      password: getPassword(),
    })
    return data.isAuthenticated === true
  } catch (err) {
    console.error('[auth] Token verification failed:', err instanceof Error ? err.message : err)
    return false
  }
}
