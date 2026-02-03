'use client';

import { useState, useEffect, useRef } from 'react';

interface Heart {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  lifetime: number;
  element: HTMLDivElement;
}

interface GameState {
  score: number;
  timeLeft: number;
  combo: number;
  difficulty: 'easy' | 'medium' | 'hard';
  isPlaying: boolean;
  hearts: Heart[];
}

export default function HeartChase() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    timeLeft: 30,
    combo: 0,
    difficulty: 'medium',
    isPlaying: false,
    hearts: []
  });
  
  const [showSetup, setShowSetup] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [hearts, setHearts] = useState<Array<{ id: number; left: string; top: string; delay: string; duration: string }>>([]);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const comboTimerRef = useRef<NodeJS.Timeout | null>(null);

  const difficulties = {
    easy: { speed: 2, spawnRate: 1500, gameTime: 60, heartsPerSpawn: 1 },
    medium: { speed: 4, spawnRate: 1000, gameTime: 45, heartsPerSpawn: 2 },
    hard: { speed: 6, spawnRate: 800, gameTime: 30, heartsPerSpawn: 3 }
  };

  const heartEmojis = ['💖', '💕', '💗', '💓', '💝', '💘', '💞', '💟'];

  useEffect(() => {
    // Create background hearts
    const createHeart = () => {
      const newHeart = {
        id: Date.now() + Math.random(),
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        delay: Math.random() * 4 + 's',
        duration: (Math.random() * 3 + 3) + 's'
      };
      setHearts(prev => [...prev, newHeart]);
      
      setTimeout(() => {
        setHearts(prev => prev.filter(h => h.id !== newHeart.id));
      }, 6000);
    };

    const interval = setInterval(createHeart, 2000);
    return () => clearInterval(interval);
  }, []);

  const startGame = (difficulty: 'easy' | 'medium' | 'hard') => {
    const config = difficulties[difficulty];
    setGameState({
      score: 0,
      timeLeft: config.gameTime,
      combo: 0,
      difficulty,
      isPlaying: true,
      hearts: []
    });
    setShowSetup(false);
    setShowGameOver(false);
    
    startGameTimer(config.gameTime);
    startSpawning(difficulty);
  };

  const startGameTimer = (gameTime: number) => {
    gameTimerRef.current = setInterval(() => {
      setGameState(prev => {
        const newTimeLeft = prev.timeLeft - 1;
        if (newTimeLeft <= 0) {
          endGame();
          return { ...prev, timeLeft: 0 };
        }
        return { ...prev, timeLeft: newTimeLeft };
      });
    }, 1000);
  };

  const startSpawning = (difficulty: 'easy' | 'medium' | 'hard') => {
    const config = difficulties[difficulty];
    
    const spawn = () => {
      if (!gameState.isPlaying) return;

      for (let i = 0; i < config.heartsPerSpawn; i++) {
        setTimeout(() => spawnHeart(difficulty), i * 200);
      }

      spawnTimerRef.current = setTimeout(spawn, config.spawnRate);
    };

    spawn();
  };

  const spawnHeart = (difficulty: 'easy' | 'medium' | 'hard') => {
    if (!gameAreaRef.current || !gameState.isPlaying) return;

    const heart = document.createElement('div');
    heart.className = 'absolute text-4xl cursor-pointer animate-pulse z-10';
    heart.innerHTML = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
    
    const startX = Math.random() * (window.innerWidth - 60);
    const startY = Math.random() * (window.innerHeight - 300) + 200;
    
    heart.style.left = startX + 'px';
    heart.style.top = startY + 'px';
    
    const config = difficulties[difficulty];
    const heartData: Heart = {
      id: Date.now() + Math.random(),
      x: startX,
      y: startY,
      vx: (Math.random() - 0.5) * config.speed,
      vy: (Math.random() - 0.5) * config.speed,
      lifetime: 5000,
      element: heart
    };

    heart.addEventListener('click', () => catchHeart(heartData));
    
    gameAreaRef.current.appendChild(heart);
    setGameState(prev => ({ ...prev, hearts: [...prev.hearts, heartData] }));

    // Move heart
    const moveInterval = setInterval(() => {
      if (!gameState.isPlaying) {
        clearInterval(moveInterval);
        return;
      }

      heartData.x += heartData.vx;
      heartData.y += heartData.vy;

      // Bounce off walls
      if (heartData.x <= 0 || heartData.x >= window.innerWidth - 60) {
        heartData.vx *= -1;
      }
      if (heartData.y <= 100 || heartData.y >= window.innerHeight - 60) {
        heartData.vy *= -1;
      }

      heart.style.left = heartData.x + 'px';
      heart.style.top = heartData.y + 'px';

      heartData.lifetime -= 50;
      if (heartData.lifetime <= 0) {
        removeHeart(heartData);
        clearInterval(moveInterval);
      }
    }, 50);
  };

  const catchHeart = (heartData: Heart) => {
    if (!gameState.isPlaying) return;

    const points = Math.max(10, Math.floor(heartData.lifetime / 50));
    const newScore = gameState.score + points * (1 + gameState.combo * 0.1);
    const newCombo = gameState.combo + 1;

    setGameState(prev => ({
      ...prev,
      score: newScore,
      combo: newCombo
    }));

    // Show combo indicator
    if (newCombo > 0 && newCombo % 5 === 0) {
      showComboIndicator(newCombo);
    }

    // Create particle effect
    createParticles(heartData.x + 30, heartData.y + 30);

    // Remove heart with animation
    heartData.element.classList.add('animate-spin');
    heartData.element.style.opacity = '0';
    heartData.element.style.transform = 'scale(0)';
    setTimeout(() => removeHeart(heartData), 500);

    // Reset combo timer
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    comboTimerRef.current = setTimeout(() => {
      setGameState(prev => ({ ...prev, combo: 0 }));
    }, 2000);
  };

  const removeHeart = (heartData: Heart) => {
    if (heartData.element.parentNode) {
      heartData.element.remove();
    }
    setGameState(prev => ({
      ...prev,
      hearts: prev.hearts.filter(h => h.id !== heartData.id)
    }));
  };

  const createParticles = (x: number, y: number) => {
    for (let i = 0; i < 10; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute text-2xl pointer-events-none z-50';
      particle.innerHTML = '💖';
      particle.style.left = x + 'px';
      particle.style.top = y + 'px';
      particle.style.setProperty('--x', (Math.random() - 0.5) * 100 + 'px');
      particle.style.setProperty('--y', (Math.random() - 0.5) * 100 + 'px');
      particle.style.transition = 'all 1s ease-out';
      
      document.body.appendChild(particle);
      
      setTimeout(() => {
        particle.style.transform = `translate(var(--x), var(--y)) scale(0)`;
        particle.style.opacity = '0';
      }, 10);
      
      setTimeout(() => particle.remove(), 1000);
    }
  };

  const showComboIndicator = (combo: number) => {
    const indicator = document.createElement('div');
    indicator.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-5xl font-bold text-red-400 pointer-events-none z-150';
    indicator.textContent = `${combo}x COMBO!`;
    indicator.style.animation = 'comboPopup 1s ease forwards';
    
    document.body.appendChild(indicator);
    setTimeout(() => indicator.remove(), 1000);
  };

  const endGame = () => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    if (comboTimerRef.current) clearInterval(comboTimerRef.current);

    // Clear all hearts
    gameState.hearts.forEach(heartData => {
      if (heartData.element.parentNode) {
        heartData.element.remove();
      }
    });

    setGameState(prev => ({ ...prev, isPlaying: false, hearts: [] }));
    setShowGameOver(true);
  };

  const resetGame = () => {
    setShowGameOver(false);
    setShowSetup(true);
    setGameState({
      score: 0,
      timeLeft: 30,
      combo: 0,
      difficulty: 'medium',
      isPlaying: false,
      hearts: []
    });
  };

  const getGameOverMessage = () => {
    const finalScore = Math.floor(gameState.score);
    if (finalScore >= 1000) {
      return { title: '🏆 Amazing!', message: "You're a heart-catching champion! Your Valentine would be so proud!" };
    } else if (finalScore >= 500) {
      return { title: '🎉 Great Job!', message: "Excellent skills! You've got what it takes to win hearts!" };
    } else if (finalScore >= 200) {
      return { title: '💖 Good Effort!', message: "Nice work! With practice, you'll be catching hearts like a pro!" };
    } else {
      return { title: '💕 Keep Trying!', message: "Every heart matters! Try again to improve your score!" };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 relative overflow-hidden">
      {/* Background Hearts */}
      {hearts.map(heart => (
        <div
          key={heart.id}
          className="absolute text-pink-300"
          style={{
            left: heart.left,
            top: heart.top,
            fontSize: (Math.random() * 20 + 15) + 'px',
            animationDelay: heart.delay,
            animationDuration: heart.duration,
            animation: 'float 4s ease-in-out infinite'
          }}
        >
          💖
        </div>
      ))}

      {/* Game Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-4 shadow-lg z-100">
        <div className="text-center text-2xl font-bold text-pink-600 mb-2">
          💖 Catch the Hearts!
        </div>
        <div className="flex justify-center gap-8 items-center">
          <div className="text-center">
            <div className="text-sm text-gray-600">Score</div>
            <div className="text-2xl font-bold">{Math.floor(gameState.score)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Time</div>
            <div className="text-2xl font-bold">{gameState.timeLeft}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Combo</div>
            <div className="text-2xl font-bold">{gameState.combo}</div>
          </div>
        </div>
      </div>

      {/* Timer Bar */}
      <div 
        className="fixed bottom-0 left-0 h-2 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 transition-all duration-100 z-100"
        style={{ width: `${(gameState.timeLeft / difficulties[gameState.difficulty].gameTime) * 100}%` }}
      />

      {/* Game Area */}
      <div ref={gameAreaRef} className="pt-32 min-h-screen relative">
        {/* Hearts will be spawned here */}
      </div>

      {/* Setup Screen */}
      {showSetup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-3xl font-bold text-pink-600 text-center mb-4">
              💖 Catch the Valentine Hearts! 💖
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Click on the hearts to catch them before they escape! The faster you catch them, the more points you earn. Build combos for bonus points!
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => startGame('easy')}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-bold hover:scale-105 transition-transform"
              >
                Easy (60s, Slow)
              </button>
              <button
                onClick={() => startGame('medium')}
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full font-bold hover:scale-105 transition-transform"
              >
                Medium (45s, Normal)
              </button>
              <button
                onClick={() => startGame('hard')}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-bold hover:scale-105 transition-transform"
              >
                Hard (30s, Fast)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {showGameOver && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h2 className="text-3xl font-bold text-pink-600 mb-4">
              {getGameOverMessage().title}
            </h2>
            <p className="text-gray-600 mb-6">
              {getGameOverMessage().message}
            </p>
            <div className="text-4xl font-bold text-pink-600 mb-6">
              {Math.floor(gameState.score)}
            </div>
            <button
              onClick={resetGame}
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full font-bold hover:scale-105 transition-transform"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(15deg); }
        }
        
        @keyframes comboPopup {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
}
