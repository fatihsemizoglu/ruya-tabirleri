import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface DreamFaqProps {
  faqs: { q: string; a: string }[];
}

export function DreamFaq({ faqs }: DreamFaqProps) {
  return (
    <section className="container pb-12" aria-label="Sıkça sorulan sorular">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.56 }}
        className="max-w-3xl mx-auto surface p-6 md:p-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Sıkça Sorulan Sorular</h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, idx) => (
            <AccordionItem key={idx} value={`faq-${idx}`}>
              <AccordionTrigger className="text-left text-sm md:text-base font-medium">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </section>
  );
}
