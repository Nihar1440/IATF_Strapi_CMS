import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/billing/stripe'
import { fulfillCheckoutSession } from '@/lib/billing/fulfillment'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.trim() : ''

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
  }

  try {
    const { stripe } = await getStripeClient()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Session is not paid yet' }, { status: 409 })
    }

    const email = session.customer_details?.email || session.customer_email
    if (!email) {
      return NextResponse.json({ error: 'Customer email not found on session' }, { status: 422 })
    }

    const metadata = session.metadata || {}
    const parsedCount = parseInt(metadata.creditCount || '1', 10)
    const count = Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : 1
    const toolId = metadata.toolId || 'tool_8d'
    const planId = metadata.planId || undefined

    const status = await fulfillCheckoutSession({ sessionId, email, toolId, planId, count })

    console.log(`[Checkout Fulfillment] ${status} for paid session ${sessionId} (${email}).`)
    return NextResponse.json({ ok: true, status })
  } catch (error) {
    console.error('[Checkout Fulfillment] Failed to fulfill paid session:', error)

    const message = error instanceof Error ? error.message : 'Failed to fulfill checkout session'
    const isResendRecipientRestriction =
      message.toLowerCase().includes('only send testing emails') ||
      message.toLowerCase().includes('verify a domain')

    if (isResendRecipientRestriction) {
      return NextResponse.json(
        {
          error:
            'Email provider is in testing mode. Verify a sending domain in Resend and set CREDIT_DELIVERY_EMAIL_FROM to that domain.',
          code: 'EMAIL_PROVIDER_TESTING_MODE',
        },
        { status: 422 },
      )
    }

    return NextResponse.json({ error: 'Failed to fulfill checkout session' }, { status: 500 })
  }
}
