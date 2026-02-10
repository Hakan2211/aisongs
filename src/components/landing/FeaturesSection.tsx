import { motion } from 'framer-motion'
import {
  Download,
  Infinity as InfinityIcon,
  Key,
  Lock,
  Mic2,
  Music,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const features = [
  {
    icon: Key,
    title: 'Bring Your Own Key',
    description:
      'Use your own fal.ai and MiniMax API keys. No middleman markup, direct access to AI providers.',
    color: 'text-primary',
    bgColor: 'bg-primary/5',
  },
  {
    icon: Music,
    title: 'ElevenLabs Music',
    description:
      'Generate professional instrumental and vocal music from text descriptions. Perfect for any style.',
    color: 'text-primary',
    bgColor: 'bg-primary/5',
  },
  {
    icon: Mic2,
    title: 'MiniMax Music',
    description:
      'Create music with your own lyrics using reference tracks. Full control over vocals and style.',
    color: 'text-primary',
    bgColor: 'bg-primary/5',
  },
  {
    icon: Lock,
    title: 'Secure & Private',
    description:
      'Your API keys are encrypted with AES-256-GCM. We never store or see your keys in plaintext.',
    color: 'text-primary',
    bgColor: 'bg-primary/5',
  },
  {
    icon: Download,
    title: 'Download & Own',
    description:
      'Download your generated music as MP3. Full ownership of everything you create.',
    color: 'text-primary',
    bgColor: 'bg-primary/5',
  },
  {
    icon: InfinityIcon,
    title: 'Unlimited Generations',
    description:
      'No generation limits from us. Only pay for what you use directly to AI providers.',
    color: 'text-primary',
    bgColor: 'bg-primary/5',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 lg:py-32 bg-muted/30">
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
            Powerful AI Music Generation
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Access cutting-edge AI music models with your own API keys. No
            subscriptions, no per-generation fees from us.
          </p>
        </motion.div>

        {/* Features Grid — staggered animation */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <FeatureCard feature={feature} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function FeatureCard({ feature }: { feature: (typeof features)[0] }) {
  const Icon = feature.icon

  return (
    <div className="group relative h-full rounded-xl border bg-card p-7 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
      {/* Icon */}
      <div
        className={cn(
          'mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-colors',
          feature.bgColor,
          'group-hover:bg-primary/10',
        )}
      >
        <Icon className={cn('h-5 w-5', feature.color)} />
      </div>

      {/* Content */}
      <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {feature.description}
      </p>
    </div>
  )
}
