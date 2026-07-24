/**
 * Merkezi logging ve hata raporlama utility.
 *
 * - Geliştirme ortamında console'a yazar.
 * - Üretimde (Sentry DSN yapılandırılmışsa) hataları Sentry'ye gönderir.
 *
 * ÖNEMLI: `captureError` / `logger.error`, production'da `console.error` yerine
 * kullanılmalıdır. Üretim bundle'ında `console.*` çağrıları korunur (yalnızca
 * `debugger` ifadeleri düşürülür). Ancak `logger.*` helper'ları geliştirme
 * ortamı dışında no-op'tur; hataların Sentry'ye iletilmesi için `captureError`
 * kullanılmalıdır. Bu yardımcı, Sentry import'u tree-shake edilmediği sürece
 * (DSN yoksa bile) çağrıyı canlı tutar.
 */
import * as Sentry from '@sentry/react';

const isDev = import.meta.env.DEV;

/** Sentry'ye gönderilecek ek bağlam (tags, extra, level). */
export interface CaptureContext {
  /** Sentry tags (filtrelenebilir anahtar/değerler). */
  tags?: Record<string, string | number | boolean>;
  /** Sentry extra (ekstra detaylar, filtrelenmez). */
  extra?: Record<string, unknown>;
  /** Seviye. Varsayılan: error. */
  level?: 'error' | 'warning' | 'info';
}

/**
 * Bir hatayı Sentry'ye raporlar ve (dev ortamında) console'a da yazar.
 *
 * Tüm `catch` bloklarında `console.error(...)` yerine kullanın:
 *
 * ```ts
 * try {
 *   await doWork();
 * } catch (error) {
 *   captureError(error, { tags: { feature: 'search' }, extra: { query } });
 * }
 * ```
 */
export function captureError(error: unknown, context: CaptureContext = {}): void {
  const err = error instanceof Error ? error : new Error(String(error ?? 'Unknown error'));

  Sentry.captureException(err, {
    level: context.level ?? 'error',
    ...(context.tags ? { tags: context.tags } : {}),
    ...(context.extra ? { extra: context.extra } : {}),
  });

  // Sentry DSN yoksa bile dev ortamında console'a düşsün ki geliştirici görsün.
  if (isDev) {
    console.error(context.tags?.feature ? `[${context.tags.feature}]` : '[error]', err, context.extra ?? '');
  }
}

/**
 * Bilgilendirici bir mesajı Sentry'ye (captureMessage) ve dev console'ına gönderir.
 * Kullanıcıyı etkilemeyen önemli akışlar için (ör. fallback arama devreye girdi).
 */
export function captureMessage(message: string, context: CaptureContext = {}): void {
  Sentry.captureMessage(message, {
    level: context.level ?? 'info',
    ...(context.tags ? { tags: context.tags } : {}),
    ...(context.extra ? { extra: context.extra } : {}),
  });

  if (isDev) {
    console.info(context.tags?.feature ? `[${context.tags.feature}]` : '[info]', message);
  }
}

/**
 * Konsol yardımcıları. Sadece geliştirme ortamında yazar; production'da no-op.
 * Üretimde izlenmesi gereken şeyler için `captureError` / `captureMessage` kullanın.
 */
export const logger = {
  error: isDev ? console.error.bind(console) : () => {},
  warn: isDev ? console.warn.bind(console) : () => {},
  info: isDev ? console.info.bind(console) : () => {},
  log: isDev ? console.log.bind(console) : () => {},
};

export default logger;
