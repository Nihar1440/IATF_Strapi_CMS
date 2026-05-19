import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/billing/stripe'
import { getStripeConfig } from '@/lib/billing/store'
import { fulfillCheckoutSession } from '@/lib/billing/fulfillment'
import {
  clearEventProcessing,
  isEventProcessed,
  markEventProcessed,
  reserveEventProcessing,
} from '@/lib/redis/codeStore'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature') as string

  let event: Stripe.Event

  try {
    const { stripe } = await getStripeClient()
    const stripeConfig = await getStripeConfig()
    const webhookSecret = stripeConfig.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      throw new Error('Stripe webhook secret is not configured')
    }

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 })
  }

  console.log(`[Webhook] Received Stripe event: ${event.type}`)

  if (event.type === 'checkout.session.completed') {
    const alreadyProcessed = await isEventProcessed(event.id)
    if (alreadyProcessed) {
      console.log(`[Webhook] Event ${event.id} already processed. Skipping.`)
      return new NextResponse('Already processed', { status: 200 })
    }

    const hasLock = await reserveEventProcessing(event.id)
    if (!hasLock) {
      console.log(`[Webhook] Event ${event.id} is already being processed. Skipping duplicate delivery.`)
      return new NextResponse('Already processing', { status: 200 })
    }

    const session = event.data.object as Stripe.Checkout.Session
    const sessionId = session.id

    const email = session.customer_details?.email || session.customer_email
    const metadata = session.metadata || {}
    const parsedCount = parseInt(metadata.creditCount || '1', 10)
    const count = Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : 1
    const toolId = metadata.toolId || 'tool_fmea'
    const planId = metadata.planId || undefined

    if (!email) {
      console.error('No email found in session, cannot send code.')
      await clearEventProcessing(event.id)
      return new NextResponse('OK', { status: 200 })
    }

    try {
      const status = await fulfillCheckoutSession({ sessionId, email, toolId, planId, count })

      // Mark the Stripe event as processed once fulfillment path has been resolved.
      await markEventProcessed(event.id)
      await clearEventProcessing(event.id)

      console.log(`[Webhook] Processed purchase for ${email}. Fulfillment status: ${status}.`)
    } catch (err: unknown) {
      await clearEventProcessing(event.id)
      console.error('[Webhook] Failed to generate codes or send email:', err instanceof Error ? err.message : err)
      return new NextResponse('Internal Server Error', { status: 500 })
    }
  }

  return new NextResponse('OK', { status: 200 })
}
