/**
 * Phase 1 Split Generation — AI Call #3a
 *
 * Generates D2 enhanced + D3 + D4 roots.
 */

import type { GenerationD3D4Result, GenerationInput } from '../types/ai'
import { generationD3D4ResultSchema } from '../schemas/aiSchemas'
import { callAIWithRetry } from './aiService'
import { buildGenerationD3D4SystemPrompt, buildGenerationD3D4UserPrompt } from './prompts'
import {
  AI_GENERATION_MAX_RETRIES,
  AI_GENERATION_MAX_TOKENS,
  AI_GENERATION_TIMEOUT_MS,
} from './constants'

export async function generateD3D4(
  input: GenerationInput,
  language: 'en' | 'de',
): Promise<{ success: true; data: GenerationD3D4Result } | { success: false; error: string }> {
  return callAIWithRetry({
    systemPrompt: buildGenerationD3D4SystemPrompt(language),
    userPrompt: buildGenerationD3D4UserPrompt(input),
    schema: generationD3D4ResultSchema,
    maxTokens: AI_GENERATION_MAX_TOKENS,
    temperature: 0.3,
    maxRetries: AI_GENERATION_MAX_RETRIES,
    timeoutMs: AI_GENERATION_TIMEOUT_MS,
  })
}
