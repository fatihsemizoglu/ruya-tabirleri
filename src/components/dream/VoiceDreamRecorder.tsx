import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Trash2,
  Loader2,
  Volume2,
  Sparkles,
  X,
  CheckCircle2,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string; confidence: number };
  length: number;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = { error: string; message?: string };

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

interface DreamInterpretation {
  islamic?: string;
  psychological?: string;
  symbols?: string[];
  summary?: string;
}

interface VoiceDreamRecorderProps {
  onSave: (data: { title: string; content: string; mood: string; interpretation?: DreamInterpretation; audioBlob?: Blob }) => Promise<void> | void;
}

const MOODS = [
  { value: 'happy', label: 'Mutlu', emoji: '😊', color: 'bg-amber-100 dark:bg-amber-900/30' },
  { value: 'sad', label: 'Üzgün', emoji: '😢', color: 'bg-blue-100 dark:bg-blue-900/30' },
  { value: 'scared', label: 'Korkmuş', emoji: '😨', color: 'bg-rose-100 dark:bg-rose-900/30' },
  { value: 'confused', label: 'Şaşkın', emoji: '😕', color: 'bg-slate-100 dark:bg-slate-800/30' },
  { value: 'peaceful', label: 'Huzurlu', emoji: '😌', color: 'bg-emerald-100 dark:bg-emerald-900/30' },
  { value: 'anxious', label: 'Endişeli', emoji: '😰', color: 'bg-orange-100 dark:bg-orange-900/30' },
  { value: 'excited', label: 'Heyecanlı', emoji: '🤩', color: 'bg-pink-100 dark:bg-pink-900/30' },
  { value: 'neutral', label: 'Nötr', emoji: '😐', color: 'bg-zinc-100 dark:bg-zinc-800/30' },
];

