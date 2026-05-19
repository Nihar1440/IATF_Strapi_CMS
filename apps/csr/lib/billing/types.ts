export type BillingInterval = 'one_time' | 'month' | 'year'

export interface BillingPlan {
  id: string
  name: string
  description?: string
  toolId: string
  stripePriceId: string
  stripeProductId?: string
  unitAmount: number
  currency: string
  creditCount: number
  interval: BillingInterval
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface IntegratedTool {
  id: string
  name: string
  description?: string
  baseUrl?: string
  active: boolean
  defaultPlanId?: string
  createdAt: string
  updatedAt: string
}

export interface StripeConfig {
  publishableKey?: string
  secretKey?: string
  webhookSecret?: string
  apiVersion?: string
  successUrl?: string
  cancelUrl?: string
  updatedAt: string
}
