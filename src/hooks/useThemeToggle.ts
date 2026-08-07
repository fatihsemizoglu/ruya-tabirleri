import { useState, useEffect, useCallback } from 'react';

/**
 * Temayı <html> üzerindeki 'dark' sınıfı + localStorage('theme') ile yönetir.
 * Bu hook tek yazıcıdır; diğer tüketiciler (sonner vb.) salt okunur
 * `useTheme` hook'u ile aynı kaynağı okur.
 */
export function useThemeToggle() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  // Başlangıçta kayıtlı tercihi (localStorage → sistem fallback'i) uygula.
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const activeTheme = savedTheme || systemTheme;
    if (activeTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  // isDark değişince DOM + localStorage'a uygula (idempotent — mount'ta da güvenli).
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Tarayıcı chrome'unu (adres çubuğu / PWA penceresi) aktif temayla senkronize et.
  // index.html'deki media'li static meta ilk boyamayı karşılar; JS devralınca
  // çakışmayı önlemek için kaldırılır — tarayıcı eşleşen media'lı son metayı
  // uyguladığından, koyu OS + açık tema durumunda yanlış renk kazanabilirdi.
  useEffect(() => {
    const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
    const primary = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])');
    metas.forEach((m) => {
      if (m !== primary) m.remove();
    });
    if (primary) {
      primary.setAttribute('content', isDark ? '#0f172a' : '#6366f1');
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  return { isDark, toggleTheme };
}
