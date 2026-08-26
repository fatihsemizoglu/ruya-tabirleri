import { supabase } from '@/integrations/supabase/client';

export interface InterpretationResult {
  general_meaning?: string;
  islamic_interpretation?: string;
  psychological_interpretation?: string;
  keywords?: string[];
  similarDreams?: { id: string; title: string; slug: string }[];
}

const MIN_CHARS = 10;
const MAX_CHARS = 4000;

/** Günlük ücretsiz yorum hakkı (freemium kancası). */
export const FREE_DAILY_LIMIT = 3;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readUsage(): number {
  try {
    const raw = localStorage.getItem('interpret_usage');
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { date: string; count: number };
    if (parsed.date !== todayKey()) return 0;
    return typeof parsed.count === 'number' ? parsed.count : 0;
  } catch {
    return 0;
  }
}

function writeUsage(count: number): void {
  try {
    localStorage.setItem('interpret_usage', JSON.stringify({ date: todayKey(), count }));
  } catch {
    /* localStorage yoksa sessizce geç */
  }
}

export function getRemainingFreeUses(): number {
  return Math.max(0, FREE_DAILY_LIMIT - readUsage());
}

export function interpretDreamText(text: string): Promise<InterpretationResult> {
  const trimmed = text.trim();
  if (trimmed.length < MIN_CHARS) {
    return Promise.reject(new Error(`Rüyanızı en az ${MIN_CHARS} karakter yazarak anlatın.`));
  }
  if (trimmed.length > MAX_CHARS) {
    return Promise.reject(new Error(`Rüya metni en fazla ${MAX_CHARS} karakter olabilir.`));
  }
  if (getRemainingFreeUses() <= 0) {
    return Promise.reject(new Error('FREE_LIMIT_REACHED'));
  }

  return supabase.functions
    .invoke<InterpretationResult>('interpret-dream', { body: { dreamText: trimmed } })
    .then(({ data, error }) => {
      if (error) throw new Error(error.message || 'Yorum oluşturulamadı');
      const result = data as (InterpretationResult & { error?: string }) | null;
      if (!result || result.error) throw new Error(result?.error || 'Yorum oluşturulamadı');
      writeUsage(readUsage() + 1);
      return result as InterpretationResult;
    });
}
