import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Volume2, Search, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface VoiceSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResult: (text: string) => void;
}

const EXAMPLE_PHRASES = [
  'Yılan rüyası',
  'Su görmek',
  'Uçmak',
  'Düşmek',
  'Altın görmek',
];

export function VoiceSearchModal({ open, onOpenChange, onResult }: VoiceSearchModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const cleanupAudio = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {
        // ignore
      }
    }
    setIsListening(false);
    cleanupAudio();
  }, [cleanupAudio]);

  useEffect(() => {
    if (!open) {
      stopRecognition();
      setTranscript('');
      setInterimTranscript('');
      setError(null);
    }
    return () => {
      stopRecognition();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const startAudioAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioContextClass =
        (window as unknown as { AudioContext: typeof AudioContext }).AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        const level = Math.min(100, (avg / 255) * 100);
        setAudioLevel(level);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (err) {
      console.warn('Audio analysis could not start', err);
    }
  }, []);

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript('');
    setInterimTranscript('');

    const SR =
      ((window as unknown as Record<string, unknown>).SpeechRecognition as
        | { new (): SpeechRecognitionInstance }
        | undefined) ||
      ((window as unknown as Record<string, unknown>).webkitSpeechRecognition as
        | { new (): SpeechRecognitionInstance }
        | undefined);

    if (!SR) {
      setError('Tarayıcınız sesli aramayı desteklemiyor.');
      return;
    }

    try {
      const recognition = new SR();
      recognition.lang = 'tr-TR';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalText = '';
        let interimText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += t;
          } else {
            interimText += t;
          }
        }

        if (interimText) {
          setInterimTranscript(interimText);
        }

        if (finalText) {
          setTranscript(finalText);
          setInterimTranscript('');
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        cleanupAudio();
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError('Mikrofon erişimi reddedildi. Lütfen tarayıcı ayarlarınızı kontrol edin.');
        } else if (event.error === 'no-speech') {
          setError('Ses algılanamadı. Lütfen tekrar deneyin.');
        } else if (event.error !== 'aborted') {
          setError('Bir hata oluştu. Lütfen tekrar deneyin.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        cleanupAudio();
      };

      recognitionRef.current = recognition;
      recognition.start();
      await startAudioAnalysis();
    } catch (err) {
      setIsListening(false);
      cleanupAudio();
      setError('Sesli arama başlatılamadı.');
    }
  }, [cleanupAudio, startAudioAnalysis]);

  const handleConfirm = () => {
    const text = (transcript || interimTranscript).trim();
    if (text) {
      onResult(text);
      onOpenChange(false);
    }
  };

  const handleTryAgain = () => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    startListening();
  };

  const handleExampleClick = (phrase: string) => {
    onResult(phrase);
    onOpenChange(false);
  };

  // 32 audio bar visualization
  const audioBars = Array.from({ length: 32 }, (_, i) => {
    return audioLevel / 100;
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[calc(100%-2rem)] max-w-md"
          >
            <div className="relative overflow-hidden rounded-3xl bg-card border border-border/60 shadow-2xl">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Close button */}
              <button
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-background/60 backdrop-blur flex items-center justify-center hover:bg-background/80 transition-colors"
                aria-label="Kapat"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative px-6 pt-8 pb-6">
                {/* Header */}
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-500/20 text-xs font-semibold mb-3"
                  >
                    <Volume2 className="h-3.5 w-3.5 text-primary" />
                    Sesli Arama
                  </motion.div>
                  <h2 className="text-xl font-bold mb-1">Rüyanızı Söyleyin</h2>
                  <p className="text-sm text-muted-foreground">
                    Mikrofona doğru konuşun, sizin yerinize arayalım
                  </p>
                </div>

                {/* Microphone animation */}
                <div className="relative h-40 flex items-center justify-center mb-6">
                  {isListening && (
                    <>
                      <motion.div
                        className="absolute w-32 h-32 rounded-full bg-primary/20"
                        animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <motion.div
                        className="absolute w-32 h-32 rounded-full bg-primary/20"
                        animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                      />
                    </>
                  )}

                  <motion.button
                    onClick={isListening ? stopRecognition : startListening}
                    disabled={!!error && !isListening}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300',
                      isListening
                        ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-xl shadow-red-500/40'
                        : error
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 shadow-xl shadow-primary/30 hover:shadow-primary/50'
                    )}
                    aria-label={isListening ? 'Dinlemeyi durdur' : 'Sesli aramayı başlat'}
                  >
                    {isListening ? (
                      <MicOff className="h-9 w-9 text-white" />
                    ) : (
                      <Mic className="h-9 w-9 text-white" />
                    )}
                  </motion.button>
                </div>

                {/* Audio bars visualization */}
                {isListening && (
                  <div className="flex items-end justify-center gap-1 h-10 mb-4">
                    {audioBars.map((bar, i) => {
                      const height = Math.max(8, (bar + Math.sin((i + Date.now() / 200) * 0.5) * 0.3 + 0.3) * 40);
                      return (
                        <motion.div
                          key={i}
                          className="w-1 bg-gradient-to-t from-violet-500 to-pink-500 rounded-full"
                          animate={{
                            height: `${height}px`,
                          }}
                          transition={{ duration: 0.15 }}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Transcript display */}
                <div
                  className={cn(
                    'min-h-[72px] rounded-2xl border border-border/60 bg-background/60 backdrop-blur p-4 mb-4 transition-all',
                    isListening && 'border-primary/40 shadow-inner'
                  )}
                >
                  {error ? (
                    <div className="flex items-start gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  ) : transcript || interimTranscript ? (
                    <div className="text-center">
                      <p className="text-base font-medium leading-relaxed">
                        {transcript}
                        {interimTranscript && (
                          <span className="text-muted-foreground"> {interimTranscript}</span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      {isListening ? (
                        <span className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                          </span>
                          Dinleniyor...
                        </span>
                      ) : (
                        <span>Mikrofon simgesine tıklayın</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mb-5">
                  {isListening ? (
                    <Button
                      onClick={stopRecognition}
                      variant="outline"
                      className="flex-1 h-11 rounded-xl"
                    >
                      Durdur
                    </Button>
                  ) : transcript || interimTranscript ? (
                    <>
                      <Button
                        onClick={handleTryAgain}
                        variant="outline"
                        className="flex-1 h-11 rounded-xl"
                      >
                        Tekrar Dene
                      </Button>
                      <Button
                        onClick={handleConfirm}
                        className="flex-1 h-11 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Ara
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={startListening}
                      disabled={!!error}
                      className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600"
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      Konuşmaya Başla
                    </Button>
                  )}
                </div>

                {/* Examples */}
                {!transcript && !interimTranscript && (
                  <div className="pt-4 border-t border-border/60">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <Sparkles className="h-3 w-3" />
                      Örnekler
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {EXAMPLE_PHRASES.map((phrase) => (
                        <button
                          key={phrase}
                          onClick={() => handleExampleClick(phrase)}
                          className="text-xs px-2.5 py-1.5 rounded-full bg-muted/60 hover:bg-primary/10 hover:text-primary transition-colors border border-border/40 hover:border-primary/30"
                        >
                          {phrase}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
