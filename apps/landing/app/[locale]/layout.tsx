import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/lib/i18n/routing'
import '../globals.css'

export const metadata: Metadata = {
  title: 'IATF Solutions',
  description: 'AI-supported quality tools for automotive teams.',
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)

  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster richColors position="top-center" />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
