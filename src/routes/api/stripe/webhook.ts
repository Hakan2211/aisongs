import { createFileRoute } from '@tanstack/react-router'
import { handleWebhook } from '../../../lib/stripe.server'

export const Route = createFileRoute('/api/stripe/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const rawBody = await request.text()
          const signature = request.headers.get('stripe-signature')

          if (!signature) {
            return new Response(
              JSON.stringify({ error: 'Missing stripe-signature header' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } },
            )
          }

          const result = await handleWebhook(rawBody, signature)

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('[Stripe Webhook] Error:', error)
          return new Response(
            JSON.stringify({
              error:
                error instanceof Error
                  ? error.message
                  : 'Webhook handler failed',
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          )
        }
      },
    },
  },
})
