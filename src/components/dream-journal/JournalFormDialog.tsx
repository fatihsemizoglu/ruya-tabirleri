import { useEffect, useImperativeHandle, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Loader2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVoiceDictation } from '@/lib/dream-journal-voice';
import { moodOptions } from '@/lib/dream-journal-constants';
import type { JournalFormData } from '@/lib/dream-journal-constants';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import type { DreamJournalEntry } from '@/types/database';

export interface JournalFormDialogHandle {
  /** Çalışan dikteyi durdurur (submit sonrası temizlik için). */
  stopDictation: () => void;
}

interface JournalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: JournalFormData;
  setFormData: React.Dispatch<React.SetStateAction<JournalFormData>>;
  selectedEntry: DreamJournalEntry | null;
  onSubmit: (e: React.FormEvent) => void;
  audioRecorder: ReturnType<typeof useAudioRecorder>;
  userSeries: { id: string; title: string; count: number }[];
  /** Her artışta dialog açıkken dikteyi otomatik başlatır (Sesle Rüya Yaz). */
  autoStartToken: number;
  /** Submit sonrası dikteyi durdurmak için parent'ın kullanabileceği ref. */
  actionRef?: React.RefObject<JournalFormDialogHandle | null>;
}

export default function JournalFormDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  selectedEntry,
  onSubmit,
  audioRecorder,
  userSeries,
  autoStartToken,
  actionRef,
}: JournalFormDialogProps) {
  const {
    voiceDraft,
    isVoiceListening,
    isVoiceSupported,
    startDictation,
    stopDictation,
    toggleDictation,
    markManualEdit,
  } = useVoiceDictation(setFormData);

  useImperativeHandle(actionRef, () => ({ stopDictation }), [stopDictation]);

  const contentRef = useRef(formData.content);
  useEffect(() => {
    contentRef.current = formData.content;
  }, [formData.content]);

  // "Sesle Rüya Yaz" akışı: dialog açılınca dikteyi otomatik başlat.
  useEffect(() => {
    if (!open || !autoStartToken) return;
    const timer = window.setTimeout(() => startDictation('auto', contentRef.current), 350);
    return () => window.clearTimeout(timer);
  }, [open, autoStartToken, startDictation]);

  const handleOpenChange = (next: boolean) => {
    if (!next) stopDictation();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl border-border/45 bg-card text-card-foreground shadow-2xl dark:border-white/10 dark:bg-slate-950">
        <DialogHeader>
          <DialogTitle>
            {selectedEntry ? 'Rüyayı Düzenle' : 'Yeni Rüya Ekle'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 text-foreground">
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
                onValueChange={(value) => setFormData({ ...formData, mood: value as JournalFormData['mood'] })}
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
                onClick={() => toggleDictation(contentRef.current)}
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
                markManualEdit();
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
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" className="dream-gradient">
              {selectedEntry ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
