import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type RecordingState = 'idle' | 'recording' | 'uploading' | 'done' | 'error';

export function useAudioRecorder(userId: string | undefined) {
  const [state, setState] = useState<RecordingState>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const startRecording = useCallback(async () => {
    chunksRef.current = [];
    setDuration(0);
    setAudioUrl(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => handleUpload();
      recorder.onerror = () => setState('error');

      recorder.start();
      setState('recording');

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch {
      setState('error');
    }
  }, []);

  const stopRecording = useCallback(() => {
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!userId || chunksRef.current.length === 0) return;

    setState('uploading');
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const fileName = `${userId}/${Date.now()}.webm`;
    const file = new File([blob], fileName, { type: 'audio/webm' });

    const { data, error } = await supabase.storage
      .from('dream-audio')
      .upload(fileName, file, { contentType: 'audio/webm' });

    if (error) {
      setState('error');
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('dream-audio')
      .getPublicUrl(fileName);

    setAudioUrl(publicUrl);
    setState('done');
  }, [userId]);

  const reset = useCallback(() => {
    clearInterval(timerRef.current);
    chunksRef.current = [];
    mediaRecorderRef.current = null;
    setState('idle');
    setAudioUrl(null);
    setDuration(0);
  }, []);

  return { state, audioUrl, duration, startRecording, stopRecording, reset };
}
