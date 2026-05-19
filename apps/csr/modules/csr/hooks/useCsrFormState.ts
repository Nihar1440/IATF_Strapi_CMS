'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  CsrFormState,
  CsrFormStep,
  OemId,
  ProcessEntry,
  MatrixRow,
  ImplementationRecord,
  Language,
  ConflictInfo,
} from '../types'
import { EMPTY_CSR_FORM, CSR_STEP_ORDER } from '../types'
import { CSR_STORAGE_KEY, CSR_STEP_KEY } from '../lib/constants'

/* ------------------------------------------------------------------ */
/*  Obfuscation helpers (matches 8D pattern)                          */
/* ------------------------------------------------------------------ */

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

function loadInitialFormState(defaultLanguage?: Language): CsrFormState {
  const base = { ...EMPTY_CSR_FORM }
  if (defaultLanguage) {
    base.language = defaultLanguage
  }

  if (typeof window === 'undefined') {
    return base
  }

  try {
    const activeCode = localStorage.getItem('CSR_ACTIVE_CODE')
    const codeSuffix = activeCode ? `_${activeCode}` : ''
    const raw = localStorage.getItem(`${CSR_STORAGE_KEY}${codeSuffix}`)
    const stepRaw = localStorage.getItem(`${CSR_STEP_KEY}${codeSuffix}`)
    const nextForm = { ...base }

    if (raw) {
      const saved = deobfuscate(raw) as Partial<CsrFormState> | null
      if (saved && typeof saved === 'object') {
        Object.assign(nextForm, saved)
      }
    }

    if (stepRaw && CSR_STEP_ORDER.includes(stepRaw as CsrFormStep)) {
      nextForm.currentStep = stepRaw as CsrFormStep
    }

    return nextForm
  } catch {
    return base
  }
}

/* ------------------------------------------------------------------ */
/*  Hook                                                              */
/* ------------------------------------------------------------------ */

export function useCsrFormState(defaultLanguage?: Language) {
  // Always start with server-safe defaults to avoid hydration mismatch.
  // localStorage is read only after mount (client-side).
  const [form, setForm] = useState<CsrFormState>(() => {
    const base = { ...EMPTY_CSR_FORM }
    if (defaultLanguage) {
      base.language = defaultLanguage
    }
    return base
  })
  const [hydrated, setHydrated] = useState(false)

  /* ---------- Hydrate from localStorage on mount ---------- */
  useEffect(() => {
    const restored = loadInitialFormState(defaultLanguage)
    setForm(restored)
    setHydrated(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- Persist to localStorage on change ---------- */
  useEffect(() => {
    if (!hydrated) return
    try {
      const activeCode = localStorage.getItem('CSR_ACTIVE_CODE')
      const codeSuffix = activeCode ? `_${activeCode}` : ''
      localStorage.setItem(`${CSR_STORAGE_KEY}${codeSuffix}`, obfuscate(form))
      localStorage.setItem(`${CSR_STEP_KEY}${codeSuffix}`, form.currentStep)
    } catch {
      // Quota exceeded – silently ignore
    }
  }, [form, hydrated])

  /* ---------- Step navigation ---------- */
  const stepIndex = CSR_STEP_ORDER.indexOf(form.currentStep)
  const totalSteps = CSR_STEP_ORDER.length

  const nextStep = useCallback(() => {
    setForm((prev) => {
      const idx = CSR_STEP_ORDER.indexOf(prev.currentStep)
      if (idx < CSR_STEP_ORDER.length - 1) {
        return { ...prev, currentStep: CSR_STEP_ORDER[idx + 1] }
      }
      return prev
    })
  }, [])

  const prevStep = useCallback(() => {
    setForm((prev) => {
      const idx = CSR_STEP_ORDER.indexOf(prev.currentStep)
      if (idx > 0) {
        return { ...prev, currentStep: CSR_STEP_ORDER[idx - 1] }
      }
      return prev
    })
  }, [])

  const goToStep = useCallback((step: CsrFormStep) => {
    setForm((prev) => ({ ...prev, currentStep: step }))
  }, [])

  /* ---------- Field updaters ---------- */
  const setSelectedOems = useCallback((oems: OemId[]) => {
    setForm((prev) => {
      // Invalidate matrix when OEM selection changes
      const oemsChanged = prev.selectedOems.length !== oems.length ||
        !prev.selectedOems.every((o) => oems.includes(o))
      return {
        ...prev,
        selectedOems: oems,
        ...(oemsChanged ? { matrixRows: [], conflicts: [], insights: [], aiPowered: false } : {}),
      }
    })
  }, [])

  const setProcesses = useCallback((processes: ProcessEntry[]) => {
    setForm((prev) => {
      // Invalidate matrix when process list changes
      const changed = prev.processes.length !== processes.length ||
        !prev.processes.every((p, i) => processes[i]?.id === p.id)
      return {
        ...prev,
        processes,
        ...(changed ? { matrixRows: [], conflicts: [], insights: [], aiPowered: false } : {}),
      }
    })
  }, [])

  const setCompanyName = useCallback((companyName: string) => {
    setForm((prev) => ({ ...prev, companyName }))
  }, [])

  const setCompanyLocation = useCallback((companyLocation: string) => {
    setForm((prev) => ({ ...prev, companyLocation }))
  }, [])

  const setLanguage = useCallback((language: Language) => {
    setForm((prev) => ({ ...prev, language }))
  }, [])

  const setMatrixData = useCallback((matrixRows: MatrixRow[], conflicts: ConflictInfo[], insights: string[], aiPowered: boolean) => {
    setForm((prev) => ({ ...prev, matrixRows, conflicts, insights, aiPowered }))
  }, [])

  const setProcessMapImage = useCallback((processMapImage: string | undefined) => {
    setForm((prev) => ({ ...prev, processMapImage }))
  }, [])

  const setImplementationRecords = useCallback((records: Record<string, ImplementationRecord>) => {
    setForm((prev) => ({ ...prev, implementationRecords: records }))
  }, [])

  const updateImplementationRecord = useCallback((csrId: string, record: ImplementationRecord) => {
    setForm((prev) => ({
      ...prev,
      implementationRecords: { ...prev.implementationRecords, [csrId]: record },
    }))
  }, [])

  const setCompanyLogo = useCallback((companyLogo: string | undefined) => {
    setForm((prev) => ({ ...prev, companyLogo }))
  }, [])

  const resetForm = useCallback(() => {
    setForm({ ...EMPTY_CSR_FORM, language: defaultLanguage ?? 'de' })
    try {
      const activeCode = localStorage.getItem('CSR_ACTIVE_CODE')
      const codeSuffix = activeCode ? `_${activeCode}` : ''
      localStorage.removeItem(`${CSR_STORAGE_KEY}${codeSuffix}`)
      localStorage.removeItem(`${CSR_STEP_KEY}${codeSuffix}`)
    } catch {
      // ignore
    }
  }, [defaultLanguage])

  return {
    form,
    conflicts: form.conflicts ?? [],
    insights: form.insights ?? [],
    aiPowered: form.aiPowered ?? false,
    hydrated,
    stepIndex,
    totalSteps,
    currentStep: form.currentStep,
    nextStep,
    prevStep,
    goToStep,
    setSelectedOems,
    setProcesses,
    setCompanyName,
    setCompanyLocation,
    setLanguage,
    setMatrixData,
    setProcessMapImage,
    setImplementationRecords,
    updateImplementationRecord,
    setCompanyLogo,
    resetForm,
  }
}
