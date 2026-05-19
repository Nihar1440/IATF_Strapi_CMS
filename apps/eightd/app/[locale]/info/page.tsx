import { strapi } from '@/lib/strapi'
import EightDInfoPage from './info-client'

type Props = {
  params: Promise<{ locale: string }>
}

export const revalidate = 10 // Revalidate every 10 seconds

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const content = await strapi.getEightdInfoPage(locale)
  
  return {
    title: content.metaTitle || '8D Report',
    description: content.metaDescription || 'Automated 8D reporting.',
  }
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  const content = await strapi.getEightdInfoPage(locale)

  return <EightDInfoPage content={content} />
}
