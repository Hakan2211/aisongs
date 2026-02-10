import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  createBillingPortalSession,
  createCheckoutSession,
  getPlatformAccessStatus,
} from '../lib/stripe.server'
import { authMiddleware } from './middleware'

/**
 * Create Stripe Checkout Session (One-Time Payment — EUR 199 Lifetime Access)
 */
const checkoutSchema = z.object({
  priceId: z.string().optional(),
})

export const createCheckoutFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(checkoutSchema)
  .handler(async ({ data, context }) => {
    const priceId =
      data.priceId ||
      process.env.STRIPE_LIFETIME_PRICE_ID ||
      process.env.STRIPE_PRICE_ID ||
      'price_default'
    const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000'

    const result = await createCheckoutSession(
      context.user.id,
      priceId,
      `${baseUrl}/music?success=true`,
      `${baseUrl}/?canceled=true`,
    )

    return result
  })

/**
 * Get current user's platform access status
 */
export const getPlatformAccessFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const status = await getPlatformAccessStatus(context.user.id)
    return status
  })

/**
 * Create Stripe Billing Portal Session (for payment history / receipts)
 */
export const createBillingPortalFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000'

    const result = await createBillingPortalSession(
      context.user.id,
      `${baseUrl}/profile`,
    )

    return result
  })
