import type {
  StrapiListResponse,
  StrapiSingleResponse,
  LandingPage,
  OemProfile,
  CsrRequirement,
  ProcessDefinition,
  PricingTier,
  InfoPage,
  OemId,
} from './types'

// ─── Client Configuration ─────────────────────────────────────────────────────

export interface StrapiClientConfig {
  baseUrl: string
  apiToken: string
  /** Default timeout in ms (default: 10000) */
  timeout?: number
}

// ─── Internal fetch helper ────────────────────────────────────────────────────

async function apiFetch<T>(
  config: StrapiClientConfig,
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = new URL(`${config.baseUrl}/api${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), config.timeout ?? 10_000)

  try {
    let res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      next: { revalidate: 10 },
    } as RequestInit)

    // If 401, try again without token (in case token is invalid but API is public)
    if (res.status === 401 && config.apiToken) {
      console.warn(`Strapi shared client: 401 with token for ${path}. Retrying without token...`)
      res = await fetch(url.toString(), {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        next: { revalidate: 10 },
      } as RequestInit)
    }

    if (!res.ok) {
      throw new Error(`Strapi API error: ${res.status} ${res.statusText} — ${url.pathname}`)
    }

    return res.json() as Promise<T>
  } finally {
    clearTimeout(timer)
  }
}

// ─── Public Client Factory ────────────────────────────────────────────────────

export function createStrapiClient(config: StrapiClientConfig) {
  // ── Landing Page ────────────────────────────────────────────────────────────
  async function getLandingPage(locale: string = 'en'): Promise<LandingPage> {
    const res = await apiFetch<StrapiSingleResponse<LandingPage>>(config, '/landing-page', {
      locale,
      'populate[nav]': 'true',
      'populate[hero][populate]': '*',
      'populate[about]': 'true',
      'populate[features][populate][items][populate]': 'cta',
      'populate[features][populate][steps]': 'true',
      'populate[testimonials][populate]': 'items',
      'populate[footer][populate][legal][populate]': 'links',
      'populate[footer][populate][about][populate]': 'links',
      'populate[footer][populate][tools][populate]': 'links',
      'populate[seo]': 'true',
      status: 'published',
    })
    return res.data
  }

  // ── OEM Profiles ────────────────────────────────────────────────────────────
  async function getOemProfiles(): Promise<OemProfile[]> {
    const res = await apiFetch<StrapiListResponse<OemProfile>>(config, '/oem-profiles', {
      'filters[active][$eq]': 'true',
      'pagination[pageSize]': '100',
      'sort': 'oemId:asc',
    })
    return res.data
  }

  async function getOemProfile(oemId: OemId): Promise<OemProfile | null> {
    const res = await apiFetch<StrapiListResponse<OemProfile>>(config, '/oem-profiles', {
      'filters[oemId][$eq]': oemId,
      'pagination[pageSize]': '1',
    })
    return res.data[0] ?? null
  }

  // ── CSR Requirements ────────────────────────────────────────────────────────
  async function getCsrRequirements(oemIds?: OemId[]): Promise<CsrRequirement[]> {
    const params: Record<string, string> = {
      'filters[active][$eq]': 'true',
      'pagination[pageSize]': '500',
      'sort': 'iatfChapter:asc',
    }
    if (oemIds && oemIds.length > 0) {
      // Include base IATF (no OEM) + selected OEMs
      params['filters[$or][0][oemId][$null]'] = 'true'
      oemIds.forEach((id, i) => {
        params[`filters[$or][${i + 1}][oemId][$eq]`] = id
      })
    }
    const res = await apiFetch<StrapiListResponse<CsrRequirement>>(config, '/csr-requirements', params)
    return res.data
  }

  // ── Process Definitions ─────────────────────────────────────────────────────
  async function getProcessDefinitions(locale: string = 'en'): Promise<ProcessDefinition[]> {
    const res = await apiFetch<StrapiListResponse<ProcessDefinition>>(config, '/process-definitions', {
      locale,
      'pagination[pageSize]': '100',
      'sort': 'sortOrder:asc',
    })
    return res.data
  }

  // ── Pricing Tiers ───────────────────────────────────────────────────────────
  async function getPricingTiers(
    toolId: 'tool_8d' | 'tool_csr',
    locale: string = 'en',
  ): Promise<PricingTier[]> {
    const res = await apiFetch<StrapiListResponse<PricingTier>>(config, '/pricing-tiers', {
      'filters[toolId][$eq]': toolId,
      locale,
      'pagination[pageSize]': '20',
      'sort': 'sortOrder:asc',
      status: 'published',
    })
    return res.data
  }

  // ── Info Pages ──────────────────────────────────────────────────────────────
  async function getCsrInfoPage(locale: string = 'en'): Promise<InfoPage> {
    try {
      const res = await apiFetch<StrapiSingleResponse<InfoPage>>(config, '/csr-info-page', { locale, status: 'published' })
      return res.data
    } catch (e) {
      console.warn(`Strapi Client: Failed to fetch CSR Info Page (${locale}). Using fallback.`, e)
      return {} as InfoPage
    }
  }

  async function getEightdInfoPage(locale: string = 'en'): Promise<InfoPage> {
    try {
      const res = await apiFetch<StrapiSingleResponse<InfoPage>>(config, '/eightd-info-page', { locale, status: 'published' })
      return res.data
    } catch (e) {
      console.warn(`Strapi Client: Failed to fetch 8D Info Page (${locale}). Using fallback.`, e)
      return {} as InfoPage
    }
  }

  async function getFmeaInfoPage(locale: string = 'en'): Promise<InfoPage> {
    try {
      const res = await apiFetch<StrapiSingleResponse<InfoPage>>(config, '/fmea-info-page', { locale, status: 'published' })
      return res.data
    } catch (e) {
      console.warn(`Strapi Client: Failed to fetch FMEA Info Page (${locale}). Using fallback.`, e)
      return {} as InfoPage
    }
  }

  return {
    getLandingPage,
    getOemProfiles,
    getOemProfile,
    getCsrRequirements,
    getProcessDefinitions,
    getPricingTiers,
    getCsrInfoPage,
    getEightdInfoPage,
    getFmeaInfoPage,
  }
}

export type StrapiClient = ReturnType<typeof createStrapiClient>
