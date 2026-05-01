import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

type Mood = 'mutlu' | 'uzgun' | 'korku' | 'heyecan' | 'sakin' | 'berbat';

const moods: { value: Mood; label: string; emoji: string }[] = [
  { value: 'mutlu', label: 'Mutlu', emoji: '😊' },
  { value: 'uzgun', label: 'Üzgün', emoji: '😢' },
  { value: 'korku', label: 'Korku', emoji: '😨' },
  { value: 'heyecan', label: 'Heyecan', emoji: '🤩' },
  { value: 'sakin', label: 'Sakin', emoji: '😌' },
  { value: 'berbat', label: 'Berbat', emoji: '😔' },
];

interface MoodEntry {
  date: string;
  mood: Mood;
  dreamId?: string;
}

interface MoodTrackerProps {
  onSelect?: (mood: Mood) => void;
  showHistory?: boolean;
}

export function MoodTracker({ onSelect, showHistory = false }: MoodTrackerProps) {
  const [selected, setSelected] = useState<Mood | null>(null);
  const [history, setHistory] = useState<MoodEntry[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('moodHistory');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleSelect = (mood: Mood) => {
    setSelected(mood);
    const entry: MoodEntry = { date: new Date().toISOString(), mood };
    const updated = [entry, ...history].slice(0, 30);
    setHistory(updated);
    localStorage.setItem('moodHistory', JSON.stringify(updated));
    onSelect?.(mood);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {moods.map(m => (
          <button
            key={m.value}
            onClick={() => handleSelect(m.value)}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm transition-colors',
              selected === m.value ? 'border-primary bg-primary/10' : 'hover:border-primary/50'
            )}
          >
            <span>{m.emoji}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>
      {showHistory && history.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Son rüya ruh halin: {moods.find(m => m.value === history[0].mood)?.emoji}
        </div>
      )}
    </div>
  );
}