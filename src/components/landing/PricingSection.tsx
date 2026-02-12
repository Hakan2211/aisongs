import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const features = [
  'Lifetime platform access',
  'ElevenLabs Music generation',
  'MiniMax Music generation',
  'Unlimited track generations',
  'Full track library management',
  'Download in multiple formats',
  'Reference audio support',
  'Lyrics-based generation',
  'Voice cloning & conversion',
  'Future model updates included',
]

interface PricingSectionProps {
  isLoggedIn?: boolean
}

export function PricingSection({ isLoggedIn = false }: PricingSectionProps) {
  return (
    <section id="pricing" className="py-24 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            One price. Lifetime access.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No subscriptions, no hidden fees. Pay once and create unlimited AI
            music forever. You only pay for your own API usage.
          </p>
        </motion.div>

        {/* Single Pricing Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-lg mx-auto"
        >
          <div className="relative rounded-2xl border-2 border-primary bg-card p-8 md:p-10 shadow-xl">
            {/* Badge */}
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-5 py-1.5 text-xs font-semibold text-primary-foreground flex items-center gap-1.5 shadow-lg">
              <Sparkles className="h-3 w-3" />
              Lifetime Deal
            </span>

            {/* Header */}
            <div className="text-center mb-8 pt-2">
              <h3 className="text-2xl font-semibold mb-5">Songlar</h3>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-6xl font-bold tracking-tight">
                  &euro;199
                </span>
                <span className="text-muted-foreground text-lg">one-time</span>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Full platform access + all future updates
              </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-border mb-8" />

            {/* Features */}
            <ul className="space-y-3.5 mb-8">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            {isLoggedIn ? (
              <Link to="/music" className="block">
                <Button className="w-full h-12 text-base group" size="lg">
                  Go to Studio
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            ) : (
              <Link to="/signup" className="block">
                <Button className="w-full h-12 text-base" size="lg">
                  Get Lifetime Access
                </Button>
              </Link>
            )}

            {/* Note */}
            <p className="text-xs text-muted-foreground text-center mt-4">
              Bring your own API keys. You pay providers directly for usage.
            </p>
          </div>
        </motion.div>

        {/* BYOK Explanation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-16 max-w-3xl mx-auto text-center"
        >
          <h3 className="text-xl font-semibold mb-6">
            How does Bring Your Own Key work?
          </h3>
          <div className="grid md:grid-cols-3 gap-5 text-sm">
            <div className="p-5 rounded-xl bg-card border">
              <div className="font-semibold mb-2">1. Get API Keys</div>
              <p className="text-muted-foreground leading-relaxed">
                Sign up for fal.ai and get your API key. They offer generous
                free tiers to get started.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-card border">
              <div className="font-semibold mb-2">2. Add to Studio</div>
              <p className="text-muted-foreground leading-relaxed">
                Securely add your API keys in Settings. Keys are encrypted and
                never shared.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-card border">
              <div className="font-semibold mb-2">3. Pay-as-you-go</div>
              <p className="text-muted-foreground leading-relaxed">
                Only pay for what you generate. Costs vary by
                provider&mdash;e.g. ~$0.05/track on MiniMax, or ~$0.80/min on
                ElevenLabs.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
