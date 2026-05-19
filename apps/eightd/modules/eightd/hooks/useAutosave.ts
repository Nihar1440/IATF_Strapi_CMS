'use client'

import { useEffect, useRef } from 'react'
import { ReportData } from '../types/report'
import { AUTOSAVE_INTERVAL_MS, STORAGE_KEY } from '../lib/constants'
import { obfuscate } from './useFormState'

/**
 * Autosaves the report to localStorage every 30 seconds.
 * Data is never sent to the server.
 */
export function useAutosave(report: ReportData) {
  const reportRef = useRef(report)

  // Keep ref current without triggering the interval setup again
  useEffect(() => {
    reportRef.current = report
  }, [report])

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        localStorage.setItem(STORAGE_KEY, obfuscate(reportRef.current))
      } catch {
        // localStorage unavailable (private browsing quota etc.) — silently ignore
      }
    }, AUTOSAVE_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [])
}
