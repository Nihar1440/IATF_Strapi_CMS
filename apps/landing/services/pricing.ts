export interface PricingPlan {
  key: string
  title: string
  price: string
  features: string[]
  action: {
    type: 'buy' | 'quote'
    label: string
    priceId?: string
    creditCountHint?: number
    toolId?: 'tool_8d' | 'tool_csr' | 'tool_fmea'
    checkoutApiUrl?: string
    planId?: string
  }
}

export interface PricingConfig {
  title: string
  subtitle: string
  eightDPlans: PricingPlan[]
  csrPlans: PricingPlan[]
  fmeaPlans: PricingPlan[]
}

const TOOL_8D_URL = process.env.NEXT_PUBLIC_TOOL_8D_URL || process.env.NEXT_PUBLIC_TOOL_URL || 'https://8d.iatf-solutions.com'
const TOOL_CSR_URL = process.env.NEXT_PUBLIC_TOOL_CSR_URL || 'https://csr.iatf-solutions.com'
const TOOL_FMEA_URL = process.env.NEXT_PUBLIC_TOOL_FMEA_URL || 'https://fmea.iatf-solutions.com'

// ─── CMS Pricing Fetch ───────────────────────────────────────────────────────

interface StrapiPricingTier {
  toolId: 'tool_8d' | 'tool_csr' | 'tool_fmea'
  name: string
  price: number
  currency: string
  credits: number
  stripePriceId?: string
  highlighted: boolean
  features?: string[]
  sortOrder: number
}

function tierToPlan(tier: StrapiPricingTier, t: (key: string) => string): PricingPlan {
  const tool = tier.toolId === 'tool_8d' ? '8d' : tier.toolId === 'tool_csr' ? 'csr' : 'fmea'
  const toolUrl = tier.toolId === 'tool_8d' ? TOOL_8D_URL : tier.toolId === 'tool_csr' ? TOOL_CSR_URL : TOOL_FMEA_URL
  const isBuy = tier.price > 0

  // Derive a stable key from credits or fallback to name slug
  let key = `${tool}-${tier.credits > 0 ? tier.credits : 'pilot'}`
  if (tier.credits === 1) key = `${tool}-single`
  else if (tier.credits === 5) key = `${tool}-five`
  else if (tier.credits === 20) key = `${tool}-twenty`

  let labelKey = 'pilot_btn'
  if (key === '8d-single') labelKey = 'single_btn'
  else if (key === '8d-five') labelKey = 'fivePack_btn'
  else if (key === '8d-pilot') labelKey = 'pilot_btn'
  else if (key === 'csr-single') labelKey = 'csrSingle_btn'
  else if (key === 'csr-five') labelKey = 'csrFive_btn'
  else if (key === 'csr-pilot') labelKey = 'csrPilot_btn'
  else if (key === 'fmea-single') labelKey = 'fmeaSingle_btn'
  else if (key === 'fmea-five') labelKey = 'fmeaFive_btn'
  else if (key === 'fmea-pilot') labelKey = 'fmeaPilot_btn'

  let priceDisplay = isBuy
    ? `${tier.currency === 'EUR' ? '€' : tier.currency}${tier.price}`
    : t('pricing.onRequest')

  // Hardcode specific price for csr-five even if CMS sets price to 0 for quoting
  if (key === 'csr-five' && !isBuy) {
    priceDisplay = '€1,249'
  }

  return {
    key,
    title: tier.name,
    price: priceDisplay,
    features: tier.features ?? [],
    action: isBuy
      ? {
        type: 'buy',
        label: t(`pricing.${labelKey}`),
        priceId: tier.stripePriceId,
        creditCountHint: tier.credits,
        toolId: tier.toolId,
        checkoutApiUrl: `${toolUrl}/api/billing/checkout-session`,
      }
      : {
        type: 'quote',
        label: t(`pricing.${labelKey}`),
        planId: key,
      },
  }
}

/**
 * Try to load pricing configuration from Strapi CMS.
 * Returns null if CMS is unreachable or has no pricing tiers.
 * Designed for server-side use (Next.js server components / RSC).
 */
