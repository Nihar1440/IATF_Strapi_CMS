import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
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

// In-memory sliding window rate limiter (no Redis dependency for landing)
const rateMap = new Map<string, number[]>()
const RATE_WINDOW_MS = 60_000
const RATE_MAX = 5

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = (rateMap.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS)
  if (timestamps.length >= RATE_MAX) return true
  timestamps.push(now)
  rateMap.set(ip, timestamps)
  return false
}

export async function POST(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = forwarded || req.headers.get('x-real-ip') || 'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json({ success: false, error: 'Too many attempts. Please wait.' }, { status: 429 })
  }

  try {
    const { planId, locale, email } = await req.json()

    if (typeof planId !== 'string' || !PLAN_ID_RE.test(planId)) {
      return NextResponse.json({ success: false, error: 'Invalid plan ID.' }, { status: 400 })
    }

    const customerEmail = typeof email === 'string' ? email.trim() : ''
    if (!customerEmail || !EMAIL_REGEX.test(customerEmail)) {
      return NextResponse.json({ success: false, error: 'A valid email address is required.' }, { status: 400 })
    }

    const safePlanId = escapeHtml(planId)
    const safeEmail = escapeHtml(customerEmail)
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
      replyTo: customerEmail,
      subject: `New Custom Quote Request for ${safePlanId}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>New Enquiry for Custom Codes</h2>
          <p>A user has requested a custom quote/on-request package for: <strong>${safePlanId}</strong>.</p>
          <p><strong>Customer Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
          <p>Language active on site: ${safeLocale}</p>
          <hr />
          <p>Reply directly to this email to reach the customer.</p>
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
