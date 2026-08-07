import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  MessageCircle,
  Mail,
  Phone,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useContactSettings } from '@/hooks/useContactSettings';

export function ContactCTASection() {
  const { settings, emailHref, phoneHref, waUrl } = useContactSettings();

  const contactCards = [
    ...(waUrl
      ? [{
          icon: MessageCircle,
          label: 'WhatsApp',
          description: 'Hızlı iletişim',
          href: waUrl,
          external: true,
          gradient: 'from-green-500 to-emerald-500',
          softGradient: 'from-green-500/15 to-emerald-500/5',
          hoverBorder: 'hover:border-green-500/40',
          hoverShadow: 'hover:shadow-green-500/10',
          textColor: 'text-green-600 dark:text-green-400',
        }]
      : []),
    {
      icon: Mail,
      label: 'E-posta',
      description: settings.contactEmail,
      href: emailHref,
      external: false,
      gradient: 'from-blue-500 to-cyan-500',
      softGradient: 'from-blue-500/15 to-cyan-500/5',
      hoverBorder: 'hover:border-blue-500/40',
      hoverShadow: 'hover:shadow-blue-500/10',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: Phone,
      label: 'Telefon',
      description: settings.contactPhone,
      href: phoneHref,
      external: false,
      gradient: 'from-violet-500 to-fuchsia-500',
      softGradient: 'from-violet-500/15 to-fuchsia-500/5',
      hoverBorder: 'hover:border-violet-500/40',
      hoverShadow: 'hover:shadow-violet-500/10',
      textColor: 'text-violet-600 dark:text-violet-400',
    },
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-80 h-80 bg-green-500/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-500/8 rounded-full blur-[100px]" />
      </div>

      <div className="container relative py-14 md:py-20">
        {/* Section header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-green-500/20 text-green-700 dark:text-green-300 text-xs font-semibold mb-3"
          >
            <MessageCircle className="h-3 w-3" />
            İletişim
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-[-0.025em] text-foreground leading-[1.05]"
          >
            Sorularınız mı var?{' '}
            <span className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
              Hemen Ulaşın
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="text-muted-foreground text-sm md:text-base mt-2 max-w-md mx-auto"
          >
            Rüya tabirleri, iş birliği veya destek için bize ulaşabilirsiniz
          </motion.p>
        </div>

        {/* Contact cards grid */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
          }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto mb-6"
        >
          {contactCards.map((card) => {
            const Icon = card.icon;
            const isExternal = card.external;

            return (
              <motion.div
                key={card.label}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
                }}
              >
                {isExternal ? (
                  <a
                    href={card.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group relative flex flex-col items-center gap-3 p-4 sm:p-5 rounded-xl bg-card border border-border/50 overflow-hidden transition-all duration-300 ${card.hoverBorder} hover:shadow-lg ${card.hoverShadow} hover:-translate-y-0.5 text-center`}
                  >
                    <CardInner card={card} Icon={Icon} />
                  </a>
                ) : (
                  <a
                    href={card.href}
                    className={`group relative flex flex-col items-center gap-3 p-4 sm:p-5 rounded-xl bg-card border border-border/50 overflow-hidden transition-all duration-300 ${card.hoverBorder} hover:shadow-lg ${card.hoverShadow} hover:-translate-y-0.5 text-center`}
                  >
                    <CardInner card={card} Icon={Icon} />
                  </a>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom: Working hours + Contact page link */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center"
        >
          {settings.contactWorkingHours && (
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{settings.contactWorkingHours}</span>
            </div>
          )}
          <Link
            to="/iletisim"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
          >
            <Sparkles className="h-3.5 w-3.5" />
            İletişim Formu
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function CardInner({
  card,
  Icon,
}: {
  card: {
    gradient: string;
    softGradient: string;
    label: string;
    description: string;
    textColor: string;
  };
  Icon: LucideIcon;
}) {
  return (
    <>
      {/* Background gradient on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${card.softGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />
      {/* Mobilde yatay (ikon solda, metin sağda), sm+ da dikey ortalanmış düzen */}
      <div className="relative flex w-full items-center gap-3.5 text-left sm:w-auto sm:flex-col sm:gap-2.5 sm:text-center">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} shadow-md transition-all duration-300 group-hover:rotate-3 group-hover:scale-110 sm:h-12 sm:w-12`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm text-foreground transition-colors group-hover:text-primary">
            {card.label}
          </h3>
          {/* break-words: uzun e-posta adresleri kart dışına taşmasın */}
          <p className={`mt-0.5 break-words text-[11px] font-medium ${card.textColor}`}>
            {card.description}
          </p>
        </div>
      </div>
    </>
  );
}
