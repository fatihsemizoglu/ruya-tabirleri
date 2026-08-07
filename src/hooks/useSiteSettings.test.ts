import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SITE_SETTINGS,
  mergeSiteSettings,
} from '@/hooks/useSiteSettings';
import {
  SITE_EMAIL,
  SITE_PHONE,
  SITE_ADDRESS,
  SITE_WORKING_HOURS,
  MAP_LATITUDE,
  MAP_LONGITUDE,
} from '@/lib/config';

// Canlı DB'den çekilen gerçek satırlar (site_settings key-value tablosu).
// Not: contact_email/site_description/site_name/contactLocation gibi
// legacy anahtarlar bilinçli olarak listede — merge yok saymalı.
//
// ⚠️ Bu snapshot statiktir; canlı DB'de değer değişirse TAZELENMELİDİR.
// Yetkili canlı kontrol scripts/check-site-settings.mjs'tir — bu test yalnızca
// merge davranışını ve config↔snapshot eşleşmesini pinler.
const LIVE_DB_ROWS: { key: string; value: unknown }[] = [
  { key: 'analyticsEnabled', value: true },
  { key: 'contact_email', value: 'info@ruyatabirleri.com' },
  { key: 'contactAddress', value: 'Atakum, Samsun, Türkiye' },
  { key: 'contactEmail', value: 'fatihsemizoglu@gmail.com' },
  { key: 'contactLocation', value: 'Atakum, Samsun, Türkiye' },
  { key: 'contactPhone', value: '+90 532 291 52 55' },
  { key: 'contactWorkingHours', value: 'Pzt - Cum: 09:00 - 18:00' },
  { key: 'enableComments', value: true },
  { key: 'maintenanceMode', value: false },
  { key: 'mapLatitude', value: '41.32833' },
  { key: 'mapLongitude', value: '36.28500' },
  { key: 'metaDescription', value: 'Binlerce rüya tabiri arasında arama yapın. İslami ve psikolojik yorumlarla rüyalarınızın anlamını keşfedin.' },
  { key: 'metaKeywords', value: 'rüya tabiri, rüya yorumu, islami rüya tabiri, rüya sözlüğü' },
  { key: 'metaTitle', value: 'Rüya Tabirleri - En Kapsamlı Rüya Yorumları' },
  { key: 'requireApproval', value: true },
  { key: 'site_description', value: 'Binlerce rüya tabiri arasında arama yapın' },
  { key: 'site_name', value: 'Rüya Tabirleri' },
  { key: 'siteDescription', value: "Türkiye'nin en kapsamlı rüya tabirleri sitesi" },
  { key: 'siteName', value: 'Rüya Tabirleri' },
  { key: 'socialFacebook', value: 'https://www.facebook.com/FatihSemizoglu/' },
  { key: 'socialInstagram', value: 'https://instagram.com/semizoglu.fatih/' },
  { key: 'socialTwitter', value: 'https://x.com/Fatihs55' },
  { key: 'socialYoutube', value: 'https://www.youtube.com/@fatihsemizoglu' },
];

