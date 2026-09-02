import { motion } from 'framer-motion';
import { MoonStar, MessageCircle, ArrowRight } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

/** WhatsApp numarasını wa.me formatına hazırlar (rakam dışını temizler). */
function toWaNumber(raw: string): string {
  return (raw || '').replace(/\D/g, '');
}

/** Ana sayfa özel rüya yorum servisi banner'ı (ücretli — WhatsApp başvuru).
 *  İçerik admin panel > Site Ayarları > Banner sekmesinden yönetilir. */
export function DreamReadingBanner() {
  const { settings } = useSiteSettings();

  const waNumber = toWaNumber(settings.dreamBannerWhatsapp) || '905322915255';
  const waMessage =
    'Merhaba! Rüyamın özel olarak detaylı yorumlanmasını istiyorum. (Rüya Tabirleri sitesinden)';
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;
  const priceInfo = settings.dreamBannerPriceInfo.trim();

  return (
    <section className="container py-4 md:py-6" aria-label="Özel rüya yorum servisi">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-violet-500/25 bg-gradient-to-br from-violet-600/15 via-fuchsia-500/10 to-pink-500/10 p-8 md:p-12 text-center"
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-xl mx-auto">
          <MoonStar className="h-10 w-10 mx-auto text-primary mb-4" />
          <h2 className="text-2xl md:text-3xl font-serif-dream font-bold tracking-tight mb-3">
            {settings.dreamBannerTitle}
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {settings.dreamBannerDescription}
          </p>
          {priceInfo && (
            <p className="mb-4 text-sm font-semibold text-primary">{priceInfo}</p>
          )}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-12 px-8 rounded-xl dream-gradient text-white font-semibold transition hover:opacity-90 active:scale-[0.98]"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {settings.dreamBannerCtaText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
          <p className="mt-3 text-xs text-muted-foreground/70">
            Başvuru doğrudan WhatsApp üzerinden yapılır.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
