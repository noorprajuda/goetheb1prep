import { useState, useRef, useCallback } from 'react';

interface UseAudioProps {
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  onError?: (error: Error) => void;
}

interface UseAudioReturn {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  play: (audioUrl?: string, audioBlob?: Blob) => Promise<void>;
  pause: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  seek: (time: number) => void;
}

export function useAudio({
  onPlayStart,
  onPlayEnd,
  onError
}: UseAudioProps = {}): UseAudioReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(async (audioUrl?: string, audioBlob?: Blob) => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const audio = audioRef.current;

      // Set up event listeners
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        onPlayEnd?.();
      };

      const handleError = (event: Event) => {
        const error = new Error('Audio playback failed');
        onError?.(error);
        setIsPlaying(false);
      };

      // Remove existing listeners
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);

      // Add new listeners
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      // Set audio source
      if (audioUrl) {
        audio.src = audioUrl;
      } else if (audioBlob) {
        audio.src = URL.createObjectURL(audioBlob);
      } else {
        throw new Error('No audio source provided');
      }

      // Set volume
      audio.volume = isMuted ? 0 : volume;

      // Play audio
      await audio.play();
      setIsPlaying(true);
      onPlayStart?.();
    } catch (error) {
      onError?.(error as Error);
      setIsPlaying(false);
    }
  }, [isMuted, volume, onPlayStart, onPlayEnd, onError]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : clampedVolume;
    }
  }, [isMuted]);

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted);
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    play,
    pause,
    stop,
    setVolume,
    setMuted,
    seek
  };
}
