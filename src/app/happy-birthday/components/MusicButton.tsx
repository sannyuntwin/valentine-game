'use client';

import { useState, useRef, useEffect } from 'react';

export default function MusicButton() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element with a soft piano music source
    // Using a placeholder - replace with your actual music file URL
    audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3; // Soft volume

    audioRef.current.addEventListener('canplaythrough', () => {
      setIsLoaded(true);
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {
        // Auto-play blocked, user needs to interact first
      });
      setIsPlaying(true);
    }
  };

  return (
    <button
      onClick={toggleMusic}
      className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 flex items-center justify-center text-2xl ${
        isPlaying
          ? 'bg-pink-500/80 text-white shadow-pink-500/30 animate-pulse'
          : 'bg-white/20 text-white hover:bg-white/30'
      }`}
      title={isPlaying ? 'Pause music' : 'Play music'}
    >
      {isPlaying ? '🔊' : '🔇'}
    </button>
  );
}
