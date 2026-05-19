import { strapi } from '@/lib/strapi'
import CsrInfoPage from './info-client'

type Props = {
  params: Promise<{ locale: string }>
}

export const revalidate = 10 // Revalidate every 10 seconds

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const content = await strapi.getCsrInfoPage(locale)
  
  return {
    title: content.metaTitle || 'CSR Matrix',
    description: content.metaDescription || 'Intelligent CSR mapping.',
  }
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  const content = await strapi.getCsrInfoPage(locale)

  return <CsrInfoPage content={content} />
}
