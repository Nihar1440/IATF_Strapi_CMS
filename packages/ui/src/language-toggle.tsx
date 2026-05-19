'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@iatf/config/i18n/navigation'
import { Button } from './button'

export function LanguageToggle() {
  const t = useTranslations('lang')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const handleLocaleChange = (newLocale: 'de' | 'en') => {
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <div className="inline-flex items-center rounded-md border border-neutral-200 bg-white text-xs">
      <Button
        variant={locale === 'de' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleLocaleChange('de')}
        className="h-7 rounded-r-none px-2.5 text-xs"
      >
        {t('de')}
      </Button>
      <Button
        variant={locale === 'en' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleLocaleChange('en')}
        className="h-7 rounded-l-none px-2.5 text-xs"
      >
        {t('en')}
      </Button>
    </div>
  )
}
