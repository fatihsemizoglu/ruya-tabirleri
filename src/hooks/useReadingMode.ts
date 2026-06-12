import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'reading-mode';
const CLASS_NAME = 'reading-mode';

function applyReadingMode(enabled: boolean) {
  const root = document.documentElement;
  if (enabled) root.classList.add(CLASS_NAME);
  else root.classList.remove(CLASS_NAME);
}

/**
 * Reading mode: hides header, footer, bottom-nav, and increases content width
 * and font size. Activated by adding `.reading-mode` to <html>.
 *
 * Components can use a CSS rule like:
 *   .reading-mode header { display: none }
 *   .reading-mode .content { max-width: 720px }
 */
export function useReadingMode() {
  const [isReadingMode, setIsReadingMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    applyReadingMode(isReadingMode);
  }, [isReadingMode]);

  const toggle = useCallback(() => {
    setIsReadingMode((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const enable = useCallback(() => {
    setIsReadingMode(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  const disable = useCallback(() => {
    setIsReadingMode(false);
    localStorage.setItem(STORAGE_KEY, 'false');
  }, []);

  return { isReadingMode, toggle, enable, disable };
}
