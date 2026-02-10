import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/start-server-core'
import { z } from 'zod'
import { auth } from '../lib/auth'
import { prisma } from '../db'
import { authMiddleware } from './middleware'

/**
 * Get current user session
 */
export const getSessionFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    return session
  },
)

/**
 * Update user profile
 */
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.string().url().optional(),
})

export const updateProfileFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateProfileSchema)
  .handler(async ({ data, context }) => {
    const user = await prisma.user.update({
      where: { id: context.user.id },
      data: {
        name: data.name,
        image: data.image,
      },
    })

    return { success: true, user }
  })

/**
 * Get user by ID (admin only)
 */
const getUserSchema = z.object({ userId: z.string() })

export const getUserFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(getUserSchema)
  .handler(async ({ data, context }) => {
    // Only admins can view other users
    if (context.user.role !== 'admin' && context.user.id !== data.userId) {
      throw new Error('Forbidden')
    }

    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    })

    return user
  })

/**
 * List all users (admin only)
 */
export const listUsersFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (context.user.role !== 'admin') {
      throw new Error('Forbidden: Admins only')
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        subscriptionStatus: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return users
  })

/**
 * Update user role (admin only)
 */
const updateRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(['user', 'admin']),
})

export const updateUserRoleFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateRoleSchema)
  .handler(async ({ data, context }) => {
    if (context.user.role !== 'admin') {
      throw new Error('Forbidden: Admins only')
    }

    // Prevent self-demotion
    if (data.userId === context.user.id && data.role !== 'admin') {
      throw new Error('Cannot demote yourself')
    }

    const user = await prisma.user.update({
      where: { id: data.userId },
      data: { role: data.role },
    })

    return { success: true, user }
  })

/**
 * Check onboarding status directly from DB (bypasses session cookie cache).
 * If the user already has API keys configured, auto-mark them as onboarded
 * so existing users don't get stuck in the onboarding flow.
 */
const checkOnboardingSchema = z.object({
  userId: z.string(),
})

export const checkOnboardingFn = createServerFn({ method: 'GET' })
  .inputValidator(checkOnboardingSchema)
  .handler(async ({ data }) => {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: {
        onboardingComplete: true,
        falApiKey: true,
        minimaxApiKey: true,
      },
    })

    if (!user) {
      return { complete: false }
    }

    // Already marked as complete
    if (user.onboardingComplete) {
      return { complete: true }
    }

    // Auto-complete for existing users who already have API keys
    const hasKeys = !!(user.falApiKey || user.minimaxApiKey)
    if (hasKeys) {
      await prisma.user.update({
        where: { id: data.userId },
        data: { onboardingComplete: true },
      })
      return { complete: true }
    }

    return { complete: false }
  })

/**
 * Complete onboarding — marks user as onboarded
 */
export const completeOnboardingFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await prisma.user.update({
      where: { id: context.user.id },
      data: { onboardingComplete: true },
    })

    return { success: true }
  })
