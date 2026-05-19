import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AICompletionOptions {
  /** Max tokens for the response (default 4096) */
  maxTokens?: number
  /** Temperature for randomness (default 0.3 for structured output) */
  temperature?: number
}

export interface AIProvider {
  readonly name: string
  complete(
    messages: AIMessage[],
    systemPrompt: string,
    options?: AICompletionOptions,
  ): Promise<string>
}

// ─── Retry / Timeout Helpers ──────────────────────────────────────────────────

// Keep the total worst-case time below the route handler maxDuration (60s).
// 2 attempts × 25s timeout + backoff fits within 60s with margin.
const AI_MAX_RETRIES = 2
const AI_RETRY_BASE_DELAY_MS = 1000  // 1s → 2s exponential backoff
export const AI_TIMEOUT_MS = 25_000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Race an AI call against a timeout. Rejects with a clear message on timeout.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`AI request timed out after ${timeoutMs}ms`)),
      timeoutMs,
    )
    promise.then(
      (val) => { clearTimeout(timer); resolve(val) },
      (err) => { clearTimeout(timer); reject(err) },
    )
  })
}

/**
 * Returns true for errors that are transient and worth retrying:
 * rate limits (429), server errors (5xx), timeouts, network issues.
 */
function isRetryableError(err: unknown): boolean {
  if (!(err instanceof Error)) return true
  const msg = err.message.toLowerCase()

  // Timeout — always retry
  if (msg.includes('timed out')) return true

  // Rate limit / overloaded
  if (msg.includes('429') || msg.includes('rate') || msg.includes('overloaded')) return true

  // Server errors
  if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('504')) return true

  // Network issues
  if (msg.includes('econnreset') || msg.includes('enotfound') || msg.includes('fetch failed')) return true

  // Non-retryable (e.g. auth errors, validation)
  return false
}

/**
 * Wraps an AI provider with retry + timeout logic.
 * SDK-level retries are disabled (maxRetries: 0) so this is the sole retry layer.
 */
class ResilientProvider implements AIProvider {
  readonly name: string
  private inner: AIProvider

  constructor(inner: AIProvider) {
    this.inner = inner
    this.name = inner.name
  }

  async complete(
    messages: AIMessage[],
    systemPrompt: string,
    options?: AICompletionOptions,
  ): Promise<string> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= AI_MAX_RETRIES; attempt++) {
      try {
        const result = await withTimeout(
          this.inner.complete(messages, systemPrompt, options),
          AI_TIMEOUT_MS,
        )
        return result
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        console.error(
          `[AI] ${this.name} attempt ${attempt}/${AI_MAX_RETRIES} failed:`,
          lastError.message,
        )

        if (attempt < AI_MAX_RETRIES && isRetryableError(err)) {
          const delay = AI_RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 1000
          console.log(`[AI] Retrying in ${Math.round(delay)}ms...`)
          await sleep(delay)
        }
      }
    }

    throw lastError || new Error('AI completion failed after all retries')
  }
}

function normalizeAnthropicModel(model: string): string {
  const normalized = model.trim()
  if (!normalized) return 'claude-3-sonnet-20240229'

  // Anthropic API requires exact model ids; map common shorthand aliases.
  switch (normalized) {
    case 'claude-sonnet-4':
    case 'claude-sonnet-4-6':
      return 'claude-sonnet-4-20250514'
    case 'claude-opus-4':
      return 'claude-opus-4-20250514'
    case 'claude-haiku-4':
      return 'claude-haiku-4-5-20251001'
    default:
      return normalized
  }
}

// ─── Anthropic Provider ───────────────────────────────────────────────────────

class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic'
  private client: Anthropic
  private modelName: string

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
    // Disable SDK-internal retries so our own retry/timeout logic stays in control.
    this.client = new Anthropic({ apiKey, maxRetries: 0 })
    // Default to a stable model id; normalize shorthand aliases if provided.
    this.modelName = normalizeAnthropicModel(
      process.env.ANTHROPIC_MODEL ?? 'claude-3-sonnet-20240229',
    )
  }

  async complete(
    messages: AIMessage[],
    systemPrompt: string,
    options?: AICompletionOptions,
  ): Promise<string> {
    const response = await this.client.messages.create({
      model: this.modelName,
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.3,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    })

    const block = response.content[0]
    if (block.type !== 'text') throw new Error('Unexpected Anthropic response type')
    return block.text
  }
}

// ─── OpenAI Provider ──────────────────────────────────────────────────────────

class OpenAIProvider implements AIProvider {
  readonly name = 'openai'
  private client: OpenAI
  private modelName: string

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
    // Disable SDK-internal retries so our own retry/timeout logic stays in control.
    this.client = new OpenAI({ apiKey, maxRetries: 0 })
    this.modelName = process.env.OPENAI_MODEL ?? 'gpt-4o'
  }

  async complete(
    messages: AIMessage[],
    systemPrompt: string,
    options?: AICompletionOptions,
  ): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.modelName,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 4096,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('Empty OpenAI response')
    return content
  }
}

// ─── Gemini Provider ─────────────────────────────────────────────────────────

class GeminiProvider implements AIProvider {
  readonly name = 'gemini'
  private client: GoogleGenerativeAI
  private modelName: string

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
    this.client = new GoogleGenerativeAI(apiKey)
    this.modelName = process.env.GEMINI_MODEL ?? 'gemini-1.5-pro'
  }

  async complete(
    messages: AIMessage[],
    systemPrompt: string,
    options?: AICompletionOptions,
  ): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: this.modelName,
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.3,
      },
    })

    // Gemini requires alternating user/model roles — map 'assistant' → 'model'
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const lastMessage = messages[messages.length - 1]
    const chat = model.startChat({ history })
    const result = await chat.sendMessage(lastMessage.content)
    const text = result.response.text()
    if (!text) throw new Error('Empty Gemini response')
    return text
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

let _provider: AIProvider | null = null
let _cachedProviderName: string | null = null

export function getAIProvider(): AIProvider {
  const providerName = (process.env.AI_PROVIDER ?? 'anthropic').toLowerCase()

  // Re-initialise if provider changed (e.g. env var updated in dev)
  if (_provider && _cachedProviderName === providerName) return _provider

  let raw: AIProvider
  switch (providerName) {
    case 'openai':
      raw = new OpenAIProvider()
      break
    case 'gemini':
      raw = new GeminiProvider()
      break
    case 'anthropic':
    default:
      raw = new AnthropicProvider()
      break
  }

  // Wrap with retry + timeout logic
  _provider = new ResilientProvider(raw)
  _cachedProviderName = providerName
  return _provider
}

/** Convenience export — lazily initialised singleton */
export const aiProvider = {
  get instance(): AIProvider {
    return getAIProvider()
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract the JSON block from an AI response that may contain markdown fences.
 * Falls back to the raw text if no fences are found.
 */
export function extractJSON(raw: string): string {
  // Try to find ```json ... ``` first, then plain ``` ... ```
  const jsonFenceMatch = raw.match(/```json\s*([\s\S]*?)```/)
  if (jsonFenceMatch) return jsonFenceMatch[1].trim()

  const fenceMatch = raw.match(/```\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()

  // Try to find raw JSON object or array
  const objMatch = raw.match(/(\{[\s\S]*\})/)
  if (objMatch) return objMatch[1].trim()

  const arrMatch = raw.match(/(\[[\s\S]*\])/)
  if (arrMatch) return arrMatch[1].trim()

  return raw.trim()
}
