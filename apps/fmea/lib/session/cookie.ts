/**
 * Secure HttpOnly cookie configuration for cross-tool session sharing.
 *
 * Cookies are set with:
 *  - HttpOnly: prevents XSS from reading the token
 *  - Secure: only sent over HTTPS
 *  - SameSite=None: allows cross-origin usage (e.g. .iatf-solutions.com subdomains)
 *  - Domain=.iatf-solutions.com: shared across all tools on the domain
 */

import { NextRequest, NextResponse } from 'next/server'

export const SESSION_COOKIE_NAME = 'iatf-session'

const SESSION_TTL_SECONDS = parseInt(process.env.SESSION_TTL_SECONDS || '86400', 10)

/**
 * Resolve the cookie domain. In production this is `.iatf-solutions.com`
 * so that all tool subdomains share the same session cookie.
 * In development we omit the domain so the cookie is scoped to localhost.
 */
function getCookieDomain(): string | undefined {
  const explicit = process.env.COOKIE_DOMAIN
  if (explicit) return explicit

  // Only set a shared domain when explicitly configured. This avoids
  // accidentally setting a mismatched domain in deployments that don't use
  // the production root domain.
  return undefined
}

/**
 * Sets the session token as a secure HttpOnly cookie on the NextResponse.
 */
export function setSessionCookie(response: NextResponse, token: string): void {
  const domain = getCookieDomain()
  const isProduction = process.env.NODE_ENV === 'production'

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    domain,
    path: '/',
    // maxAge: SESSION_TTL_SECONDS, // Removed to make it a session cookie (expires on browser close)
  })
}

/**
 * Clears the session cookie on the NextResponse.
 */
export function clearSessionCookie(response: NextResponse): void {
  const domain = getCookieDomain()
  const isProduction = process.env.NODE_ENV === 'production'

  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    domain,
    path: '/',
    maxAge: 0,
  })
}

/**
 * Reads the session token from the request — tries the HttpOnly cookie first,
 * then falls back to the Authorization: Bearer header for backward compatibility.
 */
export function getSessionToken(request: NextRequest): string | null {
  // 1. Try HttpOnly cookie
  const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (cookieToken) return cookieToken

  // 2. Fallback: Authorization header (backward compat with localStorage clients)
  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)

  return null
}
