import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'What is the Bring Your Own Key (BYOK) model?',
    answer:
      'BYOK means you use your own API keys from providers like fal.ai to generate music. You pay the providers directly for usage, which is typically much cheaper than platform markups. We never see your API bills - you have full control and transparency over costs.',
  },
  {
    question: 'Which AI music models are supported?',
    answer:
      'Currently we support ElevenLabs Music (great for instrumentals and songs with vocals) and MiniMax Music (excellent for lyrics-based generation and reference audio styling). We plan to add more models as they become available.',
  },
  {
    question: 'How much does it cost to generate a track?',
    answer:
      'The platform itself is a one-time €99 payment. For API usage, typical costs are $0.01-0.05 per track depending on the model and track length. fal.ai offers free credits to get started, so you can try before committing to paid usage.',
  },
  {
    question: 'Do I own the music I generate?',
    answer:
      'Yes! Music generated through AI Music Studio is yours to use. However, please check the specific terms of the AI model providers (ElevenLabs, MiniMax) for their commercial usage policies, as these may vary.',
  },
  {
    question: 'Are my API keys secure?',
    answer:
      'Absolutely. Your API keys are encrypted using AES-256-GCM encryption before being stored. Keys are only decrypted server-side when making API calls and are never exposed to the browser or logged.',
  },
  {
    question: 'What happens if new AI models are released?',
    answer:
      'Your lifetime access includes all future updates to the platform, including new AI models as we add support for them. No additional payment required.',
  },
  {
    question: 'Can I use this commercially?',
    answer:
      'Yes, you can use AI Music Studio for commercial projects. Just ensure you comply with the terms of service of the underlying AI providers regarding commercial use of generated content.',
  },
  {
    question: 'How do I get started with fal.ai?',
    answer:
      'Sign up at fal.ai, navigate to your dashboard to get your API key, then paste it in the Settings page of AI Music Studio. fal.ai provides free credits to new users, so you can start generating immediately.',
  },
  {
    question: 'Where is my generated audio stored?',
    answer:
      'By default, generated audio is stored temporarily on the AI provider servers and may expire. For permanent storage, you can connect your own Bunny.net CDN account in Settings. Audio will then be automatically uploaded to your CDN for reliable, long-term access. This is also BYOK - you bring your own storage and only pay for what you use.',
  },
]

export function FAQSection() {
  return (
    <section id="faq" className="py-24 lg:py-32">
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
            Frequently asked questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about AI Music Studio and the BYOK
            model.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
