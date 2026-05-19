/**
 * AIAG/VDA Process FMEA (PFMEA) Action Priority (AP) Lookup Table
 * 
 * Official mapping from AIAG/VDA PFMEA Appendix C (Section C2.5)
 * Maps Severity (S) × Occurrence (O) × Detection (D) → Action Priority (AP)
 * 
 * Internal lookup codes:
 * - H = High (action required)
 * - M = Medium (action suggested)
 * - L = Low (acceptable)
 * 
 * Source: AIAG/VDA PFMEA Appendix C – Action Priority (AP) for PFMEA
 * Implementation: Grouped conditional logic covering all 1000 S×O×D combinations (1–10 each)
 * 
 * Severity Levels (S):
 *   10: Acute health/safety risk for personnel
 *   9:  Non-compliance with requirements
 *   8:  100% scrapped, or chronic safety risk
 *   7:  Partial scrap or shutdown up to one shift
 *   6:  100% reworked offline
 *   5:  Partial rework offline
 *   4:  100% rework at stations before further processing
 *   3:  Partial rework at stations
 *   2:  Minor process difficulties
 *   1:  No perceptible effect
 * 
 * Occurrence Levels (O):
 *   10: Extremely high (no prevention)
 *   9:  Very high (behavioral measures only)
 *   8:  High
 *   7:  High (behavioral or technical)
 *   6:  Medium
 *   5:  Medium
 *   4:  Medium
 *   3:  Low (proven practices)
 *   2:  Very low
 *   1:  Extremely low (prevention prevents occurrence)
 * 
 * Detection Levels (D):
 *   10: Very low (no detection method available)
 *   9:  Very low (unlikely to detect)
 *   8:  Low (method not yet proven)
 *   7:  Low (automated/semi-automatic detection)
 *   6:  Medium (demonstrated detection method)
 *   5:  Medium (automated detection with sampling)
 *   4:  High (automated detection at downstream station)
 *   3:  High (automated detection at workstation)
 *   2:  High (detection prevents defect creation)
 *   1:  Very high (failure cannot occur or always detected)
 */

import type { APLevel } from '@/modules/fmea/types'

type APCode = 'H' | 'M' | 'L'

export const AP_DISPLAY_LABELS: Record<APLevel, 'High' | 'Medium' | 'Low'> = {
  H: 'High',
  M: 'Medium',
  L: 'Low',
}

export function normalizeAPLevel(value: string | null | undefined): APLevel | null {
  if (!value) return null

  switch (value.trim().toLowerCase()) {
    case 'h':
    case 'high':
      return 'H'
    case 'm':
    case 'medium':
      return 'M'
    case 'l':
    case 'low':
    case 'n':
    case 'normal':
    case 'niedrig': // Legacy German support
      return 'L'
    default:
      return null
  }
}

/**
 * Helper: Check if value falls within inclusive range
 */
function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

/**
 * Get AP level from official AIAG/VDA 5th Edition table
 * All S×O×D values from 1-10 are covered by grouped conditions.
 */
