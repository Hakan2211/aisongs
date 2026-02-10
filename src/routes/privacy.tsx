import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { LandingHeader, LandingFooter } from '@/components/landing'

const getAuthStatusFn = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const { getRequest } = await import('@tanstack/start-server-core')
    const { auth } = await import('@/lib/auth')
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    return { isLoggedIn: !!session?.user }
  } catch {
    return { isLoggedIn: false }
  }
})

export const Route = createFileRoute('/privacy')({
  loader: async () => {
    return await getAuthStatusFn()
  },
  component: PrivacyPage,
  head: () => ({
    meta: [{ title: 'Privacy Policy - Songlar' }],
  }),
})

function PrivacyPage() {
  const { isLoggedIn } = Route.useLoaderData()

  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader isLoggedIn={isLoggedIn} />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground mb-12">
            Last updated: February 10, 2026
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <Section title="1. Introduction">
              <p>
                Songlar ("we", "us", or "our") operates the Songlar web
                application (songlar.com). This Privacy Policy explains how we
                collect, use, and protect your personal information when you use
                our service.
              </p>
              <p>
                By using Songlar, you agree to the collection and use of
                information in accordance with this policy.
              </p>
            </Section>

            <Section title="2. Information We Collect">
              <h4 className="font-semibold mt-4 mb-2">Account Information</h4>
              <p>
                When you create an account, we collect your email address and
                name. If you sign up via Google OAuth, we receive your basic
                profile information from Google.
              </p>

              <h4 className="font-semibold mt-4 mb-2">API Keys</h4>
              <p>
                Songlar uses a Bring Your Own Key (BYOK) model. You provide your
                own API keys for third-party services such as fal.ai, MiniMax,
                Replicate, and Bunny CDN. These keys are encrypted using
                AES-256-GCM encryption before being stored in our database. We
                never transmit your API keys to any party other than the
                respective service provider for which the key was issued.
              </p>

              <h4 className="font-semibold mt-4 mb-2">Generated Content</h4>
              <p>
                We store metadata about the music tracks and voice clones you
                create (such as titles, prompts, and generation parameters).
                Audio files are stored either temporarily on our servers or on
                Bunny CDN if you choose to save them permanently using your own
                CDN key.
              </p>

              <h4 className="font-semibold mt-4 mb-2">Payment Information</h4>
              <p>
                Payments are processed by Stripe. We do not store your credit
                card details. We retain your Stripe customer ID and transaction
                records for billing purposes.
              </p>
            </Section>

            <Section title="3. How We Use Your Information">
              <ul className="list-disc pl-6 space-y-2">
                <li>To provide and maintain the Songlar service</li>
                <li>To authenticate your account and manage your session</li>
                <li>
                  To securely relay your API keys to third-party AI providers on
                  your behalf
                </li>
                <li>To process payments and manage your platform access</li>
                <li>
                  To communicate service updates or respond to support requests
                </li>
              </ul>
            </Section>

            <Section title="4. Third-Party Services">
              <p>
                When you generate music or clone voices, your requests are sent
                to third-party AI services using your own API keys. These
                services have their own privacy policies:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>fal.ai</strong> &mdash; AI model hosting and inference
                </li>
                <li>
                  <strong>MiniMax</strong> &mdash; Music generation
                </li>
                <li>
                  <strong>Replicate</strong> &mdash; Voice model training
                </li>
                <li>
                  <strong>Bunny CDN</strong> &mdash; Audio file storage
                </li>
                <li>
                  <strong>Stripe</strong> &mdash; Payment processing
                </li>
                <li>
                  <strong>Google</strong> &mdash; OAuth authentication
                  (optional)
                </li>
              </ul>
              <p>
                We encourage you to review the privacy policies of these
                services. Since you use your own API keys, your usage of these
                services is also governed by your own agreements with them.
              </p>
            </Section>

            <Section title="5. Data Security">
              <p>
                We take data security seriously. Your API keys are encrypted at
                rest using AES-256-GCM encryption with a unique initialization
                vector for each key. Authentication sessions are managed
                securely, and all traffic is served over HTTPS.
              </p>
              <p>
                However, no method of electronic storage is 100% secure. While
                we strive to use commercially acceptable means to protect your
                data, we cannot guarantee absolute security.
              </p>
            </Section>

            <Section title="6. Data Retention">
              <p>
                We retain your account information and generated content for as
                long as your account is active. You can delete your API keys at
                any time from the Settings page. If you wish to delete your
                account entirely, please contact us.
              </p>
            </Section>

            <Section title="7. Your Rights">
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account and associated data</li>
                <li>Export your data in a portable format</li>
                <li>Withdraw consent for optional data processing</li>
              </ul>
              <p>
                To exercise any of these rights, please contact us at the email
                address listed below.
              </p>
            </Section>

            <Section title="8. Cookies">
              <p>
                We use essential cookies for authentication and session
                management. We do not use tracking cookies or third-party
                analytics services.
              </p>
            </Section>

            <Section title="9. Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by updating the "Last updated" date at
                the top of this page.
              </p>
            </Section>

            <Section title="10. Contact">
              <p>
                If you have any questions about this Privacy Policy, please
                contact us at{' '}
                <a
                  href="mailto:support@songlar.com"
                  className="text-foreground underline underline-offset-4 hover:text-foreground/80"
                >
                  support@songlar.com
                </a>
                .
              </p>
            </Section>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <div className="text-muted-foreground space-y-3 leading-relaxed">
        {children}
      </div>
    </section>
  )
}
