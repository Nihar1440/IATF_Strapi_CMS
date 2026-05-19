import { z } from 'zod'

// ─── Flat Schemas ─────────────────────────────────────────────────────────────

const cmsLandingPageFlatSchema = z.object({
  navTools: z.string().optional().nullable(),
  navPricing: z.string().optional().nullable(),
  navAbout: z.string().optional().nullable(),

  heroTitle: z.string().optional().nullable(),
  heroTitleHighlight: z.string().optional().nullable(),
  heroSubtitle: z.string().optional().nullable(),
  heroPrimaryLabel: z.string().optional().nullable(),
  heroPrimaryHref: z.string().optional().nullable(),
  heroSecondaryLabel: z.string().optional().nullable(),
  heroSecondaryHref: z.string().optional().nullable(),

  aboutTitle: z.string().optional().nullable(),
  aboutDescription: z.string().optional().nullable(),

  featuresTitle: z.string().optional().nullable(),
  featuresInfoLabel: z.string().optional().nullable(),

  tool1Title: z.string().optional().nullable(),
  tool1Desc: z.string().optional().nullable(),
  tool1Image: z.string().optional().nullable(),
  tool1Href: z.string().optional().nullable(),
  tool2Title: z.string().optional().nullable(),
  tool2Desc: z.string().optional().nullable(),
  tool2Image: z.string().optional().nullable(),
  tool2Href: z.string().optional().nullable(),
  tool3Title: z.string().optional().nullable(),
  tool3Desc: z.string().optional().nullable(),
  tool3Image: z.string().optional().nullable(),
  tool3Href: z.string().optional().nullable(),

  step1Label: z.string().optional().nullable(),
  step2Label: z.string().optional().nullable(),
  step3Label: z.string().optional().nullable(),
  step4Label: z.string().optional().nullable(),

  testimonialsTitle: z.string().optional().nullable(),
  testimonial1Quote: z.string().optional().nullable(),
  testimonial1Author: z.string().optional().nullable(),
  testimonial1Role: z.string().optional().nullable(),
  testimonial2Quote: z.string().optional().nullable(),
  testimonial2Author: z.string().optional().nullable(),
  testimonial2Role: z.string().optional().nullable(),

  footerLegalTitle: z.string().optional().nullable(),
  footerLegalLink1Label: z.string().optional().nullable(),
  footerLegalLink1Href: z.string().optional().nullable(),
  footerLegalLink2Label: z.string().optional().nullable(),
  footerLegalLink2Href: z.string().optional().nullable(),
  footerLegalLink3Label: z.string().optional().nullable(),
  footerLegalLink3Href: z.string().optional().nullable(),

  footerAboutTitle: z.string().optional().nullable(),
  footerAboutLink1Label: z.string().optional().nullable(),
  footerAboutLink1Href: z.string().optional().nullable(),
  footerAboutLink2Label: z.string().optional().nullable(),
  footerAboutLink2Href: z.string().optional().nullable(),
  footerAboutLink3Label: z.string().optional().nullable(),
  footerAboutLink3Href: z.string().optional().nullable(),

  footerToolsTitle: z.string().optional().nullable(),
  footerToolsLink1Label: z.string().optional().nullable(),
  footerToolsLink2Label: z.string().optional().nullable(),
  footerToolsLink3Label: z.string().optional().nullable(),

  footerContactLabel: z.string().optional().nullable(),
  footerLanguageLabel: z.string().optional().nullable(),

  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
})

// ─── Types ────────────────────────────────────────────────────────────────────

export type LandingPageContent = {
  nav: {
    tools: string
    pricing: string
    about: string
  }
  hero: {
    title: string
    highlight: string
    highlightColor: string
    subtitle: string
    primaryButton: {
      label: string
      href: string
      variant: 'primary' | 'secondary'
      disabled?: boolean
    }
    secondaryButton: {
      label: string
      href: string
      variant: 'primary' | 'secondary' | 'outline' | 'ghost'
      disabled?: boolean
    }
  }
  about: {
    title: string
    description: string
  }
  features: {
    title?: string
    infoLabel?: string
    items: Array<{
      title: string
      description: string
      imageUrl: string
      imageAlt: string
      cta?: {
        label: string
        href: string
        variant: 'primary' | 'secondary'
        disabled?: boolean
      }
    }>
    steps: Array<{
      number: string
      label: string
      href?: string
    }>
  }
  testimonials: {
    title: string
    items: Array<{
      quote: string
      author: string
      role?: string
    }>
  }
  footer: {
    legal: {
      title: string
      links: Array<{
        label: string
        href: string
        muted?: boolean
        faint?: boolean
      }>
    }
    about: {
      title: string
      links: Array<{
        label: string
        href: string
        muted?: boolean
        faint?: boolean
      }>
    }
    tools: {
      title: string
      links: Array<{
        label: string
        href: string
        muted?: boolean
        faint?: boolean
      }>
    }
    contact: string
    languageLabel: string
  }
  seo: {
    title: string
    description: string
  }
}

