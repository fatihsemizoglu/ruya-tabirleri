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
    <article
      className="dream-card group w-72 shrink-0 snap-start"
      aria-label={entry.title}
    >
      {/* Tek satır: tarih · başlık · içerik önizlemesi */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(entry.dream_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-serif font-semibold truncate">{entry.title}</h3>
          <p className="text-xs text-muted-foreground truncate">{entry.content}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {entry.audio_url && (
            <span title="Ses kaydı var">
              <Volume2 className="h-3.5 w-3.5 text-emerald-500" />
            </span>
          )}
          {entry.mood && (
            <span className="text-base">
              {moodOptions.find(m => m.value === entry.mood)?.emoji}
            </span>
          )}
        </div>
      </div>

      {/* Etiketler (en fazla 2) */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {entry.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-[10px] rounded-full bg-muted">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Aksiyonlar — kompakt ikon butonlar */}
      <div className="flex items-center gap-1.5 mt-3 opacity-60 group-hover:opacity-100 transition-opacity">
        {entry.ai_analysis ? (
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => onViewAnalysis(entry)}>
            <Brain className="h-3.5 w-3.5 mr-1" />
            Analiz
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => handleAnalyze(entry)}
            disabled={analyzingId === entry.id}
          >
            {analyzingId === entry.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Brain className="h-3.5 w-3.5 mr-1" />}
            {analyzingId === entry.id ? 'Analiz...' : 'AI Analiz'}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="Düzenle"
          aria-label={`${entry.title} kaydını düzenle`}
          onClick={() => openEditDialog(entry)}
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          title="Sil"
          aria-label={`${entry.title} kaydını sil`}
          onClick={() => handleDelete(entry.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </article>
  );
}
