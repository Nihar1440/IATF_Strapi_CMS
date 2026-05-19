/**
 * useAI — Client-side hooks for all 4 AI calls.
 *
 * Handles:
 * - Calling the /api/ai endpoint
 * - Loading states
 * - Error handling
 * - Fingerprint-based caching (invalidates when D1/D2 change)
 * - Regeneration limit (max 5 per session)
 */

'use client'

import { useState, useCallback, useRef } from 'react'
import type {
  AICallType,
  AIApiRequest,
  AIApiResponse,
  AssistInput,
  AssistResult,
  ComplaintExtractionInput,
  ComplaintExtractionResult,
  SufficiencyInput,
  SufficiencyResult,
  GenerationInput,
  GenerationResult,
  GenerationD3D4Result,
  GenerationD5Result,
  GenerationD5Input,
  GenerationD6Result,
  GenerationD6Input,
  GenerationD7Result,
  GenerationD7Input,
  ConsistencyInput,
  ConsistencyResult,
  ChainCompletionInput,
  ChainCompletionResult,
  RootCauseBackfillInput,
  RootCauseBackfillResult,
  ReportTranslationInput,
  ReportTranslationResult,
  TextTranslationInput,
  TextTranslationResult,
} from '../types/ai'
import {
  MAX_REGENERATIONS,
  CONSISTENCY_DEBOUNCE_MS,
  GEN_CACHE_KEY,
  GEN_FP_KEY,
  SUFF_CACHE_KEY,
  SUFF_FP_KEY,
  CONS_CACHE_KEY,
  CONS_FP_KEY,
  REGEN_COUNT_KEY,
} from '../lib/constants'
import { handleUnauthorized } from '@/lib/session/client'

// ─── Fingerprinting ──────────────────────────────────────────────────────────

/**
 * Build a stable fingerprint string from an object.
 * Used to detect when D1/D2 inputs change so the cache is invalidated.
 */
function fingerprint(obj: unknown): string {
  return JSON.stringify(obj)
}

function fingerprintWithLanguage(
  obj: unknown,
  language: 'en' | 'de',
): string {
  return fingerprint({ language, payload: obj })
}

// ─── Generic AI call helper ──────────────────────────────────────────────────

async function callAI<T>(
  type: AICallType,
  language: 'en' | 'de',
  payload: AIApiRequest['payload'],
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  // Client-side fetch timeout must exceed Vercel maxDuration (60s)
  // so the UI receives structured server errors instead of local AbortError.
  const controller = new AbortController()
  const fetchTimeout = setTimeout(() => controller.abort(), 65_000)

  let res: Response
  try {
    res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, language, payload } satisfies AIApiRequest),
      signal: controller.signal,
      credentials: 'include',
    })
  } catch (err) {
    clearTimeout(fetchTimeout)
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { success: false, error: 'Request timed out. Please try again or simplify your description.' }
    }
    return { success: false, error: 'Network error — please check your connection and try again.' }
  } finally {
    clearTimeout(fetchTimeout)
  }

  // Handle expired/invalid token
  if (res.status === 401) {
    handleUnauthorized()
    return { success: false, error: 'Session expired. Redirecting…' }
  }

  // Handle gateway errors from Netlify/proxy (502, 504)
  if (res.status === 502 || res.status === 504) {
    return {
      success: false,
      error: 'Server timeout — the AI call took too long. Please try again.',
    }
  }

  let json: AIApiResponse<T> | null = null
  try {
    json = (await res.json()) as AIApiResponse<T>
  } catch {
    if (!res.ok) {
      return { success: false, error: `Server error: ${res.status} ${res.statusText}. Please try again.` }
    }
    return { success: false, error: 'Failed to parse server response.' }
  }

  if (!res.ok || !json?.success) {
    return { success: false, error: json?.error ?? 'AI request failed' }
  }

  return { success: true, data: json.data as T }
}

// ─── Session cache helpers ───────────────────────────────────────────────────

function sessionGet<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function sessionSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // sessionStorage might be unavailable
  }
}

function sessionDel(key: string): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(key)
  } catch {
    // ignore
  }
}

