"use client";
import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Square, Volume2, VolumeX } from "lucide-react";

interface AudioPlayerProps {
  audioUrl?: string;
  audioBlob?: Blob;
  isPlaying: boolean;
  onPlayStateChange: (isPlaying: boolean) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  showVolumeControl?: boolean;
  onAudioEnd?: () => void;
}

export default function AudioPlayer({
  audioUrl,
  audioBlob,
  isPlaying,
  onPlayStateChange,
  className = "",
  size = "md",
  showVolumeControl = false,
  onAudioEnd
}: AudioPlayerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4", 
    lg: "w-5 h-5"
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [isMuted, volume]);

  useEffect(() => {
    if (audioRef.current) {
      const handleEnded = () => {
        onPlayStateChange(false);
        onAudioEnd?.();
      };

      audioRef.current.addEventListener('ended', handleEnded);
      return () => {
        audioRef.current?.removeEventListener('ended', handleEnded);
      };
    }
  }, [onPlayStateChange, onAudioEnd]);

  const handlePlay = async () => {
    if (!audioRef.current) {
      const audio = new Audio();
      audioRef.current = audio;
    }

    if (audioUrl) {
      audioRef.current.src = audioUrl;
    } else if (audioBlob) {
      audioRef.current.src = URL.createObjectURL(audioBlob);
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
        onPlayStateChange(false);
      } else {
        await audioRef.current.play();
        onPlayStateChange(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      onPlayStateChange(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      onPlayStateChange(false);
    }
  };

  const handleVolumeToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handlePlay}
        className={`${sizeClasses[size]} rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors`}
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause className={`${iconSizes[size]} text-white`} />
        ) : (
          <Play className={`${iconSizes[size]} text-white`} />
        )}
      </button>

      <button
        onClick={handleStop}
        className={`${sizeClasses[size]} rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors`}
        title="Stop"
      >
        <Square className={`${iconSizes[size]} text-white`} />
      </button>

      {showVolumeControl && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleVolumeToggle}
            className={`${sizeClasses[size]} rounded-full bg-gray-600 hover:bg-gray-700 flex items-center justify-center transition-colors`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className={`${iconSizes[size]} text-white`} />
            ) : (
              <Volume2 className={`${iconSizes[size]} text-white`} />
            )}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}
