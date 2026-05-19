'use client'

import { useState, useEffect } from 'react'
import { Button } from './button'
import { Loader2 } from 'lucide-react'
import { cn } from './lib/utils'
import { useLocale } from 'next-intl'

interface Props {
  priceId?: string
  planId?: string
  creditCountHint?: number
  toolId?: string
  label: string
  className?: string
  /** Override the checkout API URL. Defaults to /api/billing/checkout-session (relative).
   *  Set to the target tool's full URL when purchasing from a different app (e.g. the landing page). */
  checkoutApiUrl?: string
}

export function BuyCreditsButton({ priceId, planId, creditCountHint, toolId = 'tool_8d', label, className, checkoutApiUrl }: Props) {
  const [loading, setLoading] = useState(false)
  const locale = useLocale()

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setLoading(false)
    }
    const handleFocus = () => setLoading(false)
    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  async function handleClick() {
    setLoading(true)
    try {
      const apiUrl = checkoutApiUrl
        ?? (process.env.NEXT_PUBLIC_TOOL_URL ? `${process.env.NEXT_PUBLIC_TOOL_URL}/api/billing/checkout-session` : '/api/billing/checkout-session')

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, planId, creditCountHint, toolId, locale }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to create checkout session')
      }

      const { url } = payload
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      alert(message)
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      variant={className ? "default" : "outline"}
      className={cn("w-full transition-all", className || "mt-2 border-dashed border-2 bg-neutral-50 hover:bg-neutral-100")}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Redirecting to payment...
        </>
      ) : label}
    </Button>
  )
}
