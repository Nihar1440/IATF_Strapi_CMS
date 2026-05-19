/* ------------------------------------------------------------------ */
/*  CSR Matrix – Module Constants                                     */
/* ------------------------------------------------------------------ */

/** localStorage key for persisting the CSR form draft */
export const CSR_STORAGE_KEY = 'csr-matrix-draft'

/** localStorage key for the current wizard step */
export const CSR_STEP_KEY = 'csr-matrix-step'

/** Autosave interval in milliseconds */
export const CSR_AUTOSAVE_INTERVAL_MS = 30_000

/** Maximum time the Excel generation may take (ms) */
export const CSR_GENERATION_TIMEOUT_MS = 8_000

/** Download link expiry in minutes */
export const DOWNLOAD_EXPIRY_MINUTES = 15

/** Brand colour matching the IATF Solutions design system */
export const BRAND_COLOR = '#1d4ed8'
export const BRAND_COLOR_HEX = '1D4ED8'

/** Tool identifier for billing / credit system */
export const CSR_TOOL_ID = 'tool_csr'

/** Maximum number of OEMs selectable at once (perf guard) */
export const MAX_OEM_SELECTION = 10

/** Maximum number of processes in a process map */
export const MAX_PROCESSES = 50
