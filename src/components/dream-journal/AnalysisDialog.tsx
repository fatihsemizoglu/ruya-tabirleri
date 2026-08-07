import { Brain, Share2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getSentimentEmoji, getSentimentLabel } from '@/lib/ai-analysis';
import type { DreamAnalysis } from '@/lib/ai-analysis';
import { shareDreamCard, copyDreamCard } from '@/lib/share';
import { notify } from '@/lib/notify';
import type { DreamJournalEntry } from '@/types/database';

interface AnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: DreamAnalysis | null;
  entry: DreamJournalEntry | null;
}

export default function AnalysisDialog({ open, onOpenChange, result, entry }: AnalysisDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl border-border/45 bg-card text-card-foreground shadow-2xl dark:border-white/10 dark:bg-slate-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-500" />
            AI Rüya Analizi
          </DialogTitle>
        </DialogHeader>
        {result && entry && (
          <div className="space-y-4">
            <div className="rounded-xl bg-violet-500/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{entry.title}</h4>
                <span className="text-2xl">{getSentimentEmoji(result.sentiment)}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(entry.dream_date).toLocaleDateString('tr-TR')}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Duygu Durumu</h4>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-violet-500/10 text-violet-700 dark:text-violet-300">
                {getSentimentEmoji(result.sentiment)} {getSentimentLabel(result.sentiment)} (%{Math.round(result.confidence * 100)})
              </span>
            </div>

            {result.symbols.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Semboller</h4>
                <div className="flex flex-wrap gap-1.5">
                  {result.symbols.map((symbol) => (
                    <span key={symbol} className="px-2.5 py-1 text-xs rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      {symbol}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Yorum</h4>
              <p className="text-sm leading-relaxed text-card-foreground/90">
                {result.interpretation}
              </p>
            </div>

            {result.advice && (
              <div className="rounded-xl bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 border border-violet-500/10 p-4">
                <h4 className="text-sm font-medium text-violet-600 dark:text-violet-400 mb-1">Öneri</h4>
                <p className="text-sm leading-relaxed text-card-foreground/80">
                  {result.advice}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => shareDreamCard({
                title: entry.title,
                content: entry.content,
                date: entry.dream_date,
                mood: entry.mood,
                tags: entry.tags,
                sentiment: result.sentiment,
                interpretation: result.interpretation,
              })}>
                <Share2 className="h-4 w-4 mr-1" />
                Paylaş
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                copyDreamCard({
                  title: entry.title,
                  content: entry.content,
                  date: entry.dream_date,
                  mood: entry.mood,
                  tags: entry.tags,
                  sentiment: result.sentiment,
                  interpretation: result.interpretation,
                });
                notify.success('Karta kopyalandı');
              }}>
                <Copy className="h-4 w-4 mr-1" />
                Kopyala
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
