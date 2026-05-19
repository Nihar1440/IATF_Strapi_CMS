'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ConfidenceLevel, FmeaValidationResult, FmeaRow, Language, ParserResult } from '@/modules/fmea/types'

/* ─── State types ─────────────────────────────────────────────── */

export type FmeaReviewStep = 'upload' | 'review' | 'export'

export interface FmeaReviewState {
  uploadedFile: File | null
  uploadedFileName: string
  validationResult: FmeaValidationResult | null
  parsedRows: FmeaRow[]
  originalWorkbookBase64: string
  parserWarnings: string[]
  parserMetadata: ParserResult['metadata'] | null
  headerMap: Record<string, string>
  headerConfidence: ConfidenceLevel
  currentStep: FmeaReviewStep
  language: Language
}

const FMEA_STEP_ORDER: FmeaReviewStep[] = ['upload', 'review', 'export']
const FMEA_STORAGE_KEY = 'FMEA_REVIEW_STATE'
const FMEA_STEP_KEY = 'FMEA_CURRENT_STEP'
const FMEA_ACTIVE_CODE_KEY = 'FMEA_ACTIVE_CODE'

const EMPTY_FMEA_STATE: FmeaReviewState = {
  uploadedFile: null,
  uploadedFileName: '',
  validationResult: null,
  parsedRows: [],
  originalWorkbookBase64: '',
  parserWarnings: [],
  parserMetadata: null,
  headerMap: {},
  headerConfidence: 'High',
  currentStep: 'upload',
  language: 'de',
}

/* ─── Obfuscation helpers (matches CSR/8D pattern) ──────────────── */

function obfuscate(data: unknown): string {
  try {
    return btoa(encodeURIComponent(JSON.stringify(data)))
  } catch {
    return ''
  }
}

function deobfuscate(encoded: string): unknown {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded)))
  } catch {
    return null
  }
}

function loadInitialReviewState(defaultLanguage?: Language): FmeaReviewState {
  const base = { ...EMPTY_FMEA_STATE }
  if (defaultLanguage) {
    base.language = defaultLanguage
  }

  if (typeof window === 'undefined') {
    return base
  }

  try {
    const activeCode = localStorage.getItem(FMEA_ACTIVE_CODE_KEY)
    const codeSuffix = activeCode ? `_${activeCode}` : ''
    const raw = localStorage.getItem(`${FMEA_STORAGE_KEY}${codeSuffix}`)
    const stepRaw = localStorage.getItem(`${FMEA_STEP_KEY}${codeSuffix}`)
    const nextState = { ...base }

    if (raw) {
      const saved = deobfuscate(raw) as Partial<FmeaReviewState> | null
      if (saved && typeof saved === 'object') {
        const rest = { ...saved }
        delete rest.uploadedFile
        Object.assign(nextState, rest)
      }
    }

    if (stepRaw && FMEA_STEP_ORDER.includes(stepRaw as FmeaReviewStep)) {
      nextState.currentStep = stepRaw as FmeaReviewStep
    }

    return nextState
  } catch {
    return base
  }
}

/* ─── Hook ──────────────────────────────────────────────────────── */

