// Site ayarlarını Supabase'den çeken ve tüm uygulamada paylaşılan hook
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SITE_EMAIL, SITE_NAME, SITE_PHONE, SITE_ADDRESS, SITE_WORKING_HOURS, MAP_LATITUDE, MAP_LONGITUDE } from '@/lib/config';

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  contactWorkingHours: string;
  mapLatitude: string;
  mapLongitude: string;
  enableComments: boolean;
  requireApproval: boolean;
  enableNewsletter: boolean;
  maintenanceMode: boolean;
  analyticsEnabled: boolean;
  socialFacebook: string;
  socialTwitter: string;
  socialInstagram: string;
  socialYoutube: string;
  socialLinkedin: string;
  socialTiktok: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
}

/** Sosyal medya ayar anahtarları — arayüzle birlikte yaşar; yeni alan eklenirse buraya da eklenmeli. */
export const SOCIAL_SETTINGS_KEYS = [
  'socialFacebook',
  'socialTwitter',
  'socialInstagram',
  'socialYoutube',
  'socialLinkedin',
  'socialTiktok',
] as const;

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: SITE_NAME,
  siteDescription: "Türkiye'nin en kapsamlı rüya tabirleri sitesi",
  contactEmail: SITE_EMAIL,
  contactPhone: SITE_PHONE,
  contactAddress: SITE_ADDRESS,
  contactWorkingHours: SITE_WORKING_HOURS,
  mapLatitude: MAP_LATITUDE,
  mapLongitude: MAP_LONGITUDE,
  enableComments: true,
  requireApproval: true,
  enableNewsletter: false,
  maintenanceMode: false,
  analyticsEnabled: true,
  socialFacebook: '',
  socialTwitter: '',
  socialInstagram: '',
  socialYoutube: '',
  socialLinkedin: '',
  socialTiktok: '',
  metaTitle: 'Rüya Tabirleri - En Kapsamlı Rüya Yorumları',
  metaDescription: 'Binlerce rüya tabiri arasında arama yapın. İslami ve psikolojik yorumlarla rüyalarınızın anlamını keşfedin.',
  metaKeywords: 'rüya tabiri, rüya yorumu, islami rüya tabiri, rüya sözlüğü',
};

const SITE_SETTINGS_QUERY_KEY = ['site-settings'] as const;
const STALE_60_SEC = 60_000;

/**
 * DB'deki key-value satırlarını DEFAULT_SITE_SETTINGS üzerine birleştirir.
 * Yalnızca SiteSettings arayüzünde tanımlı anahtarlar uygulanır;
 * legacy/fazladan anahtarlar (örn. contact_email, site_description) yok sayılır.
 * useSiteSettings hook'u ve SiteSettingsPanel aynı mantığı paylaşır.
 */
export function mergeSiteSettings(rows: { key: string; value: unknown }[]): SiteSettings {
  const merged: SiteSettings = { ...DEFAULT_SITE_SETTINGS };
  rows.forEach((row) => {
    // hasOwnProperty: yalnızca kendi (prototype değil) özelliklerini uygula —
    // 'toString'/'constructor' gibi anahtarlar merged'ın kalıtılmış üyelerini ezmemeli.
    if (Object.prototype.hasOwnProperty.call(merged, row.key) && row.value !== null && row.value !== undefined) {
      (merged as unknown as Record<string, unknown>)[row.key] = row.value;
    }
  });
  return merged;
}

export function useSiteSettings() {
  const { data: settings = DEFAULT_SITE_SETTINGS, isLoading: loading } = useQuery({
    queryKey: SITE_SETTINGS_QUERY_KEY,
    queryFn: async (): Promise<SiteSettings> => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (error) throw error;
      return mergeSiteSettings(data ?? []);
    },
    staleTime: STALE_60_SEC,
  });

  return { settings, loading };
}

// Admin panelde değişiklik sonrası cache'i invalidate etmek için
export function useInvalidateSiteSettings() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: SITE_SETTINGS_QUERY_KEY });
}

// Eski API uyumluluğu için (deprecated)
export function invalidateSiteSettingsCache() {
  console.warn('invalidateSiteSettingsCache deprecated — use useInvalidateSiteSettings()');
}
