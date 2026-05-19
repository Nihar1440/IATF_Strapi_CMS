import { NextRequest, NextResponse } from 'next/server'
import { requireBillingAdmin } from '@/lib/billing/adminAuth'
import { getStripeConfig, updateStripeConfig } from '@/lib/billing/store'

export async function GET(request: NextRequest) {
  const unauthorized = requireBillingAdmin(request)
  if (unauthorized) {
    return unauthorized
  }

  try {
    const config = await getStripeConfig()
    return NextResponse.json({ config })
  } catch (error) {
    console.error('[billing/stripe-config][GET]', error)
    return NextResponse.json({ error: 'Failed to fetch Stripe config' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const unauthorized = requireBillingAdmin(request)
  if (unauthorized) {
    return unauthorized
  }

  try {
    const body = await request.json()
    const config = await updateStripeConfig({
      publishableKey: body?.publishableKey,
      secretKey: body?.secretKey,
      webhookSecret: body?.webhookSecret,
      apiVersion: body?.apiVersion,
      successUrl: body?.successUrl,
      cancelUrl: body?.cancelUrl,
    })

    return NextResponse.json({ config })
  } catch (error) {
    console.error('[billing/stripe-config][PUT]', error)
    return NextResponse.json({ error: 'Failed to update Stripe config' }, { status: 500 })
  }
}
