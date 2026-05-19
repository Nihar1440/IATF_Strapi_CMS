import type { TextTranslationInput, TextTranslationResult } from '../types/ai'
import { textTranslationResultSchema } from '../schemas/aiSchemas'
import { callAIWithRetry } from './aiService'

function buildTextTranslationSystemPrompt(targetLanguage: 'en' | 'de'): string {
  const lang = targetLanguage === 'de' ? 'German' : 'English'

  return `You are a professional technical translator for automotive quality complaints.

Translate the provided text into ${lang}.

Rules:
1. Preserve the original meaning, defect details, quantities, dates, and technical terms.
2. Do not summarize.
3. Do not add explanations.
4. If the text is already in ${lang}, lightly normalize it and return it in ${lang}.

CRITICAL: Respond with ONLY valid JSON.

Required JSON schema:
{
  "translatedText": "string"
}`
}

function buildTextTranslationUserPrompt(input: TextTranslationInput): string {
  return `Translate the following customer complaint between German and English:

${input.text}`
}

export async function translateText(
  input: TextTranslationInput,
): Promise<{ success: true; data: TextTranslationResult } | { success: false; error: string }> {
  return callAIWithRetry({
    systemPrompt: buildTextTranslationSystemPrompt(input.targetLanguage),
    userPrompt: buildTextTranslationUserPrompt(input),
    schema: textTranslationResultSchema,
    maxTokens: 1400,
    temperature: 0.1,
  })
}
