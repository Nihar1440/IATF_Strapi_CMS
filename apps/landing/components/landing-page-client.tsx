'use client'

import Image, { type ImageLoaderProps } from 'next/image'
import { Check } from 'lucide-react'
import { LanguageToggle } from '@/components/language-toggle'
import { BuyCreditsButton } from '@/components/BuyCreditsButton'
import { RequestQuoteButton } from '@/components/RequestQuoteButton'
import type { LandingPageContent } from '@/services/cms'
import type { PricingConfig, PricingPlan } from '@/services/pricing'

const pageStyles = `
  .lp { font-family: 'Inter', system-ui, -apple-system, sans-serif; min-height: 100vh; background: #fff; }
  *, *::before, *::after { box-sizing: border-box; }
  .lp-header { position: sticky; top: 0; z-index: 50; background: rgba(255,255,255,0.97); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border-bottom: 1px solid #f0f0f0; }
  .lp-header-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; }
  .lp-logo { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; text-decoration: none; white-space: nowrap; }
  .lp-logo-blue { color: #0066FF; }
  .lp-logo-black { color: #111; }
  .lp-nav { display: flex; align-items: center; gap: 4px; }
  .lp-nav-link { padding: 6px 14px; font-size: 14px; font-weight: 500; color: #0066FF; text-decoration: none; border-radius: 6px; transition: color 0.2s, background 0.2s; white-space: nowrap; }
  .lp-nav-link:hover { color: #888; background: #f5f5f5; }
  .lp-hero { text-align: center; padding: 80px 24px 64px; max-width: 900px; margin: 24px auto 0; background: linear-gradient(180deg, #f5f9ff 0%, #ffffff 100%); border-radius: 32px; }
  .lp-hero h1 { font-size: 46px; font-weight: 800; line-height: 1.15; color: #0033AA; letter-spacing: -0.02em; margin: 0; }
  .lp-hero p { font-size: 22px; font-weight: 400; line-height: 1.5; color: #888; margin-top: 16px; max-width: 650px; margin-left: auto; margin-right: auto; }
  .lp-hero-btns { margin-top: 32px; display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
  .lp-btn-primary { display: inline-flex; align-items: center; justify-content: center; height: 44px; padding: 0 16px; border-radius: 999px; font-size: 14px; font-weight: 600; color: #fff; background: #4B5EAA; text-decoration: none; transition: background 0.2s; border: none; cursor: pointer; }
  .lp-btn-primary:hover { background: #3a4d8f; }
  .lp-btn-secondary { display: inline-flex; align-items: center; justify-content: center; height: 44px; padding: 0 28px; border-radius: 999px; font-size: 14px; font-weight: 600; color: #333; background: #F3F3F3; text-decoration: none; transition: background 0.2s; border: none; cursor: pointer; }
  .lp-btn-secondary:hover { background: #e5e5e5; }
  .lp-purpose { text-align: center; padding: 48px 24px 56px; max-width: 780px; margin: 0 auto; }
  .lp-purpose h2 { font-size: 28px; font-weight: 700; color: #0033AA; margin: 0; }
  .lp-purpose p { font-size: 15px; line-height: 1.7; color: #666; margin-top: 16px; }
  .lp-tools { padding: 24px 24px 48px; max-width: 1000px; margin: 0 auto; }
  .lp-tools-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 32px; }
  .lp-tool-img { border-radius: 12px; overflow: hidden; aspect-ratio: 16/10; background: #f5f5f7; }
  .lp-tool-img-link { display: block; text-decoration: none; color: inherit; }
  .lp-tool-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .lp-tool-card { display: flex; flex-direction: column; height: 100%; }
  .lp-tool-title { font-size: 22px; font-weight: 700; color: #111; margin-top: 20px; margin-bottom: 8px; }
  .lp-tool-desc { font-size: 14px; line-height: 1.65; color: #666; margin: 0; }
  .lp-tool-actions { margin-top: auto; padding-top: 16px; display: flex; gap: 8px; flex-wrap: wrap; }
  .lp-btn-primary[disabled], .lp-btn-secondary[disabled] { opacity: 0.55; cursor: not-allowed; }
  .lp-steps { display: flex; justify-content: center; align-items: flex-start; gap: 0; margin-top: 64px; }
  .lp-step-item { display: flex; align-items: center; }
  .lp-step-content { text-align: center; width: 160px; }
  .lp-step-circle { width: 48px; height: 48px; border-radius: 50%; border: 2px solid #ccc; background: #fff; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 600; color: #888; margin: 0 auto 10px; }
  .lp-step-label { font-size: 14px; font-weight: 600; color: #111; text-decoration: none; display: block; }
  .lp-step-line { width: 60px; height: 2px; background: #ddd; flex-shrink: 0; margin-top: -18px; }
  .lp-pricing { padding: 64px 24px 80px; max-width: 1000px; margin: 0 auto; }
  .lp-pricing-header { text-align: center; margin-bottom: 40px; }
  .lp-pricing-header h2 { font-size: 32px; font-weight: 700; color: #111; margin: 0; }
  .lp-pricing-header p { font-size: 20px; color: #888; margin-top: 6px; font-weight: 400; }
  .lp-pricing-section-title { font-size: 20px; font-weight: 600; color: #111; margin-bottom: 24px; margin-top: 0; }
  .lp-pricing-section-title:first-of-type { margin-top: 0; }
  .lp-pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 36px; }
  .lp-price-card { background: #F7F7F8; border-radius: 14px; padding: 28px 24px 24px; display: flex; flex-direction: column; }
  .lp-price-card-title { font-size: 13px; font-weight: 500; color: #888; margin: 0; }
  .lp-price-card-amount { font-size: 36px; font-weight: 800; color: #111; margin: 8px 0 0; letter-spacing: -0.02em; }
  .lp-price-card-features { list-style: none; padding: 0; margin: 20px 0 0; flex: 1; }
  .lp-price-card-features li { display: flex; align-items: flex-start; gap: 8px; font-size: 14px; color: #555; margin-bottom: 10px; line-height: 1.4; }
  .lp-price-card-features .check-icon { width: 16px; height: 16px; color: #888; flex-shrink: 0; margin-top: 2px; }
  .lp-price-card-btn { margin-top: auto; padding-top: 20px; }
  .lp-buy-btn { display: inline-flex; width: 100%; height: 44px; align-items: center; justify-content: center; border-radius: 999px; padding: 0 24px; font-size: 14px; font-weight: 600; line-height: 1; color: #fff !important; background: #111 !important; border: none; cursor: pointer; transition: background 0.2s; text-decoration: none; }
  .lp-buy-btn:hover { background: #555 !important; color: #fff !important; }
  .lp-testimonials { max-width: 1000px; margin: 0 auto; padding: 0 24px 72px; }
  .lp-testimonials h2 { font-size: 28px; font-weight: 700; color: #111; text-align: center; margin: 0 0 28px; }
  .lp-testimonials-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
  .lp-testimonial-card { background: #fafafa; border: 1px solid #eee; border-radius: 14px; padding: 24px; }
  .lp-testimonial-quote { font-size: 15px; line-height: 1.7; color: #444; margin: 0 0 16px; }
  .lp-testimonial-author { font-size: 14px; font-weight: 600; color: #111; margin: 0; }
  .lp-testimonial-role { font-size: 13px; color: #777; margin-top: 4px; }
  .lp-footer { border-top: 1px solid #eee; padding: 48px 24px 40px; }
  .lp-footer-inner { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: 1.2fr 1fr 1fr 1fr; gap: 40px; }
  .lp-footer-col h4 { font-size: 13px; font-weight: 600; color: #111; margin: 0 0 14px; text-transform: uppercase; letter-spacing: 0.04em; }
  .lp-footer-col ul { list-style: none; padding: 0; margin: 0; }
  .lp-footer-col li { margin-bottom: 10px; font-size: 14px; }
  .lp-footer-col a { color: #0066FF; text-decoration: none; transition: color 0.2s; }
  .lp-footer-col a:hover { color: #0066FF; }
  .lp-footer-col .muted { color: #666; }
  .lp-footer-col .faint { color: #999; }
  @media (max-width: 1024px) {
    .lp-header-inner { padding: 12px 20px; }
    .lp-nav-link { padding: 5px 10px; font-size: 13px; }
    .lp-hero { padding: 56px 20px 44px; }
    .lp-hero h1 { font-size: 36px; }
    .lp-hero p { font-size: 18px; }
    .lp-purpose { padding: 40px 20px 44px; }
    .lp-purpose h2 { font-size: 24px; }
    .lp-purpose p { font-size: 14px; }
    .lp-tools { padding: 20px 20px 40px; }
    .lp-tools-grid { gap: 24px; }
    .lp-tool-title { font-size: 19px; margin-top: 16px; }
    .lp-tool-desc { font-size: 13px; }
    .lp-steps { margin-top: 48px; }
    .lp-step-content { width: 140px; }
    .lp-step-circle { width: 42px; height: 42px; font-size: 16px; }
    .lp-step-label { font-size: 13px; }
    .lp-step-line { width: 44px; }
    .lp-pricing { padding: 48px 20px 60px; }
    .lp-pricing-header h2 { font-size: 28px; }
    .lp-pricing-header p { font-size: 17px; }
    .lp-pricing-section-title { font-size: 18px; margin-bottom: 20px; }
    .lp-pricing-grid { gap: 16px; }
    .lp-price-card { padding: 24px 20px 22px; border-radius: 12px; }
    .lp-price-card-amount { font-size: 30px; }
    .lp-price-card-features li { font-size: 13px; }
    .lp-buy-btn { height: 42px; font-size: 13px; }
    .lp-testimonials-grid { grid-template-columns: 1fr; }
    .lp-footer { padding: 40px 20px 32px; }
    .lp-footer-inner { gap: 32px; }
    .lp-footer-col li { font-size: 13px; }
    .lp-footer-col h4 { font-size: 12px; }
  }
  @media (max-width: 768px) {
    .lp-header-inner { padding: 10px 16px; }
    .lp-logo { font-size: 16px; }
    .lp-nav { gap: 2px; }
    .lp-nav-link { padding: 4px 8px; font-size: 12px; }
    .lp-hero { padding: 40px 16px 32px; }
    .lp-hero h1 { font-size: 28px; }
    .lp-hero p { font-size: 15px; margin-top: 12px; }
    .lp-hero-btns { margin-top: 24px; gap: 10px; }
    .lp-btn-primary, .lp-btn-secondary { height: 40px; padding: 0 22px; font-size: 13px; }
    .lp-purpose { padding: 32px 16px 36px; }
    .lp-purpose h2 { font-size: 22px; }
    .lp-purpose p { font-size: 13px; }
    .lp-tools { padding: 16px 16px 32px; }
    .lp-tools-grid { grid-template-columns: 1fr; gap: 28px; }
    .lp-tool-img { border-radius: 10px; }
    .lp-tool-title { font-size: 18px; margin-top: 14px; }
    .lp-tool-desc { font-size: 13px; }
    .lp-steps { margin-top: 36px; }
    .lp-step-content { width: 100px; }
    .lp-step-circle { width: 38px; height: 38px; font-size: 14px; margin-bottom: 8px; }
    .lp-step-label { font-size: 11px; }
    .lp-step-line { width: 24px; margin-top: -14px; }
    .lp-pricing { padding: 40px 16px 48px; }
    .lp-pricing-header { margin-bottom: 28px; }
    .lp-pricing-header h2 { font-size: 24px; }
    .lp-pricing-header p { font-size: 15px; }
    .lp-pricing-section-title { font-size: 16px; margin-bottom: 18px; margin-top: 32px; }
    .lp-pricing-grid { grid-template-columns: 1fr; gap: 14px; margin-bottom: 24px; }
    .lp-price-card { padding: 22px 18px 20px; border-radius: 12px; }
    .lp-price-card-title { font-size: 12px; }
    .lp-price-card-amount { font-size: 28px; }
    .lp-price-card-features li { font-size: 13px; }
    .lp-buy-btn { height: 42px; font-size: 13px; }
    .lp-testimonials { padding: 0 16px 48px; }
    .lp-footer { padding: 32px 16px 28px; }
    .lp-footer-inner { grid-template-columns: 1fr 1fr; gap: 28px; }
    .lp-footer-col h4 { font-size: 11px; margin-bottom: 10px; }
    .lp-footer-col li { font-size: 13px; margin-bottom: 8px; }
  }
  @media (max-width: 480px) {
    .lp-header-inner { padding: 8px 12px; }
    .lp-logo { font-size: 14px; }
    .lp-nav-link { padding: 3px 6px; font-size: 11px; }
    .lp-hero { padding: 28px 12px 24px; }
    .lp-hero h1 { font-size: 22px; line-height: 1.2; }
    .lp-hero p { font-size: 13px; margin-top: 8px; }
    .lp-hero-btns { margin-top: 18px; gap: 8px; flex-direction: column; align-items: center; }
    .lp-btn-primary, .lp-btn-secondary { height: 38px; padding: 0 20px; font-size: 12px; width: 100%; max-width: 260px; }
    .lp-purpose { padding: 24px 12px 28px; }
    .lp-purpose h2 { font-size: 18px; }
    .lp-purpose p { font-size: 12px; line-height: 1.6; }
    .lp-tools { padding: 12px 12px 24px; }
    .lp-tools-grid { gap: 20px; }
    .lp-tool-img { border-radius: 8px; }
    .lp-tool-title { font-size: 16px; margin-top: 10px; margin-bottom: 4px; }
    .lp-tool-desc { font-size: 12px; }
    .lp-steps { margin-top: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; justify-items: center; }
    .lp-step-item { flex-direction: column; }
    .lp-step-content { width: auto; }
    .lp-step-circle { width: 36px; height: 36px; font-size: 14px; margin-bottom: 6px; }
    .lp-step-label { font-size: 11px; }
    .lp-step-line { display: none; }
    .lp-pricing { padding: 28px 12px 36px; }
    .lp-pricing-header { margin-bottom: 20px; }
    .lp-pricing-header h2 { font-size: 20px; }
    .lp-pricing-header p { font-size: 13px; }
    .lp-pricing-section-title { font-size: 15px; margin-bottom: 16px; margin-top: 24px; }
    .lp-pricing-grid { gap: 10px; margin-bottom: 16px; }
    .lp-price-card { padding: 18px 14px 16px; border-radius: 10px; }
    .lp-price-card-title { font-size: 11px; }
    .lp-price-card-amount { font-size: 24px; }
    .lp-price-card-features li { font-size: 12px; gap: 6px; margin-bottom: 6px; }
    .lp-price-card-features .check-icon { width: 14px; height: 14px; }
    .lp-buy-btn { height: 38px; font-size: 12px; padding: 0 16px; }
    .lp-testimonials { padding: 0 12px 36px; }
    .lp-footer { padding: 24px 12px 20px; }
    .lp-footer-inner { grid-template-columns: 1fr; gap: 20px; }
    .lp-footer-col h4 { font-size: 11px; margin-bottom: 8px; }
    .lp-footer-col li { font-size: 12px; margin-bottom: 6px; }
  }
`

