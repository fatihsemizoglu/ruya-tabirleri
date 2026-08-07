import type { DreamMood } from '@/types/database';

export interface JournalFormData {
  title: string;
  content: string;
  dream_date: string;
  mood: DreamMood | '';
  tags: string;
  series_id: string;
}

export function createEmptyJournalForm(): JournalFormData {
  return {
    title: '',
    content: '',
    dream_date: new Date().toISOString().split('T')[0] ?? '',
    mood: '',
    tags: '',
    series_id: '',
  };
}

export const moodOptions: { value: DreamMood; label: string; emoji: string }[] = [
  { value: 'happy', label: 'Mutlu', emoji: '😊' },
  { value: 'sad', label: 'Üzgün', emoji: '😢' },
  { value: 'scared', label: 'Korkmuş', emoji: '😨' },
  { value: 'confused', label: 'Şaşkın', emoji: '😕' },
  { value: 'peaceful', label: 'Huzurlu', emoji: '😌' },
  { value: 'anxious', label: 'Endişeli', emoji: '😰' },
  { value: 'excited', label: 'Heyecanlı', emoji: '🤩' },
  { value: 'neutral', label: 'Nötr', emoji: '😐' },
];
