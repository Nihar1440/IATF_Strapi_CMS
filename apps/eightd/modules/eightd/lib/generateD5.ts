/**
 * Phase 2 Split Generation — AI Call #3b
 *
 * Generates D5 based on D4 results.
 */

import type { GenerationD5Result, GenerationD5Input } from '../types/ai'
import { generationD5ResultSchema } from '../schemas/aiSchemas'
import { callAIWithRetry } from './aiService'
import { buildGenerationD5SystemPrompt, buildGenerationD5UserPrompt } from './prompts'
import {
  AI_GENERATION_MAX_RETRIES,
  AI_GENERATION_MAX_TOKENS,
  AI_GENERATION_TIMEOUT_MS,
} from './constants'

export async function generateD5(
  input: GenerationD5Input,
  language: 'en' | 'de',
): Promise<{ success: true; data: GenerationD5Result } | { success: false; error: string }> {
  return callAIWithRetry({
    systemPrompt: buildGenerationD5SystemPrompt(language),
    userPrompt: buildGenerationD5UserPrompt(input),
    schema: generationD5ResultSchema,
    maxTokens: AI_GENERATION_MAX_TOKENS,
    temperature: 0.3,
    maxRetries: AI_GENERATION_MAX_RETRIES,
    timeoutMs: AI_GENERATION_TIMEOUT_MS,
  })
}
