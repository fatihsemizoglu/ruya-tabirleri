import { motion } from 'framer-motion';
import { MessageCircle, ArrowRight, Check, MoonStar } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

/** WhatsApp numarasını wa.me formatına hazırlar (rakam dışını temizler). */
function toWaNumber(raw: string): string {
  return (raw || '').replace(/\D/g, '');
}

const TRUST_ITEMS = [
  'İbn-i Sirin geleneği',
  'Psikoloji literatürü',
  'Size özel yazılı yorum',
];

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
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      >
        {/* Üst vurgu çizgisi */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary/60 to-primary/0" />

        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:gap-10 md:p-8">
          {/* Sol: metin bloğu */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/15">
                <MoonStar className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Özel Yorum Hizmeti
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground leading-snug">
              {settings.dreamBannerTitle}
            </h2>
            <p className="mt-2 text-sm md:text-[15px] text-muted-foreground leading-relaxed max-w-2xl">
              {settings.dreamBannerDescription}
            </p>

            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
              {TRUST_ITEMS.map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/80">
                  <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Sağ: başvuru bloğu */}
          <div className="shrink-0 md:w-64 md:border-l md:border-border md:pl-10">
            {priceInfo && (
              <p className="mb-3 text-sm font-semibold text-foreground">{priceInfo}</p>
            )}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.99]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              {settings.dreamBannerCtaText}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <p className="mt-2.5 text-center text-[11px] text-muted-foreground/80">
              Başvuru doğrudan WhatsApp üzerinden yapılır.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
