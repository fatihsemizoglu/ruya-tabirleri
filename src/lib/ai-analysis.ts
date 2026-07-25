import { supabase } from '@/integrations/supabase/client';

export interface DreamAnalysis {
  symbols: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  interpretation: string;
  advice: string;
  confidence: number;
}

export async function analyzeDream(content: string, title?: string): Promise<DreamAnalysis> {
  const { data, error } = await supabase.functions.invoke('analyze-dream', {
    body: { content, title },
  });

  if (error) {
    throw new Error(error.message || 'AI analizi sırasında bir hata oluştu');
  }

  if (!data || data.error) {
    throw new Error(data?.error || 'Analiz sonucu alınamadı');
  }

  return data as DreamAnalysis;
}

export function getSentimentEmoji(sentiment: string): string {
  switch (sentiment) {
    case 'positive': return '😊';
    case 'negative': return '😟';
    default: return '😐';
  }
}

export function getSentimentLabel(sentiment: string): string {
  switch (sentiment) {
    case 'positive': return 'Olumlu';
    case 'negative': return 'Olumsuz';
    default: return 'Nötr';
  }
}

export function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case 'positive': return 'text-emerald-500';
    case 'negative': return 'text-red-500';
    default: return 'text-yellow-500';
  }
}
