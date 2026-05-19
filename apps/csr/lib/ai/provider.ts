import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Tool } from '@google/generative-ai'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
  /** Optional base64-encoded image data (without data:... prefix) */
  imageBase64?: string
  /** MIME type of the image, e.g. 'image/png' */
  imageMimeType?: string
}

export interface AICompletionOptions {
  /** Max tokens for the response (default 4096) */
  maxTokens?: number
  /** Temperature for randomness (default 0.3 for structured output) */
  temperature?: number
  /** Enable native web search grounding (currently supported via Gemini provider) */
  useWebSearch?: boolean
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
const AI_RETRY_BASE_DELAY_MS = 1000
export const AI_TIMEOUT_MS = 25_000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

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

function isRetryableError(err: unknown): boolean {
  if (!(err instanceof Error)) return true
  const msg = err.message.toLowerCase()
  if (msg.includes('timed out')) return true
  if (msg.includes('429') || msg.includes('rate') || msg.includes('overloaded')) return true
  if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('504')) return true
  if (msg.includes('econnreset') || msg.includes('enotfound') || msg.includes('fetch failed')) return true
  return false
}

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
  if (!normalized) return 'claude-3-5-sonnet-20241022'
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
    this.client = new Anthropic({ apiKey, maxRetries: 0 })
    this.modelName = normalizeAnthropicModel(
      process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
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
      messages: messages.map((m) => {
        if (m.imageBase64 && m.imageMimeType) {
          return {
            role: m.role as 'user' | 'assistant',
            content: [
              {
                type: 'image' as const,
                source: {
                  type: 'base64' as const,
                  media_type: m.imageMimeType as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
                  data: m.imageBase64,
                },
              },
              {
                type: 'text' as const,
                text: m.content,
              },
            ],
          }
        }
        return { role: m.role as 'user' | 'assistant', content: m.content }
      }),
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
    const generationConfig = {
      maxOutputTokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.3,
    }
    
    const tools: Tool[] | undefined = options?.useWebSearch
      ? [{ googleSearchRetrieval: {} }]
      : undefined

    const model = this.client.getGenerativeModel({
      model: this.modelName,
      systemInstruction: systemPrompt,
      tools,
      generationConfig,
    })

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

  _provider = new ResilientProvider(raw)
  _cachedProviderName = providerName
  return _provider
}

export const aiProvider = {
  get instance(): AIProvider {
    return getAIProvider()
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function extractJSON(raw: string): string {
  // 1. Closed ```json ... ``` fence
  const jsonFenceMatch = raw.match(/```json\s*([\s\S]*?)```/)
  if (jsonFenceMatch) return jsonFenceMatch[1].trim()

  // 2. Closed ``` ... ``` fence
  const fenceMatch = raw.match(/```\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()

  // 3. Unclosed ```json fence (truncated response) — take everything after the fence marker
  const unclosedJsonFence = raw.match(/```json\s*([\s\S]*)$/)
  if (unclosedJsonFence) return unclosedJsonFence[1].trim()

  const unclosedFence = raw.match(/```\s*([\s\S]*)$/)
  if (unclosedFence) return unclosedFence[1].trim()

  // 4. Match outermost { ... }
  const objMatch = raw.match(/(\{[\s\S]*\})/)
  if (objMatch) return objMatch[1].trim()

  // 5. Match outermost [ ... ]
  const arrMatch = raw.match(/(\[[\s\S]*\])/)
  if (arrMatch) return arrMatch[1].trim()

  return raw.trim()
}
