import Stripe from 'stripe'
import { prisma } from '../db'

/**
 * Stripe Adapter — One-Time Payment (EUR 199 Lifetime Access)
 *
 * - When MOCK_PAYMENTS=true or no STRIPE_SECRET_KEY, returns mock responses
 * - Uses mode: 'payment' for a single one-time charge
 * - Gates access via the `hasPlatformAccess` boolean on the User model
 */

const MOCK_PAYMENTS = process.env.MOCK_PAYMENTS === 'true'

// Initialize Stripe only if we have a key and not in mock mode
function getStripeClient(): Stripe | null {
  if (MOCK_PAYMENTS) return null
  if (!process.env.STRIPE_SECRET_KEY) return null
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export interface CheckoutResult {
  url: string
}

export interface PlatformAccessStatus {
  hasPlatformAccess: boolean
  purchaseDate: Date | null
}

export async function createCheckoutSession(
  userId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<CheckoutResult> {
  const stripe = getStripeClient()

  if (!stripe) {
    // Mock mode: grant access immediately and redirect to success
    console.log(
      `[MOCK STRIPE] Created one-time checkout for user: ${userId} — granting access`,
    )
    await prisma.user.update({
      where: { id: userId },
      data: {
        hasPlatformAccess: true,
        platformPurchaseDate: new Date(),
        platformStripePaymentId: `mock_payment_${Date.now()}`,
      },
    })
    return { url: `${successUrl}?session_id=mock_session_${Date.now()}` }
  }

  // Get or create Stripe customer
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  let customerId = user.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId },
    })
    customerId = customer.id

    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
  })

  if (!session.url) {
    throw new Error('Failed to create checkout session')
  }

  return { url: session.url }
}

export async function getPlatformAccessStatus(
  userId: string,
): Promise<PlatformAccessStatus> {
  const stripe = getStripeClient()

  if (!stripe) {
    // Mock mode: always return active platform access
    return { hasPlatformAccess: true, purchaseDate: new Date() }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      hasPlatformAccess: true,
      platformPurchaseDate: true,
    },
  })

  return {
    hasPlatformAccess: user?.hasPlatformAccess ?? false,
    purchaseDate: user?.platformPurchaseDate ?? null,
  }
}

export async function handleWebhook(
  payload: string,
  signature: string,
): Promise<{ received: boolean }> {
  const stripe = getStripeClient()

  if (!stripe) {
    console.log('[MOCK STRIPE] Webhook received')
    return { received: true }
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('Stripe webhook secret not configured')
  }

  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET,
  )

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session.metadata?.userId
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            hasPlatformAccess: true,
            platformPurchaseDate: new Date(),
            platformStripePaymentId: session.payment_intent as string | null,
          },
        })

        // Record the purchase event for audit
        await prisma.subscriptionEvent.create({
          data: {
            userId,
            event: 'platform_purchase',
            toTier: 'lifetime',
            stripeEventId: event.id,
            metadata: JSON.stringify({
              amount: session.amount_total,
              currency: session.currency,
              paymentIntent: session.payment_intent,
            }),
          },
        })
      }
      break
    }

    case 'charge.refunded': {
      // Handle refunds — revoke platform access
      const charge = event.data.object as Stripe.Charge
      const paymentIntent =
        typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : charge.payment_intent?.id
      if (paymentIntent) {
        const user = await prisma.user.findFirst({
          where: { platformStripePaymentId: paymentIntent },
        })
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { hasPlatformAccess: false },
          })

          await prisma.subscriptionEvent.create({
            data: {
              userId: user.id,
              event: 'platform_refund',
              fromTier: 'lifetime',
              toTier: null,
              stripeEventId: event.id,
              metadata: JSON.stringify({ paymentIntent }),
            },
          })
        }
      }
      break
    }
  }

  return { received: true }
}

export async function createBillingPortalSession(
  userId: string,
  returnUrl: string,
): Promise<{ url: string }> {
  const stripe = getStripeClient()

  if (!stripe) {
    console.log(`[MOCK STRIPE] Created billing portal for user: ${userId}`)
    return { url: returnUrl }
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.stripeCustomerId) {
    throw new Error('No Stripe customer found for user')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: returnUrl,
  })

  return { url: session.url }
}
