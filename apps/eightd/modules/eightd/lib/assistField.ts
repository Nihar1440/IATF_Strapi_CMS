/**
 * D1/D2 Field Assist — AI Call #1
 *
 * Triggered on field blur or on demand.
 * Checks completeness, improves grammar, suggests improvements.
 */

import type { AssistResult, AssistInput } from '../types/ai'
import { assistResultSchema } from '../schemas/aiSchemas'
import { callAIWithRetry } from './aiService'
import { buildAssistSystemPrompt, buildAssistUserPrompt } from './prompts'

export async function assistField(
  input: AssistInput,
  language: 'en' | 'de',
): Promise<{ success: true; data: AssistResult } | { success: false; error: string }> {
  return callAIWithRetry({
    systemPrompt: buildAssistSystemPrompt(language),
    userPrompt: buildAssistUserPrompt(input),
    schema: assistResultSchema,
    maxTokens: 1024,
    temperature: 0.4,
  })
}
