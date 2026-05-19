import { Resend } from 'resend'
import { listIntegratedTools } from '@/lib/billing/store'
import { getRedis } from '@/lib/redis/client'

const MAX_EMAIL_RETRIES = 3
const RETRY_BASE_DELAY_MS = 1000 // 1s, 2s, 4s exponential backoff

/**
 * Log an email delivery attempt to Redis for support traceability.
 * Key: `email_log:{to}:{timestamp}` — TTL 90 days.
 */
async function logEmailDelivery(entry: {
  to: string
  toolId?: string
  codeCount: number
  resendId?: string
  status: 'sent' | 'failed'
  error?: string
  attempt: number
}) {
  try {
    const redis = getRedis()
    const key = `email_log:${entry.to}:${Date.now()}`
    await redis.set(key, { ...entry, timestamp: new Date().toISOString() }, { ex: 60 * 60 * 24 * 90 })
  } catch (logErr) {
    // Never let logging failures break the main flow
    console.error('[email] Failed to write delivery log:', logErr instanceof Error ? logErr.message : logErr)
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function sendCreditDeliveryEmail({ to, toolId, codes }: { to: string, toolId?: string, codes: string[] }) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const resend = new Resend(resendApiKey)

  const tools = await listIntegratedTools()
  const activeTool = toolId ? tools.find(t => t.id === toolId) : undefined
  const toolName = activeTool?.name || 'IATF Solutions'

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_EMAIL_RETRIES; attempt++) {
    try {
      console.log(`[email] Attempt ${attempt}/${MAX_EMAIL_RETRIES} — sending to ${to} with ${codes.length} code(s)`)

      const { data, error } = await resend.emails.send({
        from: process.env.CREDIT_DELIVERY_EMAIL_FROM || (() => { throw new Error('CREDIT_DELIVERY_EMAIL_FROM is not configured') })(),
        to,
        subject: `Your Credit Code(s) - ${toolName}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Thank you for your purchase of ${toolName}!</h2>
            <p>Your payment was successful. Here are your purchased credit codes:</p>
            <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <ul style="list-style-type: none; padding: 0;">
                ${codes.map(c => `<li style="font-size: 18px; font-weight: bold; letter-spacing: 2px; margin-bottom: 10px; font-family: monospace;">${c}</li>`).join('')}
              </ul>
            </div>
            <p>You can redeem them by entering them on the application unlock page.</p>
            <p>Need help? Reply to this email.</p>
          </div>
        `,
      })

      if (error) {
        throw new Error(`Resend API Error: ${error.message || 'Unknown email provider error'}`)
      }

      console.log('[email] Successfully sent! ID:', data?.id)

      // Log successful delivery
      await logEmailDelivery({
        to,
        toolId,
        codeCount: codes.length,
        resendId: data?.id,
        status: 'sent',
        attempt,
      })

      return // Success — exit
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.error(`[email] Attempt ${attempt}/${MAX_EMAIL_RETRIES} failed:`, lastError.message)

      // Don't retry on non-transient errors (domain verification, validation)
      const isNonRetryable =
        lastError.message.includes('only send testing emails') ||
        lastError.message.includes('validation') ||
        lastError.message.includes('not verified')

      if (isNonRetryable) {
        await logEmailDelivery({
          to,
          toolId,
          codeCount: codes.length,
          status: 'failed',
          error: lastError.message,
          attempt,
        })
        throw lastError
      }

      // Exponential backoff for transient failures
      if (attempt < MAX_EMAIL_RETRIES) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
        console.log(`[email] Retrying in ${delay}ms...`)
        await sleep(delay)
      }
    }
  }

  // All retries exhausted
  await logEmailDelivery({
    to,
    toolId,
    codeCount: codes.length,
    status: 'failed',
    error: lastError?.message || 'Unknown error after all retries',
    attempt: MAX_EMAIL_RETRIES,
  })

  throw lastError || new Error('Email delivery failed after all retries')
}
