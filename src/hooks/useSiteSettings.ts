// Site ayarlarını Supabase'den çeken ve tüm uygulamada paylaşılan hook
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

const defaults: SiteSettings = {
  siteName: 'Rüya Tabirleri',
  siteDescription: "Türkiye'nin en kapsamlı rüya tabirleri sitesi",
  contactEmail: 'info@ruyatabirleri.com',
  contactPhone: '+90 (212) 123 45 67',
  contactAddress: 'İstanbul, Türkiye',
  contactWorkingHours: 'Pzt - Cum: 09:00 - 18:00',
  mapLatitude: '41.0082',
  mapLongitude: '28.9784',
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
  metaDescription: 'Binlerce rüya tabiri arasında arama yapın.',
  metaKeywords: 'rüya tabiri, rüya yorumu',
};

const SITE_SETTINGS_QUERY_KEY = ['site-settings'] as const;
const STALE_60_SEC = 60_000;

export function useSiteSettings() {
  const { data: settings = defaults, isLoading: loading } = useQuery({
    queryKey: SITE_SETTINGS_QUERY_KEY,
    queryFn: async (): Promise<SiteSettings> => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (error) throw error;

      const merged: SiteSettings = { ...defaults };
      data?.forEach((row: { key: string; value: unknown }) => {
        if (row.key in merged && row.value !== null && row.value !== undefined) {
          (merged as unknown as Record<string, unknown>)[row.key] = row.value as string;
        }
      });
      return merged;
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
