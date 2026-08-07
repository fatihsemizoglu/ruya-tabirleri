import { useCallback, useEffect, useRef, useState } from 'react';
import { notify } from '@/lib/notify';
import type { JournalFormData } from '@/lib/dream-journal-constants';

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

/**
 * Web Speech API tabanlı sesli dikte durumunu ve mantığını yönetir.
 * `updateForm` işlevsel bir setState güncelleyicisi olmalıdır; dikte edilen
 * metin, bayat closure sorunu olmadan form içeriğine eklenir.
 */
export function useVoiceDictation(
  updateForm: (updater: (prev: JournalFormData) => JournalFormData) => void
) {
  const [voiceDraft, setVoiceDraft] = useState('');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceBaseContentRef = useRef<string | null>(null);
  const voiceFinalPartsRef = useRef<string[]>([]);
  const updateFormRef = useRef(updateForm);
  updateFormRef.current = updateForm;

  useEffect(() => {
    setIsVoiceSupported(!!getSpeechRecognitionCtor());
  }, []);

  const applyVoiceText = useCallback((text: string) => {
    const cleanText = normalizeVoiceText(text);
    if (!cleanText) return;
    setVoiceDraft(cleanText);
    updateFormRef.current((current) => {
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

  const stopDictation = useCallback(() => {
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

  const startDictation = useCallback((mode: VoiceLaunchMode, baseContent: string) => {
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
    voiceBaseContentRef.current = baseContent;
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
      stopDictation();
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
      stopDictation();
    }
  }, [applyVoiceText, stopDictation]);

  useEffect(() => stopDictation, [stopDictation]);

  const toggleDictation = useCallback((baseContent: string) => {
    if (!isVoiceSupported) {
      notify.error('Tarayıcınız sesli dikteyi desteklemiyor', {
        description: 'Chrome, Edge veya Web Speech API destekleyen bir tarayıcı deneyin.',
      });
      return;
    }
    if (isVoiceListening) {
      stopDictation();
      return;
    }
    startDictation('manual', baseContent);
  }, [isVoiceSupported, isVoiceListening, startDictation, stopDictation]);

  /** Kullanıcı dikte sırasında içeriği elle düzenlerse temel içeriği sıfırlar. */
  const markManualEdit = useCallback(() => {
    if (!isVoiceListening) voiceBaseContentRef.current = null;
  }, [isVoiceListening]);

  return {
    voiceDraft,
    isVoiceListening,
    isVoiceSupported,
    startDictation,
    stopDictation,
    toggleDictation,
    markManualEdit,
  };
}
