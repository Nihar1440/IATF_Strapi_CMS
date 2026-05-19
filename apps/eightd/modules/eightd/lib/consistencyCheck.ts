/**
 * Consistency Check — AI Call #4
 *
 * Triggered when the user edits D4 or D5 after AI generation.
 * Verifies logical consistency across:
 * - D2 problem description (symptom only, no causes/actions)
 * - D3 containment actions (temporary, Verb + Noun grammar)
 * - D4 root causes (TUA → SUA, TUN → SUN, 5 Why chains)
 * - D5 corrective actions (linked to root causes, grammar compliance)
 * - No blame on individuals
 * - No vague wording
 */

import type { ConsistencyResult, ConsistencyInput } from '../types/ai'
import { consistencyResultSchema } from '../schemas/aiSchemas'
import { callAIWithRetry } from './aiService'
import {
  buildConsistencySystemPrompt,
  buildConsistencyUserPrompt,
} from './prompts'

export async function checkConsistency(
  input: ConsistencyInput,
  language: 'en' | 'de',
): Promise<{ success: true; data: ConsistencyResult } | { success: false; error: string }> {
  return callAIWithRetry({
    systemPrompt: buildConsistencySystemPrompt(language),
    userPrompt: buildConsistencyUserPrompt(input),
    schema: consistencyResultSchema,
    maxTokens: 2048,
  })
}
