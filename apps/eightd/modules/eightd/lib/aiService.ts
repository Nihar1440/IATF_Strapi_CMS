/**
 * Core AI service with retry logic and Zod validation.
 *
 * Every AI call goes through callAIWithRetry which:
 * 1. Sends the prompt to the configured AI provider
 * 2. Extracts JSON from the response
 * 3. Validates with the Zod schema
 * 4. On failure: appends validation error to prompt and retries (max 3 attempts)
 */

import { z } from 'zod'
import { getAIProvider, extractJSON, type AIMessage, type AICompletionOptions } from '@/lib/ai/provider'
import { buildRetryPrompt } from './prompts'
import {
  AI_MAX_RETRIES,
  AI_DEFAULT_MAX_TOKENS,
  AI_DEFAULT_TEMPERATURE,
  AI_DEFAULT_TIMEOUT_MS,
} from './constants'

export interface AICallOptions<T extends z.ZodType> {
  systemPrompt: string
  userPrompt: string
  schema: T
  maxTokens?: number
  temperature?: number
  maxRetries?: number
  timeoutMs?: number
}

export type AICallResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`AI provider timeout after ${timeoutMs}ms`))
    }, timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

/**
 * Execute an AI call with automatic retry logic and Zod validation.
 *
 * - Max 3 retry attempts
 * - On validation failure, appends error details to the prompt
 * - Returns typed result matching the Zod schema
 */
export async function callAIWithRetry<T extends z.ZodType>(
  options: AICallOptions<T>,
): Promise<AICallResult<z.infer<T>>> {
  const retries = options.maxRetries ?? AI_MAX_RETRIES
  const timeoutMs = options.timeoutMs ?? AI_DEFAULT_TIMEOUT_MS

  const completionOptions: AICompletionOptions = {
    maxTokens: options.maxTokens ?? AI_DEFAULT_MAX_TOKENS,
    temperature: options.temperature ?? AI_DEFAULT_TEMPERATURE,
  }

  let lastError = ''

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Initialise provider inside the loop so init errors are caught per-attempt
      const provider = getAIProvider()

      const startedAt = Date.now()

      // Build messages — append retry context for attempts > 1
      const userContent =
        attempt === 1
          ? options.userPrompt
          : options.userPrompt + buildRetryPrompt(lastError, attempt)

      const messages: AIMessage[] = [{ role: 'user', content: userContent }]

      // Call the AI provider
      const rawResponse = await withTimeout(
        provider.complete(
          messages,
          options.systemPrompt,
          completionOptions,
        ),
        timeoutMs,
      )

      const durationMs = Date.now() - startedAt
      console.info(`[AI] Provider '${provider.name}' responded in ${durationMs}ms (attempt ${attempt}/${retries})`)

      // Extract JSON from the response
      const jsonStr = extractJSON(rawResponse)

      // Parse JSON
      let parsed: unknown
      try {
        parsed = JSON.parse(jsonStr)
      } catch (parseErr) {
        lastError = `JSON parse error: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}. Raw response starts with: "${jsonStr.substring(0, 200)}"`
        console.error(`[AI] Attempt ${attempt}/${retries} — JSON parse failed:`, lastError)
        continue
      }

      // Validate with Zod schema
      const validation = options.schema.safeParse(parsed)
      if (validation.success) {
        return { success: true, data: validation.data }
      }

      // Collect validation errors
      const zodErrors = validation.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ')
      lastError = `Schema validation failed: ${zodErrors}`
      console.error(`[AI] Attempt ${attempt}/${retries} — Validation failed:`, lastError)
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : String(err)
      if (
        rawMsg.includes('not_found_error') &&
        rawMsg.includes('model:') &&
        (process.env.AI_PROVIDER ?? 'anthropic').toLowerCase() === 'anthropic'
      ) {
        lastError =
          'AI provider error: Anthropic model not found for this API key. ' +
          'Set `ANTHROPIC_MODEL` to a model you have access to (e.g. `claude-3-sonnet-20240229` or `claude-3-haiku-20240307`). ' +
          `Raw error: ${rawMsg}`
      } else {
        lastError = `AI provider error: ${rawMsg}`
      }
      console.error(`[AI] Attempt ${attempt}/${retries} — Provider error:`, lastError)

      // A full provider timeout already consumed most of the request budget.
      // Stop retrying to avoid platform-level timeouts on the route.
      if (rawMsg.includes('AI provider timeout after')) {
        break
      }
    }
  }

  return {
    success: false,
    error: `AI generation failed after ${retries} attempts. Last error: ${lastError}`,
  }
}
