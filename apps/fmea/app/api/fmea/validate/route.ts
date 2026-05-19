import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit/rateLimit'
import { isAuthenticatedFromRequest } from '@/lib/session/session'
import { parseExcelFMEA, validateParserResult } from '@/modules/fmea/lib/parser'
import { validateFmeaRows } from '@/modules/fmea/lib/rulesEngine'
import { generateFmeaAiFindings } from '@/modules/fmea/lib/aiFindings'
import { fmeaValidateRequestSchema } from '@/modules/fmea/schemas/formSchemas'
import type { ConfidenceLevel, FmeaRow, FmeaValidationResult, ParserResult } from '@/modules/fmea/types'

export const runtime = 'nodejs'
export const maxDuration = 60

interface ValidateResponse {
  success: boolean
  validationResult?: FmeaValidationResult
  rows?: FmeaRow[]
  headerMap?: Record<string, string>
  headerConfidence?: ConfidenceLevel
  parserWarnings?: string[]
  parserMetadata?: ParserResult['metadata']
  error?: string
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ValidateResponse>> {
  // 1. Rate limit check
  const allowed = await checkRateLimit(request)
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { status: 429 },
    )
  }

  // 2. Authentication check (session-based, same as CSR & 8D)
  const authed = await isAuthenticatedFromRequest(request)
  if (!authed) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON' },
      { status: 400 },
    )
  }

  // Validate request schema
  const parsed = fmeaValidateRequestSchema.safeParse(body)
  if (!parsed.success) {
    const errorMessage = parsed.error.issues[0]?.message ?? 'Invalid request format'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 },
    )
  }

  const {
    file: base64File,
    sheet_index = 0,
    header_row,
    language = 'en'
  } = parsed.data

  try {
    // Decode base64 to buffer
    const buffer = Buffer.from(base64File, 'base64')
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)

    // Parse the Excel file
    const parserResult = await parseExcelFMEA(arrayBuffer, {
      sheet_index,
      header_row,
    })
    const parserValidation = validateParserResult(parserResult)
    const parserWarnings = [
      ...parserResult.warnings,
      ...parserValidation.errors.map((error) => `Structure: ${error}`),
    ]

    // Validate parsed rows with parser metadata as the document-level source of truth.
    const validationResult = await validateFmeaRows(parserResult.rows, {
      header_map: parserResult.header_map,
      raw_headers: parserResult.raw_headers,
      unmapped_headers: parserResult.unmapped_headers,
      confidence: parserResult.confidence,
      warnings: parserResult.warnings,
      legacy_indicators: parserResult.legacy_indicators,
      metadata: parserResult.metadata,
    })
    validationResult.ai_findings = await generateFmeaAiFindings(
      parserResult.rows,
      validationResult.issues,
      language === 'de' ? 'de' : 'en',
    )

    return NextResponse.json({
      success: true,
      validationResult,
      rows: parserResult.rows,
      headerMap: parserResult.header_map,
      headerConfidence: parserResult.confidence,
      parserWarnings,
      parserMetadata: parserResult.metadata,
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to validate FMEA file'

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    )
  }
}
