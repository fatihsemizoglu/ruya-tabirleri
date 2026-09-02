import { describe, it, expect } from 'vitest';
import { supabaseSrcset, defaultSizes, supabaseResized } from './supabaseImage';

const STORAGE_URL =
  'https://abcxyz.supabase.co/storage/v1/object/public/media/cover.jpg';

describe('supabaseSrcset', () => {
  it('null/undefined için boş dize döndürür', () => {
    expect(supabaseSrcset(null)).toBe('');
    expect(supabaseSrcset(undefined)).toBe('');
  });

  it('Supabase olmayan URL\'i değiştirmez', () => {
    expect(supabaseSrcset('https://cdn.ornek.com/resim.jpg')).toBe(
      'https://cdn.ornek.com/resim.jpg'
    );
  });

  it('her genişlik için transform parametreli aday üretir', () => {
    const out = supabaseSrcset(STORAGE_URL, [320, 640]);
    expect(out).toContain(`${STORAGE_URL}?width=320&quality=75 320w`);
    expect(out).toContain(`${STORAGE_URL}?width=640&quality=75 640w`);
    expect(out.split(', ')).toHaveLength(2);
  });

  it('özel kalite değerini uygular', () => {
    const out = supabaseSrcset(STORAGE_URL, [320], 90);
    expect(out).toContain('quality=90');
  });

  it('query param içeren URL\'e & ile ekler', () => {
    const url = `${STORAGE_URL}?token=abc`;
    const out = supabaseSrcset(url, [320]);
    expect(out).toContain('?token=abc&width=320');
  });
});

describe('supabaseResized', () => {
  it('genişlik parametreli tek URL döndürür', () => {
    expect(supabaseResized(STORAGE_URL, 640)).toBe(
      `${STORAGE_URL}?width=640&quality=75`
    );
  });

  it('Supabase olmayan URL\'i olduğu gibi döndürür', () => {
    expect(supabaseResized('https://x.com/a.png', 100)).toBe('https://x.com/a.png');
  });

  it('null için boş dize döndürür', () => {
    expect(supabaseResized(null, 100)).toBe('');
  });
});

describe('defaultSizes', () => {
  it('varsayılan breakpoints içerir', () => {
    expect(defaultSizes()).toBe('(max-width: 640px) 100vw, (max-width: 1280px) 1280px, 100vw');
  });

  it('özel maxWidth uygular', () => {
    expect(defaultSizes(800)).toContain('(max-width: 800px) 800px');
  });
});
