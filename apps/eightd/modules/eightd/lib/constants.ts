/**
 * Shared constants for the 8D Report Generator module.
 *
 * Centralises magic strings, numbers, and configuration values
 * that were previously scattered across hooks, services, and components.
 */

// ─── AI Configuration ────────────────────────────────────────────────────────

/** Maximum number of AI generation retries (server-side) */
export const AI_MAX_RETRIES = 3

/** Default maximum output tokens for AI calls */
export const AI_DEFAULT_MAX_TOKENS = 4096

/** Default temperature for structured AI output */
export const AI_DEFAULT_TEMPERATURE = 0.3

/** Per-attempt AI provider timeout (ms) for non-generation calls.
 *  Override via AI_DEFAULT_TIMEOUT_MS env var for platforms with shorter limits. */
export const AI_DEFAULT_TIMEOUT_MS = 25_000

function readPositiveIntEnv(name: string, fallback: number): number {
	const raw = process.env[name]
	if (!raw) return fallback
	const parsed = Number.parseInt(raw, 10)
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

/**
 * Generation tuning (D3/D4/D5).
 *
 * Defaults are generous for local development (~55s, 2 retries).
 * For Netlify free tier (26s function limit), set these env vars:
 *   AI_GENERATION_TIMEOUT_MS=22000
 *   AI_GENERATION_MAX_RETRIES=1
 */
export const AI_GENERATION_TIMEOUT_MS = readPositiveIntEnv('AI_GENERATION_TIMEOUT_MS', 55_000)
export const AI_GENERATION_MAX_RETRIES = readPositiveIntEnv('AI_GENERATION_MAX_RETRIES', 2)
export const AI_GENERATION_MAX_TOKENS = readPositiveIntEnv('AI_GENERATION_MAX_TOKENS', 4096)

/** Sufficiency check needs less time (simpler output).
 *  Override via AI_SUFFICIENCY_TIMEOUT_MS env var if needed. */
export const AI_SUFFICIENCY_TIMEOUT_MS = readPositiveIntEnv('AI_SUFFICIENCY_TIMEOUT_MS', 10_000)

/** Maximum regeneration attempts per client session */
export const MAX_REGENERATIONS = 5

/** Debounce delay (ms) before triggering consistency check after edits */
export const CONSISTENCY_DEBOUNCE_MS = 2_000

// ─── Storage Keys ────────────────────────────────────────────────────────────

/** localStorage key for the saved report draft */
export const STORAGE_KEY = '8d-report-draft'

/** localStorage key for the current wizard step */
export const STEP_KEY = '8d-report-step'

/** sessionStorage – cached generation result */
export const GEN_CACHE_KEY = '8d-gen-cache'

/** sessionStorage – generation input fingerprint */
export const GEN_FP_KEY = '8d-gen-fingerprint'

/** sessionStorage – cached sufficiency result */
export const SUFF_CACHE_KEY = '8d-suff-cache'

/** sessionStorage – sufficiency input fingerprint */
export const SUFF_FP_KEY = '8d-suff-fingerprint'

/** sessionStorage – cached consistency result */
export const CONS_CACHE_KEY = '8d-cons-cache'

/** sessionStorage – consistency input fingerprint */
export const CONS_FP_KEY = '8d-cons-fingerprint'

/** sessionStorage – regeneration counter */
export const REGEN_COUNT_KEY = '8d-regen-count'

// ─── Autosave ────────────────────────────────────────────────────────────────

/** Interval (ms) between autosave writes to localStorage */
export const AUTOSAVE_INTERVAL_MS = 30_000

// ─── Brand / Theme ───────────────────────────────────────────────────────────

/** Primary brand colour (hex) used in PDF/XLSX exports */
export const BRAND_COLOR = '#1d4ed8'

/** Brand colour without '#' for ExcelJS ARGB fills (prepend FF) */
export const BRAND_COLOR_HEX = '1D4ED8'