function getRegenCount(): number {
  if (typeof window === 'undefined') return 0
  try {
    return parseInt(sessionStorage.getItem(REGEN_COUNT_KEY) ?? '0', 10)
  } catch {
    return 0
  }
}

function incrementRegenCount(): number {
  const count = getRegenCount() + 1
  try {
    sessionStorage.setItem(REGEN_COUNT_KEY, String(count))
  } catch {
    // ignore
  }
  return count
}

// ─── useFieldAssist ──────────────────────────────────────────────────────────

export function useFieldAssist() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AssistResult | null>(null)

  const assist = useCallback(
    async (input: AssistInput, language: 'en' | 'de') => {
      setLoading(true)
      setError(null)
      setResult(null)

      const res = await callAI<AssistResult>('assist', language, input)

      setLoading(false)
      if (res.success) {
        setResult(res.data)
      } else {
        setError(res.error)
      }

      return res
    },
    [],
  )

  const clear = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { assist, loading, error, result, clear }
}

// ─── useComplaintExtraction ──────────────────────────────────────────────────

export function useComplaintExtraction() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ComplaintExtractionResult | null>(null)

  const extract = useCallback(
    async (input: ComplaintExtractionInput, language: 'en' | 'de') => {
      setLoading(true)
      setError(null)
      setResult(null)

      const res = await callAI<ComplaintExtractionResult>('complaintExtraction', language, input)

      setLoading(false)
      if (res.success) {
        setResult(res.data)
      } else {
        setError(res.error)
      }

      return res
    },
    [],
  )

  const clear = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { extract, loading, error, result, clear }
}

// ─── useTextTranslation ──────────────────────────────────────────────────────

export function useTextTranslation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TextTranslationResult | null>(null)

  const translate = useCallback(
    async (input: TextTranslationInput) => {
      setLoading(true)
      setError(null)
      setResult(null)

      const res = await callAI<TextTranslationResult>('textTranslation', input.targetLanguage, input)

      setLoading(false)
      if (res.success) {
        setResult(res.data)
      } else {
        setError(res.error)
      }

      return res
    },
    [],
  )

  const clear = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { translate, loading, error, result, clear }
}

// ─── useReportTranslation ────────────────────────────────────────────────────

export function useReportTranslation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ReportTranslationResult | null>(null)

  const translateReport = useCallback(
    async (input: ReportTranslationInput) => {
      setLoading(true)
      setError(null)
      setResult(null)

      const res = await callAI<ReportTranslationResult>('reportTranslation', input.targetLanguage, input)

      setLoading(false)
      if (res.success) {
        setResult(res.data)
      } else {
        setError(res.error)
      }

      return res
    },
    [],
  )

  const clear = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { translateReport, loading, error, result, clear }
}

// ─── useSufficiencyCheck ─────────────────────────────────────────────────────

export function useSufficiencyCheck() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SufficiencyResult | null>(null)

  const check = useCallback(
    async (input: SufficiencyInput, language: 'en' | 'de') => {
      // Check fingerprint cache — skip API if D1+D2 haven't changed
      const fp = fingerprintWithLanguage(input, language)
      const cachedFp = sessionStorage.getItem(SUFF_FP_KEY)
      if (cachedFp === fp) {
        const cached = sessionGet<SufficiencyResult>(SUFF_CACHE_KEY)
        if (cached) {
          setResult(cached)
          return { success: true as const, data: cached }
        }
      }

      setLoading(true)
      setError(null)
      // Keep existing result visible while checking (don't setResult(null))

      const res = await callAI<SufficiencyResult>('sufficiency', language, input)

      setLoading(false)
      if (res.success) {
        setResult(res.data)
        sessionSet(SUFF_CACHE_KEY, res.data)
        sessionStorage.setItem(SUFF_FP_KEY, fp)
      } else {
        setError(res.error)
      }

      return res
    },
    [],
  )

  const clear = useCallback(() => {
    setResult(null)
    setError(null)
    sessionDel(SUFF_CACHE_KEY)
    sessionDel(SUFF_FP_KEY)
  }, [])

  return { check, loading, error, result, clear }
}

// ─── useGeneration ───────────────────────────────────────────────────────────

