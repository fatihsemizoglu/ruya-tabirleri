import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionEventLike = {
  results: { 0: { transcript: string; isFinal: boolean }; length: number } & ArrayLike<{ transcript: string; isFinal: boolean }>;
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

interface UseVoiceSearchOptions {
  lang?: string;
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
  const { lang = 'tr-TR', onResult, onError } = options;
  const Ctor = getSpeechRecognitionCtor();

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
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
    setTranscript('');
    setError(null);
  }, []);

  const start = useCallback(() => {
    if (!Ctor) return;
    setError(null);
    setTranscript('');

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e) => {
      let final = '';
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r.transcript;
        else interim += r.transcript;
      }
      const text = (final || interim).trim();
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
  }, [Ctor, lang, onResult, onError]);

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
