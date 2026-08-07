import { useMemo } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { GOOGLE_MAPS_EMBED_KEY, MAP_LATITUDE, MAP_LONGITUDE } from '@/lib/config';

/**
 * Contact iletişim değerlerini tek kaynaktan sağlar.
 * phoneHref/emailHref/waUrl/lat-lng/harita URL'leri burada bir kez üretilir;
 * ContactHero, ContactInfo, ContactMap, Footer ve ContactCTASection aynı mantığı kopyalamaz.
 */
export function useContactSettings() {
  const { settings } = useSiteSettings();

  return useMemo(() => {
    const phoneHref = settings.contactPhone
      ? `tel:${settings.contactPhone.replace(/[^\d+]/g, '')}`
      : undefined;
    const emailHref = `mailto:${settings.contactEmail}`;
    // WhatsApp linki için rakam-only + baştaki sıfırları temizlenmiş telefon.
    const phoneDigits = settings.contactPhone.replace(/[^\d]/g, '').replace(/^0+/, '');
    const waUrl = phoneDigits
      ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent('Merhaba, rüya tabirleri hakkında bilgi almak istiyorum.')}`
      : undefined;
    const lat = parseFloat(settings.mapLatitude) || parseFloat(MAP_LATITUDE);
    const lng = parseFloat(settings.mapLongitude) || parseFloat(MAP_LONGITUDE);
    const encodedAddress = encodeURIComponent(settings.contactAddress || `${lat},${lng}`);
    const mapUrls = {
      embed: `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_EMBED_KEY}&q=${encodedAddress}&zoom=12`,
      view: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
      directions: `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`,
    };

    return { settings, phoneHref, emailHref, waUrl, lat, lng, mapUrls };
  }, [settings]);
}
