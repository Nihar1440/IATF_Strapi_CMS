'use client'

import { useEffect, useMemo, useState } from 'react'

type FulfillmentState = 'idle' | 'processing' | 'done' | 'error'

export default function CheckoutFulfillmentClient({ sessionId }: { sessionId?: string }) {
  const [state, setState] = useState<FulfillmentState>('idle')
  const [errorText, setErrorText] = useState('')

  const canFulfill = useMemo(() => Boolean(sessionId), [sessionId])

  useEffect(() => {
    if (!canFulfill || state !== 'idle') return

    let cancelled = false

    async function run() {
      setState('processing')

      try {
        const response = await fetch('/api/checkout/fulfill-session', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        })

        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          if (body?.code === 'EMAIL_PROVIDER_TESTING_MODE') {
            throw new Error(
              'Email provider is in testing mode. Verify your sending domain in Resend and set CREDIT_DELIVERY_EMAIL_FROM to that domain.',
            )
          }
          throw new Error(body?.error || 'Unable to finalize checkout')
        }

        if (!cancelled) {
          setState('done')
        }
      } catch (error) {
        if (!cancelled) {
          setErrorText(error instanceof Error ? error.message : 'Unable to finalize checkout')
          setState('error')
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [canFulfill, sessionId, state])

  if (!canFulfill) {
    return (
      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
        Missing checkout session id. If payment was completed, contact support with your payment receipt.
      </p>
    )
  }

  if (state === 'processing' || state === 'idle') {
    return (
      <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-md p-3">
        Finalizing your purchase and sending your credit code email...
      </p>
    )
  }

  if (state === 'done') {
    return (
      <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
        Your purchase is confirmed. Your credit code email should arrive shortly.
      </p>
    )
  }

  return (
    <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
      We could not finalize your credit delivery automatically: {errorText}. Please contact support.
    </p>
  )
}
