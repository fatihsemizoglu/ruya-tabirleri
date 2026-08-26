import { describe, it, expect } from 'vitest';
import { generateSlug } from './slug';

describe('generateSlug', () => {
  it('Türkçe karakterleri dönüştürür', () => {
    expect(generateSlug('Rüyada Yılan Görmek')).toBe('ruyada-yilan-gormek');
    expect(generateSlug('ÇİĞDEM ÜŞÜYOR ŞÖYLE')).toBe('cigdem-usuyor-soyle');
  });

  it('ı ve i ayrımını doğru yapar', () => {
    expect(generateSlug('Işık')).toBe('isik');
    expect(generateSlug('İnek')).toBe('inek');
  });

  it('boşlukları ve özel karakterleri tireye çevirir', () => {
    expect(generateSlug('para & altın!')).toBe('para-altin');
    expect(generateSlug('  çok   boşluk  ')).toBe('cok-bosluk');
  });

  it('baştaki/sondaki tireleri kaldırır', () => {
    expect(generateSlug('--deneme--')).toBe('deneme');
    expect(generateSlug('!!!')).toBe('');
  });

  it('rakamları korur', () => {
    expect(generateSlug('2026 Rüyası')).toBe('2026-ruyasi');
  });
});
