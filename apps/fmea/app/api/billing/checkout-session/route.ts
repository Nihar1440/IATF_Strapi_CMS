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

function resolvePriceIdFromEnv(toolId: string, creditCountHint: number): string {
  if (toolId === 'tool_fmea') {
    if (creditCountHint >= 5) {
      return process.env.NEXT_PUBLIC_STRIPE_PRICE_FMEA_FIVE || process.env.STRIPE_PRICE_FMEA_FIVE || ''
    }
    return process.env.NEXT_PUBLIC_STRIPE_PRICE_FMEA_SINGLE || process.env.STRIPE_PRICE_FMEA_SINGLE || ''
  }

  return ''
}

function resolveInlineFallback(
  toolId: string,
  creditCountHint: number,
): {
  unitAmount: number
  currency: string
  productName: string
} | null {
  if (toolId === 'tool_fmea') {
    if (creditCountHint >= 5) {
      return { unitAmount: 14900, currency: 'eur', productName: 'FMEA Reviewer - 5 Code Package' }
    }
    return { unitAmount: 3900, currency: 'eur', productName: 'FMEA Reviewer - Single Use Code' }
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const toolId = String(body?.toolId || body?.tool_id || 'tool_fmea')
    const locale = String(body?.locale || 'en')
    const requestedPlanId = body?.planId ? String(body.planId) : ''
    const requestedPriceId = body?.priceId ? String(body.priceId) : ''
    const creditCountHint = Number(body?.creditCountHint || 0)
    const userEmail = body?.userEmail ? String(body.userEmail) : undefined

    const [plans, stripeConfig] = await Promise.all([listBillingPlans(), getStripeConfig()])

    const activeToolPlans = plans
      .filter((plan) => plan.toolId === toolId && plan.active)
      .sort((a, b) => a.unitAmount - b.unitAmount)

    const selectedPlanByIdOrPrice = requestedPlanId
      ? plans.find((plan) => plan.id === requestedPlanId)
      : plans.find((plan) => plan.stripePriceId === requestedPriceId && plan.toolId === toolId)

    const selectedPlanByHint = creditCountHint > 0
      ? activeToolPlans.find((plan) => plan.creditCount === creditCountHint)
      : undefined

    const selectedPlan = selectedPlanByIdOrPrice || selectedPlanByHint || activeToolPlans[0]

    const envFallbackPriceId = resolvePriceIdFromEnv(toolId, creditCountHint)
    const selectedPlanInlineData = selectedPlan && selectedPlan.unitAmount > 0
      ? {
        unitAmount: selectedPlan.unitAmount,
        currency: selectedPlan.currency || 'eur',
        productName: selectedPlan.name,
      }
      : null

    const inlineFallback = selectedPlanInlineData || resolveInlineFallback(toolId, creditCountHint)
    const priceId = requestedPriceId || selectedPlan?.stripePriceId || envFallbackPriceId
    if (!priceId && !inlineFallback) {
      return NextResponse.json(
        {
          error:
            'Unable to resolve Stripe price. Configure active billing plans in admin or set STRIPE/NEXT_PUBLIC_STRIPE price env vars.',
        },
        { status: 400 },
      )
    }

    const stripeSecretConfigured = Boolean(stripeConfig.secretKey || process.env.STRIPE_SECRET_KEY)
    if (!stripeSecretConfigured) {
      return NextResponse.json(
        {
          error:
            'Stripe is not configured. Set STRIPE_SECRET_KEY in environment variables or save a secret key in Billing Admin settings.',
          code: 'STRIPE_NOT_CONFIGURED',
        },
        { status: 503 },
      )
    }

    const baseUrl = process.env.BASE_URL || new URL(request.url).origin
    const successUrl = resolveUrl(
      baseUrl,
      String(
        body?.successUrl ||
        stripeConfig.successUrl ||
        `/${locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      ),
    )

    const cancelUrl = resolveUrl(
      baseUrl,
      String(body?.cancelUrl || stripeConfig.cancelUrl || `/${locale}/unlock`),
    )

    const session = await createBillingCheckoutSession({
      priceId,
      inlinePriceData: inlineFallback || undefined,
      toolId,
      planId: selectedPlan?.id,
      creditCount: Math.max(
        Number(selectedPlan?.creditCount || 1),
        creditCountHint,
        Number(body?.creditCount || 1),
      ),
      userEmail,
      successUrl,
      cancelUrl,
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      planId: selectedPlan?.id || null,
    })
  } catch (error) {
    console.error('[billing/checkout-session][POST]', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
