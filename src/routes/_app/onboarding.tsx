import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Music,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/common'

export const Route = createFileRoute('/_app/onboarding')({
  component: OnboardingPage,
})

function OnboardingPage() {
  const [step, setStep] = useState(0)

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-lg mx-auto">
        {/* Progress indicators */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-primary w-10' : 'bg-muted w-6'
              }`}
            />
          ))}
        </div>

        {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
        {step === 1 && <ApiKeysStep />}
      </div>
    </div>
  )
}

/**
 * Step 1: Welcome
 */
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center space-y-8">
      {/* Logo */}
      <div className="flex justify-center">
        <div className="relative">
          <Logo size={64} />
          <div className="absolute -bottom-1 -right-1 flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground">
            <Sparkles className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* Heading */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          Welcome to Songlar
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
          Let's get you set up so you can start creating AI music.
        </p>
      </div>

      {/* How it works cards */}
      <div className="space-y-3 text-left">
        <div className="flex items-start gap-4 p-4 rounded-xl border bg-card">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/5 shrink-0">
            <Key className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-sm">Bring Your Own API Keys</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              You'll use your own fal.ai or MiniMax keys. This means no
              middleman markup — you pay providers directly.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-xl border bg-card">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/5 shrink-0">
            <Music className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-sm">Generate Unlimited Music</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Create with ElevenLabs and MiniMax models. Instrumentals, vocals,
              lyrics-based — any style you want.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <Button size="lg" className="w-full h-12 group" onClick={onNext}>
        Set Up API Keys
        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Button>
    </div>
  )
}

/**
 * Step 2: API Keys
 */
function ApiKeysStep() {
  const queryClient = useQueryClient()
  const [falKey, setFalKey] = useState('')
  const [minimaxKey, setMinimaxKey] = useState('')
  const [showFalKey, setShowFalKey] = useState(false)
  const [showMinimaxKey, setShowMinimaxKey] = useState(false)

  // Save fal.ai key
  const saveFalMutation = useMutation({
    mutationFn: async (key: string) => {
      const { saveApiKeyFn } = await import('@/server/byok.fn')
      return saveApiKeyFn({ data: { provider: 'fal', apiKey: key } })
    },
  })

  // Save MiniMax key
  const saveMinimaxMutation = useMutation({
    mutationFn: async (key: string) => {
      const { saveApiKeyFn } = await import('@/server/byok.fn')
      return saveApiKeyFn({ data: { provider: 'minimax', apiKey: key } })
    },
  })

  // Complete onboarding
  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      const { completeOnboardingFn } = await import('@/server/auth.fn')
      return completeOnboardingFn()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['session'] })
      // Hard redirect to bypass Better-Auth's session cookie cache
      // (navigate() would hit the _app beforeLoad with stale cached session)
      window.location.href = '/music'
    },
    onError: () => {
      toast.error('Something went wrong. Please try again.')
    },
  })

  const handleComplete = async () => {
    try {
      // Save any keys that were entered
      const promises: Promise<unknown>[] = []
      if (falKey.trim()) {
        promises.push(saveFalMutation.mutateAsync(falKey.trim()))
      }
      if (minimaxKey.trim()) {
        promises.push(saveMinimaxMutation.mutateAsync(minimaxKey.trim()))
      }

      if (promises.length > 0) {
        await Promise.all(promises)
        void queryClient.invalidateQueries({ queryKey: ['api-keys'] })
        toast.success('API keys saved successfully')
      }

      // Mark onboarding complete
      await completeOnboardingMutation.mutateAsync()
    } catch (err) {
      toast.error('Failed to save API keys. Please try again.')
    }
  }

  const handleSkip = async () => {
    await completeOnboardingMutation.mutateAsync()
  }

  const isPending =
    saveFalMutation.isPending ||
    saveMinimaxMutation.isPending ||
    completeOnboardingMutation.isPending

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          Add Your API Keys
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
          Add at least one API key to start generating music. You can always add
          or change keys later in Settings.
        </p>
      </div>

      {/* API Key Forms */}
      <div className="space-y-5">
        {/* fal.ai Key */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <Label className="font-medium">fal.ai API Key</Label>
            </div>
            <a
              href="https://fal.ai/dashboard/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              Get key
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            For ElevenLabs Music and MiniMax v2 generation via fal.ai
          </p>
          <div className="relative">
            <Input
              type={showFalKey ? 'text' : 'password'}
              placeholder="Enter your fal.ai API key"
              value={falKey}
              onChange={(e) => setFalKey(e.target.value)}
              disabled={isPending}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowFalKey(!showFalKey)}
            >
              {showFalKey ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        {/* MiniMax Key */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <Label className="font-medium">MiniMax API Key</Label>
              <span className="text-xs text-muted-foreground">(optional)</span>
            </div>
            <a
              href="https://platform.minimax.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              Get key
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            For MiniMax Music v2.5 direct API access
          </p>
          <div className="relative">
            <Input
              type={showMinimaxKey ? 'text' : 'password'}
              placeholder="Enter your MiniMax API key"
              value={minimaxKey}
              onChange={(e) => setMinimaxKey(e.target.value)}
              disabled={isPending}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowMinimaxKey(!showMinimaxKey)}
            >
              {showMinimaxKey ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Security note */}
      <p className="text-xs text-muted-foreground text-center">
        Your keys are encrypted with AES-256-GCM and stored securely. We never
        have access to your keys in plaintext.
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          className="w-full h-12 group"
          onClick={handleComplete}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              {falKey.trim() || minimaxKey.trim() ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Keys & Open Studio
                </>
              ) : (
                <>
                  Open Studio
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </>
          )}
        </Button>
        {(falKey.trim() || minimaxKey.trim()) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={handleSkip}
            disabled={isPending}
          >
            Skip for now
          </Button>
        )}
        {!falKey.trim() && !minimaxKey.trim() && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={handleSkip}
            disabled={isPending}
          >
            Skip — I'll add keys later
          </Button>
        )}
      </div>
    </div>
  )
}
