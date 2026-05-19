import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import CheckoutFulfillmentClient from './CheckoutFulfillmentClient'
import { getStripeClient } from '@/lib/billing/stripe'
import { listIntegratedTools } from '@/lib/billing/store'

export default async function CheckoutSuccessPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ session_id?: string }>
  params: Promise<{ locale: string }>
}) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([params, searchParams])
  const sessionId = resolvedSearchParams?.session_id

  let unlockHref = `/${locale}/unlock`

  if (sessionId) {
    try {
      const { stripe } = await getStripeClient()
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      const toolId = session.metadata?.toolId || 'tool_csr'

      const tools = await listIntegratedTools()
      const tool = tools.find((t) => t.id === toolId)
      
      if (tool?.baseUrl) {
        const normalizedBase = tool.baseUrl.endsWith('/') ? tool.baseUrl.slice(0, -1) : tool.baseUrl
        unlockHref = `${normalizedBase}/${locale}/unlock`
      } else if (toolId === 'tool_8d') {
        const eightDUrl = process.env.NEXT_PUBLIC_EIGHTD_URL || process.env.EIGHTD_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '')
        unlockHref = eightDUrl ? `${eightDUrl.replace(/\/$/, '')}/${locale}/unlock` : `/${locale}/unlock`
      } else if (toolId === 'tool_csr') {
        const csrUrl = process.env.NEXT_PUBLIC_CSR_URL || process.env.CSR_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3002' : '')
        unlockHref = csrUrl ? `${csrUrl.replace(/\/$/, '')}/${locale}/unlock` : `/${locale}/unlock`
      }
    } catch (e) {
      console.error('Failed to resolve tool unlock URL:', e)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 r-px">
      <Card className="w-full max-w-[calc(100%-2rem)] sm:max-w-lg text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto r-mb flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
          </div>
          <CardTitle className="r-text-2xl font-bold text-gray-900">Payment Successful</CardTitle>
          <CardDescription className="r-mt-sm r-text-base text-gray-600">
            Your credit code(s) are being delivered to your email. This usually takes less than 60 seconds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="r-space-y">
            <CheckoutFulfillmentClient sessionId={sessionId} />
            <p className="r-text-sm text-gray-500">
              Did not receive an email? Check your spam folder or contact support.
            </p>
            <div className="r-mt">
              <Link
                href={unlockHref}
                className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md bg-primary r-px-lg py-2 r-text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                Return to Login / Redeem
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
