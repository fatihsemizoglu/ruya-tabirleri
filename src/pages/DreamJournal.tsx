import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, Book, BookOpen, Mic, WifiOff, RefreshCw, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { PullToRefresh } from '@/components/PullToRefresh';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage, notify } from '@/lib/notify';
import { captureError } from '@/lib/logger';
import { analyzeDream } from '@/lib/ai-analysis';
import type { DreamAnalysis } from '@/lib/ai-analysis';
import type { DreamJournalEntry } from '@/types/database';
import { getPendingJournalEntries, savePendingJournalEntry, syncPendingJournalEntries } from '@/lib/voiceDreamDB';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import SeriesCard from '@/components/dream-journal/SeriesCard';
import JournalFormDialog from '@/components/dream-journal/JournalFormDialog';
import type { JournalFormDialogHandle } from '@/components/dream-journal/JournalFormDialog';
import AnalysisDialog from '@/components/dream-journal/AnalysisDialog';
import { createEmptyJournalForm } from '@/lib/dream-journal-constants';
import type { JournalFormData } from '@/lib/dream-journal-constants';

export default function DreamJournal() {
  const { user, isLoading: authLoading } = useAuth();
  const [entries, setEntries] = useState<DreamJournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DreamJournalEntry | null>(null);
  const [formData, setFormData] = useState<JournalFormData>(() => createEmptyJournalForm());
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);
  const [voiceAutoStartToken, setVoiceAutoStartToken] = useState(0);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DreamAnalysis | null>(null);
  const [analysisEntry, setAnalysisEntry] = useState<DreamJournalEntry | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const audioRecorder = useAudioRecorder(user?.id);
  const formDialogRef = useRef<JournalFormDialogHandle>(null);

  const seriesMap = useMemo(() => {
    const map = new Map<string, DreamJournalEntry[]>();
    for (const entry of entries) {
      if (entry.series_id) {
        const list = map.get(entry.series_id) || [];
        list.push(entry);
        map.set(entry.series_id, list);
      }
    }
    return map;
  }, [entries]);

  const userSeries = useMemo(() => {
    return Array.from(seriesMap.entries())
      .map(([id, items]) => ({
        id,
        title: items[0]?.title || 'Seri',
        count: items.length,
        lastDate: items.reduce((latest, e) => e.dream_date > latest ? e.dream_date : latest, items[0]?.dream_date || ''),
      }))
      .sort((a, b) => b.lastDate.localeCompare(a.lastDate));
  }, [seriesMap]);

  const fetchEntries = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('dream_journal')
        .select('*')
        .eq('user_id', user!.id)
        .order('dream_date', { ascending: false });

      if (error) throw error;
      setEntries((data as DreamJournalEntry[]) || []);
    } catch (error) {
      captureError(error, { tags: { feature: 'dream-journal' } });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const refreshPendingOfflineCount = useCallback(async () => {
    if (!user) return;
    const pending = await getPendingJournalEntries(user.id);
    setPendingOfflineCount(pending.length);
  }, [user]);

  const syncOfflineEntries = useCallback(async () => {
    if (!user || typeof navigator !== 'undefined' && !navigator.onLine) return;
    const result = await syncPendingJournalEntries(user.id, async (entry) => {
      const { error } = await supabase.from('dream_journal').insert({
        user_id: entry.userId,
        title: entry.title,
        content: entry.content,
        dream_date: entry.dreamDate,
        mood: entry.mood,
        tags: entry.tags,
        is_private: entry.isPrivate ?? true,
      } as never);
      if (error) throw error;
    });
    if (result.synced > 0) {
      notify.success(`${result.synced} offline rüya senkronize edildi`);
      fetchEntries();
    }
    if (result.failed > 0) {
      notify.error(`${result.failed} offline rüya senkronize edilemedi`);
    }
    refreshPendingOfflineCount();
  }, [fetchEntries, refreshPendingOfflineCount, user]);

  useEffect(() => {
    if (user) {
      fetchEntries();
      refreshPendingOfflineCount();
      syncOfflineEntries();
    }
  }, [user, fetchEntries, refreshPendingOfflineCount, syncOfflineEntries]);

  useEffect(() => {
    const handleOnline = () => syncOfflineEntries();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncOfflineEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const entryData = {
        user_id: user!.id,
        title: formData.title,
        content: formData.content,
        ...(formData.dream_date ? { dream_date: formData.dream_date } : {}),
        mood: formData.mood || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        audio_url: audioRecorder.audioUrl || selectedEntry?.audio_url || null,
        series_id: formData.series_id || null,
        is_private: formData.is_private,
      };

      if (selectedEntry) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          notify.error('Offline düzenleme desteklenmiyor', {
            description: 'Bağlantı geldiğinde mevcut kayıtları düzenleyebilirsiniz.',
          });
          return;
        }
        const { error } = await supabase
          .from('dream_journal')
          .update(entryData as never)
          .eq('id', selectedEntry.id);

        if (error) throw error;
        notify.success('Rüya güncellendi');
      } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await savePendingJournalEntry({
          id: crypto.randomUUID(),
          userId: user!.id,
          title: formData.title,
          content: formData.content,
          dreamDate: formData.dream_date || new Date().toISOString().slice(0, 10),
          mood: formData.mood || null,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          isPrivate: formData.is_private,
          createdAt: Date.now(),
        });
        notify.success('Rüya offline kaydedildi', {
          description: 'İnternete bağlandığınızda otomatik senkronize edilecek.',
        });
        refreshPendingOfflineCount();
      } else {
        const { error } = await supabase
          .from('dream_journal')
          .insert(entryData as never);

        if (error) throw error;
        notify.success('Rüya eklendi');
      }

      setIsDialogOpen(false);
      setVoiceAutoStartToken(0);
      formDialogRef.current?.stopDictation();
      setSelectedEntry(null);
      setFormData(createEmptyJournalForm());
      audioRecorder.reset();
      fetchEntries();
    } catch (error: unknown) {
      notify.error('Hata', { description: getErrorMessage(error) });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu rüyayı silmek istediğinize emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('dream_journal')
        .delete()
        .eq('id', id);

      if (error) throw error;
      notify.success('Rüya silindi');
      fetchEntries();
    } catch (error: unknown) {
      notify.error('Hata', { description: getErrorMessage(error) });
    }
  };

  const openEditDialog = (entry: DreamJournalEntry) => {
    setSelectedEntry(entry);
    setFormData({
      title: entry.title,
      content: entry.content,
      dream_date: entry.dream_date,
      mood: entry.mood || '',
      tags: entry.tags?.join(', ') || '',
      series_id: entry.series_id || '',
      is_private: entry.is_private ?? true,
    });
    setIsDialogOpen(true);
  };

  const resetJournalForm = () => {
    setSelectedEntry(null);
    audioRecorder.reset();
    setFormData(createEmptyJournalForm());
  };

  const handleAnalyze = async (entry: DreamJournalEntry) => {
    setAnalyzingId(entry.id);
    setAnalysisResult(null);
    setAnalysisEntry(entry);
    try {
      const result = await analyzeDream(entry.content, entry.title);
      setAnalysisResult(result);
      setIsAnalysisOpen(true);

      if (typeof navigator === 'undefined' || navigator.onLine) {
        const updatePayload: Record<string, unknown> = { ai_analysis: result };
        await supabase
          .from('dream_journal')
          .update(updatePayload as never)
          .eq('id', entry.id);
        setEntries((prev) =>
          prev.map((e) => (e.id === entry.id ? { ...e, ai_analysis: result as unknown as Record<string, unknown> } : e))
        );
      }
    } catch (error) {
      notify.error('Analiz yapılamadı', {
        description: getErrorMessage(error),
      });
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleViewAnalysis = (entry: DreamJournalEntry) => {
    setAnalysisResult(entry.ai_analysis as unknown as DreamAnalysis);
    setAnalysisEntry(entry);
    setIsAnalysisOpen(true);
  };

  const openNewDreamDialog = () => {
    setSelectedEntry(null);
    setFormData(createEmptyJournalForm());
    setIsDialogOpen(true);
  };

  const openVoiceJournal = () => {
    openNewDreamDialog();
    setVoiceAutoStartToken((t) => t + 1);
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-8">
          {pendingOfflineCount > 0 && (
            <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <WifiOff className="h-5 w-5" />
                <div>
                  <p className="font-semibold">{pendingOfflineCount} rüya offline bekliyor</p>
                  <p className="text-sm opacity-80">Bağlantı geldiğinde otomatik senkronize edilir.</p>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={syncOfflineEntries}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Şimdi Dene
              </Button>
            </div>
          )}
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-muted rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/giris" replace />;
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-medium mb-3"
            >
              <BookOpen className="w-3 h-3" />
              Rüya Günlüğüm
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-serif-dream font-bold leading-[1.1] tracking-tight mb-2"
            >
              <span className="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                Rüya Günlüğün
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-base text-muted-foreground"
            >
              Gördüğünüz rüyaları kaydedin ve zamanla analiz edin.
            </motion.p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={openVoiceJournal} className="rounded-xl dream-gradient shadow-lg shadow-primary/20">
              <Mic className="mr-2 h-4 w-4" />
              Sesle Rüya Yaz
            </Button>
            <Button type="button" variant="outline" onClick={openNewDreamDialog} className="rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              Elle Yaz
            </Button>
          </div>
        </div>

        {user && (
          <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-border/50 bg-card/50 p-4 dark:border-white/10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{entries.length} rüya</span>
              <span className="text-border">|</span>
              <span>{userSeries.length} seri</span>
            </div>
          </div>
        )}

        <JournalFormDialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              resetJournalForm();
              setVoiceAutoStartToken(0);
            }
          }}
          formData={formData}
          setFormData={setFormData}
          selectedEntry={selectedEntry}
          onSubmit={handleSubmit}
          audioRecorder={audioRecorder}
          userSeries={userSeries}
          autoStartToken={voiceAutoStartToken}
          actionRef={formDialogRef}
        />

        <div className="mb-8 rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-background p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-600 dark:text-violet-300">
                <Mic className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-serif-dream text-xl font-bold">Rüyanı sesle kaydet</h2>
                <p className="mt-1 text-sm text-muted-foreground">Mikrofonla anlat, içerik alanına otomatik olarak düz yazı şeklinde aktarılsın.</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" onClick={openVoiceJournal} className="rounded-xl dream-gradient md:min-w-48">
                <Mic className="mr-2 h-4 w-4" />
                Sesle Kaydet
              </Button>
              <Button type="button" variant="outline" onClick={openNewDreamDialog} className="rounded-xl md:min-w-36">
                <Plus className="mr-2 h-4 w-4" />
                Elle Yaz
              </Button>
            </div>
          </div>
        </div>

        {/* Entries */}
        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-3" aria-hidden>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 w-72 shrink-0 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : entries.length > 0 ? (
          <PullToRefresh onRefresh={fetchEntries}>
            <div>
              {Array.from(seriesMap.entries()).map(([seriesId, seriesEntries]) => (
                <div key={seriesId} className="mb-10">
                  <div className="flex items-center gap-3 mb-4 px-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{seriesEntries[0]?.title || 'Seri'}</h3>
                      <p className="text-xs text-muted-foreground">
                        {seriesEntries.length} rüya · {new Date(seriesEntries[seriesEntries.length - 1]?.dream_date || new Date().toISOString()).toLocaleDateString('tr-TR')} - {new Date(seriesEntries[0]?.dream_date || new Date().toISOString()).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory">
                    {seriesEntries.map((entry) => (
                      <SeriesCard key={entry.id} entry={entry} analyzingId={analyzingId} handleAnalyze={handleAnalyze} onViewAnalysis={handleViewAnalysis} openEditDialog={openEditDialog} handleDelete={handleDelete} />
                    ))}
                  </div>
                </div>
              ))}
              {entries.filter(e => !e.series_id).length > 0 && (
                <div>
                  {seriesMap.size > 0 && (
                    <div className="flex items-center gap-2 mb-4 px-1">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs text-muted-foreground">Diğer Rüyalar</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  )}
                  <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory">
                    {entries.filter(e => !e.series_id).map((entry) => (
                      <SeriesCard key={entry.id} entry={entry} analyzingId={analyzingId} handleAnalyze={handleAnalyze} onViewAnalysis={handleViewAnalysis} openEditDialog={openEditDialog} handleDelete={handleDelete} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PullToRefresh>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Book className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-serif font-semibold mb-2">Henüz rüya eklemediniz</h3>
            <p className="text-muted-foreground mb-6">
              İlk rüyanızı kaydetmeye başlayın ve rüya dünyanızı keşfedin.
            </p>
            <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
              <Button type="button" onClick={openVoiceJournal} className="rounded-xl dream-gradient">
                <Mic className="mr-2 h-4 w-4" />
                Sesle Rüya Yaz
              </Button>
              <Button type="button" variant="outline" onClick={openNewDreamDialog} className="rounded-xl">
                <Plus className="mr-2 h-4 w-4" />
                Elle Yaz
              </Button>
            </div>
          </div>
        )}

        <AnalysisDialog
          open={isAnalysisOpen}
          onOpenChange={setIsAnalysisOpen}
          result={analysisResult}
          entry={analysisEntry}
        />
      </div>
    </Layout>
  );
}
