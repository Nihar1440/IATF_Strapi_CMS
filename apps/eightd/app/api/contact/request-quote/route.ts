import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { checkRateLimit } from '@/lib/rate-limit/rateLimit'

const PLAN_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/
const LOCALE_RE = /^[a-z]{2}(-[A-Z]{2})?$/

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(req: NextRequest) {
  const allowed = await checkRateLimit(req)
  if (!allowed) {
    return NextResponse.json({ success: false, error: 'Too many attempts. Please wait.' }, { status: 429 })
  }

  try {
    const { planId, locale } = await req.json()

    if (typeof planId !== 'string' || !PLAN_ID_RE.test(planId)) {
      return NextResponse.json({ success: false, error: 'Invalid plan ID.' }, { status: 400 })
    }

    const safePlanId = escapeHtml(planId)
    const safeLocale = typeof locale === 'string' && LOCALE_RE.test(locale) ? escapeHtml(locale) : 'en'

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.error('No RESEND_API_KEY found.')
      return NextResponse.json({ success: false, error: 'Email configuration missing.' }, { status: 500 })
    }

    const resend = new Resend(resendApiKey)
    const fromEmail = process.env.CREDIT_DELIVERY_EMAIL_FROM || 'contact@iatf-solutions.com'
    const toEmail = process.env.ADMIN_EMAIL || 'contact@iatf-solutions.com'

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `New Custom Quote Request for ${safePlanId}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>New Enquiry for Custom Codes</h2>
          <p>A user has requested a custom quote/on-request package for: <strong>${safePlanId}</strong>.</p>
          <p>Language active on site: ${safeLocale}</p>
          <hr />
          <p>Please review and communicate with them shortly.</p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend API Error:', error.message || error)
      return NextResponse.json({ success: false, error: 'Failed to send email.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    console.error('Exception in request-quote API route:', err)
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 })
  }
}
