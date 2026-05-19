/**
 * Client-side session helpers.
 *
 * The access token is now stored ONLY in an HttpOnly cookie (set by the server).
 * JavaScript cannot read or write it — the browser sends it automatically.
 *
 * This module provides helpers for auth-related client actions:
 *  - checking auth status via the /api/auth/status endpoint
 *  - handling 401 (reload to redirect via AuthGuard)
 *  - credentials: 'include' on all fetches so the cookie is sent cross-origin
 */

/**
 * Check authentication by calling the server (the HttpOnly cookie is sent automatically).
 */
export async function checkAuth(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/status', {
      credentials: 'include',
      cache: 'no-store',
    })
    if (!res.ok) return false
    const json = await res.json()
    return json.authenticated === true
  } catch {
    return false
  }
}

/**
 * Called when a 401 is received — clears any legacy localStorage token
 * and reloads the page so the AuthGuard redirects to /unlock.
 */
export function handleUnauthorized(): void {
  // Clean up legacy localStorage token if it exists
  if (typeof window !== 'undefined') {
    localStorage.removeItem('iatf-session-token')
  }
  fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  }).finally(() => {
    window.location.reload()
  })
}
