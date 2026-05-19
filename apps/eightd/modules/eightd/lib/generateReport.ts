/**
 * Full Generation — AI Call #3
 *
 * Single AI call that generates D3 + D4 + D5 proposals.
 * Triggered after D2 sufficiency check passes.
 */

import type { GenerationResult, GenerationInput } from '../types/ai'
import { generationResultSchema } from '../schemas/aiSchemas'
import { callAIWithRetry } from './aiService'
import { buildGenerationSystemPrompt, buildGenerationUserPrompt } from './prompts'
import {
  AI_GENERATION_MAX_RETRIES,
  AI_GENERATION_MAX_TOKENS,
  AI_GENERATION_TIMEOUT_MS,
} from './constants'

export async function generateReport(
  input: GenerationInput,
  language: 'en' | 'de',
): Promise<{ success: true; data: GenerationResult } | { success: false; error: string }> {
  return callAIWithRetry({
    systemPrompt: buildGenerationSystemPrompt(language),
    userPrompt: buildGenerationUserPrompt(input),
    schema: generationResultSchema,
    maxTokens: AI_GENERATION_MAX_TOKENS,
    temperature: 0.3,
    maxRetries: AI_GENERATION_MAX_RETRIES,
    timeoutMs: AI_GENERATION_TIMEOUT_MS,
  })
}
