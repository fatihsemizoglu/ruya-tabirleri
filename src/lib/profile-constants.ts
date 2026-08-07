import type { DreamMood } from '@/types/database';

export type MoodValue = DreamMood | '';

export const moodOptions: { value: DreamMood; key: string; emoji: string }[] = [
  { value: 'happy', key: 'moodHappy', emoji: '😊' },
  { value: 'sad', key: 'moodSad', emoji: '😢' },
  { value: 'scared', key: 'moodScared', emoji: '😨' },
  { value: 'confused', key: 'moodConfused', emoji: '😕' },
  { value: 'peaceful', key: 'moodPeaceful', emoji: '😌' },
  { value: 'anxious', key: 'moodAnxious', emoji: '😰' },
  { value: 'excited', key: 'moodExcited', emoji: '🤩' },
  { value: 'neutral', key: 'moodNeutral', emoji: '😐' },
];

export const moodColors: Record<string, { ring: string; text: string; bg: string }> = {
  happy: { ring: 'stroke-amber-400', text: 'text-amber-500', bg: 'bg-amber-500/10' },
  sad: { ring: 'stroke-blue-400', text: 'text-blue-500', bg: 'bg-blue-500/10' },
  scared: { ring: 'stroke-purple-500', text: 'text-purple-500', bg: 'bg-purple-500/10' },
  confused: { ring: 'stroke-orange-400', text: 'text-orange-500', bg: 'bg-orange-500/10' },
  peaceful: { ring: 'stroke-emerald-400', text: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  anxious: { ring: 'stroke-rose-400', text: 'text-rose-500', bg: 'bg-rose-500/10' },
  excited: { ring: 'stroke-pink-500', text: 'text-pink-500', bg: 'bg-pink-500/10' },
  neutral: { ring: 'stroke-slate-400', text: 'text-slate-500', bg: 'bg-slate-500/10' },
};
