import { format as formatDateFns, formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';

/** "23 Ağu 2026" biçiminde kısa tarih. */
export function formatShortDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '-';
  return formatDateFns(d, 'd MMM yyyy', { locale: tr });
}

/** "23 Ağustos 2026 14:30" biçiminde uzun tarih. */
export function formatLongDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '-';
  return formatDateFns(d, 'd MMMM yyyy HH:mm', { locale: tr });
}

/** "3 saat önce" biçiminde göreli zaman. */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '-';
  return formatDistanceToNowStrict(d, { addSuffix: true, locale: tr });
}
