import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, Book, Calendar, Trash2, Edit, BookOpen, Mic, MicOff, Sparkles, Volume2, WifiOff, RefreshCw, Brain, Share2, Copy, Loader2, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PullToRefresh } from '@/components/PullToRefresh';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage, notify } from '@/lib/notify';
import { captureError } from '@/lib/logger';
import { analyzeDream, getSentimentEmoji, getSentimentLabel } from '@/lib/ai-analysis';
import type { DreamAnalysis } from '@/lib/ai-analysis';
import { shareDreamCard, copyDreamCard } from '@/lib/share';
import type { DreamJournalEntry, DreamMood } from '@/types/database';
import { getPendingJournalEntries, savePendingJournalEntry, syncPendingJournalEntries } from '@/lib/voiceDreamDB';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

const moodOptions: { value: DreamMood; label: string; emoji: string }[] = [
  { value: 'happy', label: 'Mutlu', emoji: '😊' },
  { value: 'sad', label: 'Üzgün', emoji: '😢' },
  { value: 'scared', label: 'Korkmuş', emoji: '😨' },
  { value: 'confused', label: 'Şaşkın', emoji: '😕' },
  { value: 'peaceful', label: 'Huzurlu', emoji: '😌' },
  { value: 'anxious', label: 'Endişeli', emoji: '😰' },
  { value: 'excited', label: 'Heyecanlı', emoji: '🤩' },
  { value: 'neutral', label: 'Nötr', emoji: '😐' },
];

