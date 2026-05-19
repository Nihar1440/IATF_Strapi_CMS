/**
 * D2 Sufficiency Check — AI Call #2
 *
 * Evaluates whether D1 + D2 data is detailed enough to generate D3/D4/D5.
 * Returns pass/fail with specific gaps if insufficient.
 */

import type { SufficiencyResult, SufficiencyInput } from '../types/ai'
import { sufficiencyResultSchema } from '../schemas/aiSchemas'
import { callAIWithRetry } from './aiService'
import {
  buildSufficiencySystemPrompt,
  buildSufficiencyUserPrompt,
} from './prompts'
import { AI_SUFFICIENCY_TIMEOUT_MS } from './constants'

export async function checkSufficiency(
  input: SufficiencyInput,
  language: 'en' | 'de',
): Promise<{ success: true; data: SufficiencyResult } | { success: false; error: string }> {
  return callAIWithRetry({
    systemPrompt: buildSufficiencySystemPrompt(language),
    userPrompt: buildSufficiencyUserPrompt(input),
    schema: sufficiencyResultSchema,
    maxTokens: 1024,
    maxRetries: 2,
    timeoutMs: AI_SUFFICIENCY_TIMEOUT_MS,
  })
}