type GetLandingPageContentOptions = {
  locale: string
  preview?: boolean
  fallbackContent: LandingPageContent
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCmsBaseUrl() {
  return process.env.NEXT_PUBLIC_STRAPI_URL || process.env.STRAPI_URL || 'http://127.0.0.1:1337'
}

function getToolUrl(name: 'default' | '8d' | 'csr' | 'fmea') {
  if (name === '8d') {
    return process.env.NEXT_PUBLIC_TOOL_8D_URL || process.env.NEXT_PUBLIC_TOOL_URL || 'https://8d.iatf-solutions.com'
  }
  if (name === 'csr') {
    return process.env.NEXT_PUBLIC_TOOL_CSR_URL || 'https://csr.iatf-solutions.com'
  }
  if (name === 'fmea') {
    return process.env.NEXT_PUBLIC_TOOL_FMEA_URL || 'https://fmea.iatf-solutions.com'
  }
  return process.env.NEXT_PUBLIC_TOOL_URL || 'https://8d.iatf-solutions.com'
}

function normalizeStrapiData(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as { data?: unknown }
  const data = root.data
  if (!data || typeof data !== 'object') return null
  const maybeAttributes = (data as { attributes?: unknown }).attributes
  if (maybeAttributes && typeof maybeAttributes === 'object') {
    return maybeAttributes as Record<string, unknown>
  }
  return data as Record<string, unknown>
}

// ─── Fallback Content ─────────────────────────────────────────────────────────

export function getLandingPageFallbackContent(
  locale: string,
  t: (key: string) => string
): LandingPageContent {
  const tool8dUrl = getToolUrl('8d')
  const toolCsrUrl = getToolUrl('csr')
  const toolFmeaUrl = getToolUrl('fmea')

  return {
    nav: {
      tools: t('nav.tools'),
      pricing: t('nav.pricing'),
      about: t('nav.about'),
    },
    hero: {
      title: t('hero.title'),
      highlight: '',
      highlightColor: '#2563eb',
      subtitle: t('hero.subtitle'),
      primaryButton: {
        label: t('hero.buyBtn'),
        href: '#pricing',
        variant: 'primary',
      },
      secondaryButton: {
        label: t('hero.exploreBtn'),
        href: '#tools',
        variant: 'secondary',
      },
    },
    about: {
      title: t('purpose.title'),
      description: t('purpose.desc'),
    },
    features: {
      title: t('nav.tools'),
      infoLabel: t('tools.infoBtn'),
      items: [
        {
          title: t('tools.generatorTitle'),
          description: t('tools.generatorDesc'),
          imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800',
          imageAlt: t('tools.generatorTitle'),
          cta: { label: t('hero.openToolBtn'), href: `${tool8dUrl}/${locale}/info`, variant: 'primary' },
        },
        {
          title: t('tools.csrTitle'),
          description: t('tools.csrDesc'),
          imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800',
          imageAlt: t('tools.csrTitle'),
          cta: { label: `Open ${t('tools.csrTitle')}`, href: `${toolCsrUrl}/${locale}/info`, variant: 'primary' },
        },
        {
          title: t('tools.fmeaTitle'),
          description: t('tools.fmeaDesc'),
          imageUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=800',
          imageAlt: t('tools.fmeaTitle'),
          cta: { label: `Open ${t('tools.fmeaTitle')}`, href: `${toolFmeaUrl}/${locale}/info`, variant: 'primary' },
        },
      ],
      steps: [
        { number: '1', label: t('tools.step1') },
        { number: '2', label: t('tools.step2'), href: `${tool8dUrl}/${locale}/info` },
        { number: '3', label: t('tools.step3'), href: `${tool8dUrl}/${locale}/generator` },
        { number: '4', label: t('tools.step4') },
      ],
    },
    testimonials: {
      title: locale === 'de' ? 'Erfahrungen' : 'Testimonials',
      items: [
        {
          quote: locale === 'de' ? 'Die Tools bringen Struktur in unsere Qualitätsdokumentation...' : 'The tools bring structure...',
          author: locale === 'de' ? 'Qualitätsmanager' : 'Quality Manager',
        },
      ],
    },
    footer: {
      legal: {
        title: t('footer.legal'),
        links: [
          { label: t('footer.terms'), href: '#' },
          { label: t('footer.privacy'), href: '#' },
          { label: t('footer.imprint'), href: '#' },
        ],
      },
      about: {
        title: t('footer.aboutTitle'),
        links: [
          { label: t('footer.disclaimer'), href: '#' },
          { label: t('footer.contact'), href: '#', muted: true },
          { label: t('footer.lang'), href: '#', faint: true },
        ],
      },
      tools: {
        title: t('footer.toolsTitle'),
        links: [
          { label: t('tools.generatorTitle'), href: `${tool8dUrl}/${locale}/info` },
          { label: t('tools.csrTitle'), href: `${toolCsrUrl}/${locale}/info` },
          { label: t('tools.fmeaTitle'), href: `${toolFmeaUrl}/${locale}/info` },
        ],
      },
      contact: t('footer.contact'),
      languageLabel: t('footer.lang'),
    },
    seo: {
      title: 'IATF Solutions',
      description: t('hero.subtitle'),
    },
  }
}

// ─── Main Content Fetcher ─────────────────────────────────────────────────────

export async function getLandingPageContent({
  locale,
  preview = false,
  fallbackContent,
}: GetLandingPageContentOptions): Promise<LandingPageContent> {
  const cmsBaseUrl = getCmsBaseUrl()
  const requestUrl = new URL('/api/landing-page', cmsBaseUrl)
  requestUrl.searchParams.set('locale', locale)

  if (preview) {
    requestUrl.searchParams.set('publicationState', 'preview')
    requestUrl.searchParams.set('status', 'draft')
  }

  const apiToken = process.env.STRAPI_API_TOKEN
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (apiToken) headers.Authorization = `Bearer ${apiToken}`

  try {
    let response = await fetch(requestUrl.toString(), {
      headers,
      next: { revalidate: preview ? 0 : 300 },
      cache: preview ? 'no-store' : 'force-cache',
    })

    // If 401, try again without token (in case token is invalid but API is public)
    if (response.status === 401 && apiToken) {
      console.warn(`Landing Page API returned 401 with token. Retrying without token...`)
      response = await fetch(requestUrl.toString(), {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: preview ? 0 : 300 },
        cache: preview ? 'no-store' : 'force-cache',
      })
    }

    if (!response.ok) {
      console.warn(`Landing Page API returned status ${response.status} for ${locale}. Falling back to hardcoded content.`)
      return fallbackContent
    }

    const json = (await response.json()) as any
    const normalized = normalizeStrapiData(json)
    if (!normalized) {
      console.warn(`Landing Page API returned invalid data structure for ${locale}. Falling back to hardcoded content.`)
      return fallbackContent
    }

    const parsed = cmsLandingPageFlatSchema.safeParse(normalized)
    if (!parsed.success) {
      console.error(`Landing Page Schema Validation Failed for ${locale}:`, JSON.stringify(parsed.error.format(), null, 2))
      // We still try to use whatever data we have instead of complete fallback if possible
      // but for now, let's stick to returning fallback to be safe, but with BETTER logging.
      return fallbackContent
    }

    const inc = parsed.data

    // Build items from individual fields
    const items = [
      {
        title: inc.tool1Title || fallbackContent.features.items[0].title,
        description: inc.tool1Desc || fallbackContent.features.items[0].description,
        imageUrl: inc.tool1Image || fallbackContent.features.items[0].imageUrl,
        imageAlt: inc.tool1Title || fallbackContent.features.items[0].imageAlt,
        cta: { label: fallbackContent.features.items[0].cta?.label || '', href: inc.tool1Href || fallbackContent.features.items[0].cta?.href || '', variant: 'primary' as const }
      },
      {
        title: inc.tool2Title || fallbackContent.features.items[1].title,
        description: inc.tool2Desc || fallbackContent.features.items[1].description,
        imageUrl: inc.tool2Image || fallbackContent.features.items[1].imageUrl,
        imageAlt: inc.tool2Title || fallbackContent.features.items[1].imageAlt,
        cta: { label: fallbackContent.features.items[1].cta?.label || '', href: inc.tool2Href || fallbackContent.features.items[1].cta?.href || '', variant: 'primary' as const }
      },
      {
        title: inc.tool3Title || fallbackContent.features.items[2].title,
        description: inc.tool3Desc || fallbackContent.features.items[2].description,
        imageUrl: inc.tool3Image || fallbackContent.features.items[2].imageUrl,
        imageAlt: inc.tool3Title || fallbackContent.features.items[2].imageAlt,
        cta: { label: fallbackContent.features.items[2].cta?.label || '', href: inc.tool3Href || fallbackContent.features.items[2].cta?.href || '', variant: 'primary' as const }
      }
    ]

    const steps = [
      { number: '1', label: inc.step1Label || fallbackContent.features.steps[0].label },
      { number: '2', label: inc.step2Label || fallbackContent.features.steps[1].label, href: fallbackContent.features.steps[1].href },
      { number: '3', label: inc.step3Label || fallbackContent.features.steps[2].label, href: fallbackContent.features.steps[2].href },
      { number: '4', label: inc.step4Label || fallbackContent.features.steps[3].label }
    ]

    const testimonials = []
    if (inc.testimonial1Quote) {
      testimonials.push({
        quote: inc.testimonial1Quote,
        author: inc.testimonial1Author || '',
        role: inc.testimonial1Role ?? undefined
      })
    }
    if (inc.testimonial2Quote) {
      testimonials.push({
        quote: inc.testimonial2Quote,
        author: inc.testimonial2Author || '',
        role: inc.testimonial2Role ?? undefined
      })
    }

    // If we have any CMS testimonials, use them. Otherwise use all fallbacks.
    const finalTestimonials = testimonials.length > 0 ? testimonials : fallbackContent.testimonials.items

    const footerLegalLinks = [
      { label: inc.footerLegalLink1Label || fallbackContent.footer.legal.links[0].label, href: inc.footerLegalLink1Href || fallbackContent.footer.legal.links[0].href },
      { label: inc.footerLegalLink2Label || fallbackContent.footer.legal.links[1].label, href: inc.footerLegalLink2Href || fallbackContent.footer.legal.links[1].href },
      { label: inc.footerLegalLink3Label || fallbackContent.footer.legal.links[2].label, href: inc.footerLegalLink3Href || fallbackContent.footer.legal.links[2].href }
    ]

    const footerAboutLinks = [
      { label: inc.footerAboutLink1Label || fallbackContent.footer.about.links[0].label, href: inc.footerAboutLink1Href || fallbackContent.footer.about.links[0].href },
      { label: inc.footerAboutLink2Label || fallbackContent.footer.about.links[1].label, href: inc.footerAboutLink2Href || fallbackContent.footer.about.links[1].href, muted: true },
      { label: inc.footerAboutLink3Label || fallbackContent.footer.about.links[2].label, href: inc.footerAboutLink3Href || fallbackContent.footer.about.links[2].href, faint: true }
    ]

    const footerToolsLinks = [
      { label: inc.footerToolsLink1Label || fallbackContent.footer.tools.links[0].label, href: fallbackContent.footer.tools.links[0].href },
      { label: inc.footerToolsLink2Label || fallbackContent.footer.tools.links[1].label, href: fallbackContent.footer.tools.links[1].href },
      { label: inc.footerToolsLink3Label || fallbackContent.footer.tools.links[2].label, href: fallbackContent.footer.tools.links[2].href }
    ]

    return {
      nav: {
        tools: inc.navTools || fallbackContent.nav.tools,
        pricing: inc.navPricing || fallbackContent.nav.pricing,
        about: inc.navAbout || fallbackContent.nav.about,
      },
      hero: {
        title: inc.heroTitle || fallbackContent.hero.title,
        highlight: inc.heroTitleHighlight || '',
        highlightColor: '#2563eb',
        subtitle: inc.heroSubtitle || fallbackContent.hero.subtitle,
        primaryButton: {
          label: inc.heroPrimaryLabel || fallbackContent.hero.primaryButton.label,
          href: inc.heroPrimaryHref || fallbackContent.hero.primaryButton.href,
          variant: 'primary',
        },
        secondaryButton: {
          label: inc.heroSecondaryLabel || fallbackContent.hero.secondaryButton.label,
          href: inc.heroSecondaryHref || fallbackContent.hero.secondaryButton.href,
          variant: 'secondary',
        },
      },
      about: {
        title: inc.aboutTitle || fallbackContent.about.title,
        description: inc.aboutDescription || fallbackContent.about.description,
      },
      features: {
        title: inc.featuresTitle || fallbackContent.features.title,
        infoLabel: inc.featuresInfoLabel || fallbackContent.features.infoLabel,
        items,
        steps,
      },
      testimonials: {
        title: inc.testimonialsTitle || fallbackContent.testimonials.title,
        items: finalTestimonials,
      },
      footer: {
        legal: {
          title: inc.footerLegalTitle || fallbackContent.footer.legal.title,
          links: footerLegalLinks,
        },
        about: {
          title: inc.footerAboutTitle || fallbackContent.footer.about.title,
          links: footerAboutLinks,
        },
        tools: {
          title: inc.footerToolsTitle || fallbackContent.footer.tools.title,
          links: footerToolsLinks,
        },
        contact: inc.footerContactLabel || fallbackContent.footer.contact,
        languageLabel: inc.footerLanguageLabel || fallbackContent.footer.languageLabel,
      },
      seo: {
        title: inc.metaTitle || fallbackContent.seo.title,
        description: inc.metaDescription || fallbackContent.seo.description,
      },
    }
  } catch (error) {
    console.error('Error fetching Landing Page from CMS:', error)
    return fallbackContent
  }
}