describe('mergeSiteSettings', () => {
  it('DB değerlerini DEFAULT_SITE_SETTINGS üzerine ezer', () => {
    const merged = mergeSiteSettings(LIVE_DB_ROWS);
    expect(merged.contactPhone).toBe('+90 532 291 52 55');
    expect(merged.contactEmail).toBe('fatihsemizoglu@gmail.com');
    expect(merged.contactAddress).toBe('Atakum, Samsun, Türkiye');
    expect(merged.mapLatitude).toBe('41.32833');
    expect(merged.mapLongitude).toBe('36.28500');
    expect(merged.siteName).toBe('Rüya Tabirleri');
  });

  it('legacy/fazladan anahtarları yok sayar (contact_email, site_description, contactLocation)', () => {
    const merged = mergeSiteSettings(LIVE_DB_ROWS);
    // Legacy contact_email anahtarı, kodun okuduğu contactEmail'i ezmemeli
    expect(merged.contactEmail).toBe('fatihsemizoglu@gmail.com');
    expect(merged.contactEmail).not.toBe('info@ruyatabirleri.com');
  });

  it('prototype anahtarları (toString/constructor) uygulanmaz', () => {
    const merged = mergeSiteSettings([
      { key: 'toString', value: 'bozuk' },
      { key: 'constructor', value: 'bozuk' },
    ]);
    expect(merged.toString).toBe(Object.prototype.toString);
    expect(merged.contactPhone).toBe(SITE_PHONE);
  });

  it('tanımsız anahtarlar default değerleri korur', () => {
    const merged = mergeSiteSettings([{ key: 'contactPhone', value: '+90 111 222 33 44' }]);
    expect(merged.contactPhone).toBe('+90 111 222 33 44');
    // Dokunulmayan alanlar default'ta kalır
    expect(merged.contactAddress).toBe(SITE_ADDRESS);
    expect(merged.contactEmail).toBe(SITE_EMAIL);
  });

  it('null/undefined değerler defaultu ezmez', () => {
    const merged = mergeSiteSettings([
      { key: 'contactPhone', value: null },
      { key: 'contactEmail', value: undefined },
    ]);
    expect(merged.contactPhone).toBe(SITE_PHONE);
    expect(merged.contactEmail).toBe(SITE_EMAIL);
  });

  it('boş satır listesi defaultu döndürür', () => {
    expect(mergeSiteSettings([])).toEqual(DEFAULT_SITE_SETTINGS);
  });
});

// Config sabitleri ↔ DEFAULT_SITE_SETTINGS ↔ canlı DB arasındaki
// uçtan uca tutarlılık: placeholder'lar ve fallback'ler aynı kaynaktan gelmeli.
describe('config ↔ DEFAULT_SITE_SETTINGS tutarlılığı', () => {
  it('iletişim defaultları config sabitlerinden gelir', () => {
    expect(DEFAULT_SITE_SETTINGS.contactPhone).toBe(SITE_PHONE);
    expect(DEFAULT_SITE_SETTINGS.contactEmail).toBe(SITE_EMAIL);
    expect(DEFAULT_SITE_SETTINGS.contactAddress).toBe(SITE_ADDRESS);
    expect(DEFAULT_SITE_SETTINGS.contactWorkingHours).toBe(SITE_WORKING_HOURS);
    expect(DEFAULT_SITE_SETTINGS.mapLatitude).toBe(MAP_LATITUDE);
    expect(DEFAULT_SITE_SETTINGS.mapLongitude).toBe(MAP_LONGITUDE);
  });

  it('config sabitleri canlı DB değerleriyle birebir aynı', () => {
    const live = new Map(LIVE_DB_ROWS.map((r) => [r.key, r.value]));
    expect(SITE_PHONE).toBe(live.get('contactPhone'));
    expect(SITE_EMAIL).toBe(live.get('contactEmail'));
    expect(SITE_ADDRESS).toBe(live.get('contactAddress'));
    expect(SITE_WORKING_HOURS).toBe(live.get('contactWorkingHours'));
    expect(MAP_LATITUDE).toBe(live.get('mapLatitude'));
    expect(MAP_LONGITUDE).toBe(live.get('mapLongitude'));
  });

  it('canlı DB merge sonucu config ile eşleşir (uygulamanın gördüğü değerler)', () => {
    const merged = mergeSiteSettings(LIVE_DB_ROWS);
    expect(merged.contactPhone).toBe(SITE_PHONE);
    expect(merged.contactEmail).toBe(SITE_EMAIL);
    expect(merged.contactAddress).toBe(SITE_ADDRESS);
    expect(merged.mapLatitude).toBe(MAP_LATITUDE);
    expect(merged.mapLongitude).toBe(MAP_LONGITUDE);
  });
});
