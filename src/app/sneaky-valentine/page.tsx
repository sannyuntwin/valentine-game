'use client';

import { useState, useEffect } from 'react';

export default function SneakyValentine() {
  const [noClickCount, setNoClickCount] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [noPosition, setNoPosition] = useState({ x: 0, y: 0 });
  const [noScale, setNoScale] = useState(1);
  const [hearts, setHearts] = useState<Array<{ id: number; left: string; top: string; delay: string; duration: string }>>([]);

  const noResponses = [
    '❌ No',
    '🤔 Really?',
    '😏 Think again',
    '🥺 Please?',
    '💕 Just say yes',
    '🌹 Be mine',
    '😊 You know you want to',
    '💖 Pretty please',
    '🎁 I have chocolate',
    '🌟 Last chance!'
  ];

  useEffect(() => {
    // Create floating hearts
    const createHeart = () => {
      const newHeart = {
        id: Date.now() + Math.random(),
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        delay: Math.random() * 3 + 's',
        duration: (Math.random() * 3 + 2) + 's'
      };
      setHearts(prev => [...prev, newHeart]);
      
      setTimeout(() => {
        setHearts(prev => prev.filter(h => h.id !== newHeart.id));
      }, 5000);
    };

    const interval = setInterval(createHeart, 300);
    return () => clearInterval(interval);
  }, []);

  const handleNoHover = () => {
    if (isMoving) return;
    setIsMoving(true);
    
    const newCount = noClickCount + 1;
    setNoClickCount(newCount);
    
    // Shrink the button
    const newScale = Math.max(0.3, 1 - (newCount * 0.1));
    setNoScale(newScale);
    
    // Move to random position
    const container = document.getElementById('game-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      const maxX = rect.width - 100;
      const maxY = rect.height - 50;
      
      const randomX = Math.random() * maxX;
      const randomY = Math.random() * maxY;
      
      setNoPosition({ x: randomX, y: randomY });
    }
    
    setTimeout(() => {
      setIsMoving(false);
    }, 200);
  };

  const handleNoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Rapid escape sequence
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const container = document.getElementById('game-container');
        if (container) {
          const rect = container.getBoundingClientRect();
          const randomX = Math.random() * (rect.width - 100);
          const randomY = Math.random() * (rect.height - 50);
          
          setNoPosition({ x: randomX, y: randomY });
        }
      }, i * 100);
    }
  };

  const handleYesClick = () => {
    setShowSuccess(true);
    
    // Celebration hearts explosion
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const heart = document.createElement('div');
        heart.innerHTML = '💖';
        heart.style.position = 'fixed';
        heart.style.left = '50%';
        heart.style.top = '50%';
        heart.style.fontSize = '30px';
        heart.style.color = '#e91e63';
        heart.style.transform = 'translate(-50%, -50%)';
        heart.style.pointerEvents = 'none';
        heart.style.zIndex = '1000';
        
        const angle = (Math.PI * 2 * i) / 20;
        const velocity = 5 + Math.random() * 5;
        
        document.body.appendChild(heart);
        
        let posX = 0;
        let posY = 0;
        let opacity = 1;
        
        const animate = () => {
          posX += Math.cos(angle) * velocity;
          posY += Math.sin(angle) * velocity;
          opacity -= 0.02;
          
          heart.style.transform = `translate(calc(-50% + ${posX}px), calc(-50% + ${posY}px))`;
          heart.style.opacity = opacity.toString();
          
          if (opacity > 0) {
            requestAnimationFrame(animate);
          } else {
            heart.remove();
          }
        };
        
        requestAnimationFrame(animate);
      }, i * 50);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 relative overflow-hidden">
      {/* Floating Hearts Background */}
      {hearts.map(heart => (
        <div
          key={heart.id}
          className="absolute text-pink-300 animate-pulse"
          style={{
            left: heart.left,
            top: heart.top,
            fontSize: (Math.random() * 20 + 10) + 'px',
            animationDelay: heart.delay,
            animationDuration: heart.duration,
            animation: 'float 3s ease-in-out infinite'
          }}
        >
          💖
        </div>
      ))}

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full relative z-10">
          {!showSuccess ? (
            <>
              <h1 className="text-4xl font-bold text-pink-600 text-center mb-8 animate-pulse">
                💖 Will you be my Valentine?
              </h1>
              
              <div className="flex gap-4 justify-center items-center mt-8">
                <button
                  onClick={handleYesClick}
                  className="px-8 py-4 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-lg hover:shadow-xl"
                >
                  ✅ Yes
                </button>
                
                <button
                  onMouseEnter={handleNoHover}
                  onClick={handleNoClick}
                  className="px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl"
                  style={{
                    position: 'absolute',
                    left: noPosition.x + 'px',
                    top: noPosition.y + 'px',
                    transform: `scale(${noScale})`,
                    background: noClickCount > 3 ? 
                      `linear-gradient(45deg, hsl(${Math.random() * 360}, 70%, 60%), hsl(${Math.random() * 360}, 70%, 50%))` : 
                      undefined
                  }}
                >
                  {noClickCount < noResponses.length ? noResponses[noClickCount] : '💖 Please!'}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center animate-fade-in">
              <h2 className="text-3xl font-bold text-pink-600 mb-4">
                🎉 Yay! You made my day! 🎉
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                I knew you'd say yes! You're the best Valentine ever! 💕<br />
                Get ready for lots of love, hugs, and happiness! 🌹
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease;
        }
      `}</style>
    </div>
  );
}
