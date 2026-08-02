import { generateSlug } from '@/lib/slug';
import type { Dream } from '@/types/database';

export type SymbolEntry = {
  term: string;
  slug: string;
  keyword: string;
  count: number;
  /** Example dream titles containing this symbol (max 3) */
  examples: string[];
};

const STOP_WORDS = new Set([
  'rüya', 'ruya', 'görmek', 'gormek', 'ne', 'demek', 'anlamı', 'anlami',
  'nedir', 'hakkında', 'sonucu', 'tabiri', 've', 'ile', 'veya', 'bir',
]);

export function slugifySymbol(name: string): string {
  return generateSlug(name);
}

export function isValidSymbol(term: string): boolean {
  const cleaned = term.trim();
  if (cleaned.length < 2 || cleaned.length > 40) return false;
  if (STOP_WORDS.has(cleaned.toLocaleLowerCase('tr-TR'))) return false;
  if (/^\d+$/.test(cleaned)) return false;
  return true;
}

/**
 * Derives a deduplicated, ordered glossary of symbols from a dreams array.
 * Symbols come from dream keywords primarily; falls back to title tokens
 * when keywords are missing. Count = number of dreams mentioning this term.
 */
export function buildSymbolGlossary(dreams: Dream[]): SymbolEntry[] {
  const map = new Map<string, SymbolEntry>();

  for (const dream of dreams) {
    const terms = new Set<string>();

    // Primary: curated keywords
    for (const kw of dream.keywords ?? []) {
      const t = kw.trim();
      if (isValidSymbol(t)) terms.add(t);
    }

    // Fallback: individual words from the title (only if keywords are absent)
    if (terms.size === 0 && dream.title) {
      for (const raw of dream.title.split(/\s+/)) {
        const t = raw.replace(/[^\p{L}\s]/gu, '').trim();
        if (isValidSymbol(t)) terms.add(t);
        if (terms.size >= 3) break;
      }
    }

    for (const term of terms) {
      const key = term.toLocaleLowerCase('tr-TR');
      const slug = slugifySymbol(term);
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        if (existing.examples.length < 3 && !existing.examples.includes(dream.title)) {
          existing.examples.push(dream.title);
        }
      } else {
        map.set(key, {
          term,
          slug,
          count: 1,
          keyword: term,
          examples: dream.title ? [dream.title] : [],
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.term.localeCompare(b.term, 'tr-TR'),
  );
}

/** Groups glossary entries by first letter (Turkish locale-aware) */
export function groupSymbolsByLetter(symbols: SymbolEntry[]): Map<string, SymbolEntry[]> {
  const groups = new Map<string, SymbolEntry[]>();
  for (const s of symbols) {
    let letter = s.term.charAt(0).toLocaleUpperCase('tr-TR');
    // Fold dotted I to İ for Turkish display
    if (letter === 'İ') letter = 'İ';
    const list = groups.get(letter) ?? [];
    list.push(s);
    groups.set(letter, list);
  }
  return groups;
}
