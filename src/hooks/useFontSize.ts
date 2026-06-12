import { useCallback, useEffect, useState } from 'react';

export type FontSize = 'sm' | 'md' | 'lg' | 'xl';

const STORAGE_KEY = 'font-size';
const DEFAULT_SIZE: FontSize = 'md';

const SIZES: Record<FontSize, string> = {
  sm: '14px',
  md: '16px',
  lg: '18px',
  xl: '20px',
};

const VALID = new Set<FontSize>(['sm', 'md', 'lg', 'xl']);
const ORDER: FontSize[] = ['sm', 'md', 'lg', 'xl'];

function applyFontSize(size: FontSize) {
  document.documentElement.style.setProperty('--app-font-size', SIZES[size]);
}

function readStoredSize(): FontSize {
  if (typeof window === 'undefined') return DEFAULT_SIZE;
  const v = localStorage.getItem(STORAGE_KEY) as FontSize | null;
  return v && VALID.has(v) ? v : DEFAULT_SIZE;
}

interface UseFontSizeResult {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  cycleUp: () => void;
  cycleDown: () => void;
}

/**
 * Global font size preference, applied via `--app-font-size` CSS variable on
 * the document root. The variable defaults to 16px (body) when unset.
 */
export function useFontSize(): UseFontSizeResult {
  const [fontSize, setFontSizeState] = useState<FontSize>(readStoredSize);

  useEffect(() => {
    applyFontSize(fontSize);
  }, [fontSize]);

  const setFontSize = useCallback((size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem(STORAGE_KEY, size);
  }, []);

  const cycleUp = useCallback(() => {
    setFontSizeState((prev) => {
      const next = ORDER[Math.min(ORDER.indexOf(prev) + 1, ORDER.length - 1)];
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);
  const cycleDown = useCallback(() => {
    setFontSizeState((prev) => {
      const next = ORDER[Math.max(ORDER.indexOf(prev) - 1, 0)];
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { fontSize, setFontSize, cycleUp, cycleDown };
}
