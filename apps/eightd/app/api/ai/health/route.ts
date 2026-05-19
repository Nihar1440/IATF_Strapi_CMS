import { NextResponse } from 'next/server'

export async function GET() {
  const provider = (process.env.AI_PROVIDER ?? 'anthropic').toLowerCase()
  const providerKeyPresent =
    provider === 'openai'
      ? Boolean(process.env.OPENAI_API_KEY)
      : provider === 'gemini'
        ? Boolean(process.env.GEMINI_API_KEY)
        : Boolean(process.env.ANTHROPIC_API_KEY)

  return NextResponse.json(
    {
      ok: true,
      provider,
      hasProviderKey: providerKeyPresent,
      hasSessionSecret: Boolean(process.env.SESSION_SECRET),
      nodeEnv: process.env.NODE_ENV ?? 'unknown',
    },
    { status: 200 },
  )
}
