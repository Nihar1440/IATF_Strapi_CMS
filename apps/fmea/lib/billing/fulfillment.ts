import { generateCreditCodes } from '@/lib/credits/generate'
import { sendCreditDeliveryEmail } from '@/lib/email/sendCredit'
import {
  clearSessionFulfillmentReservation,
  getSessionDelivery,
  isSessionFulfilled,
  markSessionFulfilled,
  reserveSessionFulfillment,
  saveSessionDelivery,
} from '@/lib/redis/codeStore'

export type FulfillmentStatus = 'fulfilled' | 'already-fulfilled' | 'already-processing'

export interface FulfillCheckoutSessionInput {
  sessionId: string
  email: string
  toolId: string
  planId?: string
  count: number
}

export async function fulfillCheckoutSession(input: FulfillCheckoutSessionInput): Promise<FulfillmentStatus> {
  const alreadyFulfilled = await isSessionFulfilled(input.sessionId)
  if (alreadyFulfilled) {
    return 'already-fulfilled'
  }

  const hasLock = await reserveSessionFulfillment(input.sessionId)
  if (!hasLock) {
    return 'already-processing'
  }

  try {
    const existingDelivery = await getSessionDelivery(input.sessionId)
    const codes = existingDelivery?.codes?.length
      ? existingDelivery.codes
      : await generateCreditCodes({
          toolId: input.toolId,
          planId: input.planId,
          count: input.count,
          sessionId: input.sessionId,
        })

    if (!existingDelivery) {
      await saveSessionDelivery(input.sessionId, {
        email: input.email,
        toolId: input.toolId,
        planId: input.planId,
        count: input.count,
        codes,
      })
    }

    await sendCreditDeliveryEmail({ to: input.email, toolId: input.toolId, codes })
    await markSessionFulfilled(input.sessionId)
    return 'fulfilled'
  } finally {
    await clearSessionFulfillmentReservation(input.sessionId)
  }
}
