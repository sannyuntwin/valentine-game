'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MusicButton from '../components/MusicButton';

export default function BirthdayWish() {
  const [candlesLit, setCandlesLit] = useState([true, true, true, true, true]);
  const [showWish, setShowWish] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; left: string; delay: string }[]>([]);
  const router = useRouter();

  const birthdayName = 'Bae'; // Change this to the actual name

  useEffect(() => {
    // Generate floating hearts
    const hearts = [];
    for (let i = 0; i < 20; i++) {
      hearts.push({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 5}s`
      });
    }
    setFloatingHearts(hearts);
  }, []);

  useEffect(() => {
    // Check if all candles are blown out
    if (candlesLit.every(c => !c) && !showWish) {
      setTimeout(() => {
        setShowWish(true);
      }, 800);
    }
  }, [candlesLit, showWish]);

  const blowOutCandle = (index: number) => {
    const newCandles = [...candlesLit];
    newCandles[index] = false;
    setCandlesLit(newCandles);
  };

  const blowOutAll = () => {
    setCandlesLit([false, false, false, false, false]);
  };

  const handleContinue = () => {
    router.push('/happy-birthday/gallery');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Floating Hearts Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingHearts.map((heart) => (
          <div
            key={heart.id}
            className="absolute text-2xl animate-float-up-slow opacity-30"
            style={{
              left: heart.left,
              bottom: '-50px',
              animationDelay: heart.delay,
              animationDuration: '8s'
            }}
          >
            {['💖', '💕', '💗', '💓', '💝'][heart.id % 5]}
          </div>
        ))}
      </div>

      {/* Sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-200 rounded-full animate-sparkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="text-center z-10 max-w-4xl w-full">
        {/* Birthday Header */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 animate-fade-in">
          Happy Birthday, {birthdayName} 🎉
        </h1>

        <p className="text-xl md:text-2xl text-pink-200 mb-12 animate-fade-in-delay">
          Make a wish and blow out the candles...
        </p>

        {/* Animated Cake */}
        <div className="relative mx-auto mb-12">
          {/* Cake Base */}
          <div className="text-8xl md:text-9xl animate-bounce-slow">🎂</div>

          {/* Candles */}
          <div className="flex justify-center gap-3 md:gap-6 -mt-16 md:-mt-20 mb-4">
            {candlesLit.map((isLit, index) => (
              <button
                key={index}
                onClick={() => blowOutCandle(index)}
                className="relative transition-all duration-300 hover:scale-110"
              >
                <span className="text-4xl md:text-5xl">🕯️</span>
                {isLit && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl animate-flicker">
                    🔥
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Blow Out All Button */}
        {!candlesLit.every(c => !c) && (
          <button
            onClick={blowOutAll}
            className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-lg md:text-xl font-medium rounded-full shadow-lg shadow-pink-500/30 hover:scale-105 transition-all duration-300 mb-8"
          >
            🌬️ Blow out the candles
          </button>
        )}

        {/* Birthday Wish Message (Appears after candles blown out) */}
        <div
          className={`transition-all duration-1000 ${
            showWish
              ? 'opacity-100 translate-y-0 max-h-[1000px]'
              : 'opacity-0 translate-y-8 max-h-0 overflow-hidden'
          }`}
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 md:p-12 mb-8 border border-white/20">
            <p className="text-lg md:text-xl text-white leading-relaxed mb-6">
              Dear {birthdayName},
            </p>
            <p className="text-base md:text-lg text-pink-100 leading-relaxed mb-6">
              On this special day, I want you to know how much you mean to me.
              You bring so much joy, love, and light into my life.
              Every moment with you is a gift I cherish deeply.
            </p>
            <p className="text-base md:text-lg text-pink-100 leading-relaxed mb-6">
              May this year bring you endless happiness, countless adventures,
              and all the love your heart can hold.
            </p>
            <p className="text-xl md:text-2xl text-pink-300 font-semibold">
              Happy Birthday, my love! 💕
            </p>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            className="px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-medium rounded-full shadow-lg shadow-purple-500/30 hover:scale-110 transition-all duration-300"
          >
            Continue to surprises 🎁 →
          </button>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float-up-slow {
          0% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
        }
        
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes flicker {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.95); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float-up-slow {
          animation: float-up-slow linear infinite;
        }
        
        .animate-sparkle {
          animation: sparkle ease-in-out infinite;
        }
        
        .animate-flicker {
          animation: flicker 0.5s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
        
        .animate-fade-in-delay {
          animation: fade-in 1s ease-out 0.5s forwards;
          opacity: 0;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
      <MusicButton />
    </div>
  );
}
