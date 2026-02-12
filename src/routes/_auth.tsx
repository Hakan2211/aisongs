import { Link, Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { getSessionFn } from '../server/auth.fn'

/**
 * Auth Layout
 * Centered layout for authentication pages (login, signup)
 * Redirects to music if already authenticated
 */
export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    const session = await getSessionFn()
    if (session?.user) {
      throw redirect({ to: '/music' })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="relative grid min-h-screen place-items-center px-4 py-12">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/40 via-background to-muted/20 pointer-events-none" />

      {/* Back to landing */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="relative z-10 w-full">
        <Outlet />
      </div>
    </div>
  )
}
