import { describe, it, expect } from 'vitest';
import { normalizeSocialUrl } from '@/lib/social';

describe('normalizeSocialUrl', () => {
  it('protokolsüz URLye https:// ekler', () => {
    expect(normalizeSocialUrl('instagram.com/semizoglu.fatih/')).toBe('https://instagram.com/semizoglu.fatih/');
    expect(normalizeSocialUrl('x.com/Fatihs55')).toBe('https://x.com/Fatihs55');
  });

  it('https:// ile başlayan URL aynen kalır', () => {
    expect(normalizeSocialUrl('https://www.facebook.com/FatihSemizoglu/')).toBe('https://www.facebook.com/FatihSemizoglu/');
    expect(normalizeSocialUrl('https://x.com/Fatihs55')).toBe('https://x.com/Fatihs55');
  });

  it('// ile başlayan protokol-göreli URL aynen kalır', () => {
    expect(normalizeSocialUrl('//www.youtube.com/@fatihsemizoglu')).toBe('//www.youtube.com/@fatihsemizoglu');
  });

  it('başka protokollü URL (mailto, tel) aynen kalır', () => {
    expect(normalizeSocialUrl('mailto:info@example.com')).toBe('mailto:info@example.com');
    expect(normalizeSocialUrl('tel:+905322915255')).toBe('tel:+905322915255');
  });

  it('eksotik protokoller (javascript: vb.) reddedilir', () => {
    expect(normalizeSocialUrl('javascript:alert(1)')).toBe('');
    expect(normalizeSocialUrl('data:text/html,x')).toBe('');
  });

  it('HTTP:// büyük harf protokol aynen kalır (case-insensitive)', () => {
    expect(normalizeSocialUrl('HTTP://www.instagram.com/x')).toBe('HTTP://www.instagram.com/x');
  });

  it('boş/undefined değer boş string döner', () => {
    expect(normalizeSocialUrl('')).toBe('');
    expect(normalizeSocialUrl(undefined)).toBe('');
    expect(normalizeSocialUrl('   ')).toBe('');
  });

  it('çevresindeki boşlukları temizler', () => {
    expect(normalizeSocialUrl('  instagram.com/x  ')).toBe('https://instagram.com/x');
  });
});
