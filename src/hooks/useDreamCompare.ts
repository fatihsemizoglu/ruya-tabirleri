import { useEffect, useState } from 'react';

const STORAGE_KEY = 'dream-compare-ids';
const MAX_COMPARE_ITEMS = 3;

function readCompareIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string').slice(0, MAX_COMPARE_ITEMS) : [];
  } catch {
    return [];
  }
}

function writeCompareIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_COMPARE_ITEMS)));
  window.dispatchEvent(new Event('dream-compare-change'));
}

export function useDreamCompare() {
  const [ids, setIds] = useState<string[]>(() => readCompareIds());

  useEffect(() => {
    const sync = () => setIds(readCompareIds());
    window.addEventListener('storage', sync);
    window.addEventListener('dream-compare-change', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('dream-compare-change', sync);
    };
  }, []);

  const add = (id: string) => {
    const current = readCompareIds();
    const next = [id, ...current.filter((item) => item !== id)].slice(0, MAX_COMPARE_ITEMS);
    writeCompareIds(next);
  };

  const remove = (id: string) => {
    writeCompareIds(readCompareIds().filter((item) => item !== id));
  };

  const clear = () => writeCompareIds([]);

  return { ids, add, remove, clear, isSelected: (id: string) => ids.includes(id), maxItems: MAX_COMPARE_ITEMS };
}