type SpeechRecognitionEventLike = { results: SpeechRecognitionResultList };
type SpeechRecognitionErrorEventLike = { error: string };
type VoiceLaunchMode = 'manual' | 'auto';
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function normalizeVoiceText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function SeriesCard({ entry, analyzingId, handleAnalyze, setAnalysisResult, setAnalysisEntry, setIsAnalysisOpen, openEditDialog, handleDelete, moodOptions }: {
  entry: DreamJournalEntry;
  analyzingId: string | null;
  handleAnalyze: (e: DreamJournalEntry) => void;
  setAnalysisResult: (r: DreamAnalysis | null) => void;
  setAnalysisEntry: (e: DreamJournalEntry | null) => void;
  setIsAnalysisOpen: (o: boolean) => void;
  openEditDialog: (e: DreamJournalEntry) => void;
  handleDelete: (id: string) => void;
  moodOptions: { value: string; emoji: string }[];
}) {
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
          <Button variant="outline" size="sm" onClick={() => {
            setAnalysisResult(entry.ai_analysis as unknown as DreamAnalysis);
            setAnalysisEntry(entry);
            setIsAnalysisOpen(true);
          }}>
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

export default function DreamJournal() {
  const { user, isLoading: authLoading } = useAuth();
  const [entries, setEntries] = useState<DreamJournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DreamJournalEntry | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    dream_date: new Date().toISOString().split('T')[0],
    mood: '' as DreamMood | '',
    tags: '',
    series_id: '',
  });
  const [voiceDraft, setVoiceDraft] = useState('');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceBaseContentRef = useRef<string | null>(null);
  const voiceFinalPartsRef = useRef<string[]>([]);
  const formContentRef = useRef(formData.content);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DreamAnalysis | null>(null);
  const [analysisEntry, setAnalysisEntry] = useState<DreamJournalEntry | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const audioRecorder = useAudioRecorder(user?.id);

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

  useEffect(() => {
    formContentRef.current = formData.content;
  }, [formData.content]);

  useEffect(() => {
    setIsVoiceSupported(!!getSpeechRecognitionCtor());
  }, []);

  const applyVoiceText = useCallback((text: string) => {
    const cleanText = normalizeVoiceText(text);
    if (!cleanText) return;
    setVoiceDraft(cleanText);
    setFormData((current) => {
      const baseContent = voiceBaseContentRef.current ?? current.content;
      const content = baseContent.trim();
      const suggestedTitle = cleanText.split(/\s+/).slice(0, 6).join(' ') || 'Sesli Rüya';
      const nextContent = `${content ? `${content} ` : ''}${cleanText}`;
      return {
        ...current,
        title: current.title.trim() ? current.title : suggestedTitle,
        content: nextContent,
      };
    });
  }, []);

  const stopVoiceDictation = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        try {
          recognitionRef.current.abort();
        } catch {
          /* noop */
        }
      }
    }
    recognitionRef.current = null;
    voiceBaseContentRef.current = null;
    voiceFinalPartsRef.current = [];
    setIsVoiceListening(false);
    setVoiceDraft('');
  }, []);

  const startVoiceDictation = useCallback((mode: VoiceLaunchMode = 'manual') => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      notify.error('Tarayıcınız sesli dikteyi desteklemiyor', {
        description: 'Chrome, Edge veya Web Speech API destekleyen bir tarayıcı deneyin.',
      });
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* noop */
      }
    }

    const recognition = new Ctor();
    recognition.lang = 'tr-TR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    voiceBaseContentRef.current = formContentRef.current;
    voiceFinalPartsRef.current = [];
    setVoiceDraft('');

    recognition.onresult = (event) => {
      const finalParts: string[] = [];
      const interimParts: string[] = [];
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (!result) continue;
        const text = result[0]?.transcript || '';
        if (result.isFinal) finalParts.push(text);
        else interimParts.push(text);
      }
      voiceFinalPartsRef.current = finalParts.map(normalizeVoiceText).filter(Boolean);
      applyVoiceText([...voiceFinalPartsRef.current, ...interimParts].join(' '));
    };

    recognition.onerror = (event) => {
      const message = event.error === 'not-allowed' || event.error === 'service-not-allowed'
        ? 'Mikrofon erişimi reddedildi. Tarayıcı izinlerini kontrol edin.'
        : event.error === 'no-speech'
        ? 'Ses algılanmadı. Mikrofona yakın konuşup tekrar deneyin.'
        : 'Sesli dikte başlatılamadı.';
      notify.error(message);
      stopVoiceDictation();
    };

    recognition.onend = () => {
      setIsVoiceListening(false);
      voiceBaseContentRef.current = null;
      recognitionRef.current = null;
      setVoiceDraft('');
    };

    try {
      recognition.start();
      setIsVoiceListening(true);
      if (mode === 'manual') {
        notify.success('Sesli yazma başladı', {
          description: 'Konuşmanız rüya içeriği alanına otomatik aktarılacak.',
        });
      }
    } catch {
      notify.error('Sesli dikte başlatılamadı. Lütfen tekrar deneyin.');
      stopVoiceDictation();
    }
  }, [applyVoiceText, stopVoiceDictation]);

  useEffect(() => stopVoiceDictation, [stopVoiceDictation]);
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
      } else {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          await savePendingJournalEntry({
            id: crypto.randomUUID(),
            userId: user!.id,
            title: formData.title,
            content: formData.content,
            dreamDate: formData.dream_date || new Date().toISOString().slice(0, 10),
            mood: formData.mood || null,
            tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
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
      }

      setIsDialogOpen(false);
      stopVoiceDictation();
      setVoiceDraft('');
      voiceBaseContentRef.current = null;
      setSelectedEntry(null);
      setFormData({ title: '', content: '', dream_date: new Date().toISOString().split('T')[0], mood: '', tags: '', series_id: '' });
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
    });
    setIsDialogOpen(true);
  };

  const resetJournalForm = () => {
    stopVoiceDictation();
    setVoiceDraft('');
    voiceBaseContentRef.current = null;
    setSelectedEntry(null);
    audioRecorder.reset();
    setFormData({ title: '', content: '', dream_date: new Date().toISOString().split('T')[0], mood: '', tags: '', series_id: '' });
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

  const toggleVoiceDictation = () => {
    if (!isVoiceSupported) {
      notify.error('Tarayıcınız sesli dikteyi desteklemiyor', {
        description: 'Chrome, Edge veya Web Speech API destekleyen bir tarayıcı deneyin.',
      });
      return;
    }
    if (isVoiceListening) {
      stopVoiceDictation();
      return;
    }
    startVoiceDictation('manual');
  };

  const openNewDreamDialog = () => {
    setSelectedEntry(null);
    setFormData({ title: '', content: '', dream_date: new Date().toISOString().split('T')[0], mood: '', tags: '', series_id: '' });
    setVoiceDraft('');
    voiceBaseContentRef.current = '';
    setIsDialogOpen(true);
  };

  const openVoiceJournal = () => {
    openNewDreamDialog();
    window.setTimeout(() => {
      if (getSpeechRecognitionCtor()) {
        startVoiceDictation('auto');
      } else {
        notify.error('Tarayıcınız sesli dikteyi desteklemiyor', {
          description: 'Chrome, Edge veya Web Speech API destekleyen bir tarayıcı deneyin.',
        });
      }
    }, 350);
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

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              resetJournalForm();
            }
          }}>
            <DialogContent className="sm:max-w-lg rounded-2xl border-border/45 bg-card text-card-foreground shadow-2xl dark:border-white/10 dark:bg-slate-950">
              <DialogHeader>
                <DialogTitle>
                  {selectedEntry ? 'Rüyayı Düzenle' : 'Yeni Rüya Ekle'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 text-foreground">
                <div className="space-y-2">
                  <Label htmlFor="title">Başlık</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Rüyanıza bir başlık verin"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Tarih</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.dream_date}
                      onChange={(e) => setFormData({ ...formData, dream_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mood">Duygu Durumu</Label>
                    <Select
                      value={formData.mood}
                      onValueChange={(value) => setFormData({ ...formData, mood: value as DreamMood })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {moodOptions.map((mood) => (
                          <SelectItem key={mood.value} value={mood.value}>
                            {mood.emoji} {mood.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Label htmlFor="content">Rüya İçeriği</Label>
                      <p className="mt-1 text-xs text-muted-foreground">Masaüstü ve mobilde mikrofonla anlatabilir veya elle yazabilirsiniz.</p>
                    </div>
                    <Button
                      type="button"
                      variant={isVoiceListening ? 'destructive' : 'outline'}
                      onClick={toggleVoiceDictation}
                      className="shrink-0 rounded-xl"
                    >
                      {isVoiceListening ? <MicOff className="h-4 w-4 mr-1" /> : <Mic className="h-4 w-4 mr-1" />}
                      {isVoiceListening ? 'Durdur' : 'Sesle Yaz'}
                    </Button>
                  </div>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => {
                      setFormData({ ...formData, content: e.target.value });
                      if (!isVoiceListening) voiceBaseContentRef.current = null;
                    }}
                    placeholder="Rüyanızı detaylı bir şekilde anlatın..."
                    rows={5}
                    required
                    className="min-h-36 rounded-xl bg-background/80 text-foreground dark:bg-slate-900/80"
                  />
                  <div className="rounded-xl border border-border/50 bg-card/70 p-3 text-xs text-muted-foreground dark:border-white/10 dark:bg-slate-900/60">
                    <div className="flex items-center gap-2 font-medium text-foreground mb-1">
                      {isVoiceListening ? <Volume2 className="h-3.5 w-3.5 text-emerald-500" /> : <Sparkles className="h-3.5 w-3.5 text-violet-500" />}
                      Sesli dikte
                    </div>
                    {isVoiceListening ? (
                      <p>
                        Dinleniyor... Konuştuklarınız otomatik olarak rüya içeriğine eklenecek.
                        {voiceDraft && <span className="block mt-1 text-foreground/80">Son algılanan: {voiceDraft}</span>}
                      </p>
                    ) : isVoiceSupported ? (
                      <p>Sesle Yaz butonuna basın, tarayıcı mikrofon izni istediğinde izin verin ve rüyanızı anlatın.</p>
                    ) : (
                      <p>Bu tarayıcı sesli dikteyi desteklemiyor.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Ses Kaydı</Label>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <div className="flex items-center gap-3">
                      {audioRecorder.state === 'idle' && (
                        <Button type="button" variant="outline" size="sm" onClick={audioRecorder.startRecording}>
                          <Mic className="h-4 w-4 mr-1" />
                          Kayda Başla
                        </Button>
                      )}
                      {audioRecorder.state === 'recording' && (
                        <div className="flex items-center gap-3 w-full">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                          </span>
                          <span className="text-sm font-medium">{audioRecorder.duration}s</span>
                          <Button type="button" variant="destructive" size="sm" onClick={audioRecorder.stopRecording}>
                            Durdur
                          </Button>
                        </div>
                      )}
                      {audioRecorder.state === 'uploading' && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Yükleniyor...
                        </div>
                      )}
                      {(audioRecorder.state === 'done' && audioRecorder.audioUrl) && (
                        <div className="flex items-center gap-2 w-full">
                          <audio src={audioRecorder.audioUrl} controls className="h-8 flex-1" />
                          <Button type="button" variant="ghost" size="sm" onClick={audioRecorder.reset}>
                            Yeniden Kaydet
                          </Button>
                        </div>
                      )}
                      {audioRecorder.state === 'error' && (
                        <div className="flex items-center gap-2 text-sm text-red-500">
                          Kayıt başarısız
                          <Button type="button" variant="outline" size="sm" onClick={audioRecorder.reset}>
                            Tekrar Dene
                          </Button>
                        </div>
                      )}
                      {selectedEntry?.audio_url && audioRecorder.state === 'idle' && (
                        <audio src={selectedEntry.audio_url} controls className="h-8 flex-1" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Etiketler</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="yılan, su, uçmak (virgülle ayırın)"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rüya Serisi</Label>
                  <Select
                    value={formData.series_id}
                    onValueChange={(value) => {
                      if (value === '__new__') {
                        setFormData({ ...formData, series_id: crypto.randomUUID() });
                      } else {
                        setFormData({ ...formData, series_id: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seri yok (tek rüya)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Seri yok</SelectItem>
                      {userSeries.map((series) => (
                        <SelectItem key={series.id} value={series.id}>
                          <Layers className="h-3 w-3 mr-1" />
                          {series.title} ({series.count})
                        </SelectItem>
                      ))}
                      <SelectItem value="__new__">✨ Yeni seri oluştur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button type="submit" className="dream-gradient">
                    {selectedEntry ? 'Güncelle' : 'Kaydet'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {seriesEntries.map((entry) => (
                    <SeriesCard key={entry.id} entry={entry} analyzingId={analyzingId} handleAnalyze={handleAnalyze} setAnalysisResult={setAnalysisResult} setAnalysisEntry={setAnalysisEntry} setIsAnalysisOpen={setIsAnalysisOpen} openEditDialog={openEditDialog} handleDelete={handleDelete} moodOptions={moodOptions} />
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {entries.filter(e => !e.series_id).map((entry) => (
                    <SeriesCard key={entry.id} entry={entry} analyzingId={analyzingId} handleAnalyze={handleAnalyze} setAnalysisResult={setAnalysisResult} setAnalysisEntry={setAnalysisEntry} setIsAnalysisOpen={setIsAnalysisOpen} openEditDialog={openEditDialog} handleDelete={handleDelete} moodOptions={moodOptions} />
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

        <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
          <DialogContent className="sm:max-w-lg rounded-2xl border-border/45 bg-card text-card-foreground shadow-2xl dark:border-white/10 dark:bg-slate-950">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-violet-500" />
                AI Rüya Analizi
              </DialogTitle>
            </DialogHeader>
            {analysisResult && analysisEntry && (
              <div className="space-y-4">
                <div className="rounded-xl bg-violet-500/10 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{analysisEntry.title}</h4>
                    <span className="text-2xl">{getSentimentEmoji(analysisResult.sentiment)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(analysisEntry.dream_date).toLocaleDateString('tr-TR')}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Duygu Durumu</h4>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-violet-500/10 text-violet-700 dark:text-violet-300">
                    {getSentimentEmoji(analysisResult.sentiment)} {getSentimentLabel(analysisResult.sentiment)} (%{Math.round(analysisResult.confidence * 100)})
                  </span>
                </div>

                {analysisResult.symbols.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Semboller</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.symbols.map((symbol) => (
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
                    {analysisResult.interpretation}
                  </p>
                </div>

                {analysisResult.advice && (
                  <div className="rounded-xl bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 border border-violet-500/10 p-4">
                    <h4 className="text-sm font-medium text-violet-600 dark:text-violet-400 mb-1">Öneri</h4>
                    <p className="text-sm leading-relaxed text-card-foreground/80">
                      {analysisResult.advice}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => shareDreamCard({
                    title: analysisEntry.title,
                    content: analysisEntry.content,
                    date: analysisEntry.dream_date,
                    mood: analysisEntry.mood,
                    tags: analysisEntry.tags,
                    sentiment: analysisResult.sentiment,
                    interpretation: analysisResult.interpretation,
                  })}>
                    <Share2 className="h-4 w-4 mr-1" />
                    Paylaş
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    copyDreamCard({
                      title: analysisEntry.title,
                      content: analysisEntry.content,
                      date: analysisEntry.dream_date,
                      mood: analysisEntry.mood,
                      tags: analysisEntry.tags,
                      sentiment: analysisResult.sentiment,
                      interpretation: analysisResult.interpretation,
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
      </div>
    </Layout>
  );
}
