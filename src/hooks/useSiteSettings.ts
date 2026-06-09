// @ts-nocheck\n// Site ayarlarını Supabase'den çeken ve tüm uygulamada paylaşılan hook
import { useEffect, useState } from 'react';
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

// In-memory cache for all consumers
let cache: { data: SiteSettings | null; ts: number } | null = null;
const CACHE_TTL = 60_000; // 60s

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(cache?.data || defaults);
  const [loading, setLoading] = useState(!cache?.data);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // Use cache if fresh
      if (cache && Date.now() - cache.ts < CACHE_TTL) {
        setSettings(cache.data!);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('key, value');

        if (error) throw error;
        if (cancelled) return;

        const merged: SiteSettings = { ...defaults };
        data?.forEach((row: { key: string; value: unknown }) => {
          if (row.key in merged && row.value !== null && row.value !== undefined) {
            // value JSON'dan gelebilir, string ise direkt ata
            (merged as unknown as Record<string, unknown>)[row.key] = row.value as string;
          }
        });

        cache = { data: merged, ts: Date.now() };
        setSettings(merged);
      } catch (err) {
        console.error('useSiteSettings load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  return { settings, loading };
}

// Admin panelde değişiklik sonrası cache'i invalidate etmek için
export function invalidateSiteSettingsCache() {
  cache = null;
}