function getAPCodeFromLookup(
  severity: number,
  occurrence: number,
  detection: number
): APCode {
  // Validate inputs
  if (![severity, occurrence, detection].every(n => n >= 1 && n <= 10)) {
    throw new Error('Severity, Occurrence, and Detection must be between 1 and 10')
  }

  // ═══════════════════════════════════════════════════════════════
  // SEVERITY 9-10 (Very High) — 17 combinations
  // ═══════════════════════════════════════════════════════════════
  if (inRange(severity, 9, 10)) {
    // O: 8-10
    if (inRange(occurrence, 8, 10)) {
      if (inRange(detection, 7, 10)) return 'H'
      if (inRange(detection, 5, 6)) return 'H'
      if (inRange(detection, 2, 4)) return 'H'
      if (detection === 1) return 'H'
    }
    // O: 6-7
    if (inRange(occurrence, 6, 7)) {
      if (inRange(detection, 7, 10)) return 'H'
      if (inRange(detection, 5, 6)) return 'H'
      if (inRange(detection, 2, 4)) return 'H'
      if (detection === 1) return 'H'
    }
    // O: 4-5
    if (inRange(occurrence, 4, 5)) {
      if (inRange(detection, 7, 10)) return 'H'
      if (inRange(detection, 5, 6)) return 'H'
      if (inRange(detection, 2, 4)) return 'H'
      if (detection === 1) return 'M'
    }
    // O: 2-3
    if (inRange(occurrence, 2, 3)) {
      if (inRange(detection, 7, 10)) return 'H'
      if (inRange(detection, 5, 6)) return 'M'
      if (inRange(detection, 2, 4)) return 'L'
      if (detection === 1) return 'L'
    }
    // O: 1
    if (occurrence === 1) {
      if (inRange(detection, 1, 10)) return 'L'
    }
    throw new Error('Invalid O value for S=9-10')
  }

  // ═══════════════════════════════════════════════════════════════
  // SEVERITY 7-8 (High) — 17 combinations
  // ═══════════════════════════════════════════════════════════════
  if (inRange(severity, 7, 8)) {
    // O: 8-10
    if (inRange(occurrence, 8, 10)) {
      if (inRange(detection, 7, 10)) return 'H'
      if (inRange(detection, 5, 6)) return 'H'
      if (inRange(detection, 2, 4)) return 'H'
      if (detection === 1) return 'H'
    }
    // O: 6-7
    if (inRange(occurrence, 6, 7)) {
      if (inRange(detection, 7, 10)) return 'H'
      if (inRange(detection, 5, 6)) return 'H'
      if (inRange(detection, 2, 4)) return 'H'
      if (detection === 1) return 'M'
    }
    // O: 4-5
    if (inRange(occurrence, 4, 5)) {
      if (inRange(detection, 7, 10)) return 'H'
      if (inRange(detection, 5, 6)) return 'M'
      if (inRange(detection, 2, 4)) return 'M'
      if (detection === 1) return 'M'
    }
    // O: 2-3
    if (inRange(occurrence, 2, 3)) {
      if (inRange(detection, 7, 10)) return 'M'
      if (inRange(detection, 5, 6)) return 'M'
      if (inRange(detection, 2, 4)) return 'L'
      if (detection === 1) return 'L'
    }
    // O: 1
    if (occurrence === 1) {
      if (inRange(detection, 1, 10)) return 'L'
    }
    throw new Error('Invalid O value for S=7-8')
  }

  // ═══════════════════════════════════════════════════════════════
  // SEVERITY 4-6 (Medium) — 19 combinations
  // ═══════════════════════════════════════════════════════════════
  if (inRange(severity, 4, 6)) {
    // O: 8-10
    if (inRange(occurrence, 8, 10)) {
      if (inRange(detection, 7, 10)) return 'H'
      if (inRange(detection, 5, 6)) return 'H'
      if (inRange(detection, 2, 4)) return 'M'
      if (detection === 1) return 'M'
    }
    // O: 6-7
    if (inRange(occurrence, 6, 7)) {
      if (inRange(detection, 7, 10)) return 'M'
      if (inRange(detection, 5, 6)) return 'M'
      if (inRange(detection, 2, 4)) return 'M'
      if (detection === 1) return 'L'
    }
    // O: 4-5
    if (inRange(occurrence, 4, 5)) {
      if (inRange(detection, 7, 10)) return 'M'
      if (inRange(detection, 5, 6)) return 'L'
      if (inRange(detection, 2, 4)) return 'L'
      if (detection === 1) return 'L'
    }
    // O: 2-3
    if (inRange(occurrence, 2, 3)) {
      if (inRange(detection, 7, 10)) return 'L'
      if (inRange(detection, 5, 6)) return 'L'
      if (inRange(detection, 2, 4)) return 'L'
      if (detection === 1) return 'L'
    }
    // O: 1
    if (occurrence === 1) {
      if (inRange(detection, 1, 10)) return 'L'
    }
    throw new Error('Invalid O value for S=4-6')
  }

  // ═══════════════════════════════════════════════════════════════
  // SEVERITY 2-3 — 15 combinations
  // ═══════════════════════════════════════════════════════════════
  if (inRange(severity, 2, 3)) {
    // O: 8-10
    if (inRange(occurrence, 8, 10)) {
      if (inRange(detection, 7, 10)) return 'M'
      if (inRange(detection, 5, 6)) return 'M'
      if (inRange(detection, 2, 4)) return 'L'
      if (detection === 1) return 'L'
    }
    // O: 6-7
    if (inRange(occurrence, 6, 7)) {
      if (inRange(detection, 7, 10)) return 'L'
      if (inRange(detection, 5, 6)) return 'L'
      if (inRange(detection, 2, 4)) return 'L'
      if (detection === 1) return 'L'
    }
    // O: 4-5
    if (inRange(occurrence, 4, 5)) {
      if (inRange(detection, 7, 10)) return 'L'
      if (inRange(detection, 5, 6)) return 'L'
      if (inRange(detection, 2, 4)) return 'L'
      if (detection === 1) return 'L'
    }
    // O: 2-3
    if (inRange(occurrence, 2, 3)) {
      if (inRange(detection, 7, 10)) return 'L'
      if (inRange(detection, 5, 6)) return 'L'
      if (inRange(detection, 2, 4)) return 'L'
      if (detection === 1) return 'L'
    }
    // O: 1
    if (occurrence === 1) {
      if (inRange(detection, 1, 10)) return 'L'
    }
    throw new Error('Invalid O value for S=2-3')
  }

  // ═══════════════════════════════════════════════════════════════
  // SEVERITY 1 — 1 combination (all detections)
  // ═══════════════════════════════════════════════════════════════
  if (severity === 1) {
    if (inRange(occurrence, 1, 10)) {
      if (inRange(detection, 1, 10)) return 'L'
    }
    throw new Error('Invalid O value for S=1')
  }

  throw new Error('Invalid S value')
}

