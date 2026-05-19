import { strapi } from '@/lib/strapi'
import FmeaInfoPageClient from './info-client'

type Props = {
  params: Promise<{ locale: string }>
}

export const revalidate = 10 // Revalidate every 10 seconds

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const content = await strapi.getFmeaInfoPage(locale)
  
  return {
    title: content.metaTitle || 'FMEA Review',
    description: content.metaDescription || 'Automated FMEA auditing.',
  }
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  const content = await strapi.getFmeaInfoPage(locale)

  return <FmeaInfoPageClient content={content} />
}
