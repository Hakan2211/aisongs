import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
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
      <div className="relative z-10 w-full">
        <Outlet />
      </div>
    </div>
  )
}
