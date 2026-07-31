import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type SpeechState = 'idle' | 'speaking' | 'paused' | 'unsupported';

interface UseSpeechSynthesisOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
}

function getSpeechSynthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null;
  return window.speechSynthesis ?? null;
}

function createUtterance(text: string, options: Required<UseSpeechSynthesisOptions>) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang;
  utterance.rate = options.rate;
  utterance.pitch = options.pitch;
  return utterance;
}

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}) {
  const resolvedOptions = useMemo<Required<UseSpeechSynthesisOptions>>(() => ({
    lang: options.lang ?? 'tr-TR',
    rate: options.rate ?? 0.95,
    pitch: options.pitch ?? 1,
  }), [options.lang, options.pitch, options.rate]);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [state, setState] = useState<SpeechState>(() => (getSpeechSynthesis() ? 'idle' : 'unsupported'));

  const stop = useCallback(() => {
    const synth = synthRef.current ?? getSpeechSynthesis();
    if (!synth) return;
    synth.cancel();
    utteranceRef.current = null;
    setState('idle');
  }, []);

  const speak = useCallback((text: string) => {
    const synth = synthRef.current ?? getSpeechSynthesis();
    if (!synth) {
      setState('unsupported');
      return;
    }

    const cleanText = text.replace(/\s+/g, ' ').trim();
    if (!cleanText) return;

    synth.cancel();

    const utterance = createUtterance(cleanText, resolvedOptions);
    utterance.onstart = () => setState('speaking');
    utterance.onpause = () => setState('paused');
    utterance.onresume = () => setState('speaking');
    utterance.onend = () => setState('idle');
    utterance.onerror = () => setState('idle');
    utteranceRef.current = utterance;
    synth.speak(utterance);
  }, [resolvedOptions]);

  const pause = useCallback(() => {
    const synth = synthRef.current ?? getSpeechSynthesis();
    if (!synth || !synth.speaking || synth.paused) return;
    synth.pause();
    setState('paused');
  }, []);

  const resume = useCallback(() => {
    const synth = synthRef.current ?? getSpeechSynthesis();
    if (!synth || !synth.paused) return;
    synth.resume();
    setState('speaking');
  }, []);

  useEffect(() => {
    synthRef.current = getSpeechSynthesis();
    if (!synthRef.current) setState('unsupported');
    return () => {
      synthRef.current?.cancel();
      utteranceRef.current = null;
    };
  }, []);

  return {
    isSupported: state !== 'unsupported',
    isSpeaking: state === 'speaking',
    isPaused: state === 'paused',
    state,
    speak,
    pause,
    resume,
    stop,
  };
}