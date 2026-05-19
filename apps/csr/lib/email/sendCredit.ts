import { Resend } from 'resend'
import { listIntegratedTools } from '@/lib/billing/store'

export async function sendCreditDeliveryEmail({ to, toolId, codes }: { to: string, toolId?: string, codes: string[] }) {
  try {
    console.log(`Attempting to send email to ${to} with ${codes.length} credit code(s).`)
    
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    const resend = new Resend(resendApiKey)

    const tools = await listIntegratedTools()
    const activeTool = toolId ? tools.find(t => t.id === toolId) : undefined
    const toolName = activeTool?.name || 'IATF Solutions'

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
    } else {
      console.log('✅ Email successfully sent! ID:', data?.id)
    }
  } catch (err) {
    console.error('Exception thrown while sending email:', err)
    throw err
  }
}
