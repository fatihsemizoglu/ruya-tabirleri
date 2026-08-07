import { describe, it, expect } from 'vitest';
import { isValidEmail } from '@/lib/validation/email';

describe('isValidEmail', () => {
  it('geçerli e-postaları kabul eder', () => {
    expect(isValidEmail('fatihsemizoglu@gmail.com')).toBe(true);
    expect(isValidEmail('info@ruyatabirleri.com')).toBe(true);
    expect(isValidEmail('kullanici@sub.domain.co')).toBe(true);
  });

  it('çevresindeki boşlukları tolere eder', () => {
    expect(isValidEmail('  fatih@example.com  ')).toBe(true);
  });

  it('boş/eksik değerleri reddeder', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('   ')).toBe(false);
    expect(isValidEmail('abc')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('a@b.c')).toBe(false);
  });

  it('boşluk/geçersiz karakter içerenleri reddeder', () => {
    expect(isValidEmail('fatih semizoglu@gmail.com')).toBe(false);
    expect(isValidEmail('@gmail.com')).toBe(false);
    expect(isValidEmail('fatih@')).toBe(false);
  });

  it('200 karakter üstü e-postaları reddeder', () => {
    expect(isValidEmail(`${'a'.repeat(200)}@example.com`)).toBe(false);
  });
});
