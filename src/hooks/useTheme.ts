import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

/**
 * Aktif temayı DOM'dan çözer. Header, temayı document.documentElement
 * üzerindeki 'dark' sınıfı + localStorage('theme') ile yönettiği için
 * bu hook aynı kaynağı okur; böylece sonner vb. bileşenler her zaman
 * gerçekte uygulanan temayla senkron kalır.
 */
function resolveTheme(): Theme {
  if (typeof document === 'undefined') return 'light';

  // Header classList'e 'dark' ekler — DOM her zaman tek doğru kaynaktır.
  if (document.documentElement.classList.contains('dark')) return 'dark';
  if (document.documentElement.classList.contains('light')) return 'light';

  // Sınıf yoksa (ör. Header henüz mount olmadıysa) localStorage → sistem fallback'i.
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  if (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark';
  }
  return 'light';
}

/**
 * Header'ın (classList + localStorage) yaptığı tema yönetimini okuyan hook.
 * MutationObserver ile <html> üzerindeki 'dark' sınıfı izlenir; tema değişince
 * bileşen yeniden render edilir — Header'ın toggle'ı anında yansır.
 */
export function useTheme(): { theme: Theme } {
  const [theme, setTheme] = useState<Theme>(resolveTheme);

  useEffect(() => {
    setTheme(resolveTheme());

    const observer = new MutationObserver(() => {
      setTheme(resolveTheme());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return { theme };
}
