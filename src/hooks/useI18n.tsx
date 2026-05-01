import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Locale, LOCALES, t as translate, getLocaleFromPath } from '@/lib/i18n';
import { useLocation } from 'react-router-dom';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
  locales: typeof LOCALES;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('locale') as Locale;
    return saved || getLocaleFromPath(location.pathname);
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
    document.documentElement.lang = newLocale;
    document.documentElement.dir = LOCALES[newLocale].dir;
  }, []);

  const t = useCallback((key: string) => translate(key, locale), [locale]);

  return (
    <I18nContext.Provider value={{
      locale,
      setLocale,
      t,
      dir: LOCALES[locale].dir,
      locales: LOCALES,
    }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      locale: 'tr' as Locale,
      setLocale: () => {},
      t: (key: string) => translate(key, 'tr'),
      dir: 'ltr' as const,
      locales: LOCALES,
    };
  }
  return context;
}
