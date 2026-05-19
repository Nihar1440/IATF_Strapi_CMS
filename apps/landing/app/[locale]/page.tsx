import { getTranslations } from 'next-intl/server'
import { LandingPageClient } from '@/components/landing-page-client'
import { getLandingPageContent, getLandingPageFallbackContent } from '@/services/cms'
import { buildPricingPlans, getCmsPricingOverride } from '@/services/pricing'

export const revalidate = 300

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ preview?: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'landing' })

  return {
    title: t('purpose.title'),
    description: t('purpose.desc'),
  }
}

export default async function LandingPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { preview } = await searchParams
  const t = await getTranslations({ locale, namespace: 'landing' })

  const fallbackContent = getLandingPageFallbackContent(locale, t)
  const [content, cmsPricing] = await Promise.all([
    getLandingPageContent({
      locale,
      preview: preview === 'true',
      fallbackContent,
    }),
    getCmsPricingOverride(t),
  ])
  
  const fallbackPricing = buildPricingPlans(t)
  const pricing = cmsPricing
    ? {
        title: fallbackPricing.title,
        subtitle: fallbackPricing.subtitle,
        eightDPlans: cmsPricing.eightDPlans.length ? cmsPricing.eightDPlans : fallbackPricing.eightDPlans,
        csrPlans: cmsPricing.csrPlans.length ? cmsPricing.csrPlans : fallbackPricing.csrPlans,
        fmeaPlans: cmsPricing.fmeaPlans.length ? cmsPricing.fmeaPlans : fallbackPricing.fmeaPlans,
      }
    : fallbackPricing

  return <LandingPageClient content={content} pricing={pricing} />
}