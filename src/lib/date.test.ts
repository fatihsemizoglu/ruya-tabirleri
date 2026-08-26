import { describe, it, expect } from 'vitest';
import { formatShortDate, formatLongDate, formatRelativeTime } from './date';

describe('formatShortDate', () => {
  it('ISO tarihi Türkçe kısa biçime çevirir', () => {
    const result = formatShortDate('2026-08-23T10:00:00Z');
    expect(result).toMatch(/Ağu/);
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/23|24/); // timezone kayması toleranslı
  });

  it('null/undefined için tire döner', () => {
    expect(formatShortDate(null)).toBe('-');
    expect(formatShortDate(undefined)).toBe('-');
  });

  it('geçersiz tarih için tire döner', () => {
    expect(formatShortDate('not-a-date')).toBe('-');
  });

  it('Date nesnesi kabul eder', () => {
    expect(formatShortDate(new Date(2026, 7, 23))).toMatch(/Ağu/);
  });
});

describe('formatLongDate', () => {
  it('saat bilgisini içerir', () => {
    const result = formatLongDate(new Date(2026, 0, 5, 14, 30));
    expect(result).toMatch(/Ocak|Şubat/);
    expect(result).toMatch(/14:30/);
  });
});

describe('formatRelativeTime', () => {
  it('geçmiş süre için "önce" döner', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoHoursAgo)).toContain('önce');
  });

  it('geçersiz tarih için tire döner', () => {
    expect(formatRelativeTime('garbage')).toBe('-');
  });
});
