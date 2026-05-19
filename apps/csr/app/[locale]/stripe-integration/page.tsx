'use client'

import { useTranslations } from 'next-intl'
import { LanguageToggle } from '@/components/language-toggle'
import { BuyCreditsButton } from '@/components/BuyCreditsButton'

const PLANS = [
  { id: 'price_8d_single_placeholder', credits: 1, title: 'Single Report', price: '€39', desc: 'Perfect for one-off nonconformities and ad-hoc troubleshooting.', popular: false },
  { id: 'price_8d_5pack_placeholder', credits: 5, title: '5 Reports Pack', price: '€169', desc: 'Save with the 5-pack. Great for active teams.', popular: true },
  { id: 'price_8d_20pack_placeholder', credits: 20, title: '20 Reports Pack', price: '€249', desc: 'Ultimate value for heavy industrial usage and tier-1 suppliers.', popular: false },
]

export default function StripeIntegrationPage() {
  const tApp = useTranslations('app')

  return (
    <main className="flex min-h-screen flex-col items-center bg-neutral-50 px-4">
      <div className="absolute right-4 top-4">
        <LanguageToggle />
      </div>

      <div className="mb-8 text-center max-w-2xl mx-auto pt-24">
        <p className="text-sm font-medium uppercase tracking-widest text-neutral-400">
          {tApp('brand')}
        </p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-neutral-900">
          Stripe Integration
        </h1>
        <p className="mt-4 text-neutral-500 text-lg">
          Select a credit package below to securely purchase generation tokens via Stripe Checkout.
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mt-4 mb-24 px-4">
        {PLANS.map((plan) => (
          <div key={plan.id} className={`relative flex flex-col p-8 rounded-3xl border bg-white shadow-sm transition-all duration-300 hover:shadow-xl ${plan.popular ? 'border-primary ring-2 ring-primary/20 shadow-md md:-translate-y-4 z-10' : 'border-neutral-200'}`}>
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full shadow-sm">
                Most Popular
              </span>
            )}
            <h3 className="text-2xl font-bold text-neutral-900">{plan.title}</h3>
            <p className="text-base text-neutral-500 mt-3 flex-grow">{plan.desc}</p>
            <div className="my-8">
              <span className="text-5xl font-extrabold text-neutral-900">{plan.price}</span>
            </div>
            <div className="mt-auto">
              <BuyCreditsButton 
                priceId={plan.id} 
                toolId="tool_8d" 
                label={`Buy ${plan.credits} Credit${plan.credits > 1 ? 's' : ''}`} 
                className={plan.popular ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md text-lg py-6' : 'py-6 text-lg'}
              />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
