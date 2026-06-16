import { useState, useEffect, useMemo, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mic,
  Plus,
  Calendar,
  Trash2,
  Search,
  Download,
  Share2,
  CloudOff,
  Cloud,
  RefreshCw,
  X,
  Sparkles,
  ChevronLeft,
  Mic2,
} from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';

import { Layout } from '@/components/layout/Layout';
import { VoiceDreamRecorder } from '@/components/dream/VoiceDreamRecorder';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage, notify } from '@/lib/notify';
import {
  savePendingDream,
  getPendingDreams,
  syncPendingDreams,
  type PendingVoiceDream,
} from '@/lib/voiceDreamDB';

const MOOD_LABELS: Record<string, { emoji: string; label: string }> = {
  happy: { emoji: '😊', label: 'Mutlu' },
  sad: { emoji: '😢', label: 'Üzgün' },
  scared: { emoji: '😨', label: 'Korkmuş' },
  confused: { emoji: '😕', label: 'Şaşkın' },
  peaceful: { emoji: '😌', label: 'Huzurlu' },
  anxious: { emoji: '😰', label: 'Endişeli' },
  excited: { emoji: '🤩', label: 'Heyecanlı' },
  neutral: { emoji: '😐', label: 'Nötr' },
};

export default function DreamJournalVoice() {
  const { user, isLoading: authLoading } = useAuth();
  const [entries, setEntries] = useState<PendingVoiceDream[]>([]);
  const [pendingOffline, setPendingOffline] = useState<PendingVoiceDream[]>([]);
  const [search, setSearch] = useState('');
  const [moodFilter, setMoodFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('dream_journal')
        .select('id, title, content, mood, dream_date, created_at, tags')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEntries(
        (data || []).map(d => ({
          id: d.id,
          title: d.title,
          content: d.content,
          mood: d.mood || '',
          createdAt: new Date(d.created_at).getTime(),
        }))
      );
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  const loadPending = useCallback(async () => {
    const p = await getPendingDreams();
    setPendingOffline(p);
  }, []);

  useEffect(() => {
    if (user) {
      loadEntries();
    }
    loadPending();
  }, [user, loadEntries, loadPending]);

  const handleSaveDream = async (data: { title: string; content: string; mood: string; audioBlob?: Blob }) => {
    if (!user) {
      notify.error('Lütfen giriş yapın', {
        description: 'Sesli rüya günlüğünü kullanmak için hesabınızla oturum açın.',
      });
      return;
    }

    const newDream: PendingVoiceDream = {
      id: `voice-${Date.now()}`,
      title: data.title,
      content: data.content,
      mood: data.mood,
      createdAt: Date.now(),
      audioBlob: data.audioBlob,
    };

    if (!isOnline) {
      await savePendingDream(newDream);
      setPendingOffline(prev => [newDream, ...prev]);
      notify.success('Çevrimdışı kaydedildi', {
        description: 'İnternete bağlanınca otomatik senkronize edilecek.',
      });
      setShowRecorder(false);
      return;
    }

    try {
      const { error } = await supabase.from('dream_journal').insert({
        user_id: user.id,
        title: data.title,
        content: data.content,
        mood: data.mood || null,
        dream_date: new Date().toISOString().split('T')[0],
      });
      if (error) throw error;
      notify.success('Rüya kaydedildi');
      setShowRecorder(false);
      loadEntries();
    } catch (err) {
      await savePendingDream(newDream);
      setPendingOffline(prev => [newDream, ...prev]);
      notify.warning('Sunucuya ulaşılamadı', {
        description: 'Rüya çevrimdışı kaydedildi ve bağlantı gelince eşitlenecek.',
      });
    }
  };

  const handleSync = useCallback(async () => {
    if (!user || pendingOffline.length === 0) return;
    setIsSyncing(true);
    try {
      const { synced, failed } = await syncPendingDreams(async dream => {
        const { error } = await supabase.from('dream_journal').insert({
          user_id: user.id,
          title: dream.title,
          content: dream.content,
          mood: dream.mood || null,
          dream_date: new Date(dream.createdAt).toISOString().split('T')[0],
        });
        if (error) throw error;
      });
      notify.success(`${synced} rüya senkronize edildi`, {
        description: failed > 0 ? `${failed} kayıt eşitlenemedi.` : undefined,
      });
      loadEntries();
      loadPending();
    } catch (err) {
      notify.error('Senkronizasyon hatası', {
        description: getErrorMessage(err),
      });
    } finally {
      setIsSyncing(false);
    }
  }, [loadEntries, loadPending, pendingOffline.length, user]);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      handleSync();
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [handleSync]);

  const handleDelete = async (id: string) => {
    if (!confirm('Bu rüyayı silmek istediğinize emin misiniz?')) return;
    const { error } = await supabase.from('dream_journal').delete().eq('id', id);
    if (error) {
      notify.error('Silme hatası', { description: error.message });
      return;
    }
    loadEntries();
    notify.success('Rüya silindi');
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(filteredEntries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ruya-gunlugu-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify.success('JSON olarak indirildi');
  };

  const handleExportPDF = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <style>body{font-family:Georgia,serif;max-width:800px;margin:0 auto;padding:24px;line-height:1.6}
      h1{color:#4f46e5}.entry{border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:16px}
      .meta{color:#6b7280;font-size:12px;margin-bottom:8px}
      .content{white-space:pre-wrap}</style></head><body>
      <h1>Rüya Günlüğüm</h1>
      <p>${format(new Date(), 'dd MMMM yyyy', { locale: tr })}</p>
      ${filteredEntries.map(e => `
        <div class="entry">
          <div class="meta">${format(new Date(e.createdAt), 'dd MMMM yyyy', { locale: tr })} ${MOOD_LABELS[e.mood]?.emoji || ''}</div>
          <h2>${e.title}</h2>
          <div class="content">${e.content}</div>
        </div>
      `).join('')}
      </body></html>`;
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 300);
    }
  };

  const handleShare = async (entry: PendingVoiceDream) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: entry.title,
          text: `${entry.title}\n\n${entry.content}`,
          url: window.location.href,
        });
      } catch (_error) {
        // User cancelled or share target failed; no UI action needed.
      }
    } else {
      await navigator.clipboard.writeText(`${entry.title}\n\n${entry.content}`);
      notify.success('Panoya kopyalandı');
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (moodFilter !== 'all' && e.mood !== moodFilter) return false;
      if (dateRange !== 'all') {
        const days = parseInt(dateRange);
        const cutoff = subDays(new Date(), days).getTime();
        if (e.createdAt < cutoff) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q);
      }
      return true;
    });
  }, [entries, moodFilter, dateRange, search]);

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="animate-pulse h-96 bg-muted rounded-xl" />
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link to="/ruya-gunlugum" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2">
              <ChevronLeft className="w-3 h-3" />
              Rüya Günlüğü
            </Link>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-medium mb-3"
            >
              <Mic2 className="w-3 h-3" />
              Sesli Günlük
            </motion.div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif-dream font-bold leading-[1.1] tracking-tight mb-2">
              <span className="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                Sesli Rüya Günlüğü
              </span>
            </h1>
            <p className="text-base text-muted-foreground">
              Rüyanı sesli anlat, metne dönüştür ve günlüğüne kaydet.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isOnline ? 'default' : 'secondary'} className="text-xs">
              {isOnline ? <Cloud className="w-3 h-3 mr-1" /> : <CloudOff className="w-3 h-3 mr-1" />}
              {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
            </Badge>
            {pendingOffline.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing || !isOnline}>
                <RefreshCw className={`w-3 h-3 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {pendingOffline.length} senkron
              </Button>
            )}
            <Button onClick={() => setShowRecorder(!showRecorder)} className="dream-gradient">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Kayıt
            </Button>
          </div>
        </div>

        {showRecorder && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10"
                onClick={() => setShowRecorder(false)}
              >
                <X className="w-4 h-4" />
              </Button>
              <VoiceDreamRecorder onSave={handleSaveDream} />
            </div>
          </motion.div>
        )}

        {pendingOffline.length > 0 && (
          <Card className="p-4 mb-6 bg-amber-500/10 border-amber-500/30">
            <div className="flex items-center gap-3">
              <CloudOff className="w-5 h-5 text-amber-500" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{pendingOffline.length} rüya çevrimdışı kaydedildi</p>
                <p className="text-xs text-muted-foreground">İnternet bağlantısı olduğunda otomatik senkronize edilir</p>
              </div>
            </div>
          </Card>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rüya ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={moodFilter} onValueChange={setMoodFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Ruh hali" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm ruh halleri</SelectItem>
              {Object.entries(MOOD_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger>
              <SelectValue placeholder="Tarih" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm zamanlar</SelectItem>
              <SelectItem value="7">Son 7 gün</SelectItem>
              <SelectItem value="30">Son 30 gün</SelectItem>
              <SelectItem value="90">Son 90 gün</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Export buttons */}
        <div className="flex justify-end gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={handleExportJSON}>
            <Download className="w-3 h-3 mr-2" />
            JSON
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="w-3 h-3 mr-2" />
            PDF
          </Button>
        </div>

        {/* Entries */}
        {filteredEntries.length === 0 ? (
          <Card className="p-16 text-center">
            <div className="w-20 h-20 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-6">
              <Mic className="h-10 w-10 text-violet-500" />
            </div>
            <h3 className="text-xl font-serif font-semibold mb-2">Henüz sesli rüya yok</h3>
            <p className="text-muted-foreground mb-6">
              İlk sesli rüyanızı kaydedin ve rüya dünyanızı sesle keşfedin.
            </p>
            <Button onClick={() => setShowRecorder(true)} className="dream-gradient">
              <Mic className="mr-2 h-4 w-4" />
              İlk Sesli Rüyam
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map(entry => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-5 group hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(entry.createdAt), 'dd MMMM yyyy', { locale: tr })}
                        </span>
                        {entry.mood && (
                          <Badge variant="outline" className="text-[10px]">
                            {MOOD_LABELS[entry.mood]?.emoji} {MOOD_LABELS[entry.mood]?.label}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-bold mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-violet-500" />
                        {entry.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                        {entry.content}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleShare(entry)}>
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
