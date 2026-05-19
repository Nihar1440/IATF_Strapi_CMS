import { getRedis } from '@/lib/redis/client'
import type { BillingPlan, IntegratedTool, StripeConfig } from './types'

const KEY_PLANS = 'billing:plans'
const KEY_TOOLS = 'billing:tools'
const KEY_STRIPE_CONFIG = 'billing:stripe:config'

const DEFAULT_STRIPE_API_VERSION = '2024-12-18.acacia'

function nowIso(): string {
  return new Date().toISOString()
}

function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function defaultTools(): IntegratedTool[] {
  const createdAt = nowIso()
  return [
    {
      id: 'tool_8d',
      name: '8D Report Manager',
      description: 'IATF 8D report generation and export workflow',
      active: true,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'tool_csr',
      name: 'CSR Matrix Generator',
      description: 'Customer Specific Requirements matrix generation',
      active: true,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'tool_fmea',
      name: 'FMEA Reviewer',
      description: 'FMEA analysis and validation tool',
      active: true,
      createdAt,
      updatedAt: createdAt,
    },
  ]
}

function defaultStripeConfig(): StripeConfig {
  return {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    apiVersion: process.env.STRIPE_API_VERSION || DEFAULT_STRIPE_API_VERSION,
    successUrl: process.env.BILLING_SUCCESS_URL || '',
    cancelUrl: process.env.BILLING_CANCEL_URL || '',
    updatedAt: nowIso(),
  }
}

export async function listBillingPlans(): Promise<BillingPlan[]> {
  const redis = getRedis()
  const plans = await redis.get<unknown>(KEY_PLANS)
  return ensureArray<BillingPlan>(plans)
}

export async function saveBillingPlans(plans: BillingPlan[]): Promise<void> {
  const redis = getRedis()
  await redis.set(KEY_PLANS, plans)
}

export async function upsertBillingPlan(input: Partial<BillingPlan> & { name: string; toolId: string }): Promise<BillingPlan> {
  const plans = await listBillingPlans()
  const existing = input.id ? plans.find((plan) => plan.id === input.id) : undefined
  const timestamp = nowIso()

  const id = existing?.id || input.id || `plan_${normalizeSlug(input.name)}_${crypto.randomUUID().slice(0, 8)}`

  const next: BillingPlan = {
    id,
    name: input.name,
    description: input.description || '',
    toolId: input.toolId,
    stripePriceId: input.stripePriceId || existing?.stripePriceId || '',
    stripeProductId: input.stripeProductId || existing?.stripeProductId,
    unitAmount: Number(input.unitAmount || existing?.unitAmount || 0),
    currency: (input.currency || existing?.currency || 'eur').toLowerCase(),
    creditCount: Number(input.creditCount || existing?.creditCount || 1),
    interval: input.interval || existing?.interval || 'one_time',
    active: typeof input.active === 'boolean' ? input.active : (existing?.active ?? true),
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp,
  }

  const merged = existing
    ? plans.map((plan) => (plan.id === existing.id ? next : plan))
    : [...plans, next]

  await saveBillingPlans(merged)
  return next
}

export async function deleteBillingPlan(planId: string): Promise<boolean> {
  const plans = await listBillingPlans()
  const filtered = plans.filter((plan) => plan.id !== planId)

  if (filtered.length === plans.length) {
    return false
  }

  await saveBillingPlans(filtered)
  return true
}

export async function listIntegratedTools(): Promise<IntegratedTool[]> {
  const redis = getRedis()
  const tools = await redis.get<unknown>(KEY_TOOLS)
  const parsed = ensureArray<IntegratedTool>(tools)

  if (parsed.length > 0) {
    return parsed
  }

  const defaults = defaultTools()
  await redis.set(KEY_TOOLS, defaults)
  return defaults
}

export async function saveIntegratedTools(tools: IntegratedTool[]): Promise<void> {
  const redis = getRedis()
  await redis.set(KEY_TOOLS, tools)
}

export async function upsertIntegratedTool(input: Partial<IntegratedTool> & { name: string }): Promise<IntegratedTool> {
  const tools = await listIntegratedTools()
  const existing = input.id ? tools.find((tool) => tool.id === input.id) : undefined
  const timestamp = nowIso()

  const id = existing?.id || input.id || `tool_${normalizeSlug(input.name)}_${crypto.randomUUID().slice(0, 8)}`

  const next: IntegratedTool = {
    id,
    name: input.name,
    description: input.description || '',
    baseUrl: input.baseUrl || existing?.baseUrl || '',
    active: typeof input.active === 'boolean' ? input.active : (existing?.active ?? true),
    defaultPlanId: input.defaultPlanId || existing?.defaultPlanId,
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp,
  }

  const merged = existing
    ? tools.map((tool) => (tool.id === existing.id ? next : tool))
    : [...tools, next]

  await saveIntegratedTools(merged)
  return next
}

export async function deleteIntegratedTool(toolId: string): Promise<boolean> {
  const tools = await listIntegratedTools()
  const filtered = tools.filter((tool) => tool.id !== toolId)

  if (filtered.length === tools.length) {
    return false
  }

  await saveIntegratedTools(filtered)
  return true
}

export async function getStripeConfig(): Promise<StripeConfig> {
  const redis = getRedis()
  const saved = await redis.get<Partial<StripeConfig> | null>(KEY_STRIPE_CONFIG)
  const defaults = defaultStripeConfig()

  return {
    ...defaults,
    ...(saved || {}),
    updatedAt: saved?.updatedAt || defaults.updatedAt,
  }
}

export async function updateStripeConfig(partial: Partial<StripeConfig>): Promise<StripeConfig> {
  const redis = getRedis()
  const current = await getStripeConfig()

  const next: StripeConfig = {
    ...current,
    ...partial,
    updatedAt: nowIso(),
  }

  await redis.set(KEY_STRIPE_CONFIG, next)
  return next
}
