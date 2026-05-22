import { useCallback, useEffect, useRef, useState } from 'react';

export const useAudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const ensureAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const stopAudio = useCallback(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.onended = null;
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playAudio = useCallback(async (buffer: AudioBuffer, speedFactor: number = 1.0) => {
    stopAudio();
    const ctx = await ensureAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.playbackRate.value = speedFactor;
    source.onended = () => {
      source.disconnect();
      if (sourceNodeRef.current === source) {
        sourceNodeRef.current = null;
      }
      setIsPlaying(false);
    };
    sourceNodeRef.current = source;
    source.start();
    setIsPlaying(true);
  }, [ensureAudioContext, stopAudio]);

  useEffect(() => () => {
    stopAudio();
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, [stopAudio]);

  return {
    isPlaying,
    audioBuffer,
    setAudioBuffer,
    playAudio,
    stopAudio,
  };
};






