import Stripe from 'stripe'
import { getStripeConfig } from './store'
import type { BillingPlan } from './types'

const DEFAULT_STRIPE_API_VERSION = '2024-12-18.acacia'

export interface BillingInlinePriceData {
  unitAmount: number
  currency: string
  productName: string
}

export interface CreateBillingCheckoutSessionInput {
  priceId?: string
  toolId: string
  planId?: string
  creditCount: number
  userEmail?: string
  successUrl: string
  cancelUrl: string
  inlinePriceData?: BillingInlinePriceData
}

function toApiVersion(version?: string): Stripe.LatestApiVersion {
  return (version || DEFAULT_STRIPE_API_VERSION) as Stripe.LatestApiVersion
}

export async function getStripeClient(): Promise<{ stripe: Stripe; config: Awaited<ReturnType<typeof getStripeConfig>> }> {
  const config = await getStripeConfig()
  const secretKey = config.secretKey || process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error('Stripe secret key is not configured')
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: toApiVersion(config.apiVersion),
  })

  return { stripe, config }
}

export async function createBillingCheckoutSession(input: CreateBillingCheckoutSessionInput): Promise<Stripe.Checkout.Session> {
  const { stripe } = await getStripeClient()

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = input.priceId
    ? [{ price: input.priceId, quantity: 1 }]
    : input.inlinePriceData
      ? [
          {
            quantity: 1,
            price_data: {
              currency: input.inlinePriceData.currency,
              unit_amount: input.inlinePriceData.unitAmount,
              product_data: {
                name: input.inlinePriceData.productName,
              },
            },
          },
        ]
      : []

  if (lineItems.length === 0) {
    throw new Error('No Stripe price or inline price data was provided for checkout session')
  }

  return stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    customer_email: input.userEmail,
    automatic_tax: { enabled: false },
    invoice_creation: { enabled: false },
    billing_address_collection: 'required',
    metadata: {
      toolId: input.toolId,
      planId: input.planId || '',
      priceId: input.priceId || '',
      creditCount: String(input.creditCount),
    },
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  })
}

/**
 * Sync a billing plan to Stripe:
 * - Creates a Stripe Product if none exists
 * - Creates a new Stripe Price (prices are immutable in Stripe)
 * - Archives the old price if it changed
 * Returns updated stripeProductId and stripePriceId
 */
export async function syncPlanToStripe(plan: BillingPlan): Promise<{
  stripeProductId: string
  stripePriceId: string
}> {
  const { stripe } = await getStripeClient()

  let productId = plan.stripeProductId || ''

  // Create or retrieve the Stripe Product
  if (productId) {
    await stripe.products.update(productId, {
      name: plan.name,
      description: plan.description || undefined,
      active: plan.active,
    })
  } else {
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description || undefined,
      active: plan.active,
      metadata: {
        toolId: plan.toolId,
        planId: plan.id,
        creditCount: String(plan.creditCount),
      },
    })
    productId = product.id
  }

  // Check if the existing price matches — if amount/currency unchanged, skip
  if (plan.stripePriceId) {
    try {
      const existingPrice = await stripe.prices.retrieve(plan.stripePriceId)
      if (
        existingPrice.unit_amount === plan.unitAmount &&
        existingPrice.currency === plan.currency.toLowerCase() &&
        existingPrice.active
      ) {
        return { stripeProductId: productId, stripePriceId: plan.stripePriceId }
      }
      // Archive old price
      await stripe.prices.update(plan.stripePriceId, { active: false })
    } catch {
      // Old price doesn't exist or can't be retrieved — proceed to create new
    }
  }

  // Create a new Stripe Price
  const newPrice = await stripe.prices.create({
    product: productId,
    unit_amount: plan.unitAmount,
    currency: plan.currency.toLowerCase(),
    metadata: {
      toolId: plan.toolId,
      planId: plan.id,
      creditCount: String(plan.creditCount),
    },
  })

  return { stripeProductId: productId, stripePriceId: newPrice.id }
}
