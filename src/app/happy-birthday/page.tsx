'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MusicButton from './components/MusicButton';

export default function HappyBirthday() {
  const [displayText, setDisplayText] = useState('');
  const [showButton, setShowButton] = useState(false);
  const [stars, setStars] = useState<{ id: number; left: string; top: string; delay: string; duration: string }[]>([]);
  const router = useRouter();

  const fullText = 'Hey love… I made something for you 💖';

  useEffect(() => {
    // Generate random stars
    const generatedStars = [];
    for (let i = 0; i < 50; i++) {
      generatedStars.push({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 3}s`,
        duration: `${2 + Math.random() * 3}s`
      });
    }
    setStars(generatedStars);

    // Typing effect
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        // Show button after typing completes
        setTimeout(() => {
          setShowButton(true);
        }, 500);
      }
    }, 100);

    return () => clearInterval(typingInterval);
  }, []);

  const handleStart = () => {
    // Navigate to the next scene or page
    router.push('/happy-birthday/wish');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-slate-900 to-black flex items-center justify-center relative overflow-hidden">
      {/* Animated Stars Background */}
      <div className="absolute inset-0">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
            style={{
              left: star.left,
              top: star.top,
              animationDelay: star.delay,
              animationDuration: star.duration
            }}
          />
        ))}
      </div>

      {/* Soft Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Main Content */}
      <div className="text-center z-10 px-4">
        {/* Typing Text */}
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-light text-white mb-12 min-h-[1.5em]">
          {displayText}
          <span className="inline-block w-1 h-8 md:h-12 bg-pink-400 ml-1 animate-blink" />
        </h1>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className={`px-12 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xl md:text-2xl font-medium rounded-full shadow-lg shadow-pink-500/30 transition-all duration-700 hover:scale-110 hover:shadow-pink-500/50 ${
            showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
          }`}
        >
          👉 Start
        </button>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        .animate-twinkle {
          animation: twinkle ease-in-out infinite;
        }
        
        .animate-blink {
          animation: blink 1s ease-in-out infinite;
        }
      `}</style>
      <MusicButton />
    </div>
  );
}