export function useGeneration() {
  const [loading, setLoading] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState<'idle' | 'd3d4' | 'd5'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [regenCount, setRegenCount] = useState(getRegenCount)
  const canRegenerate = regenCount < MAX_REGENERATIONS

  const generate = useCallback(
    async (input: GenerationInput, language: 'en' | 'de', forceRegenerate = false) => {
      // Build fingerprint from the generation input (D1 + D2 + metadata)
      const fp = fingerprintWithLanguage(input, language)
      const cachedFp = typeof window !== 'undefined' ? sessionStorage.getItem(GEN_FP_KEY) : null

      // Return cache if fingerprint matches and not forcing regeneration
      if (!forceRegenerate && cachedFp === fp) {
        const cached = sessionGet<GenerationResult>(GEN_CACHE_KEY)
        if (cached) {
          setResult(cached)
          return { success: true as const, data: cached }
        }
      }

      // If fingerprint changed (D1/D2 were edited), clear old cache
      if (cachedFp !== null && cachedFp !== fp) {
        sessionDel(GEN_CACHE_KEY)
        sessionDel(GEN_FP_KEY)
        sessionDel(CONS_CACHE_KEY)
        sessionDel(CONS_FP_KEY)
      }

      // Check regeneration limit
      if (forceRegenerate && !canRegenerate) {
        const msg = 'Regeneration limit reached (max 5 per session).'
        setError(msg)
        return { success: false as const, error: msg }
      }

      setLoading(true)
      setLoadingPhase('d3d4')
      setError(null)

      // Phase 1: Generate D3+D4
      const resPhase1 = await callAI<GenerationD3D4Result>('generation-d3d4', language, input)
      if (!resPhase1.success) {
        setLoading(false)
        setLoadingPhase('idle')
        setError(resPhase1.error)
        return resPhase1
      }

      setLoadingPhase('d5')

      // Phase 2: Generate D5 using D4 results from Phase 1
      const d5Input: GenerationD5Input = {
        d2: input.d2,
        d4: resPhase1.data.d4,
      }
      const resPhase2 = await callAI<GenerationD5Result>('generation-d5', language, d5Input)
      if (!resPhase2.success) {
        setLoading(false)
        setLoadingPhase('idle')
        setError(resPhase2.error)
        return resPhase2
      }

      const combinedData: GenerationResult = {
        d2Enhanced: resPhase1.data.d2Enhanced,
        d3: resPhase1.data.d3,
        d4: resPhase1.data.d4,
        d5: resPhase2.data.d5,
      }

      setLoading(false)
      setLoadingPhase('idle')
      setResult(combinedData)
      sessionSet(GEN_CACHE_KEY, combinedData)
      if (typeof window !== 'undefined') sessionStorage.setItem(GEN_FP_KEY, fp)
      if (forceRegenerate) {
        const newCount = incrementRegenCount()
        setRegenCount(newCount)
      }

      return { success: true as const, data: combinedData }
    },
    [canRegenerate],
  )

  /**
   * Check if a cached generation exists for exactly this input fingerprint.
   * Returns the cached data WITHOUT calling the API.
   */
  const getCached = useCallback(
    (input: GenerationInput, language: 'en' | 'de'): GenerationResult | null => {
      const fp = fingerprintWithLanguage(input, language)
      const cachedFp = typeof window !== 'undefined' ? sessionStorage.getItem(GEN_FP_KEY) : null
      if (cachedFp === fp) {
        return sessionGet<GenerationResult>(GEN_CACHE_KEY)
      }
      return null
    },
    [],
  )

  const clearGeneration = useCallback(() => {
    setResult(null)
    setError(null)
    sessionDel(GEN_CACHE_KEY)
    sessionDel(GEN_FP_KEY)
  }, [])

  return { generate, getCached, loading, loadingPhase, error, result, regenCount, canRegenerate, clearGeneration }
}

// ─── useD5Generation ────────────────────────────────────────────────────────

export function useD5Generation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GenerationD5Result | null>(null)

  const generateD5 = useCallback(
    async (input: GenerationD5Input, language: 'en' | 'de') => {
      setLoading(true)
      setError(null)

      const res = await callAI<GenerationD5Result>('generation-d5', language, input)

      setLoading(false)
      if (res.success) {
        setResult(res.data)
      } else {
        setError(res.error)
      }

      return res
    },
    [],
  )

  const clear = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { generateD5, loading, error, result, clear }
}

