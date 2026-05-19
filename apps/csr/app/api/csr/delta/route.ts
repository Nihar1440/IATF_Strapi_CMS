import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticatedFromRequest } from '@/lib/session/session'
import { getDeltaRequirements, getCsrForOems } from '@/modules/csr/data'

export async function POST(request: NextRequest) {
  const authed = await isAuthenticatedFromRequest(request)
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { oems?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { oems } = body
  if (!oems || !Array.isArray(oems) || oems.length === 0) {
    return NextResponse.json({ error: 'oems[] is required' }, { status: 400 })
  }

  const { newReqs, updatedReqs } = getDeltaRequirements(oems)
  const allReqs = getCsrForOems(oems)
  const removedReqs = allReqs.filter((r) => r.changeStatus === 'deleted')

  return NextResponse.json({
    newRequirements: newReqs,
    changedRequirements: updatedReqs,
    removedRequirements: removedReqs,
    totalCurrent: allReqs.length,
  })
}
