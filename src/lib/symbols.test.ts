import { describe, it, expect } from 'vitest';
import type { Dream } from '@/types/database';
import {
  slugifySymbol,
  isValidSymbol,
  buildSymbolGlossary,
  groupSymbolsByLetter,
} from './symbols';

function dream(partial: Partial<Dream> & Pick<Dream, 'id' | 'title' | 'slug' | 'content'>): Dream {
  return {
    islamic_interpretation: null,
    psychological_interpretation: null,
    category_id: null,
    keywords: [],
    view_count: 0,
    like_count: 0,
    is_featured: false,
    is_published: true,
    meta_title: null,
    meta_description: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...partial,
  };
}

describe('slugifySymbol', () => {
  it('Türkçe karakterleri ASCII slug\'a çevirir', () => {
    expect(slugifySymbol('Şeker')).toBe('seker');
    expect(slugifySymbol('Su İçmek')).toBe('su-icmek');
  });
});

describe('isValidSymbol', () => {
  it('stop words\'ü reddeder', () => {
    expect(isValidSymbol('görmek')).toBe(false);
    expect(isValidSymbol('tabiri')).toBe(false);
  });

  it('çok kısa/uzun terimleri reddeder', () => {
    expect(isValidSymbol('a')).toBe(false);
    expect(isValidSymbol('x'.repeat(41))).toBe(false);
  });

  it('sadece rakamları reddeder', () => {
    expect(isValidSymbol('123')).toBe(false);
  });

  it('geçerli sembolü kabul eder', () => {
    expect(isValidSymbol('Yılan')).toBe(true);
  });
});

describe('buildSymbolGlossary', () => {
  it('keyword\'lerden sözlük üretir ve sayar', () => {
    const dreams = [
      dream({ id: '1', title: 'Yılan görmek', slug: 'yilan', content: '', keywords: ['Yılan'] }),
      dream({ id: '2', title: 'Yılan ısırmak', slug: 'yilan-isirmak', content: '', keywords: ['yılan'] }),
    ];
    const out = buildSymbolGlossary(dreams);
    expect(out).toHaveLength(1);
    expect(out[0]!.term).toBe('Yılan');
    expect(out[0]!.count).toBe(2);
    expect(out[0]!.examples).toHaveLength(2);
  });

  it('keyword yoksa başlık kelimelerine düşer (max 3)', () => {
    const d = dream({ id: '1', title: 'Kara Kedi Su Bahçe Deniz Bahçe', slug: 'x', content: '' });
    const out = buildSymbolGlossary([d]);
    expect(out.length).toBeLessThanOrEqual(3);
  });

  it('stop word\'leri sembol olarak eklemez', () => {
    const d = dream({ id: '1', title: 'Rüya görmek ne demek', slug: 'x', content: '' });
    const out = buildSymbolGlossary([d]);
    expect(out).toHaveLength(0);
  });

  it('örnek sayısı 3 ile sınırlıdır', () => {
    const dreams = ['1', '2', '3', '4'].map((id) =>
      dream({ id, title: `Yılan ${id}`, slug: `yilan-${id}`, content: '', keywords: ['Yılan'] })
    );
    const out = buildSymbolGlossary(dreams);
    expect(out[0]!.examples).toHaveLength(3);
  });

  it('Türkçe locale sıralaması tutarlıdır', () => {
    const dreams = [
      dream({ id: '1', title: 'Z', slug: 'z', content: '', keywords: ['Zebra'] }),
      dream({ id: '2', title: 'A', slug: 'a', content: '', keywords: ['Arslan'] }),
      dream({ id: '3', title: 'Ş', slug: 's', content: '', keywords: ['Şeker'] }),
    ];
    const terms = buildSymbolGlossary(dreams).map((s) => s.term);
    expect(terms).toEqual([...terms].sort((a, b) => a.localeCompare(b, 'tr-TR')));
    expect(terms[0]).toBe('Arslan');
  });
});

describe('groupSymbolsByLetter', () => {
  it('ilk harfe göre gruplar', () => {
    const symbols = buildSymbolGlossary([
      dream({ id: '1', title: 'A', slug: 'a', content: '', keywords: ['Arslan'] }),
      dream({ id: '2', title: 'B', slug: 'b', content: '', keywords: ['Balık'] }),
    ]);
    const groups = groupSymbolsByLetter(symbols);
    expect(groups.get('A')?.map((s) => s.term)).toEqual(['Arslan']);
    expect(groups.get('B')?.map((s) => s.term)).toEqual(['Balık']);
  });

  it('Türkçe İ harfini doğru gruplar', () => {
    const symbols = buildSymbolGlossary([
      dream({ id: '1', title: 'İ', slug: 'i', content: '', keywords: ['İnek'] }),
    ]);
    const groups = groupSymbolsByLetter(symbols);
    expect(groups.has('İ')).toBe(true);
  });
});
