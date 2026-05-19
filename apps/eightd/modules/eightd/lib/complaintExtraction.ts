import type { ComplaintExtractionInput, ComplaintExtractionResult } from '../types/ai'
import { complaintExtractionResultSchema } from '../schemas/aiSchemas'
import { callAIWithRetry } from './aiService'

function buildComplaintExtractionSystemPrompt(language: 'en' | 'de'): string {
  const lang = language === 'de' ? 'German' : 'English'

  return `You are an expert in automotive quality management and VDA 8D problem descriptions.

Extract the important information from a customer complaint and map it into structured D2 fields.

Rules:
1. Write all output in ${lang}.
2. Stay at symptom level. Do not invent root causes or corrective actions.
3. If the complaint does not contain a field clearly, return an empty string for that field.
4. Keep the wording concise, specific, and technically clear.
5. For IS / IS NOT entries, summarize only what is explicitly supported by the complaint text.
6. Fill as many D2 fields as the complaint clearly supports, but avoid duplicate phrasing across fields.
7. If the same fact could fit multiple fields, put it in the most specific field and leave the others empty.
8. Do not repeat a "where" detail in what, when, howMany, or IS/IS NOT unless the complaint explicitly distinguishes them.

CRITICAL: Respond with ONLY valid JSON.

Required JSON schema:
{
  "what": "string",
  "where": "string",
  "when": "string",
  "howMany": "string",
  "detectionMethod": "string",
  "how": "string",
  "whyProblem": "string",
  "quantitativeDeviation": "string",
  "qualitativeDescription": "string",
  "customerImpact": "string",
  "isAnalysis": {
    "what": "string",
    "where": "string",
    "when": "string",
    "howMany": "string"
  },
  "isNotAnalysis": {
    "what": "string",
    "where": "string",
    "when": "string",
    "howMany": "string"
  }
}`
}

function buildComplaintExtractionUserPrompt(input: ComplaintExtractionInput): string {
  return `Customer complaint text:
${input.customerComplaintText}

Extract the structured D2 information from this complaint.`
}

export async function extractComplaint(
  input: ComplaintExtractionInput,
  language: 'en' | 'de',
): Promise<{ success: true; data: ComplaintExtractionResult } | { success: false; error: string }> {
  return callAIWithRetry({
    systemPrompt: buildComplaintExtractionSystemPrompt(language),
    userPrompt: buildComplaintExtractionUserPrompt(input),
    schema: complaintExtractionResultSchema,
    maxTokens: 1400,
    temperature: 0.2,
  })
}
