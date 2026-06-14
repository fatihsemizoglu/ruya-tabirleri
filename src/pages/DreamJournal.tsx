import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, Book, Calendar, Trash2, Edit, BookOpen, Mic, MicOff, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
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

  const appendVoiceText = useCallback((text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;
    setVoiceDraft(cleanText);
    setFormData((current) => {
      const content = current.content.trim();
      if (content.endsWith(cleanText)) return current;
      const suggestedTitle = cleanText.split(/\s+/).slice(0, 6).join(' ') || 'Sesli Rüya';
      return {
        ...current,
        title: current.title.trim() ? current.title : suggestedTitle,
        content: `${content ? `${content}\n\n` : ''}${cleanText}`,
      };
    });
  }, []);

  const voice = useVoiceSearch({
    continuous: true,
    onResult: (text, isFinal) => {
      setVoiceDraft(text);
      if (isFinal) appendVoiceText(text);
    },
    onError: (error) => {
      const message = error === 'not-allowed' || error === 'service-not-allowed'
        ? 'Mikrofon erişimi reddedildi. Tarayıcı izinlerini kontrol edin.'
        : error === 'no-speech'
        ? 'Ses algılanmadı. Mikrofona yakın konuşup tekrar deneyin.'
        : 'Sesli dikte başlatılamadı.';
      notify.error(message);
    },
  });

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
        dream_date: formData.dream_date,
        mood: formData.mood || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      };

      if (selectedEntry) {
        const { error } = await supabase
          .from('dream_journal')
          .update(entryData)
          .eq('id', selectedEntry.id);

        if (error) throw error;
        notify.success('Rüya güncellendi');
      } else {
        const { error } = await supabase
          .from('dream_journal')
          .insert(entryData);

        if (error) throw error;
        notify.success('Rüya eklendi');
      }

      setIsDialogOpen(false);
      voice.stop();
      voice.reset();
      setVoiceDraft('');
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
    voice.stop();
    voice.reset();
    setVoiceDraft('');
    setSelectedEntry(null);
    setFormData({ title: '', content: '', dream_date: new Date().toISOString().split('T')[0], mood: '', tags: '' });
  };

  const toggleVoiceDictation = () => {
    if (!voice.isSupported) {
      notify.error('Tarayıcınız sesli dikteyi desteklemiyor', {
        description: 'Chrome, Edge veya Web Speech API destekleyen bir tarayıcı deneyin.',
      });
      return;
    }
    if (voice.isListening) {
      voice.stop();
      return;
    }
    voice.start();
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
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              resetJournalForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="dream-gradient">
                <Plus className="mr-2 h-4 w-4" />
                Yeni Rüya Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {selectedEntry ? 'Rüyayı Düzenle' : 'Yeni Rüya Ekle'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="content">Rüya İçeriği</Label>
                    <Button
                      type="button"
                      variant={voice.isListening ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={toggleVoiceDictation}
                      className="rounded-xl"
                    >
                      {voice.isListening ? <MicOff className="h-4 w-4 mr-1" /> : <Mic className="h-4 w-4 mr-1" />}
                      {voice.isListening ? 'Durdur' : 'Sesle Yaz'}
                    </Button>
                  </div>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Rüyanızı detaylı bir şekilde anlatın..."
                    rows={5}
                    required
                  />
                  <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 font-medium text-foreground mb-1">
                      <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                      Sesli dikte
                    </div>
                    {voice.isListening ? (
                      <p>
                        Dinleniyor... Konuştuklarınız otomatik olarak rüya içeriğine eklenecek.
                        {voiceDraft && <span className="block mt-1 text-foreground/80">Son algılanan: {voiceDraft}</span>}
                      </p>
                    ) : voice.isSupported ? (
                      <p>Anasayfadaki sesli arama altyapısıyla rüyanızı konuşarak metne çevirebilirsiniz.</p>
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
            <Button onClick={() => setIsDialogOpen(true)} className="dream-gradient">
              <Plus className="mr-2 h-4 w-4" />
              İlk Rüyamı Ekle
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
