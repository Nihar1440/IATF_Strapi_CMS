'use client'

import React from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { LanguageToggle } from '@/components/language-toggle'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CreditCard,
  Download,
  Check,
  ShieldCheck,
  Database,
  Zap,
  BarChart3,
  FileCheck,
  RefreshCw,
  Languages
} from 'lucide-react'
import type { InfoPage } from '@iatf/strapi-client'

export default function CsrInfoPage({ content }: { content: InfoPage }) {
  const locale = useLocale()
  const t = useTranslations('csrInfo')
  const landingUrl = `${process.env.NEXT_PUBLIC_LANDING_PAGE_URL || ''}/${locale}`

  const capabilities = [
    { icon: Database, key: 'd1' },
    { icon: Zap, key: 'd2' },
    { icon: ShieldCheck, key: 'd3' },
    { icon: BarChart3, key: 'd4' },
    { icon: FileCheck, key: 'd5' },
    { icon: ShieldCheck, key: 'd6' },
    { icon: RefreshCw, key: 'd7' },
    { icon: Languages, key: 'd8' },
  ]

  const steps = [
    { num: '1', key: 'step1' },
    { num: '2', key: 'step2' },
    { num: '3', key: 'step3' },
  ]

  const pricingPlans = [
    { key: 'plan1', featured: false },
    { key: 'plan2', featured: true },
    { key: 'plan3', featured: false },
  ]

  const faqs = [
    { key: 'faq1' },
    { key: 'faq2' },
    { key: 'faq3' },
    { key: 'faq4' },
    { key: 'faq5' },
  ]

  return (
    <main className="min-h-dvh bg-neutral-50 text-neutral-900">

      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href={landingUrl} className="text-base font-semibold tracking-tight">
            <span className="text-blue-600">IATF</span>{' '}
            <span className="text-neutral-900">Solutions</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href={landingUrl}
              className="group flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4" />
              {content.backToHome || t('backToHome')}
            </Link>
            <LanguageToggle />
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="mx-auto max-w-[860px] px-6 pb-12 pt-16 text-center">
        <Badge variant="secondary" className="mb-6 rounded-full bg-blue-50 px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-blue-600 border-none">
          <span className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
          {content.heroBadge || t('badge')}
        </Badge>
        <h1
          className="mb-5 text-3xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-5xl"
        >
          {content.heroTitle}{' '}
          <span className="italic" style={{ color: '#2563eb' }}>
            {content.heroTitleHighlight}
          </span>
        </h1>
        <p className="mx-auto mb-10 max-w-[620px] text-base leading-relaxed text-neutral-600 sm:text-lg">
          {content.heroDescription}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button render={<a href={`/${locale}/unlock`} className="flex items-center justify-center gap-2" />} size="lg" className="rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 text-sm font-semibold h-12 w-full sm:w-52">
            <ArrowRight className="h-5 w-5" />
            {content.ctaBuy || t('ctaBuy')}
          </Button>
          <Button render={<a href={`${landingUrl}#pricing`} className="flex items-center justify-center gap-2" />} variant="outline" size="lg" className="rounded-full border-blue-200 bg-white text-blue-600 hover:bg-blue-50 hover:border-blue-600 text-sm font-semibold h-12 w-full sm:w-52">
            <Clock className="h-5 w-5" />
            {content.ctaCredits || t('ctaCredits')}
          </Button>
          <Button render={<a href="#sample" className="flex items-center justify-center gap-2" />} variant="outline" size="lg" className="rounded-full border-blue-200 bg-white text-blue-600 hover:bg-blue-50 hover:border-blue-600 text-sm font-semibold h-12 w-full sm:w-52">
            <Download className="h-5 w-5" />
            {content.ctaSample || t('ctaSample')}
          </Button>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="border-y border-neutral-100 bg-white px-6 py-5">
        <div className="mx-auto flex max-w-[920px] flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {(['trust1', 'trust2', 'trust3', 'trust4', 'trust5'] as const).map((key) => {
            const trustValue = content[key as keyof InfoPage] as string
            if (!trustValue && !t.has(key)) return null
            return (
              <div key={key} className="flex items-center gap-2.5 text-[0.85rem] font-medium text-neutral-500">
                <Check className="h-[18px] w-[18px] flex-shrink-0 text-emerald-500" />
                {trustValue || t(key)}
              </div>
            )
          })}
        </div>
      </div>

      {/* OUTPUT PREVIEW */}
      <section className="mx-auto max-w-[960px] px-6 py-16">
        <p className="mb-8 text-center text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">
          {content.outputLabel || t('previewLabel')}
        </p>
        <div className="relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-white p-8 sm:p-10 shadow-sm">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent" />
          <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* PDF Card */}
            <Card className="border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-2xl">
                  📄
                </div>
                <Badge className="absolute right-6 top-8 bg-emerald-50 text-[0.65rem] font-bold text-emerald-600 hover:bg-emerald-50 border-none">
                  {content.outputBadge || t('outputBadge')}
                </Badge>
                <h3 className="mb-2 text-lg font-bold text-neutral-900">{content.outputPdfTitle || t('outputPdfTitle')}</h3>
                <p className="text-[0.9rem] leading-relaxed text-neutral-500">{content.outputPdfDesc || t('outputPdfDesc')}</p>
              </CardContent>
            </Card>
            {/* Excel Card */}
            <Card className="border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
                  📊
                </div>
                <Badge className="absolute right-6 top-8 bg-emerald-50 text-[0.65rem] font-bold text-emerald-600 hover:bg-emerald-50 border-none">
                  {content.outputBadge || t('outputBadge')}
                </Badge>
                <h3 className="mb-2 text-lg font-bold text-neutral-900">{content.outputExcelTitle || t('outputExcelTitle')}</h3>
                <p className="text-[0.9rem] leading-relaxed text-neutral-500">{content.outputExcelDesc || t('outputExcelDesc')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES */}
      <section className="mx-auto mb-20 max-w-[960px] px-6">
        <Badge variant="outline" className="mb-4 border-blue-200 text-blue-600 font-semibold uppercase tracking-[0.2em] text-[0.65rem]">
          {content.disciplinesLabel || t('disciplinesLabel')}
        </Badge>
        <h2
          className="mb-4 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl"
        >
          {content.disciplinesTitle || t('disciplinesTitle')}
        </h2>
        <div
          className="mb-10 max-w-none text-base leading-relaxed text-neutral-500 sm:text-lg prose prose-neutral text-left"
        >
          {content.disciplinesSub || t('disciplinesSub')}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {capabilities.map((c) => {
            const title = content[`${c.key}Title` as keyof InfoPage] as string
            const desc = content[`${c.key}Desc` as keyof InfoPage] as string
            return (
              <div
                key={c.key}
                className="group rounded-2xl border border-neutral-200 bg-neutral-50/50 p-6 transition-all hover:border-blue-200 hover:bg-white hover:shadow-xl hover:shadow-blue-600/[0.05]"
              >
                <div className="mb-3 text-blue-600 transition-transform group-hover:scale-110 origin-left">
                  <c.icon className="h-7 w-7" />
                </div>
                <h4 className="mb-2 text-[0.95rem] font-bold text-neutral-900">
                  {title || t(`${c.key}Title`)}
                </h4>
                <p className="text-[0.8rem] leading-relaxed text-neutral-500">
                  {desc || t(`${c.key}Desc`)}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mb-20 border-y border-neutral-100 bg-white px-6 py-16">
        <div className="mx-auto max-w-[960px]">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
            {content.howLabel || t('howLabel')}
          </p>
          <h2
            className="mb-10 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl"
          >
            {content.howTitle || t('howTitle')}
          </h2>
          <div className="relative grid grid-cols-1 gap-12 sm:grid-cols-3">
            {/* Connecting line */}
            <div className="pointer-events-none absolute left-[calc(16.66%+24px)] right-[calc(16.66%+24px)] top-[24px] hidden h-0.5 bg-neutral-200 sm:block" />
            {steps.map((s) => {
              const title = content[`${s.key}Title` as keyof InfoPage] as string
              const desc = content[`${s.key}Desc` as keyof InfoPage] as string
              return (
                <div key={s.key} className="flex flex-col items-start gap-5">
                  <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-600/30">
                    {s.num}
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">
                    {title || t(`${s.key}Title`)}
                  </h3>
                  <p className="text-[0.95rem] leading-relaxed text-neutral-500">
                    {desc || t(`${s.key}Desc`)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="mx-auto mb-20 max-w-[960px] px-6">
        <Badge variant="outline" className="mb-4 border-blue-200 text-blue-600 font-semibold uppercase tracking-[0.2em] text-[0.65rem]">
          {content.pricingLabel || t('pricingLabel')}
        </Badge>
        <h2
          className="mb-4 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl"
        >
          {content.pricingTitle || t('pricingTitle')}
        </h2>
        <p className="mb-12 max-w-[560px] text-base leading-relaxed text-neutral-500 sm:text-lg">
          {content.pricingSub || t('pricingSub')}
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {pricingPlans.map((plan) => {
            const planCredits = content[`${plan.key}Credits` as keyof InfoPage] as string
            const planPrice = content[`${plan.key}Price` as keyof InfoPage] as string
            const planPer = content[`${plan.key}Per` as keyof InfoPage] as string
            const planCta = content[`${plan.key}Cta` as keyof InfoPage] as string

            return (
              <Card
                key={plan.key}
                className={`relative flex flex-col rounded-3xl p-2 overflow-visible transition-all hover:shadow-2xl hover:shadow-blue-600/[0.1] ${plan.featured
                  ? 'border-2 border-blue-600'
                  : 'border border-neutral-200'
                  }`}
              >
                <CardContent className="flex flex-1 flex-col p-8">
                  {plan.featured && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 px-4 py-1 text-[0.7rem] font-bold uppercase tracking-widest text-white hover:bg-blue-600 border-none">
                      {content.popularBadge || t('popularBadge')}
                    </Badge>
                  )}
                  <div className="mb-3 text-[0.7rem] font-bold uppercase tracking-widest text-neutral-400">
                    {planCredits || t(`${plan.key}Credits`)}
                  </div>
                  <div className="mb-2 text-4xl font-bold text-neutral-900 sm:text-5xl">
                    {planPrice || t(`${plan.key}Price`)}{' '}
                    <span className="text-xl font-normal text-neutral-300">€</span>
                  </div>
                  <div className="mb-8 text-sm font-medium text-neutral-400">
                    {planPer || t(`${plan.key}Per`)}
                  </div>
                  <div className="mb-8 h-px bg-neutral-100" />
                  <ul className="mb-10 flex flex-1 flex-col gap-4">
                    {([1, 2, 3, 4] as const).map((i) => {
                      const featureKey = `${plan.key}Feature${i}` as any
                      const dynamicFeature = content[featureKey as keyof InfoPage] as string
                      if (!dynamicFeature && !t.has(featureKey)) return null
                      return (
                        <li key={i} className="flex items-center gap-3 text-[0.9rem] font-medium text-neutral-600">
                          <Check className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                          {dynamicFeature || t(featureKey)}
                        </li>
                      )
                    })}
                  </ul>
                  <Button render={<a href={`${process.env.NEXT_PUBLIC_LANDING_PAGE_URL || ''}/${locale}#pricing`} className="flex items-center justify-center gap-2" />} size="lg" variant={plan.featured ? 'default' : 'outline'} className={`w-full rounded-full py-6 text-sm font-semibold transition-transform hover:-translate-y-1 ${plan.featured ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-600'
                    }`}>
                    {planCta || t(`${plan.key}Cta`)}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
        <p className="mt-8 text-center text-xs font-medium text-neutral-400">
          {content.pricingNote || t('pricingNote')}
        </p>
      </section>

      {/* SAMPLE DOWNLOAD */}
      <section id="sample" className="mb-20 px-6">
        <div className="mx-auto max-w-[960px] overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-10 sm:p-16">
          <div className="mx-auto flex flex-col items-center gap-16 lg:flex-row lg:items-center">
            <div className="flex-1 text-center lg:text-left">
              <Badge variant="secondary" className="mb-6 bg-white/10 px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/90 border-none">
                {content.sampleLabel || t('sampleLabel')}
              </Badge>
              <h2
                className="mb-6 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl"
              >
                {content.sampleTitle || t('sampleTitle')}
              </h2>
              <p className="mb-8 text-base leading-relaxed text-white/80 sm:text-lg">
                {content.sampleDesc || t('sampleDesc')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 lg:justify-start">
                <Button
                  render={<a href="/api/csr/sample-report" download="CSR-Sample-Report.pdf" className="flex items-center justify-center gap-2" />}
                  size="lg"
                  className="rounded-full bg-white text-blue-600 hover:bg-blue-50 shadow-lg shadow-black/15 text-sm font-semibold h-12 w-full sm:w-56"
                >
                  <Download className="h-5 w-5" />
                  {content.sampleDownload || t('sampleDownload')}
                </Button>
                <Button render={<a href={`${process.env.NEXT_PUBLIC_LANDING_PAGE_URL || ''}/${locale}#pricing`} className="flex items-center justify-center gap-2" />} variant="outline" size="lg" className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 text-sm font-semibold h-12 w-full sm:w-56">
                  <Clock className="h-5 w-5" />
                  {content.sampleCta || t('sampleCta')}
                </Button>
              </div>
            </div>
            {/* Document Preview Mockup */}
            <div className="relative w-full max-w-[280px] flex-shrink-0 animate-float lg:max-w-[320px]">
              <div className="rounded-3xl bg-white p-8 shadow-2xl shadow-black/40">
                <div className="mb-6 rounded-2xl bg-blue-600 px-5 py-4">
                  <div className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-white/50">
                    {content.docHeaderTitle || t('docHeaderTitle')}
                  </div>
                  <div className="text-lg font-bold text-white">{content.docHeaderSub || t('docHeaderSub')}</div>
                </div>
                {[
                  { label: 'IATF', title: content.docD1 || t('docD1'), width: 'w-4/5' },
                  { label: 'OEM', title: content.docD2 || t('docD2'), width: 'w-full' },
                  { label: 'RISK', title: content.docD4 || t('docD4'), width: 'w-3/4' },
                  { label: 'GAP', title: content.docD5D8 || t('docD5D8'), width: 'w-5/6' },
                ].map((item, idx) => (
                  <div key={idx} className="mb-6 last:mb-0">
                    <div className="mb-2 text-[0.65rem] font-bold uppercase tracking-wider text-blue-600">{item.label} — {item.title}</div>
                    <div className="space-y-1.5">
                      <div className={`h-1.5 ${item.width} rounded-full bg-neutral-100`} />
                      <div className="h-1.5 w-1/2 rounded-full bg-neutral-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto mb-20 max-w-[960px] px-6">
        <div className="text-center">
          <Badge variant="outline" className="mb-4 border-blue-200 text-blue-600 font-semibold uppercase tracking-[0.2em] text-[0.65rem]">
            {content.faqLabel || t('faqLabel')}
          </Badge>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqs.map((faq, i) => {
            const question = content[`${faq.key}Q` as keyof InfoPage] as string
            const answer = content[`${faq.key}A` as keyof InfoPage] as string
            return (
              <Card
                key={faq.key}
                className={`border-neutral-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md ${i === faqs.length - 1 && faqs.length % 2 !== 0 ? 'md:col-span-2' : ''
                  }`}
              >
                <CardContent className="p-4">
                  <h3 className="mb-3 text-[1rem] font-bold text-neutral-900">
                    {question || t(`${faq.key}Q`)}
                  </h3>
                  <p className="text-[0.9rem] leading-relaxed text-neutral-500">
                    {answer || t(`${faq.key}A`)}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-[720px] px-6 pb-24 pt-10 text-center">
        <div className="rounded-[2.5rem] bg-white px-8 py-16 border border-neutral-200 shadow-sm">
          <h2
            className="mb-5 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl"
          >
            {content.finalCtaTitle || t('finalCtaTitle')}
          </h2>
          <p className="mx-auto mb-8 max-w-[460px] text-base text-neutral-500 sm:text-lg">
            {content.finalCtaDesc || t('finalCtaDesc')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button render={<a href={`${process.env.NEXT_PUBLIC_LANDING_PAGE_URL || ''}/${locale}#pricing`} className="flex items-center justify-center gap-2" />} size="lg" className="rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 text-sm font-semibold h-12 w-full sm:w-52">
              <CreditCard className="h-5 w-5" />
              {content.finalCtaBuy || t('finalCtaBuy')}
            </Button>
            <Button render={<a href={`/${locale}/matrix`} className="flex items-center justify-center gap-2" />} variant="outline" size="lg" className="rounded-full border-blue-200 bg-white text-blue-600 hover:bg-blue-50 hover:border-blue-600 text-sm font-semibold h-12 w-full sm:w-52">
              <ArrowRight className="h-5 w-5" />
              {content.finalCtaGetStarted || t('finalCtaGetStarted')}
            </Button>
          </div>
        </div>
      </section>

      {/* Cookie Declaration */}
      <section className="border-t border-neutral-100 bg-white py-20">
        <div className="mx-auto max-w-[960px] px-6">
          <Badge variant="outline" className="mb-4 border-blue-200 text-blue-600 font-semibold uppercase tracking-[0.2em] text-[0.65rem] mx-auto flex w-max">
            {content.cookiePolicyTitle || t('cookiePolicyTitle')}
          </Badge>
          <h2
            className="mb-10 text-center text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl"
          >
            {content.cookiePolicyTitle || t('cookiePolicyTitle')}
          </h2>

          <div className="relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-white p-6 sm:p-10 shadow-sm">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50/20 to-transparent" />
            <div className="relative prose prose-neutral max-w-none">
              <div id="cookie-declaration-container" className="min-h-[240px] w-full max-w-full overflow-x-auto text-left text-[0.95rem] leading-relaxed text-neutral-600">
                <CookieDeclaration t={t} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="flex flex-wrap justify-center gap-10 border-t border-neutral-100 bg-white px-6 py-10">
        {[
          { href: '/imprint', label: t('footerImprint') },
          { href: '/privacy', label: t('footerPrivacy') },
          { href: '/terms', label: t('footerTerms') },
          { href: 'mailto:ln@laurinneises.de', label: t('footerContact') },
        ].map((link) => (
          <a key={link.href} href={link.href} className="text-xs font-bold uppercase tracking-widest text-neutral-400 transition-colors hover:text-blue-600">
            {link.label}
          </a>
        ))}
      </footer>

      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
      `}</style>
    </main>
  )
}

function CookieDeclaration({ t }: { t: any }) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted) return
    const isLocal = window.location.hostname === 'localhost'
    if (isLocal) return
    if (!process.env.NEXT_PUBLIC_COOKIEBOT_ID) return
    if (!containerRef.current) return

    if (document.getElementById('CookieDeclaration')) return

    const script = document.createElement('script')
    script.id = 'CookieDeclaration'
    script.src = `https://consent.cookiebot.com/${process.env.NEXT_PUBLIC_COOKIEBOT_ID}/cd.js`
    script.async = true

    containerRef.current.appendChild(script)
  }, [mounted])

  if (!mounted) {
    return <div className="min-h-[240px] animate-pulse rounded-2xl bg-neutral-100/50" />
  }

  const isLocal = window.location.hostname === 'localhost'

  if (isLocal || !process.env.NEXT_PUBLIC_COOKIEBOT_ID) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-neutral-200 py-16 bg-white/50 text-center">
        <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-neutral-200" />
        <p className="text-base font-bold not-italic text-neutral-400 uppercase tracking-widest">{t('cookiePolicyTitle')}</p>
        <p className="mx-auto mt-2 max-w-[320px] text-xs leading-relaxed opacity-60">
          {process.env.NEXT_PUBLIC_COOKIEBOT_ID
            ? "The live declaration is hidden on local domains to avoid authorization errors. It will appear automatically on the production domain."
            : "Cookiebot ID is missing. Please check your environment variables."}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full text-left not-italic text-neutral-600 prose-sm prose-neutral">
      <style>{`
        #CookieDeclaration { width: 100% !important; max-width: 100%; font-family: inherit; }
        #CookieDeclaration table { width: 100% !important; min-width: 720px; border-collapse: collapse; margin-top: 2rem; border-radius: 0.5rem; overflow: hidden; }
        #CookieDeclaration th { text-align: left; padding: 16px 20px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; font-weight: 700; color: #0f172a; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
        #CookieDeclaration td { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; color: #475569; vertical-align: top; }
        #CookieDeclaration a { color: #2563eb; text-decoration: none; font-weight: 600; transition: color 0.2s; }
        #CookieDeclaration a:hover { color: #1d4ed8; text-decoration: underline; }
        .CookieDeclarationType { font-weight: 800; font-size: 1.25rem; margin-top: 3rem; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
      `}</style>
      <div ref={containerRef} />
    </div>
  )
}
