import type { RootCauseBackfillInput, RootCauseBackfillResult } from '../types/ai'
import { rootCauseBackfillResultSchema } from '../schemas/aiSchemas'
import { callAIWithRetry } from './aiService'
import {
  buildRootCauseBackfillSystemPrompt,
  buildRootCauseBackfillUserPrompt,
} from './prompts'

export async function backfillRootCauseChain(
  input: RootCauseBackfillInput,
  language: 'en' | 'de',
): Promise<{ success: true; data: RootCauseBackfillResult } | { success: false; error: string }> {
  return callAIWithRetry({
    systemPrompt: buildRootCauseBackfillSystemPrompt(language),
    userPrompt: buildRootCauseBackfillUserPrompt(input),
    schema: rootCauseBackfillResultSchema,
    maxTokens: 1024,
    temperature: 0.3,
  })
}
