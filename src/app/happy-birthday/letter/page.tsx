'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MusicButton from '../components/MusicButton';

export default function SecretLetter() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const [floatingElements, setFloatingElements] = useState<{ id: number; left: string; delay: string; emoji: string }[]>([]);

  useEffect(() => {
    // Generate floating elements
    const elements = [];
    for (let i = 0; i < 25; i++) {
      elements.push({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 5}s`,
        emoji: ['💖', '💌', '✨', '💕', '🌸', '🦋'][i % 6]
      });
    }
    setFloatingElements(elements);

    // Hide hint after 5 seconds
    const hintTimer = setTimeout(() => {
      setShowHint(false);
    }, 5000);

    return () => clearTimeout(hintTimer);
  }, []);

  const handleEnvelopeClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    // Unlock after 3 clicks (or single click if preferred)
    if (newCount >= 1) {
      setIsUnlocked(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-900 flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingElements.map((el) => (
          <div
            key={el.id}
            className="absolute text-2xl opacity-20 animate-float-gentle"
            style={{
              left: el.left,
              bottom: '-50px',
              animationDelay: el.delay,
              animationDuration: '10s'
            }}
          >
            {el.emoji}
          </div>
        ))}
      </div>

      {/* Soft Glow Effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-3xl animate-pulse" />

      {/* Main Content */}
      <div className="text-center z-10 max-w-3xl w-full">
        {/* Header */}
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 animate-fade-in">
          A Secret Message 💌
        </h1>

        {!isUnlocked && (
          <>
            <p className="text-lg md:text-xl text-pink-200 mb-8 animate-fade-in-delay">
              Open when you miss me...
            </p>

            {/* Hint */}
            {showHint && (
              <p className="text-sm text-white/40 mb-6 animate-pulse">
                (Click the envelope to open)
              </p>
            )}

            {/* Closed Envelope */}
            <button
              onClick={handleEnvelopeClick}
              className="text-9xl md:text-[12rem] transition-all duration-500 hover:scale-110 hover:rotate-3 animate-float-envelope cursor-pointer"
            >
              💌
            </button>

            <p className="text-white/50 text-sm mt-8">
              Click to unlock your letter
            </p>
          </>
        )}

        {/* Unlocked Letter Content */}
        <div
          className={`transition-all duration-1000 ${
            isUnlocked
              ? 'opacity-100 translate-y-0 max-h-[2000px]'
              : 'opacity-0 translate-y-12 max-h-0 overflow-hidden'
          }`}
        >
          {/* Open Envelope Animation */}
          <div className="text-8xl md:text-9xl mb-8 animate-bounce-gentle">
            💝
          </div>

          {/* Love Letter */}
          <div className="bg-gradient-to-br from-pink-100/95 to-purple-100/95 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-2xl border border-pink-200/50 text-left transform rotate-1 hover:rotate-0 transition-all duration-500">
            {/* Letter Header */}
            <div className="border-b-2 border-pink-300/50 pb-4 mb-6">
              <p className="text-pink-600 font-medium">To My Dearest,</p>
              <p className="text-pink-400 text-sm">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Letter Body */}
            <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
              <p>
                My Love,
              </p>
              <p>
                Pa နှလုံးသားထဲမှာ Bae အတွက် အချစ်တွေနဲ့ ပြည့်နေတယ် ဆိုတာ ယုံပါနော်။ 
                ဒီထူးခြားတဲ့နေ့မှာ Bae သိထားသင့်တာက Bae က Pa ဘဝကို စိတ်ပိုင်းဆိုင်ရာ ကောင်းတဲ့ပြောင်းလဲမှုတွေ ပေးခဲ့တယ်ဆိုတာပဲ။
              </p>
              <p>
                အရင်က တစ်ပါးသူထက် ကိုယ့်အတွက်ပဲ ကြည့်တတ်တဲ့ Pa က အခုဆို သူ့များအတွက်တွေလည်း နားလည်ပေးတတ်လာပြီပဲ။ 
                Bae က တစ်ခါတစ်လေ ချစ်ဖို့ကောင်းသလို တစ်ခါတစ်လေကျတော့လည်း ပြောစကား နားမထောင် ပြောရ တအားခက်။ 
              </p>
              <p>
                နေ့ရက်တိုင်းကို အကောင်းဆုံးဖြစ်စေဖို့ စိတ်ကောင်းထားရမယ်နော်။ မာယာတွေများတဲ့ ဒီလောကကြီးထဲမှာ ဘယ်သူတွေ  တရားပျက်
                ပျက် ကိုယ်မပျက်ဖို့တော့ လိုမယ်နော် BAE
              </p>
              <p>
                အခုဆို Bae အသက်တစ်နှစ် ကြီးလာပြီး .... Pa စကားကိုလည်း ပိုနားထောင်ဖို့ လိုပါတယ်။
              </p>
              <p>
                Bae မွေးနေ့မှာ ကောင်းခြင်းအဖြာဖြာနဲ့ ပြည့်စုံပြီး လိုအင်ဆန္ဒတွေ ပြည့်ဝပါစေလို့ Pa အဝေးကနေ ဆုတောင်းပေးပါတယ်နော်။
              </p>
              <p className="text-pink-600 font-semibold italic">
                Happy Birthday, my love. I am so grateful you were born.
              </p>
            </div>

            {/* Letter Footer */}
            <div className="border-t-2 border-pink-300/50 pt-4 mt-6 text-right">
              <p className="text-pink-600 font-medium">Forever Yours,</p>
              <p className="text-pink-500">💕</p>
            </div>
          </div>

          {/* Interactive Hearts */}
          <div className="flex justify-center gap-4 mt-8">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className="text-3xl animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              >
                💖
              </span>
            ))}
          </div>

          {/* Back to Home */}
          <div className="mt-12">
            <Link
              href="/"
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-lg font-medium rounded-full shadow-lg hover:scale-105 transition-all duration-300 inline-block"
            >
              Back to Games 🎮
            </Link>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in-delay {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes float-gentle {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.2; }
          50% { opacity: 0.4; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        
        @keyframes float-envelope {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        
        @keyframes bounce-gentle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
        
        .animate-fade-in-delay {
          animation: fade-in-delay 1s ease-out 0.3s forwards;
          opacity: 0;
        }
        
        .animate-float-gentle {
          animation: float-gentle linear infinite;
        }
        
        .animate-float-envelope {
          animation: float-envelope 3s ease-in-out infinite;
        }
        
        .animate-bounce-gentle {
          animation: bounce-gentle 1s ease-in-out;
        }
      `}</style>
      <MusicButton />
    </div>
  );
}
