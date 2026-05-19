// ─── Shared Types ────────────────────────────────────────────────────────────

export type OemId =
  | 'BMW' | 'VW' | 'MERCEDES' | 'STELLANTIS'
  | 'FORD' | 'GM' | 'RENAULT' | 'TOYOTA'
  | 'HYUNDAI_KIA' | 'VOLVO'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type ChangeStatus = 'new' | 'updated' | 'unchanged' | 'deleted'
export type CsrSeverity = 'supplementary' | 'tightening' | 'replacing'

// ─── CMS Response Types ───────────────────────────────────────────────────────

export interface StrapiListResponse<T> {
  data: T[]
  meta: { pagination: { page: number; pageSize: number; pageCount: number; total: number } }
}

export interface StrapiSingleResponse<T> {
  data: T
  meta: Record<string, unknown>
}

// ─── Content Type Shapes (matching Strapi schemas) ───────────────────────────

export interface LandingPage {
  documentId: string
  nav: { tools: string; pricing: string; about: string }
  hero: {
    title: string
    highlight: string
    highlightColor: string
    subtitle: string
    primaryButton: { label: string; href: string; variant: string; disabled: boolean }
    secondaryButton: { label: string; href: string; variant: string; disabled: boolean }
  }
  about: { title: string; description: string }
  features: {
    title: string
    items: Array<{
      title: string
      description: string
      imageUrl: string
      imageAlt: string
      cta: { label: string; href: string; variant: string; disabled: boolean }
    }>
    steps: Array<{ number: string; label: string; href?: string }>
  }
  testimonials: {
    title: string
    items: Array<{ quote: string; author: string; role: string }>
  }
  footer: {
    legal: { title: string; links: Array<{ label: string; href: string; muted: boolean; faint: boolean }> }
    about: { title: string; links: Array<{ label: string; href: string; muted: boolean; faint: boolean }> }
    tools: { title: string; links: Array<{ label: string; href: string; muted: boolean; faint: boolean }> }
    contact: string
    languageLabel: string
  }
  seo: { title: string; description: string }
}

export interface OemProfile {
  documentId: string
  oemId: OemId
  name: string
  logo?: string
  lastUpdate?: string
  csrCount: number
  active: boolean
}

export interface CsrRequirement {
  documentId: string
  requirementId: string
  iatfChapter: string
  title: string
  oemId: OemId | null
  text: string
  version: string
  changeStatus: ChangeStatus
  risk: RiskLevel
  severity: CsrSeverity | null
  sourceDoc: string
  conflictFlag: boolean
  active: boolean
  lastUpdated: string
  overIatfFlag: boolean
  tags?: string[]
}

export interface ProcessDefinition {
  documentId: string
  processId: string
  name: string
  category: 'COP' | 'SUP'
  sortOrder: number
}

export interface PricingTier {
  documentId: string
  toolId: 'tool_8d' | 'tool_csr'
  name: string
  description?: string
  price: number
  currency: string
  credits: number
  stripePriceId?: string
  highlighted: boolean
  badgeLabel?: string
  features?: string[]
  sortOrder: number
}

export interface InfoPage {
  documentId?: string;
  heroBadge?: string;
  backToHome?: string;
  heroTitle?: string;
  heroTitleHighlight?: string;
  heroTitleHighlightColor?: string;
  heroDescription?: string;
  ctaCredits?: string;
  ctaBuy?: string;
  ctaSample?: string;
  sampleDownload?: string;
  sampleCta?: string;
  sampleLabel?: string;
  sampleTitle?: string;
  sampleDesc?: string;
  trust1?: string;
  trust2?: string;
  trust3?: string;
  trust4?: string;
  trust5?: string;
  
  outputLabel?: string;
  outputBadge?: string;
  outputPdfTitle?: string;
  outputPdfDesc?: string;
  outputExcelTitle?: string;
  outputExcelDesc?: string;

  disciplinesLabel?: string;
  disciplinesTitle?: string;
  disciplinesSub?: string;
  d1Title?: string;
  d1Desc?: string;
  d2Title?: string;
  d2Desc?: string;
  d3Title?: string;
  d3Desc?: string;
  d4Title?: string;
  d4Desc?: string;
  d5Title?: string;
  d5Desc?: string;
  d6Title?: string;
  d6Desc?: string;
  d7Title?: string;
  d7Desc?: string;
  d8Title?: string;
  d8Desc?: string;

  howLabel?: string;
  howTitle?: string;
  step1Title?: string;
  step1Desc?: string;
  step2Title?: string;
  step2Desc?: string;
  step3Title?: string;
  step3Desc?: string;

  pricingLabel?: string;
  pricingTitle?: string;
  pricingSub?: string;
  popularBadge?: string;
  plan1Credits?: string;
  plan1Price?: string;
  plan1Per?: string;
  plan2Credits?: string;
  plan2Price?: string;
  plan2Per?: string;
  plan3Credits?: string;
  plan3Price?: string;
  plan3Per?: string;
  plan1Feature1?: string;
  plan1Feature2?: string;
  plan1Feature3?: string;
  plan1Feature4?: string;
  plan2Feature1?: string;
  plan2Feature2?: string;
  plan2Feature3?: string;
  plan3Feature1?: string;
  plan3Feature2?: string;
  plan3Feature3?: string;
  pricingNote?: string;

  faqLabel?: string;
  faq1Q?: string;
  faq1A?: string;
  faq2Q?: string;
  faq2A?: string;
  faq3Q?: string;
  faq3A?: string;
  faq4Q?: string;
  faq4A?: string;
  faq5Q?: string;
  faq5A?: string;
  faq6Q?: string;
  faq6A?: string;

  finalCtaTitle?: string;
  finalCtaDesc?: string;
  finalCtaBuy?: string;
  finalCtaGetStarted?: string;
  cookiePolicyTitle?: string;

  docHeaderTitle?: string;
  docHeaderSub?: string;
  docD1?: string;
  docD2?: string;
  docD4?: string;
  docD5D8?: string;

  section1Title?: string;
  section1Description?: string;
  section2Title?: string;
  section2Description?: string;
  metaTitle?: string;
  metaDescription?: string;
}
