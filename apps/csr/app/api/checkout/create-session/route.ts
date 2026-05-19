import { NextRequest, NextResponse } from 'next/server'
import { createBillingCheckoutSession } from '@/lib/billing/stripe'
import { getStripeConfig, listBillingPlans } from '@/lib/billing/store'

function resolveUrl(baseUrl: string, inputUrl: string): string {
  if (/^https?:\/\//i.test(inputUrl)) {
    return inputUrl
  }
  const normalizedPath = inputUrl.startsWith('/') ? inputUrl : `/${inputUrl}`
  return `${baseUrl}${normalizedPath}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { priceId, userEmail } = body
    const incomingToolId = body.toolId || body.tool_id

    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400 })
    }

    const plans = await listBillingPlans()
    const matchedPlan = plans.find((plan) => plan.stripePriceId === priceId && plan.toolId === (incomingToolId || 'tool_csr'))

    const stripeConfig = await getStripeConfig()
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'

    const session = await createBillingCheckoutSession({
      priceId,
      toolId: incomingToolId || 'tool_csr',
      planId: matchedPlan?.id,
      creditCount: matchedPlan?.creditCount || 1,
      userEmail,
      successUrl: resolveUrl(
        baseUrl,
        stripeConfig.successUrl || '/en/checkout/success?session_id={CHECKOUT_SESSION_ID}',
      ),
      cancelUrl: resolveUrl(baseUrl, stripeConfig.cancelUrl || '/en/unlock'),
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe Checkout Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