export async function getCmsPricingOverride(
  t: (key: string) => string,
): Promise<Pick<PricingConfig, 'eightDPlans' | 'csrPlans' | 'fmeaPlans'> | null> {
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || process.env.STRAPI_URL
  const strapiToken = process.env.STRAPI_API_TOKEN

  if (!strapiUrl || !strapiToken) return null

  try {
    const url = new URL('/api/pricing-tiers', strapiUrl)
    url.searchParams.set('filters[active][$ne]', 'false')
    url.searchParams.set('pagination[pageSize]', '20')
    url.searchParams.set('sort', 'sortOrder:asc')
    url.searchParams.set('status', 'published')

    let res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${strapiToken}` },
      next: { revalidate: 300 },
    })

    // If 401, try again without token (in case token is invalid but API is public)
    if (res.status === 401) {
      console.warn(`Pricing API returned 401 with token. Retrying without token...`)
      res = await fetch(url.toString(), {
        next: { revalidate: 300 },
      })
    }

    if (!res.ok) return null

    const json = (await res.json()) as { data: StrapiPricingTier[] }
    if (!json.data?.length) return null

    const eightDPlans = json.data
      .filter((d) => d.toolId === 'tool_8d')
      .map((d) => tierToPlan(d, t))

    const csrPlans = json.data
      .filter((d) => d.toolId === 'tool_csr')
      .map((d) => tierToPlan(d, t))

    const fmeaPlans = json.data
      .filter((d) => d.toolId === 'tool_fmea')
      .map((d) => tierToPlan(d, t))

    if (!eightDPlans.length && !csrPlans.length && !fmeaPlans.length) return null

    return { eightDPlans, csrPlans, fmeaPlans }
  } catch {
    return null
  }
}

export function buildPricingPlans(t: (key: string) => string): PricingConfig {
  const eightDPlans: PricingPlan[] = [
    {
      key: '8d-single',
      title: t('pricing.single'),
      price: '€39',
      features: [t('pricing.single_f1'), t('pricing.single_f2'), t('pricing.single_f3'), t('pricing.single_f4')],
      action: {
        type: 'buy',
        label: t('pricing.single_btn'),
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_8D_SINGLE,
        creditCountHint: 1,
        toolId: 'tool_8d',
        checkoutApiUrl: `${TOOL_8D_URL}/api/billing/checkout-session`,
      },
    },
    {
      key: '8d-five',
      title: t('pricing.fivePack'),
      price: '€169',
      features: [t('pricing.fivePack_f1'), t('pricing.fivePack_f2'), t('pricing.fivePack_f3'), t('pricing.fivePack_f4')],
      action: {
        type: 'buy',
        label: t('pricing.fivePack_btn'),
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_8D_FIVE,
        creditCountHint: 5,
        toolId: 'tool_8d',
        checkoutApiUrl: `${TOOL_8D_URL}/api/billing/checkout-session`,
      },
    },
    {
      key: '8d-pilot',
      title: t('pricing.pilot'),
      price: t('pricing.onRequest'),
      features: [t('pricing.pilot_f1'), t('pricing.pilot_f2'), t('pricing.pilot_f3'), t('pricing.pilot_f4')],
      action: {
        type: 'quote',
        label: t('pricing.pilot_btn'),
        planId: '8d-pilot',
      },
    },
  ]

  const csrPlans: PricingPlan[] = [
    {
      key: 'csr-single',
      title: t('pricing.csrSingle'),
      price: '€299',
      features: [t('pricing.csrSingle_f1'), t('pricing.csrSingle_f2'), t('pricing.csrSingle_f3'), t('pricing.csrSingle_f4')],
      action: {
        type: 'buy',
        label: t('pricing.csrSingle_btn'),
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_CSR_SINGLE,
        creditCountHint: 1,
        toolId: 'tool_csr',
        checkoutApiUrl: `${TOOL_CSR_URL}/api/billing/checkout-session`,
      },
    },
    {
      key: 'csr-five',
      title: t('pricing.csrFive'),
      price: '€1,249',
      features: [t('pricing.csrFive_f1'), t('pricing.csrFive_f2'), t('pricing.csrFive_f3'), t('pricing.csrFive_f4')],
      action: {
        type: 'quote',
        label: t('pricing.csrFive_btn'),
        planId: 'csr-five',
      },
    },
    {
      key: 'csr-pilot',
      title: t('pricing.csrPilot'),
      price: t('pricing.onRequest'),
      features: [t('pricing.csrPilot_f1'), t('pricing.csrPilot_f2'), t('pricing.csrPilot_f3'), t('pricing.csrPilot_f4')],
      action: {
        type: 'quote',
        label: t('pricing.csrPilot_btn'),
        planId: 'csr-pilot',
      },
    },
  ]

  const fmeaPlans: PricingPlan[] = [
    {
      key: 'fmea-single',
      title: t('pricing.fmeaSingle'),
      price: '€39',
      features: [t('pricing.fmeaSingle_f1'), t('pricing.fmeaSingle_f2'), t('pricing.fmeaSingle_f3'), t('pricing.fmeaSingle_f4')],
      action: {
        type: 'buy',
        label: t('pricing.fmeaSingle_btn'),
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_FMEA_SINGLE,
        creditCountHint: 1,
        toolId: 'tool_fmea',
        checkoutApiUrl: `${TOOL_FMEA_URL}/api/billing/checkout-session`,
      },
    },
    {
      key: 'fmea-five',
      title: t('pricing.fmeaFive'),
      price: '€169',
      features: [t('pricing.fmeaFive_f1'), t('pricing.fmeaFive_f2'), t('pricing.fmeaFive_f3'), t('pricing.fmeaFive_f4')],
      action: {
        type: 'buy',
        label: t('pricing.fmeaFive_btn'),
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_FMEA_FIVE,
        creditCountHint: 5,
        toolId: 'tool_fmea',
        checkoutApiUrl: `${TOOL_FMEA_URL}/api/billing/checkout-session`,
      },
    },
    {
      key: 'fmea-pilot',
      title: t('pricing.fmeaPilot'),
      price: t('pricing.onRequest'),
      features: [t('pricing.fmeaPilot_f1'), t('pricing.fmeaPilot_f2'), t('pricing.fmeaPilot_f3'), t('pricing.fmeaPilot_f4')],
      action: {
        type: 'quote',
        label: t('pricing.fmeaPilot_btn'),
        planId: 'fmea-pilot',
      },
    },
  ]

  return {
    title: t('pricing.title'),
    subtitle: t('pricing.subtitle'),
    eightDPlans,
    csrPlans,
    fmeaPlans,
  }
}
