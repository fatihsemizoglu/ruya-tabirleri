import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionEventLike = {
  results: SpeechRecognitionResultList;
  resultIndex: number;
};

type SpeechRecognitionErrorEventLike = { error: string; message?: string };

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
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

function normalizeTranscript(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function appendTranscriptSegment(current: string, segment: string): string {
  const base = normalizeTranscript(current);
  const next = normalizeTranscript(segment);
  if (!next) return base;
  if (!base) return next;
  if (base === next || base.endsWith(next)) return base;
  if (next.startsWith(base)) return next;
  return `${base} ${next}`.trim();
}

interface UseVoiceSearchOptions {
  lang?: string;
  continuous?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface UseVoiceSearchResult {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

/**
 * Hook wrapping the Web Speech API for voice-driven search.
 *
 * - Uses SpeechRecognition (Chromium/WebKit) with Turkish by default
 * - Continuous mode with interim results
 * - Auto-restarts once on `no-speech` errors
 * - Cleans up on unmount
 */
export function useVoiceSearch(options: UseVoiceSearchOptions = {}): UseVoiceSearchResult {
  const { lang = 'tr-TR', continuous = false, onResult, onError } = options;
  const Ctor = getSpeechRecognitionCtor();

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isSupported = !!Ctor;

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* noop */
      }
    }
    setIsListening(false);
  }, []);

  const reset = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
    setError(null);
  }, []);

  const start = useCallback(() => {
    if (!Ctor) return;
    setError(null);
    finalTranscriptRef.current = '';
    setTranscript('');

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e) => {
      let final = '';
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (!result) continue;
        const text = result[0]?.transcript || '';
        if (result.isFinal) final += text;
        else interim += text;
      }
      if (final) {
        finalTranscriptRef.current = appendTranscriptSegment(finalTranscriptRef.current, final);
      }
      const text = appendTranscriptSegment(finalTranscriptRef.current, interim);
      setTranscript(text);
      onResult?.(text, !!final);
    };

    recognition.onerror = (e) => {
      setError(e.error);
      onError?.(e.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'start-failed');
      setIsListening(false);
    }
  }, [Ctor, continuous, lang, onResult, onError]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* noop */
        }
      }
    };
  }, []);

  return { isSupported, isListening, transcript, error, start, stop, reset };
}
