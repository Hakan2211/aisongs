import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { Music } from 'lucide-react'
import { getSessionFn } from '../server/auth.fn'
import { useSession } from '../lib/auth-client'
import { AppSidebar } from '../components/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '../components/ui/sidebar'

// Type for the user from Better-Auth session
interface AppUser {
  id: string
  email: string
  name: string | null
  image?: string | null
  emailVerified: boolean
  role?: string
  onboardingComplete?: boolean
}

/**
 * Protected App Layout
 * Requires authentication - redirects to login if not authenticated
 * Redirects to onboarding if user hasn't completed setup
 * Includes sidebar navigation and user dropdown
 */
export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ location }) => {
    const session = await getSessionFn()
    if (!session?.user) {
      throw redirect({ to: '/login' })
    }

    const user = session.user as AppUser

    // Redirect to onboarding if not completed (unless already on onboarding page)
    if (
      !user.onboardingComplete &&
      !location.pathname.includes('/onboarding')
    ) {
      throw redirect({ to: '/onboarding' })
    }

    return { user }
  },
  component: AppLayout,
})

function AppLayout() {
  const routeContext = Route.useRouteContext()
  const { data: session } = useSession()

  // User from session takes precedence, fallback to route context
  const sessionUser = session?.user as AppUser | undefined
  const user = sessionUser ?? routeContext.user

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        {/* Premium Mobile Header */}
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border/50 px-4 md:hidden bg-background/80 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/5">
              <Music className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold tracking-tight">
              AI Music Studio
            </span>
          </div>
        </header>

        {/* Page Content with refined spacing */}
        <main className="flex-1 p-4 md:p-8 lg:p-10">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
