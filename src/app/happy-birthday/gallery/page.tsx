'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MusicButton from '../components/MusicButton';

export default function SurpriseGallery() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  // Sample memory data - replace with actual photos and messages
  const memories = [
    {
      id: 1,
      emoji: '📸',
      title: 'Our First Meeting',
      message: 'The day my life changed forever. When I first saw you, I knew something special was beginning.',
      color: 'from-pink-400 to-rose-500'
    },
    {
      id: 2,
      emoji: '☕',
      title: 'Coffee Dates',
      message: 'Every coffee with you tastes sweeter than the last. Your smile is my favorite sight.',
      color: 'from-amber-400 to-orange-500'
    },
    {
      id: 3,
      emoji: '🌅',
      title: 'Sunset Moments',
      message: 'Watching sunsets with you makes every evening magical. You are my sunshine.',
      color: 'from-purple-400 to-indigo-500'
    },
    {
      id: 4,
      emoji: '🎬',
      title: 'Movie Nights',
      message: 'Cuddled up watching movies, your hand in mine. These are the moments I live for.',
      color: 'from-blue-400 to-cyan-500'
    },
    {
      id: 5,
      emoji: '✈️',
      title: 'Adventures Together',
      message: 'Every journey is better with you by my side. Here is to many more adventures!',
      color: 'from-green-400 to-emerald-500'
    },
    {
      id: 6,
      emoji: '💑',
      title: 'Us',
      message: 'You are my today and all of my tomorrows. I love you more than words can say.',
      color: 'from-red-400 to-pink-500'
    }
  ];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % memories.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + memories.length) % memories.length);
  };

  const goToLetter = () => {
    router.push('/happy-birthday/letter');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center relative overflow-hidden px-4 py-8">
      {/* Background Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute text-3xl opacity-20 animate-float-slow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${8 + Math.random() * 4}s`
            }}
          >
            {['💖', '✨', '🌟', '💫', '🦋'][i % 5]}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="text-center mb-8 z-10">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
          Our Memories 💕
        </h1>
        <p className="text-lg text-pink-200">
          Swipe through our beautiful moments together
        </p>
      </div>

      {/* Carousel Container */}
      <div className="relative w-full max-w-2xl z-10">
        {/* Memory Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl min-h-[400px] flex flex-col items-center justify-center text-center transition-all duration-500">
          {/* Memory Emoji */}
          <div className={`text-7xl md:text-8xl mb-6 transform transition-all duration-500 hover:scale-110`}>
            {memories[currentIndex].emoji}
          </div>

          {/* Memory Title */}
          <h2 className={`text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r ${memories[currentIndex].color} bg-clip-text text-transparent`}>
            {memories[currentIndex].title}
          </h2>

          {/* Memory Message */}
          <p className="text-lg md:text-xl text-gray-200 leading-relaxed max-w-lg">
            "{memories[currentIndex].message}"
          </p>

          {/* Progress Indicator */}
          <div className="flex gap-2 mt-8">
            {memories.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-pink-500 w-8'
                    : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-16 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-2xl hover:bg-white/30 transition-all duration-300 hover:scale-110"
        >
          ←
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-16 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-2xl hover:bg-white/30 transition-all duration-300 hover:scale-110"
        >
          →
        </button>
      </div>

      {/* Swipe Hint */}
      <p className="text-white/50 text-sm mt-6 z-10 animate-pulse">
        ← Swipe to see more memories →
      </p>

      {/* Continue to Letter Button */}
      <button
        onClick={goToLetter}
        className="mt-8 px-10 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white text-lg font-medium rounded-full shadow-lg shadow-purple-500/30 hover:scale-105 transition-all duration-300 z-10"
      >
        💌 Open your secret letter
      </button>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }
        
        .animate-float-slow {
          animation: float-slow ease-in-out infinite;
        }
      `}</style>
      <MusicButton />
    </div>
  );
}
