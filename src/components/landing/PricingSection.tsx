import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'
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
  'Future model updates included',
  'Priority support',
]

export function PricingSection() {
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
          <div className="relative rounded-2xl border-2 border-primary bg-card p-8 shadow-xl">
            {/* Badge */}
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Lifetime Deal
            </span>

            {/* Header */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-semibold mb-4">AI Music Studio</h3>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold">€99</span>
                <span className="text-muted-foreground">one-time</span>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Full platform access + all future updates
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link to="/signup" className="block">
              <Button className="w-full" size="lg">
                Get Lifetime Access
              </Button>
            </Link>

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
          <h3 className="text-xl font-semibold mb-4">
            How does Bring Your Own Key work?
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="p-4 rounded-lg bg-card border">
              <div className="font-medium mb-2">1. Get API Keys</div>
              <p className="text-muted-foreground">
                Sign up for fal.ai and get your API key. They offer generous
                free tiers to get started.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-card border">
              <div className="font-medium mb-2">2. Add to Studio</div>
              <p className="text-muted-foreground">
                Securely add your API keys in Settings. Keys are encrypted and
                never shared.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-card border">
              <div className="font-medium mb-2">3. Pay-as-you-go</div>
              <p className="text-muted-foreground">
                Only pay for what you use. Typical track costs $0.01-0.05
                depending on length.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
