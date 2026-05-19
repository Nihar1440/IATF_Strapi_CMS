/**
 * Phase 3 Split Generation — AI Call: D6
 *
 * Generates D6 (Implementation & Effectiveness Verification) from D5 actions.
 */

import type { GenerationD6Result, GenerationD6Input } from '../types/ai'
import { generationD6ResultSchema } from '../schemas/aiSchemas'
import { callAIWithRetry } from './aiService'
import { buildGenerationD6SystemPrompt, buildGenerationD6UserPrompt } from './prompts'
import {
  AI_GENERATION_MAX_RETRIES,
  AI_GENERATION_MAX_TOKENS,
  AI_GENERATION_TIMEOUT_MS,
} from './constants'

export async function generateD6(
  input: GenerationD6Input,
  language: 'en' | 'de',
): Promise<{ success: true; data: GenerationD6Result } | { success: false; error: string }> {
  return callAIWithRetry({
    systemPrompt: buildGenerationD6SystemPrompt(language),
    userPrompt: buildGenerationD6UserPrompt(input),
    schema: generationD6ResultSchema,
    maxTokens: AI_GENERATION_MAX_TOKENS,
    temperature: 0.3,
    maxRetries: AI_GENERATION_MAX_RETRIES,
    timeoutMs: AI_GENERATION_TIMEOUT_MS,
  })
}