const passthroughImageLoader = ({ src }: ImageLoaderProps) => src

type Props = {
  content: LandingPageContent
  pricing: PricingConfig
}

export function LandingPageClient({ content, pricing }: Props) {
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const renderPricingAction = (plan: PricingPlan) => {
    if (plan.action.type === 'buy' && plan.action.priceId && plan.action.toolId && plan.action.checkoutApiUrl) {
      return (
        <BuyCreditsButton
          priceId={plan.action.priceId}
          creditCountHint={plan.action.creditCountHint}
          toolId={plan.action.toolId}
          label={plan.action.label}
          className="lp-buy-btn"
          checkoutApiUrl={plan.action.checkoutApiUrl}
        />
      )
    }

    if (plan.action.type === 'quote' && plan.action.planId) {
      return <RequestQuoteButton planId={plan.action.planId} label={plan.action.label} className="lp-buy-btn" />
    }

    return null
  }

  const renderLink = (
    label: string,
    href: string,
    className?: string,
    muted?: boolean,
    faint?: boolean,
    onClick?: React.MouseEventHandler<HTMLAnchorElement>
  ) => {
    const spanClassName = muted ? 'muted' : faint ? 'faint' : undefined

    if (muted || faint) {
      return (
        <span className={spanClassName}>
          {label}
        </span>
      )
    }

    return (
      <a href={href} className={className} onClick={onClick}>
        {label}
      </a>
    )
  }

  const buildToolHref = (infoHref?: string) => {
    if (!infoHref) return undefined
    return infoHref.replace(/\/info\/?$/, '/unlock')
  }

  return (
    <div className="lp">
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />

      <header className="lp-header">
        <div className="lp-header-inner">
          <span className="lp-logo">
            <span className="lp-logo-blue">IATF</span>{' '}
            <span className="lp-logo-black">Solutions</span>
          </span>
          <nav className="lp-nav">
            <a href="#tools" onClick={(e) => handleScroll(e, 'tools')} className="lp-nav-link">
              {content.nav.tools}
            </a>
            <a href="#pricing" onClick={(e) => handleScroll(e, 'pricing')} className="lp-nav-link">
              {content.nav.pricing}
            </a>
            <a href="#about" onClick={(e) => handleScroll(e, 'about')} className="lp-nav-link">
              {content.nav.about}
            </a>
            <div style={{ marginLeft: 6 }}>
              <LanguageToggle />
            </div>
          </nav>
        </div>
      </header>

      <main>
        <section className="lp-hero">
          <h1>
            {content.hero.title}{' '}
            <span className="italic" style={{ color: content.hero.highlightColor || '#2563eb' }}>
              {content.hero.highlight}
            </span>
          </h1>
          <p>{content.hero.subtitle}</p>
          <div className="lp-hero-btns">
            <a
              href={content.hero.primaryButton.href}
              onClick={content.hero.primaryButton.href.startsWith('#') ? (e) => handleScroll(e, content.hero.primaryButton.href.slice(1)) : undefined}
              className={content.hero.primaryButton.variant === 'secondary' ? 'lp-btn-secondary' : 'lp-btn-primary'}
            >
              {content.hero.primaryButton.label}
            </a>
            <a
              href={content.hero.secondaryButton.href}
              onClick={content.hero.secondaryButton.href.startsWith('#') ? (e) => handleScroll(e, content.hero.secondaryButton.href.slice(1)) : undefined}
              className={content.hero.secondaryButton.variant === 'secondary' ? 'lp-btn-secondary' : 'lp-btn-primary'}
            >
              {content.hero.secondaryButton.label}
            </a>
          </div>
        </section>

        <section id="about" className="lp-purpose">
          <h2>{content.about.title}</h2>
          <p>{content.about.description}</p>
        </section>

        <section id="tools" className="lp-tools">
          <div className="lp-tools-grid">
            {content.features.items.map((feature) => {
              const infoHref = feature.cta?.href
              const toolHref = buildToolHref(infoHref)
              const infoLabel = content.features.infoLabel || 'Info'

              return (
                <div key={feature.title} className="lp-tool-card">
                  {toolHref ? (
                    <a href={toolHref} className="lp-tool-img lp-tool-img-link" aria-label={`Open ${feature.title}`}>
                      <Image
                        loader={passthroughImageLoader}
                        unoptimized
                        src={feature.imageUrl}
                        alt={feature.imageAlt}
                        width={800}
                        height={500}
                      />
                    </a>
                  ) : (
                    <div className="lp-tool-img">
                      <Image
                        loader={passthroughImageLoader}
                        unoptimized
                        src={feature.imageUrl}
                        alt={feature.imageAlt}
                        width={800}
                        height={500}
                      />
                    </div>
                  )}
                  <h3 className="lp-tool-title">{feature.title}</h3>
                  <p className="lp-tool-desc">{feature.description}</p>
                  {feature.cta ? (
                    <div className="lp-tool-actions">
                      {infoHref ? (
                        <a href={infoHref} className="lp-btn-secondary">
                          {infoLabel}
                        </a>
                      ) : null}
                      {feature.cta.disabled ? (
                        <button type="button" className="lp-btn-secondary" disabled>
                          {feature.cta.label}
                        </button>
                      ) : (
                        <a
                          href={toolHref || feature.cta.href}
                          className={feature.cta.variant === 'secondary' ? 'lp-btn-secondary' : 'lp-btn-primary'}
                        >
                          {feature.cta.label}
                        </a>
                      )}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>

          <div className="lp-steps">
            {content.features.steps.map((step, i) => (
              <div key={`${step.number}-${step.label}`} className="lp-step-item">
                <div className="lp-step-content">
                  <div className="lp-step-circle">{step.number}</div>
                  {step.href ? (
                    <a href={step.href} className="lp-step-label">{step.label}</a>
                  ) : (
                    <span className="lp-step-label">{step.label}</span>
                  )}
                </div>
                {i < content.features.steps.length - 1 && <div className="lp-step-line" />}
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="lp-pricing">
          <div className="lp-pricing-header">
            <h2>{pricing.title}</h2>
            <p>{pricing.subtitle}</p>
          </div>

          <h3 className="lp-pricing-section-title">8D Report</h3>
          <div className="lp-pricing-grid">
            {pricing.eightDPlans.map((plan) => (
              <div key={plan.key} className="lp-price-card">
                <p className="lp-price-card-title">{plan.title}</p>
                <p className="lp-price-card-amount">{plan.price}</p>
                <ul className="lp-price-card-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check className="check-icon" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="lp-price-card-btn">{renderPricingAction(plan)}</div>
              </div>
            ))}
          </div>

          <h3 className="lp-pricing-section-title">CSR Matrix</h3>
          <div className="lp-pricing-grid">
            {pricing.csrPlans.map((plan) => (
              <div key={plan.key} className="lp-price-card">
                <p className="lp-price-card-title">{plan.title}</p>
                <p className="lp-price-card-amount">{plan.price}</p>
                <ul className="lp-price-card-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check className="check-icon" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="lp-price-card-btn">{renderPricingAction(plan)}</div>
              </div>
            ))}
          </div>

          <h3 className="lp-pricing-section-title">FMEA Reviewer</h3>
          <div className="lp-pricing-grid">
            {pricing.fmeaPlans.map((plan) => (
              <div key={plan.key} className="lp-price-card">
                <p className="lp-price-card-title">{plan.title}</p>
                <p className="lp-price-card-amount">{plan.price}</p>
                <ul className="lp-price-card-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check className="check-icon" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="lp-price-card-btn">{renderPricingAction(plan)}</div>
              </div>
            ))}
          </div>
        </section>

        {content.testimonials.items.length ? (
          <section className="lp-testimonials">
            <h2>{content.testimonials.title}</h2>
            <div className="lp-testimonials-grid">
              {content.testimonials.items.map((item) => (
                <article key={`${item.author}-${item.quote}`} className="lp-testimonial-card">
                  <p className="lp-testimonial-quote">“{item.quote}”</p>
                  <p className="lp-testimonial-author">{item.author}</p>
                  {item.role ? <p className="lp-testimonial-role">{item.role}</p> : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-col">
            <span className="lp-logo">
              <span className="lp-logo-blue">IATF</span>{' '}
              <span className="lp-logo-black">Solutions</span>
            </span>
          </div>

          <div className="lp-footer-col">
            <h4>{content.footer.legal.title}</h4>
            <ul>
              {content.footer.legal.links.map((link) => (
                <li key={`${link.label}-${link.href}`}>
                  {renderLink(link.label, link.href, undefined, link.muted, link.faint)}
                </li>
              ))}
            </ul>
          </div>

          <div className="lp-footer-col">
            <h4>{content.footer.about.title}</h4>
            <ul>
              {content.footer.about.links.map((link) => (
                <li key={`${link.label}-${link.href}`}>
                  {renderLink(link.label, link.href, undefined, link.muted, link.faint)}
                </li>
              ))}
            </ul>
          </div>

          <div className="lp-footer-col">
            <h4>{content.footer.tools.title}</h4>
            <ul>
              {content.footer.tools.links.map((link) => (
                <li key={`${link.label}-${link.href}`}>
                  {link.href === '#tools' && !link.muted && !link.faint
                    ? renderLink(link.label, link.href, undefined, link.muted, link.faint, (e) => handleScroll(e, 'tools'))
                    : renderLink(link.label, link.href, undefined, link.muted, link.faint)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}