export function useReviewState(defaultLanguage?: Language) {
  // Always start with server-safe defaults to avoid hydration mismatch.
  const [state, setState] = useState<FmeaReviewState>(() => {
    const base = { ...EMPTY_FMEA_STATE }
    if (defaultLanguage) {
      base.language = defaultLanguage
    }
    return base
  })
  const [hydrated, setHydrated] = useState(false)

  /* ─── Hydrate from localStorage on mount ──────────────────── */
  useEffect(() => {
    const restored = loadInitialReviewState(defaultLanguage)
    setState(restored)
    setHydrated(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Persist to localStorage on change ───────────────────── */
  useEffect(() => {
    if (!hydrated) return
    try {
      // Only persist non-File fields
      const persistable = {
        uploadedFileName: state.uploadedFileName,
        validationResult: state.validationResult,
        parsedRows: state.parsedRows,
        originalWorkbookBase64: state.originalWorkbookBase64,
        parserWarnings: state.parserWarnings,
        parserMetadata: state.parserMetadata,
        headerMap: state.headerMap,
        headerConfidence: state.headerConfidence,
        currentStep: state.currentStep,
        language: state.language,
      }
      const activeCode = localStorage.getItem(FMEA_ACTIVE_CODE_KEY)
      const codeSuffix = activeCode ? `_${activeCode}` : ''
      localStorage.setItem(`${FMEA_STORAGE_KEY}${codeSuffix}`, obfuscate(persistable))
      localStorage.setItem(`${FMEA_STEP_KEY}${codeSuffix}`, state.currentStep)
    } catch {
      // Quota exceeded – silently ignore
    }
  }, [state, hydrated])

  /* ─── Step navigation ──────────────────────────────────────── */
  const stepIndex = FMEA_STEP_ORDER.indexOf(state.currentStep)
  const totalSteps = FMEA_STEP_ORDER.length

  const nextStep = useCallback(() => {
    setState((prev) => {
      const idx = FMEA_STEP_ORDER.indexOf(prev.currentStep)
      if (idx < FMEA_STEP_ORDER.length - 1) {
        return { ...prev, currentStep: FMEA_STEP_ORDER[idx + 1] }
      }
      return prev
    })
  }, [])

  const prevStep = useCallback(() => {
    setState((prev) => {
      const idx = FMEA_STEP_ORDER.indexOf(prev.currentStep)
      if (idx > 0) {
        return { ...prev, currentStep: FMEA_STEP_ORDER[idx - 1] }
      }
      return prev
    })
  }, [])

  const goToStep = useCallback((step: FmeaReviewStep) => {
    setState((prev) => ({ ...prev, currentStep: step }))
  }, [])

  /* ─── Field updaters ───────────────────────────────────────── */
  const setUploadedFile = useCallback((file: File | null) => {
    setState((prev) => ({
      ...prev,
      uploadedFile: file,
      uploadedFileName: file?.name ?? '',
    }))
  }, [])

  const setValidationResult = useCallback(
    (
      result: FmeaValidationResult | null,
      rows: FmeaRow[],
      diagnostics?: {
        originalWorkbookBase64?: string
        parserWarnings?: string[]
        parserMetadata?: ParserResult['metadata'] | null
        headerMap?: Record<string, string>
        headerConfidence?: ConfidenceLevel
      }
    ) => {
      setState((prev) => ({
        ...prev,
        validationResult: result,
        parsedRows: rows,
        originalWorkbookBase64: diagnostics?.originalWorkbookBase64 ?? (result ? prev.originalWorkbookBase64 : ''),
        parserWarnings: diagnostics?.parserWarnings ?? [],
        parserMetadata: diagnostics?.parserMetadata ?? null,
        headerMap: diagnostics?.headerMap ?? {},
        headerConfidence: diagnostics?.headerConfidence ?? 'High',
      }))
    },
    []
  )

  const setLanguage = useCallback((language: Language) => {
    setState((prev) => ({ ...prev, language }))
  }, [])

  const resetReview = useCallback(() => {
    setState({ ...EMPTY_FMEA_STATE, language: defaultLanguage ?? 'de' })
    try {
      const activeCode = localStorage.getItem(FMEA_ACTIVE_CODE_KEY)
      const codeSuffix = activeCode ? `_${activeCode}` : ''
      localStorage.removeItem(`${FMEA_STORAGE_KEY}${codeSuffix}`)
      localStorage.removeItem(`${FMEA_STEP_KEY}${codeSuffix}`)
    } catch {
      // ignore
    }
  }, [defaultLanguage])

  return {
    state,
    hydrated,
    stepIndex,
    totalSteps,
    currentStep: state.currentStep,
    nextStep,
    prevStep,
    goToStep,
    setUploadedFile,
    setValidationResult,
    setLanguage,
    resetReview,
  }
}
