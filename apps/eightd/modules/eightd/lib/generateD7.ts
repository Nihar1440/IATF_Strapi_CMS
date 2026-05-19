/**
 * Phase 3 Split Generation — AI Call: D7
 *
 * Generates D7 (Systemic Preventive Actions) from D3 + D5 + root cause.
 */

import type { GenerationD7Result, GenerationD7Input } from '../types/ai'
import { generationD7ResultSchema } from '../schemas/aiSchemas'
import { callAIWithRetry } from './aiService'
import { buildGenerationD7SystemPrompt, buildGenerationD7UserPrompt } from './prompts'
import {
  AI_GENERATION_MAX_RETRIES,
  AI_GENERATION_MAX_TOKENS,
  AI_GENERATION_TIMEOUT_MS,
} from './constants'

export async function generateD7(
  input: GenerationD7Input,
  language: 'en' | 'de',
): Promise<{ success: true; data: GenerationD7Result } | { success: false; error: string }> {
  return callAIWithRetry({
    systemPrompt: buildGenerationD7SystemPrompt(language),
    userPrompt: buildGenerationD7UserPrompt(input),
    schema: generationD7ResultSchema,
    maxTokens: AI_GENERATION_MAX_TOKENS,
    temperature: 0.3,
    maxRetries: AI_GENERATION_MAX_RETRIES,
    timeoutMs: AI_GENERATION_TIMEOUT_MS,
  })
}
