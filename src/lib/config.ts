/**
 * Merkezi yapılandırma — tüm çevresel sabitler buradan okunur.
 * Build sırasında Vite env değerleri (`VITE_*`) buraya gömülür;
 * varsayılanlar yalnızca production dışı/dev ortamları için fallback'tir.
 */

/** Sitenin production adresi (VITE_SITE_URL ile ezilebilir). */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://ruya-tabirleri.com').replace(/\/$/, '');

/** Sitenin görünen adı. */
export const SITE_NAME = 'Rüya Tabirleri';

/** İletişim / mailto adresleri için kullanılan kurumsal e-posta. */
export const SITE_EMAIL = 'fatihsemizoglu@gmail.com';

/** Varsayılan SEO açıklaması. */
export const DEFAULT_DESCRIPTION =
  'Binlerce rüya tabiri arasında arama yapın. İslami ve psikolojik yorumlarla rüyalarınızın anlamını keşfedin.';

/** Varsayılan Open Graph görseli (SITE_URL'e göre mutlak). */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

/** Supabase proje URL'si (VITE_SUPABASE_URL). */
export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');

/** Supabase publishable (anon) key (VITE_SUPABASE_PUBLISHABLE_KEY). */
export const SUPABASE_PUBLISHABLE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

/** Supabase Edge Functions kök ucu. */
export const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

/** Google Maps embed anahtarı (VITE_GOOGLE_MAPS_EMBED_KEY ile ezilebilir). */
export const GOOGLE_MAPS_EMBED_KEY = import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY || 'AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao';

// Not: Aşağıdaki iletişim değerleri canlı site_settings tablosundan alınmıştır
// (contactPhone=+90 532 291 52 55, contactAddress=Atakum, Samsun,
// contactEmail=fatihsemizoglu@gmail.com, mapLatitude/Longitude=Samsun).
// Admin panelinden güncellenebilir; buradakiler yalnızca fallback'tir.

/** İletişim telefonu (admin site_settings'ten ezilebilir). */
export const SITE_PHONE = '+90 532 291 52 55';

/** Kurumsal adres (admin site_settings'ten ezilebilir). */
export const SITE_ADDRESS = 'Atakum, Samsun, Türkiye';

/** Varsayılan çalışma saatleri (admin site_settings'ten ezilebilir). */
export const SITE_WORKING_HOURS = 'Pzt - Cum: 09:00 - 18:00';

/** Varsayılan harita koordinatları (admin site_settings'ten ezilebilir). */
export const MAP_LATITUDE = '41.32833';
export const MAP_LONGITUDE = '36.28500';

/** Göreli yolu sitenin mutlak adresine çevirir; mutlak URL ise aynen döner. */
export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
