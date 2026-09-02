import { MessageCircle, Zap, CalendarClock, Check, Moon } from 'lucide-react';

/**
 * ─────────────────────────────────────────────────────────────────────
 *  ÖZEL RÜYA YORUM SERVİSİ — YAPILANDIRMA
 *  Aşağıdaki değerleri kendi bilgilerinizle güncelleyin:
 * ─────────────────────────────────────────────────────────────────────
 *  WHATSAPP_NUMBER : WhatsApp numaranız (ülke koduyla, boşluksuz).
 *                    Ör: 905321234567
 *  PRICE_URGENT    : Acil yorum fiyatı (metin olarak serbest yazılır)
 *  PRICE_SCHEDULED : Randevulu yorum fiyatı
 * ─────────────────────────────────────────────────────────────────────
 */
const WHATSAPP_NUMBER = '905000000000'; // TODO: KENDİ WHATSAPP NUMARANIZ
const PRICE_URGENT = '₺—'; // TODO: Acil yorum fiyatı
const PRICE_SCHEDULED = '₺—'; // TODO: Randevulu yorum fiyatı

const waLink = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

const MSG_URGENT =
  'Merhaba! Rüyamın ACİL şekilde detaylı yorumlanmasını istiyorum. (Rüya Tabirleri sitesinden)';
const MSG_SCHEDULED =
  'Merhaba! Rüyam için RANDEVULU detaylı yorum hizmeti almak istiyorum. (Rüya Tabirleri sitesinden)';

export function DreamReadingBanner() {
  return (
    <section className="container py-10 md:py-14" aria-label="Özel rüya yorum servisi">
      <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-950 p-6 md:p-10 shadow-xl shadow-violet-950/20">
        {/* Dekoratif ışıklar */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-3xl" />
          <Moon aria-hidden className="absolute top-6 right-8 h-10 w-10 text-violet-300/30 animate-pulse" />
        </div>

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Özel Yorum Servisi — Şu an müsait
          </span>

          <h2 className="mt-4 text-2xl md:text-3xl font-serif font-bold text-white">
            Rüya Yorumunuz Yapılır
          </h2>
          <p className="mt-2 max-w-2xl text-sm md:text-base text-violet-100/80">
            Rüyalarınız <strong className="text-violet-100">özel olarak detaylı şekilde</strong> yorumlanır.
            İslami gelenek (İbn-i Sîrîn) ve psikoloji literatürü birleştirilerek size özel
            yazılı yorum hazırlanır. Hemen başvurun, yorumunuz WhatsApp'tan tarafınıza iletilsin.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {/* Acil Yorum */}
            <div className="rounded-2xl border border-emerald-400/30 bg-white/5 p-5 backdrop-blur-sm flex flex-col">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">
                  <Zap className="h-4 w-4" />
                  Acil Yorum
                </span>
                <span className="rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-200">
                  Öncelikli sıra
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{PRICE_URGENT}</span>
                <span className="text-xs text-violet-100/60">/ rüya</span>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-violet-100/75 flex-1">
                <li className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" /> Birkaç saat içinde teslim</li>
                <li className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" /> Detaylı, size özel yazılı yorum</li>
                <li className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" /> İslami + psikolojik bakış açısı</li>
                <li className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" /> WhatsApp'tan soru-cevap desteği</li>
              </ul>
              <a
                href={waLink(MSG_URGENT)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 active:scale-[0.98]"
              >
                <MessageCircle className="h-4 w-4" />
                Acil Başvur
              </a>
            </div>

            {/* Randevulu Yorum */}
            <div className="rounded-2xl border border-violet-400/30 bg-white/5 p-5 backdrop-blur-sm flex flex-col">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-violet-300">
                  <CalendarClock className="h-4 w-4" />
                  Randevulu Yorum
                </span>
                <span className="rounded-full bg-violet-400/15 px-2.5 py-0.5 text-[11px] font-medium text-violet-200">
                  Ekonomik
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{PRICE_SCHEDULED}</span>
                <span className="text-xs text-violet-100/60">/ rüya</span>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-violet-100/75 flex-1">
                <li className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" /> Size uygun tarih ve saatte</li>
                <li className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" /> Detaylı, size özel yazılı yorum</li>
                <li className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" /> İslami + psikolojik bakış açısı</li>
                <li className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" /> WhatsApp'tan soru-cevap desteği</li>
              </ul>
              <a
                href={waLink(MSG_SCHEDULED)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/50 bg-violet-500/20 px-4 py-2.5 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/30 active:scale-[0.98]"
              >
                <MessageCircle className="h-4 w-4" />
                Randevu Al
              </a>
            </div>
          </div>

          <p className="mt-4 text-center text-[11px] text-violet-100/50">
            Başvuru butonları doğrudan WhatsApp ile açılır; rüyayı anlatmanız yeterli.
          </p>
        </div>
      </div>
    </section>
  );
}
