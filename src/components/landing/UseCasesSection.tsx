import { motion } from 'framer-motion'
import { Film, Gamepad2, Mic, MonitorPlay, Music, Podcast } from 'lucide-react'
const useCases = [
  {
    icon: MonitorPlay,
    title: 'Content Creators',
    description:
      'Generate unique background music for YouTube videos, TikToks, and social media without copyright worries.',
  },
  {
    icon: Gamepad2,
    title: 'Game Developers',
    description:
      'Create adaptive soundtracks, ambient music, and sound effects for indie games and prototypes.',
  },
  {
    icon: Podcast,
    title: 'Podcasters',
    description:
      'Produce custom intro music, transitions, and ambient backgrounds that match your podcast brand.',
  },
  {
    icon: Music,
    title: 'Indie Musicians',
    description:
      'Use AI as a creative partner to generate backing tracks, explore new styles, and overcome creative blocks.',
  },
  {
    icon: Film,
    title: 'Filmmakers',
    description:
      'Score short films, documentaries, and commercials with AI-generated music tailored to your scenes.',
  },
  {
    icon: Mic,
    title: 'Voice Artists',
    description:
      'Create custom instrumentals to accompany voiceovers, audiobooks, and guided meditations.',
  },
]

export function UseCasesSection() {
  return (
    <section id="use-cases" className="py-24 lg:py-32 bg-muted/30">
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
            Built for creators
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you're making content, building games, or producing music —
            AI Music Studio fits your workflow.
          </p>
        </motion.div>

        {/* Use Cases Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <UseCaseCard useCase={useCase} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function UseCaseCard({ useCase }: { useCase: (typeof useCases)[0] }) {
  const Icon = useCase.icon

  return (
    <div className="group relative h-full rounded-xl border bg-card p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{useCase.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {useCase.description}
      </p>
    </div>
  )
}
