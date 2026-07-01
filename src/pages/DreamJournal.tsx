import { useState, useEffect, useCallback, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, Book, Calendar, Trash2, Edit, BookOpen, Mic, MicOff, Sparkles, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage, notify } from '@/lib/notify';
import type { DreamJournalEntry, DreamMood } from '@/types/database';

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
  });
  const [voiceDraft, setVoiceDraft] = useState('');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceBaseContentRef = useRef<string | null>(null);
  const voiceFinalPartsRef = useRef<string[]>([]);
  const formContentRef = useRef(formData.content);

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
      console.error('Error fetching entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user, fetchEntries]);

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
      };

      if (selectedEntry) {
        const { error } = await supabase
          .from('dream_journal')
          .update(entryData as never)
          .eq('id', selectedEntry.id);

        if (error) throw error;
        notify.success('Rüya güncellendi');
      } else {
        const { error } = await supabase
          .from('dream_journal')
          .insert(entryData as never);

        if (error) throw error;
        notify.success('Rüya eklendi');
      }

      setIsDialogOpen(false);
      stopVoiceDictation();
      setVoiceDraft('');
      voiceBaseContentRef.current = null;
      setSelectedEntry(null);
      setFormData({ title: '', content: '', dream_date: new Date().toISOString().split('T')[0], mood: '', tags: '' });
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
    });
    setIsDialogOpen(true);
  };

  const resetJournalForm = () => {
    stopVoiceDictation();
    setVoiceDraft('');
    voiceBaseContentRef.current = null;
    setSelectedEntry(null);
    setFormData({ title: '', content: '', dream_date: new Date().toISOString().split('T')[0], mood: '', tags: '' });
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
    setFormData({ title: '', content: '', dream_date: new Date().toISOString().split('T')[0], mood: '', tags: '' });
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
                  <Label htmlFor="tags">Etiketler</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="yılan, su, uçmak (virgülle ayırın)"
                  />
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
          </div>
        </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map((entry) => (
              <div key={entry.id} className="dream-card group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(entry.dream_date).toLocaleDateString('tr-TR')}</span>
                  </div>
                  {entry.mood && (
                    <span className="text-2xl">
                      {moodOptions.find(m => m.value === entry.mood)?.emoji}
                    </span>
                  )}
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
            ))}
          </div>
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
      </div>
    </Layout>
  );
}
