/**
 * Responsive image helpers for Supabase Storage URLs.
 *
 * Supabase Storage supports on-the-fly transformations via URL params:
 *   ?width=N    - resize to N pixels wide
 *   ?height=N   - resize to N pixels tall
 *   ?quality=N  - JPEG/WebP quality (1-100)
 *   ?format=webp|avif|origin - convert format
 *
 * Example:
 *   supabaseSrcset(url, [320, 640, 1024, 1280])
 *   => "https://.../image.jpg?width=320 320w, ...?width=640 640w, ..."
 */

export const DEFAULT_WIDTHS = [320, 640, 1024, 1280, 1920] as const;

export type ImageWidth = (typeof DEFAULT_WIDTHS)[number];

/**
 * Returns a srcset string for a Supabase storage URL.
 * If the URL is not a Supabase storage URL, returns the original URL unchanged
 * (as a single-candidate srcset).
 */
export function supabaseSrcset(
  url: string | null | undefined,
  widths: readonly number[] = DEFAULT_WIDTHS,
  quality = 75
): string {
  if (!url) return '';
  if (!isSupabaseStorageUrl(url)) return url;

  return widths
    .map((w) => `${withTransform(url, { width: w, quality })} ${w}w`)
    .join(', ');
}

/**
 * Returns a `sizes` attribute that mirrors the supplied breakpoints.
 * The default works for full-width responsive images on a centered container.
 */
export function defaultSizes(maxWidth = 1280): string {
  return `(max-width: 640px) 100vw, (max-width: ${maxWidth}px) ${maxWidth}px, 100vw`;
}

/**
 * Returns a smaller, single-URL src (used as the `src` fallback for older
 * browsers and as the default for cases where srcset is overkill).
 */
export function supabaseResized(
  url: string | null | undefined,
  width: number,
  quality = 75
): string {
  if (!url || !isSupabaseStorageUrl(url)) return url ?? '';
  return withTransform(url, { width, quality });
}

// --- internals ---

function isSupabaseStorageUrl(url: string): boolean {
  return /supabase\.(co|in|io)\/storage\/v1\/object\//.test(url);
}

interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'origin';
}

function withTransform(url: string, opts: TransformOptions): string {
  const sep = url.includes('?') ? '&' : '?';
  const params = new URLSearchParams();
  if (opts.width) params.set('width', String(opts.width));
  if (opts.height) params.set('height', String(opts.height));
  if (opts.quality) params.set('quality', String(opts.quality));
  if (opts.format) params.set('format', opts.format);
  return `${url}${sep}${params.toString()}`;
}