export function VoiceDreamRecorder({ onSave }: VoiceDreamRecorderProps) {
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveform, setWaveform] = useState<number[]>(() => Array.from({ length: 60 }, () => 0));
  const [mood, setMood] = useState<string>('');
  const [title, setTitle] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interpretation, setInterpretation] = useState<DreamInterpretation | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [showResult, setShowResult] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const durationTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsSupported(getSpeechRecognition() !== null);
    return () => {
      stopAll();
    };
  }, []);

  const stopAll = useCallback(() => {
    try {
      recognitionRef.current?.abort();
    } catch {}
    try {
      mediaRecorderRef.current?.stop();
    } catch {}
    try {
      streamRef.current?.getTracks().forEach(t => t.stop());
    } catch {}
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (durationTimerRef.current) window.clearInterval(durationTimerRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
  }, []);

  const startWaveform = (stream: MediaStream) => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const node = ctx.createAnalyser();
      node.fftSize = 128;
      source.connect(node);
      setAnalyser(node);
      const data = new Uint8Array(node.frequencyBinCount);
      const tick = () => {
        node.getByteFrequencyData(data);
        const sliceSize = Math.floor(data.length / 60);
        const next = Array.from({ length: 60 }, (_, i) => {
          let sum = 0;
          for (let j = 0; j < sliceSize; j++) sum += data[i * sliceSize + j] || 0;
          return sum / sliceSize / 255;
        });
        setWaveform(next);
        animationRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      console.error('Waveform error', e);
    }
  };

  const startRecording = async () => {
    if (!isSupported) {
      toast.error('Tarayıcınız ses tanımayı desteklemiyor');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      startWaveform(stream);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };
      mediaRecorder.start();

      const SR = getSpeechRecognition();
      if (SR) {
        const recognition = new SR();
        recognition.lang = 'tr-TR';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.onresult = e => {
          let finalText = '';
          let interimText = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const result = e.results[i];
            if (result.isFinal) {
              finalText += result[0].transcript;
            } else {
              interimText += result[0].transcript;
            }
          }
          if (finalText) {
            setTranscript(prev => (prev + ' ' + finalText).trim());
            setInterim('');
          } else {
            setInterim(interimText);
          }
        };
        recognition.onerror = (e) => {
          console.error('Speech recognition error:', e.error);
          if (e.error === 'not-allowed') {
            toast.error('Mikrofon erişimi reddedildi');
          } else if (e.error === 'no-speech') {
            toast.warning('Ses algılanmadı, tekrar deneyin');
          }
        };
        recognition.onend = () => {
          if (isRecording && recognitionRef.current) {
            try {
              recognition.start();
            } catch {}
          }
        };
        recognition.start();
        recognitionRef.current = recognition;
      }

      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      durationTimerRef.current = window.setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
      toast.error('Mikrofon erişimi başarısız: ' + message);
    }
  };

  const stopRecording = () => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    try {
      mediaRecorderRef.current?.stop();
    } catch {}
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (durationTimerRef.current) window.clearInterval(durationTimerRef.current);
    setIsRecording(false);
    setIsPaused(false);
    setWaveform(Array.from({ length: 60 }, () => 0));
    toast.success('Kayıt tamamlandı');
  };

  const playAudio = () => {
    if (!audioUrl) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.play();
    setIsPlaying(true);
  };

  const stopAudio = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const deleteAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setTranscript('');
    setInterim('');
    setDuration(0);
    setInterpretation(null);
    setShowResult(false);
  };

  const analyzeDream = async () => {
    const text = (transcript + ' ' + interim).trim();
    if (!text) {
      toast.error('Önce rüyanızı kaydedin veya yazın');
      return;
    }
    setIsAnalyzing(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('interpret-dream', {
        body: { dream: text, type: 'voice' },
      });
      if (error) throw error;
      setInterpretation(data);
      setShowResult(true);
      toast.success('Rüya analizi tamamlandı');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analiz başarısız';
      toast.error('Analiz hatası: ' + message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    const text = (transcript + ' ' + interim).trim();
    if (!text) {
      toast.error('Rüya içeriği boş olamaz');
      return;
    }
    await onSave({
      title: title || `Sesli Rüya - ${new Date().toLocaleDateString('tr-TR')}`,
      content: text,
      mood,
      interpretation: interpretation || undefined,
      audioBlob: audioBlob || undefined,
    });
    deleteAudio();
    setTitle('');
    setMood('');
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="overflow-hidden border-violet-500/20">
      <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 p-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <h3 className="font-bold text-lg">Sesli Rüya Günlüğü</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Mikrofona anlatın, AI yorumlasın. Türkçe ses tanıma aktif.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Waveform / Recording Visual */}
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {isRecording ? (
                <span className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                  </span>
                  <span className="text-sm font-bold text-rose-500">Kayıt</span>
                </span>
              ) : audioBlob ? (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Kayıt hazır
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">Hazır</span>
              )}
            </div>
            <span className="text-sm font-mono font-bold">{formatDuration(duration)}</span>
          </div>

          <div className="flex items-center justify-center gap-1 h-24">
            {waveform.map((v, i) => (
              <motion.div
                key={i}
                className={cn(
                  "w-1.5 rounded-full transition-colors",
                  isRecording ? "bg-gradient-to-t from-rose-500 to-violet-500" : "bg-violet-300 dark:bg-violet-700"
                )}
                animate={{
                  height: isRecording ? `${Math.max(8, v * 96)}px` : '8px',
                }}
                transition={{ duration: 0.05 }}
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 mt-6">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                disabled={!isSupported}
                size="lg"
                className="bg-gradient-to-r from-rose-500 to-violet-500 hover:from-rose-600 hover:to-violet-600"
              >
                <Mic className="w-5 h-5 mr-2" />
                Kayda Başla
              </Button>
            ) : (
              <Button onClick={stopRecording} size="lg" variant="destructive">
                <Square className="w-5 h-5 mr-2" />
                Durdur
              </Button>
            )}
            {audioUrl && !isRecording && (
              <>
                {isPlaying ? (
                  <Button onClick={stopAudio} variant="outline" size="lg">
                    <Pause className="w-4 h-4 mr-2" />
                    Duraklat
                  </Button>
                ) : (
                  <Button onClick={playAudio} variant="outline" size="lg">
                    <Play className="w-4 h-4 mr-2" />
                    Oynat
                  </Button>
                )}
                <Button onClick={deleteAudio} variant="ghost" size="lg">
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </Button>
              </>
            )}
          </div>

          {!isSupported && (
            <p className="text-xs text-center text-rose-500 mt-3">
              ⚠️ Tarayıcınız Web Speech API desteklemiyor (Chrome/Edge önerilir)
            </p>
          )}
        </div>

        {/* Transcript */}
        <div className="space-y-2">
          <Label>Transkripsiyon</Label>
          <div className="relative">
            <Textarea
              value={transcript + (interim ? ' ' + interim : '')}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Konuşmaya başlayın veya yazın..."
              rows={4}
              className="resize-none"
            />
            {(transcript || interim) && (
              <Badge variant="secondary" className="absolute top-2 right-2 text-[10px]">
                <Volume2 className="w-3 h-3 mr-1" />
                {(transcript + interim).split(/\s+/).filter(Boolean).length} kelime
              </Badge>
            )}
          </div>
        </div>

        {/* Mood */}
        <div className="space-y-2">
          <Label>Rüya Hissi</Label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {MOODS.map(m => (
              <button
                key={m.value}
                onClick={() => setMood(mood === m.value ? '' : m.value)}
                className={cn(
                  "p-2 rounded-xl border-2 transition-all text-center",
                  mood === m.value
                    ? "border-violet-500 scale-105 shadow-md"
                    : "border-transparent hover:border-violet-200",
                  m.color
                )}
              >
                <div className="text-2xl">{m.emoji}</div>
                <div className="text-[10px] font-medium mt-1">{m.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="voice-dream-title">Başlık (opsiyonel)</Label>
          <Input
            id="voice-dream-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Rüyana bir başlık ver..."
          />
        </div>

        {/* Analyze */}
        {!showResult && (
          <Button
            onClick={analyzeDream}
            disabled={isAnalyzing || !(transcript + interim).trim()}
            className="w-full bg-gradient-to-r from-violet-500 to-purple-500"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Rüyanız analiz ediliyor...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                AI ile Yorumla
              </>
            )}
          </Button>
        )}

        {/* Interpretation Result */}
        <AnimatePresence>
          {showResult && interpretation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  Yorum
                </h4>
                <Button variant="ghost" size="icon" onClick={() => setShowResult(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {interpretation.islamic && (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">İslami Yorum</p>
                  <p className="text-sm">{interpretation.islamic}</p>
                </div>
              )}
              {interpretation.psychological && (
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">Psikolojik Yorum</p>
                  <p className="text-sm">{interpretation.psychological}</p>
                </div>
              )}
              {interpretation.symbols && interpretation.symbols.length > 0 && (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-2">Semboller</p>
                  <div className="flex flex-wrap gap-1.5">
                    {interpretation.symbols.map((s, i) => (
                      <Badge key={i} variant="outline">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save */}
        <Button
          onClick={handleSave}
          disabled={!(transcript + interim).trim()}
          className="w-full"
          size="lg"
        >
          <Save className="w-4 h-4 mr-2" />
          Rüyayı Kaydet
        </Button>
      </div>
    </Card>
  );
}

export default VoiceDreamRecorder;