// ─── useD6Generation ────────────────────────────────────────────────────────

export function useD6Generation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GenerationD6Result | null>(null)

  const generateD6 = useCallback(
    async (input: GenerationD6Input, language: 'en' | 'de') => {
      setLoading(true)
      setError(null)

      const res = await callAI<GenerationD6Result>('generation-d6', language, input)

      setLoading(false)
      if (res.success) {
        setResult(res.data)
      } else {
        setError(res.error)
      }

      return res
    },
    [],
  )

  const clear = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { generateD6, loading, error, result, clear }
}

// ─── useD7Generation ────────────────────────────────────────────────────────

export function useD7Generation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GenerationD7Result | null>(null)

  const generateD7 = useCallback(
    async (input: GenerationD7Input, language: 'en' | 'de') => {
      setLoading(true)
      setError(null)

      const res = await callAI<GenerationD7Result>('generation-d7', language, input)

      setLoading(false)
      if (res.success) {
        setResult(res.data)
      } else {
        setError(res.error)
      }

      return res
    },
    [],
  )

  const clear = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { generateD7, loading, error, result, clear }
}

// ─── useConsistencyCheck ─────────────────────────────────────────────────────

export function useConsistencyCheck() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ConsistencyResult | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const check = useCallback(
    async (input: ConsistencyInput, language: 'en' | 'de') => {
      // Check fingerprint cache — skip API if D3+D4+D5 haven't changed
      const fp = fingerprintWithLanguage(input, language)
      const cachedFp = typeof window !== 'undefined' ? sessionStorage.getItem(CONS_FP_KEY) : null
      if (cachedFp === fp) {
        const cached = sessionGet<ConsistencyResult>(CONS_CACHE_KEY)
        if (cached) {
          setResult(cached)
          return { success: true as const, data: cached }
        }
      }

      setLoading(true)
      setError(null)
      setResult(null)

      const res = await callAI<ConsistencyResult>('consistency', language, input)

      setLoading(false)
      if (res.success) {
        setResult(res.data)
        sessionSet(CONS_CACHE_KEY, res.data)
        if (typeof window !== 'undefined') sessionStorage.setItem(CONS_FP_KEY, fp)
      } else {
        setError(res.error)
      }

      return res
    },
    [],
  )

  /** Debounced consistency check — waits 2s after the last edit before checking */
  const debouncedCheck = useCallback(
    (input: ConsistencyInput, language: 'en' | 'de') => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        check(input, language)
      }, CONSISTENCY_DEBOUNCE_MS)
    },
    [check],
  )

  const clear = useCallback(() => {
    setResult(null)
    setError(null)
    sessionDel(CONS_CACHE_KEY)
    sessionDel(CONS_FP_KEY)
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  return { check, debouncedCheck, loading, error, result, clear }
}

// ─── useChainCompletion ────────────────────────────────────────────────────────

export function useChainCompletion() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ChainCompletionResult | null>(null)

  const complete = useCallback(
    async (input: ChainCompletionInput, language: 'en' | 'de') => {
      setLoading(true)
      setError(null)
      setResult(null)

      const res = await callAI<ChainCompletionResult>('chainCompletion', language, input)

      setLoading(false)
      if (res.success) {
        setResult(res.data)
      } else {
        setError(res.error)
      }

      return res
    },
    [],
  )

  const clear = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { complete, loading, error, result, clear }
}

// ─── useRootCauseBackfill ─────────────────────────────────────────────────────

export function useRootCauseBackfill() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RootCauseBackfillResult | null>(null)

  const backfill = useCallback(
    async (input: RootCauseBackfillInput, language: 'en' | 'de') => {
      setLoading(true)
      setError(null)
      setResult(null)

      const res = await callAI<RootCauseBackfillResult>('rootCauseBackfill', language, input)

      setLoading(false)
      if (res.success) {
        setResult(res.data)
      } else {
        setError(res.error)
      }

      return res
    },
    [],
  )

  const clear = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { backfill, loading, error, result, clear }
}
