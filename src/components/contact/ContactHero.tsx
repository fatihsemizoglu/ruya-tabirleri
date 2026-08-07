import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Mail, Phone, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useContactSettings } from '@/hooks/useContactSettings';

export function ContactHero() {
  const { phoneHref, emailHref } = useContactSettings();
  const reduceMotion = useReducedMotion();

  return (
    <section className="container pb-14 pt-14 sm:pt-20 lg:pb-20 lg:pt-24">
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.55 }}
        className="mx-auto max-w-3xl text-center"
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 shadow-sm backdrop-blur-xl dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200">
          <Sparkles className="h-3.5 w-3.5" /> İletişim merkezi
        </div>
        <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
          Aklınızdakileri birlikte{' '}
          <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
            anlamlandıralım.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-7 text-muted-foreground sm:text-lg">
          Bir sorunuz, fikriniz ya da paylaşmak istediğiniz bir deneyim mi var? Mesajınızı bırakın; özenle okuyup en kısa sürede yanıtlayalım.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 px-6 text-white shadow-lg shadow-fuchsia-500/20 transition-all duration-200 hover:brightness-110 hover:shadow-xl hover:shadow-fuchsia-500/25">
            <a href="#contact-form"><Send className="mr-2 h-4 w-4" /> Mesaj gönder</a>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-violet-200/80 bg-white/70 px-6 backdrop-blur-xl transition-all duration-200 hover:border-violet-300 hover:bg-violet-50 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-violet-500/10">
            <a href={phoneHref ?? emailHref}>
              {phoneHref ? <Phone className="mr-2 h-4 w-4" /> : <Mail className="mr-2 h-4 w-4" />}
              Hızlı ulaşın <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
