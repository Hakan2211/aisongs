import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowRight, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CTASection() {
  return (
    <section className="py-24 lg:py-32 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="flex justify-center mb-6">
            <div className="p-3 rounded-full bg-primary-foreground/10">
              <Music className="h-8 w-8" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Ready to create your first track?
          </h2>
          <p className="text-lg md:text-xl opacity-90 mb-10">
            Join creators using AI Music Studio to generate professional-quality
            music. One-time payment, lifetime access, unlimited creativity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button
                size="lg"
                variant="secondary"
                className="min-w-[180px] group"
              >
                Get Started Now
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <a href="#pricing">
              <Button
                size="lg"
                variant="outline"
                className="min-w-[180px] bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                View Pricing
              </Button>
            </a>
          </div>
          <p className="text-sm opacity-70 mt-8">
            No credit card required to sign up. Add API keys when you're ready.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
