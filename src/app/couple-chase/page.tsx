'use client';

import { useState, useEffect, useRef } from 'react';

interface Player {
  name: string;
  score: number;
}

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
  players: {
    player1: Player;
    player2: Player;
  };
  currentPlayer: 'player1' | 'player2';
  timeLeft: number;
  turnTime: number;
  isPlaying: boolean;
  hearts: Heart[];
  totalTurns: number;
  maxTurns: number;
}

export default function CoupleChase() {
  const [gameState, setGameState] = useState<GameState>({
    players: {
      player1: { name: 'Player 1', score: 0 },
      player2: { name: 'Player 2', score: 0 }
    },
    currentPlayer: 'player1',
    timeLeft: 15,
    turnTime: 15,
    isPlaying: false,
    hearts: [],
    totalTurns: 0,
    maxTurns: 6
  });

  const [showSetup, setShowSetup] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showTurnIndicator, setShowTurnIndicator] = useState(false);
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [hearts, setHearts] = useState<Array<{ id: number; left: string; top: string; delay: string; duration: string }>>([]);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const startGame = () => {
    const p1Name = player1Name.trim() || 'Player 1';
    const p2Name = player2Name.trim() || 'Player 2';
    
    setGameState(prev => ({
      ...prev,
      players: {
        player1: { name: p1Name, score: 0 },
        player2: { name: p2Name, score: 0 }
      },
      currentPlayer: 'player1',
      totalTurns: 0
    }));
    
    setShowSetup(false);
    setShowTurnIndicator(true);
  };

  const startTurn = () => {
    setShowTurnIndicator(false);
    setGameState(prev => ({
      ...prev,
      timeLeft: prev.turnTime,
      isPlaying: true,
      hearts: []
    }));
    
    startGameTimer();
    startSpawning();
  };

  const startGameTimer = () => {
    gameTimerRef.current = setInterval(() => {
      setGameState(prev => {
        const newTimeLeft = prev.timeLeft - 1;
        if (newTimeLeft <= 0) {
          endTurn();
          return { ...prev, timeLeft: 0 };
        }
        return { ...prev, timeLeft: newTimeLeft };
      });
    }, 1000);
  };

  const startSpawning = () => {
    const spawn = () => {
      if (!gameState.isPlaying) return;

      spawnHeart();
      
      // Spawn rate increases over time
      const spawnDelay = Math.max(300, 800 - (gameState.totalTurns * 50));
      spawnTimerRef.current = setTimeout(spawn, spawnDelay);
    };

    spawn();
  };

  const spawnHeart = () => {
    if (!gameAreaRef.current || !gameState.isPlaying) return;

    const heart = document.createElement('div');
    heart.className = 'absolute text-4xl cursor-pointer animate-pulse z-10';
    heart.innerHTML = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
    
    const startX = Math.random() * (window.innerWidth - 60);
    const startY = Math.random() * (window.innerHeight - 300) + 200;
    
    heart.style.left = startX + 'px';
    heart.style.top = startY + 'px';
    
    const speed = 3 + (gameState.totalTurns * 0.5); // Speed increases with turns
    const heartData: Heart = {
      id: Date.now() + Math.random(),
      x: startX,
      y: startY,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      lifetime: 4000,
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
      if (heartData.y <= 180 || heartData.y >= window.innerHeight - 60) {
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

    const points = Math.max(10, Math.floor(heartData.lifetime / 40));
    
    setGameState(prev => ({
      ...prev,
      players: {
        ...prev.players,
        [prev.currentPlayer]: {
          ...prev.players[prev.currentPlayer],
          score: prev.players[prev.currentPlayer].score + points
        }
      }
    }));

    // Create particle effect
    createParticles(heartData.x + 30, heartData.y + 30);

    // Remove heart with animation
    heartData.element.classList.add('animate-spin');
    heartData.element.style.opacity = '0';
    heartData.element.style.transform = 'scale(0)';
    setTimeout(() => removeHeart(heartData), 500);
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
    for (let i = 0; i < 8; i++) {
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

  const endTurn = () => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);

    // Clear all hearts
    gameState.hearts.forEach(heartData => {
      if (heartData.element.parentNode) {
        heartData.element.remove();
      }
    });

    const newTotalTurns = gameState.totalTurns + 1;

    // Check if game is over
    if (newTotalTurns >= gameState.maxTurns) {
      endGame();
    } else {
      // Switch players
      const nextPlayer = gameState.currentPlayer === 'player1' ? 'player2' : 'player1';
      setGameState(prev => ({
        ...prev,
        isPlaying: false,
        hearts: [],
        totalTurns: newTotalTurns,
        currentPlayer: nextPlayer
      }));
      setShowTurnIndicator(true);
    }
  };

  const endGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: false }));
    setShowGameOver(true);
  };

  const resetGame = () => {
    setShowGameOver(false);
    setShowSetup(true);
    setShowTurnIndicator(false);
    setGameState({
      players: {
        player1: { name: 'Player 1', score: 0 },
        player2: { name: 'Player 2', score: 0 }
      },
      currentPlayer: 'player1',
      timeLeft: 15,
      turnTime: 15,
      isPlaying: false,
      hearts: [],
      totalTurns: 0,
      maxTurns: 6
    });
    setPlayer1Name('');
    setPlayer2Name('');
  };

  const claimKiss = () => {
    // Create kiss animation
    const kiss = document.createElement('div');
    kiss.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl z-300';
    kiss.innerHTML = '💋';
    kiss.style.animation = 'kissPulse 2s ease forwards';
    
    document.body.appendChild(kiss);
    setTimeout(() => kiss.remove(), 2000);
    
    // Create celebration hearts
    for (let i = 0; i < 15; i++) {
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
        
        const angle = (Math.PI * 2 * i) / 15;
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

  const getWinnerInfo = () => {
    const player1Score = gameState.players.player1.score;
    const player2Score = gameState.players.player2.score;
    
    if (player1Score > player2Score) {
      return {
        winner: gameState.players.player1,
        loser: gameState.players.player2,
        title: `🏆 ${gameState.players.player1.name} Wins! 🏆`,
        message: `${gameState.players.player1.name} scored ${player1Score} points vs ${gameState.players.player2.name}'s ${player2Score} points!`
      };
    } else if (player2Score > player1Score) {
      return {
        winner: gameState.players.player2,
        loser: gameState.players.player1,
        title: `🏆 ${gameState.players.player2.name} Wins! 🏆`,
        message: `${gameState.players.player2.name} scored ${player2Score} points vs ${gameState.players.player1.name}'s ${player1Score} points!`
      };
    } else {
      return {
        winner: null,
        loser: null,
        title: `🤝 It's a Tie! 🤝`,
        message: `Both players scored ${player1Score} points! Everyone wins a kiss! 😘`
      };
    }
  };

  const winnerInfo = getWinnerInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-500 relative overflow-hidden">
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
          💕 Couple's Valentine Chase! 💕
        </div>
        <div className="flex justify-around items-center">
          <div className={`p-3 rounded-xl transition-all ${gameState.currentPlayer === 'player1' ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white scale-105' : 'bg-white'}`}>
            <div className="font-bold">{gameState.players.player1.name}</div>
            <div className="text-2xl font-bold">{gameState.players.player1.score}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Current Turn</div>
            <div className="text-lg font-bold">
              {gameState.isPlaying ? `${gameState.players[gameState.currentPlayer].name} (${gameState.timeLeft}s)` : 'Get Ready!'}
            </div>
          </div>
          <div className={`p-3 rounded-xl transition-all ${gameState.currentPlayer === 'player2' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white scale-105' : 'bg-white'}`}>
            <div className="font-bold">{gameState.players.player2.name}</div>
            <div className="text-2xl font-bold">{gameState.players.player2.score}</div>
          </div>
        </div>
      </div>

      {/* Timer Bar */}
      <div 
        className="fixed bottom-0 left-0 h-2 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 transition-all duration-100 z-100"
        style={{ width: `${(gameState.timeLeft / gameState.turnTime) * 100}%` }}
      />

      {/* Game Area */}
      <div ref={gameAreaRef} className="pt-40 min-h-screen relative">
        {/* Hearts will be spawned here */}
      </div>

      {/* Setup Screen */}
      {showSetup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-3xl font-bold text-pink-600 text-center mb-4">
              💕 Couple's Valentine Setup 💕
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Enter your names and get ready for a romantic competition! The winner gets a kiss from the loser! 😘
            </p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Player 1 Name:</label>
                <input
                  type="text"
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  placeholder="Enter name..."
                  maxLength={15}
                  className="w-full px-4 py-2 border-2 border-pink-300 rounded-lg focus:outline-none focus:border-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Player 2 Name:</label>
                <input
                  type="text"
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  placeholder="Enter name..."
                  maxLength={15}
                  className="w-full px-4 py-2 border-2 border-pink-300 rounded-lg focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>
            <button
              onClick={startGame}
              className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full font-bold hover:scale-105 transition-transform"
            >
              Start Game
            </button>
          </div>
        </div>
      )}

      {/* Turn Indicator */}
      {showTurnIndicator && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-180">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
            <h3 className="text-2xl font-bold text-pink-600 mb-4">
              {gameState.players[gameState.currentPlayer].name}'s Turn!
            </h3>
            <button
              onClick={startTurn}
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full font-bold hover:scale-105 transition-transform"
            >
              Start Turn
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {showGameOver && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h2 className="text-3xl font-bold text-pink-600 mb-4">
              {winnerInfo.title}
            </h2>
            <p className="text-gray-600 mb-6">
              {winnerInfo.message}
            </p>
            <div className="text-5xl mb-6">👑</div>
            <div className="text-xl text-pink-600 font-bold mb-6">
              Time for the penalty kiss! 😘💋
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full font-bold hover:scale-105 transition-transform"
              >
                Play Again
              </button>
              <button
                onClick={claimKiss}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full font-bold hover:scale-105 transition-transform"
              >
                Claim Kiss! 💋
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(15deg); }
        }
        
        @keyframes kissPulse {
          0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.5) rotate(180deg); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
