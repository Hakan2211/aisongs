import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {
  CTASection,
  FAQSection,
  FeaturesSection,
  HeroSection,
  HowItWorksSection,
  LandingFooter,
  LandingHeader,
  PricingSection,
  AudioDemosSection,
  UseCasesSection,
} from '@/components/landing'

/**
 * Check if user is logged in (optional — doesn't require auth)
 * Used to show "Go to Studio" instead of "Sign in" / "Get Started"
 */
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

export const Route = createFileRoute('/')({
  loader: async () => {
    const authStatus = await getAuthStatusFn()
    return authStatus
  },
  component: LandingPage,
})

function LandingPage() {
  const { isLoggedIn } = Route.useLoaderData()

  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader isLoggedIn={isLoggedIn} />
      <main className="flex-1">
        <HeroSection isLoggedIn={isLoggedIn} />
        <FeaturesSection />
        <AudioDemosSection />
        <HowItWorksSection />
        <UseCasesSection />
        <PricingSection isLoggedIn={isLoggedIn} />
        <FAQSection />
        <CTASection isLoggedIn={isLoggedIn} />
      </main>
      <LandingFooter />
    </div>
  )
}
