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

export const Route = createFileRoute('/terms')({
  loader: async () => {
    return await getAuthStatusFn()
  },
  component: TermsPage,
  head: () => ({
    meta: [{ title: 'Terms of Service - Songlar' }],
  }),
})

function TermsPage() {
  const { isLoggedIn } = Route.useLoaderData()

  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader isLoggedIn={isLoggedIn} />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Terms of Service
          </h1>
          <p className="text-muted-foreground mb-12">
            Last updated: February 10, 2026
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <Section title="1. Acceptance of Terms">
              <p>
                By accessing or using Songlar ("the Service"), you agree to be
                bound by these Terms of Service. If you do not agree to these
                terms, do not use the Service.
              </p>
            </Section>

            <Section title="2. Description of Service">
              <p>
                Songlar is a web-based platform that enables users to generate
                AI music and clone voices using their own API keys (Bring Your
                Own Key model). The Service provides a user interface for
                interacting with third-party AI providers including fal.ai,
                MiniMax, Replicate, and others.
              </p>
              <p>
                We do not provide AI inference directly. The Service acts as an
                interface between you and the third-party providers you choose
                to use with your own API keys.
              </p>
            </Section>

            <Section title="3. Account Registration">
              <p>
                To use the Service, you must create an account with a valid
                email address. You are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Maintaining the confidentiality of your account credentials
                </li>
                <li>All activity that occurs under your account</li>
                <li>
                  Providing accurate and complete registration information
                </li>
              </ul>
            </Section>

            <Section title="4. API Keys and BYOK Model">
              <p>
                Songlar operates on a Bring Your Own Key (BYOK) model. You are
                responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Obtaining and maintaining your own API keys from third-party
                  providers
                </li>
                <li>
                  Complying with the terms of service of each third-party
                  provider
                </li>
                <li>
                  Any costs incurred through the use of your API keys on
                  third-party services
                </li>
                <li>
                  Keeping your API keys secure and not sharing them with others
                </li>
              </ul>
              <p>
                While we encrypt your API keys at rest, we are not liable for
                any unauthorized use of your keys that occurs outside our
                platform.
              </p>
            </Section>

            <Section title="5. Payment and Platform Access">
              <p>
                Access to Songlar requires a one-time payment. Upon successful
                payment, you receive lifetime access to the platform. This
                includes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access to all current features of the platform</li>
                <li>Access to future updates and improvements</li>
                <li>No recurring subscription fees</li>
              </ul>
              <p>
                Payments are processed by Stripe. All prices are listed in EUR.
                Refund requests are handled on a case-by-case basis within 14
                days of purchase, in accordance with applicable consumer
                protection laws.
              </p>
            </Section>

            <Section title="6. Acceptable Use">
              <p>You agree not to use the Service to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Generate content that infringes on copyrights, trademarks, or
                  other intellectual property rights
                </li>
                <li>
                  Create deepfakes or voice clones of individuals without their
                  explicit consent
                </li>
                <li>
                  Produce content that is illegal, harmful, threatening,
                  abusive, defamatory, or otherwise objectionable
                </li>
                <li>
                  Attempt to reverse-engineer, decompile, or disassemble the
                  Service
                </li>
                <li>Circumvent any security measures or access controls</li>
                <li>Use the Service for any fraudulent or deceptive purpose</li>
                <li>
                  Resell or redistribute access to the platform without
                  authorization
                </li>
              </ul>
            </Section>

            <Section title="7. Intellectual Property">
              <h4 className="font-semibold mt-4 mb-2">Your Content</h4>
              <p>
                You retain ownership of the music, voice clones, and other
                content you create using the Service. However, your rights to
                the generated content are also subject to the terms of the
                third-party AI providers whose models were used in the
                generation process.
              </p>

              <h4 className="font-semibold mt-4 mb-2">Our Platform</h4>
              <p>
                The Songlar platform, including its design, code, and branding,
                is our proprietary property. You may not copy, reproduce, or
                distribute any part of the platform without our written consent.
              </p>
            </Section>

            <Section title="8. Disclaimers">
              <p>
                The Service is provided "as is" and "as available" without
                warranties of any kind, whether express or implied. We do not
                guarantee:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  The quality, accuracy, or reliability of AI-generated content
                </li>
                <li>Uninterrupted or error-free operation of the Service</li>
                <li>
                  The availability or performance of third-party AI services
                </li>
                <li>
                  That generated content will be free from intellectual property
                  claims
                </li>
              </ul>
            </Section>

            <Section title="9. Limitation of Liability">
              <p>
                To the maximum extent permitted by law, Songlar shall not be
                liable for any indirect, incidental, special, consequential, or
                punitive damages, including but not limited to loss of profits,
                data, or use, arising from your use of the Service.
              </p>
              <p>
                Our total liability for any claims arising from or related to
                the Service shall not exceed the amount you paid for platform
                access.
              </p>
            </Section>

            <Section title="10. Third-Party Services">
              <p>
                The Service integrates with third-party providers. We are not
                responsible for the availability, performance, or policies of
                these services. Your use of third-party services through our
                platform is governed by your own agreements with those
                providers.
              </p>
            </Section>

            <Section title="11. Termination">
              <p>
                We reserve the right to suspend or terminate your account if you
                violate these Terms of Service. In the event of termination for
                a violation:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your access to the platform will be revoked</li>
                <li>
                  Your stored data may be deleted after a reasonable notice
                  period
                </li>
                <li>
                  No refund will be provided for violations of acceptable use
                </li>
              </ul>
              <p>
                You may request account deletion at any time by contacting us.
              </p>
            </Section>

            <Section title="12. Changes to Terms">
              <p>
                We may update these Terms of Service from time to time. We will
                notify registered users of material changes via email or through
                the platform. Continued use of the Service after changes
                constitutes acceptance of the updated terms.
              </p>
            </Section>

            <Section title="13. Governing Law">
              <p>
                These Terms of Service shall be governed by and construed in
                accordance with the laws of the applicable jurisdiction. Any
                disputes arising from these terms shall be resolved in the
                courts of the applicable jurisdiction.
              </p>
            </Section>

            <Section title="14. Contact">
              <p>
                If you have any questions about these Terms of Service, please
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
