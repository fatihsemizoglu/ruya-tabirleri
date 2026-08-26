import { BookMarked, ShieldCheck, CalendarClock } from 'lucide-react';
import { formatShortDate } from '@/lib/date';

interface SourceTrustBadgeProps {
  /** İçeriğin son güncellenme tarihi (freshness/E-E-A-T sinyali). */
  updatedAt?: string | null;
  className?: string;
}

/**
 * Rüya tabiri sayfaları için kaynak ve editoryal güven bloğu.
 * Rakiplerdeki (İbn Sirin/Nablusi vurgusu) E-E-A-T pattern'inin karşılığı;
 * AI arama motorlarının da alıntı güvenilirliğini artırır.
 */
export function SourceTrustBadge({ updatedAt, className = '' }: SourceTrustBadgeProps) {
  return (
    <aside
      aria-label="Kaynak ve güven bilgisi"
      className={`rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-transparent p-4 text-sm text-muted-foreground ${className}`}
    >
      <div className="flex flex-wrap items-start gap-x-5 gap-y-2">
        <span className="inline-flex items-center gap-1.5">
          <BookMarked className="h-4 w-4 shrink-0 text-violet-500" />
          <span>
            İbn-i Sirin ve Nablusi geleneği ile modern psikoloji literatürü kaynak alınarak hazırlanmıştır.
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>Editoryal denetimli içerik</span>
        </span>
        {updatedAt && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-4 w-4 shrink-0 text-primary" />
            <span>
              Son güncelleme: <time dateTime={updatedAt}>{formatShortDate(updatedAt)}</time>
            </span>
          </span>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground/80">
        Rüya tabirleri kesin birer kehanet değildir; sembollerin kültürel ve psikolojik yorumlarıdır.
      </p>
    </aside>
  );
}