export function getAPFromLookup(
  severity: number,
  occurrence: number,
  detection: number
): APLevel {
  return getAPCodeFromLookup(severity, occurrence, detection)
}

/**
 * Validate AP value against lookup
 * Returns true if current AP matches expected AP
 */


export function validateAPValue(current: string, severity: number, occurrence: number, detection: number): boolean {
  try {
    const expected = getAPFromLookup(severity, occurrence, detection)
    return normalizeAPLevel(current) === expected
  } catch {
    return false
  }
}

/**
 * Get AP mismatch details
 */
export function getAPMismatch(
  currentAP: string,
  severity: number,
  occurrence: number,
  detection: number
): { expected: APLevel; match: boolean } {
  const expected = getAPFromLookup(severity, occurrence, detection)
  return {
    expected,
    match: normalizeAPLevel(currentAP) === expected
  }
}

/**
 * Full AP lookup table for reference (1000 entries)
 * Format: "S:O:D" → AP
 * 
 * This is a reference table derived from the getAPFromLookup() function
 * Keys are "S:O:D" combinations, values are AP levels
 */
export const AP_LOOKUP_TABLE: Record<string, APLevel> = {}

// Generate lookup table
for (let s = 1; s <= 10; s++) {
  for (let o = 1; o <= 10; o++) {
    for (let d = 1; d <= 10; d++) {
      const key = `${s}:${o}:${d}`
      AP_LOOKUP_TABLE[key] = getAPFromLookup(s, o, d)
    }
  }
}

/**
 * Get AP distribution statistics
 */
export function getAPStatistics(): { H: number; M: number; L: number; total: number } {
  const values = Object.values(AP_LOOKUP_TABLE)
  return {
    H: values.filter(v => v === 'H').length,
    M: values.filter(v => v === 'M').length,
    L: values.filter(v => v === 'L').length,
    total: values.length
  }
}

/**
 * Test cases covering critical S×O×D combinations
 * Verified against official AIAG/VDA table
 */
export const CRITICAL_TEST_CASES = [
  // Severity 9-10
  { s: 9, o: 8, d: 7, expected: 'H' as APLevel },
  { s: 10, o: 8, d: 5, expected: 'H' as APLevel },
  { s: 9, o: 6, d: 2, expected: 'H' as APLevel },
  { s: 10, o: 4, d: 1, expected: 'M' as APLevel },
  { s: 9, o: 2, d: 5, expected: 'M' as APLevel },
  { s: 10, o: 2, d: 2, expected: 'L' as APLevel },
  { s: 9, o: 1, d: 10, expected: 'L' as APLevel },

  // Severity 7-8
  { s: 8, o: 8, d: 1, expected: 'H' as APLevel },
  { s: 7, o: 6, d: 7, expected: 'H' as APLevel },
  { s: 8, o: 4, d: 5, expected: 'M' as APLevel },
  { s: 7, o: 2, d: 9, expected: 'M' as APLevel },
  { s: 8, o: 2, d: 2, expected: 'L' as APLevel },
  { s: 7, o: 1, d: 1, expected: 'L' as APLevel },

  // Severity 4-6
  { s: 5, o: 8, d: 7, expected: 'H' as APLevel },
  { s: 6, o: 8, d: 5, expected: 'H' as APLevel },
  { s: 4, o: 8, d: 2, expected: 'M' as APLevel },
  { s: 5, o: 6, d: 7, expected: 'M' as APLevel },
  { s: 6, o: 4, d: 7, expected: 'M' as APLevel },
  { s: 4, o: 2, d: 9, expected: 'L' as APLevel },

  // Severity 2-3
  { s: 3, o: 8, d: 7, expected: 'M' as APLevel },
  { s: 2, o: 8, d: 5, expected: 'M' as APLevel },
  { s: 3, o: 4, d: 7, expected: 'L' as APLevel },
  { s: 2, o: 1, d: 10, expected: 'L' as APLevel },

  // Severity 1
  { s: 1, o: 10, d: 10, expected: 'L' as APLevel },
  { s: 1, o: 1, d: 1, expected: 'L' as APLevel }
]

/**
 * Verify AP lookup table correctness against AIAG/VDA PFMEA Appendix C
 * 
 * Test coverage:
 * - S 9-10 (Acute safety/non-compliance): 7 test cases
 * - S 7-8 (Large impact): 7 test cases
 * - S 4-6 (Medium impact): 6 test cases
 * - S 2-3 (Low impact): 4 test cases
 * - S 1 (No effect): 1 test case
 * 
 * Total: 25 critical test cases covering all severity and O/D interaction patterns
 */
export function verifyAPLookupTable(): boolean {
  return CRITICAL_TEST_CASES.every(testCase => {
    const result = getAPFromLookup(testCase.s, testCase.o, testCase.d)
    const pass = result === testCase.expected
    if (!pass) {
      console.error(
        `AP lookup test FAILED: S=${testCase.s}, O=${testCase.o}, D=${testCase.d}. Expected '${testCase.expected}', got '${result}'`
      )
    }
    return pass
  })
}
