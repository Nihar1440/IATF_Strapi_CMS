/**
 * D4 Chain Completion — AI Call #5
 *
 * Triggered on partial regeneration of D4 5-Whys.
 * Corrects grammar and generates the rest of the chain logically.
 */

import type { ChainCompletionResult, ChainCompletionInput } from '../types/ai'
import { chainCompletionResultSchema } from '../schemas/aiSchemas'
import { callAIWithRetry } from './aiService'
import { buildChainSystemPrompt, buildChainUserPrompt } from './prompts'

export async function completeChain(
  input: ChainCompletionInput,
  language: 'en' | 'de',
): Promise<{ success: true; data: ChainCompletionResult } | { success: false; error: string }> {
  return callAIWithRetry({
    systemPrompt: buildChainSystemPrompt(language),
    userPrompt: buildChainUserPrompt(input),
    schema: chainCompletionResultSchema,
    maxTokens: 1024,
    temperature: 0.3,
  })
}
