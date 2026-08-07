import { Calendar, Volume2, Brain, Loader2, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DreamJournalEntry } from '@/types/database';
import { moodOptions } from '@/lib/dream-journal-constants';

interface SeriesCardProps {
  entry: DreamJournalEntry;
  analyzingId: string | null;
  handleAnalyze: (entry: DreamJournalEntry) => void;
  onViewAnalysis: (entry: DreamJournalEntry) => void;
  openEditDialog: (entry: DreamJournalEntry) => void;
  handleDelete: (id: string) => void;
}

export default function SeriesCard({
  entry,
  analyzingId,
  handleAnalyze,
  onViewAnalysis,
  openEditDialog,
  handleDelete,
}: SeriesCardProps) {
  return (
    <div className="dream-card group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{new Date(entry.dream_date).toLocaleDateString('tr-TR')}</span>
        </div>
        <div className="flex items-center gap-2">
          {entry.audio_url && (
            <span title="Ses kaydı var">
              <Volume2 className="h-4 w-4 text-emerald-500" />
            </span>
          )}
          {entry.mood && (
            <span className="text-2xl">
              {moodOptions.find(m => m.value === entry.mood)?.emoji}
            </span>
          )}
        </div>
      </div>

      <h3 className="text-lg font-serif font-semibold mb-2">{entry.title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{entry.content}</p>

      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {entry.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-muted">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {entry.ai_analysis ? (
          <Button variant="outline" size="sm" onClick={() => onViewAnalysis(entry)}>
            <Brain className="h-4 w-4 mr-1" />
            Analizi Gör
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => handleAnalyze(entry)} disabled={analyzingId === entry.id}>
            {analyzingId === entry.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Brain className="h-4 w-4 mr-1" />}
            {analyzingId === entry.id ? 'Analiz...' : 'AI Analiz'}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => openEditDialog(entry)}>
          <Edit className="h-4 w-4 mr-1" />
          Düzenle
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleDelete(entry.id)}>
          <Trash2 className="h-4 w-4 mr-1" />
          Sil
        </Button>
      </div>
    </div>
  );
}
