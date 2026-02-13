'use client';

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { io, Socket } from 'socket.io-client';

interface Player {
  id: string;
  name: string;
  score: number;
  color: string;
}

interface Heart {
  id: number;
  x: number;
  y: number;
  emoji: string;
  points: number;
  lifetime: number;
}

interface GameState {
  id: string;
  players: Player[];
  currentHearts: Heart[];
  timeLeft: number;
  status: 'waiting' | 'playing' | 'finished';
  gameMode: 'simultaneous' | 'turn-based';
  currentPlayer?: string;
}

export default function MultiplayerHeartChase() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [joinInput, setJoinInput] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string>('');
  const [hearts, setHearts] = useState<Array<{ id: number; left: string; top: string; delay: string; duration: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showScoreAnimation, setShowScoreAnimation] = useState<{ show: boolean; points: number; x: number; y: number } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    totalScore: 0,
    heartsCaught: 0,
    wins: 0,
    highScore: 0
  });

  const socketRef = useRef<Socket | null>(null);

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

    const interval = setInterval(createHeart, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Prevent page refresh during active gameplay
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (gameState && gameState.status === 'playing') {
        e.preventDefault();
        e.returnValue = 'Game is in progress! Are you sure you want to leave? Your progress will be lost.';
        return 'Game is in progress! Are you sure you want to leave? Your progress will be lost.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [gameState]);

  useEffect(() => {
    // Initialize socket connection with better error handling
    const serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    
    const newSocket = io(serverUrl, {
      transports: ['polling', 'websocket'], // Try websocket first, fallback to polling
      timeout: 10000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true
    });
    socketRef.current = newSocket;
    setSocket(newSocket);

    // Set a timeout to show the page even if connection fails
    const connectionTimeout = setTimeout(() => {
      if (!isConnected) {
        setConnectionError('Connection taking longer than expected. The server might not be running.');
        console.log('Connection timeout - showing page anyway');
      }
    }, 5000);

    newSocket.on('connect', () => {
      clearTimeout(connectionTimeout);
      setIsConnected(true);
      setConnectionError('');
      setPlayerId(newSocket.id || '');
      console.log('Connected to server with ID:', newSocket.id);
    });

    newSocket.on('connect_error', (error) => {
      clearTimeout(connectionTimeout);
      console.error('Connection error:', error);
      
      // More specific error handling
      if (error.message.includes('xhr poll error')) {
        setConnectionError('Server connection failed. Please ensure the socket server is running on port 3001.');
        showNotification('error', 'Server not running. Start the socket server first.');
      } else if (error.message.includes('ECONNREFUSED')) {
        setConnectionError('Connection refused. The server might not be running.');
        showNotification('error', 'Cannot connect to server. Please check if port 3001 is available.');
      } else {
        setConnectionError('Failed to connect to server. Multiplayer features may not work.');
        showNotification('error', 'Connection failed. Some features may not work.');
      }
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('Disconnected from server:', reason);
      
      // Show appropriate message based on disconnect reason
      if (reason === 'io server disconnect') {
        showNotification('info', 'Server disconnected. Please refresh the page.');
      } else if (reason === 'ping timeout') {
        showNotification('error', 'Connection timeout. Please check your internet.');
      }
    });

    // Handle reconnection attempts
    newSocket.on('reconnecting', (attemptNumber) => {
      console.log(`Reconnecting... attempt ${attemptNumber}`);
      showNotification('info', `Reconnecting... (${attemptNumber})`);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      showNotification('success', 'Reconnected to server!');
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Failed to reconnect to server');
      showNotification('error', 'Unable to reconnect to server. Please refresh the page.');
    });

    newSocket.on('heart-room-created', ({ roomId, playerInfo }) => {
      setRoomId(roomId);
      console.log('Heart room created:', roomId);
    });

    newSocket.on('heart-room-joined', ({ roomId, playerInfo }) => {
      setRoomId(roomId);
      console.log('Heart room joined:', roomId);
    });

    newSocket.on('heart-game-state', (state: GameState) => {
      console.log('Game state updated:', state);
      console.log('Current player scores:', state.players.map(p => `${p.name}: ${p.score}`));
      setGameState(state);
      
      // Play game over sound when game finishes
      if (state.status === 'finished' && gameState?.status === 'playing') {
        playSound('gameOver');
        triggerHaptic('heavy');
        
        // Update statistics
        const currentPlayer = state.players.find(p => p.id === playerId);
        if (currentPlayer) {
          const isWinner = state.players.reduce((max, player) => player.score > max.score ? player : max).id === playerId;
          
          setStats(prev => ({
            gamesPlayed: prev.gamesPlayed + 1,
            totalScore: prev.totalScore + currentPlayer.score,
            heartsCaught: prev.heartsCaught + Math.floor(currentPlayer.score / 15), // Estimate hearts caught
            wins: prev.wins + (isWinner ? 1 : 0),
            highScore: Math.max(prev.highScore, currentPlayer.score)
          }));
        }
      }
    });

    newSocket.on('player-joined-heart', (playerInfo) => {
      console.log('Player joined heart game:', playerInfo);
    });

    newSocket.on('heart-caught', ({ playerId, heartId, points, playerName, heartEmoji }) => {
      console.log(`${playerName} caught heart ${heartId} for ${points} points`);
      
      // Update local game state to reflect the caught heart
      if (gameState) {
        const updatedHearts = gameState.currentHearts.filter(h => h.id !== heartId);
        const updatedPlayers = gameState.players.map(p => 
          p.id === playerId ? { ...p, score: p.score + points } : p
        );
        
        setGameState({
          ...gameState,
          currentHearts: updatedHearts,
          players: updatedPlayers
        });
      }
      
      // Show who caught the heart
      showCatchNotification(playerName, points, heartEmoji);
    });

    newSocket.on('error', (message: string) => {
      console.error('Socket error:', message);
      showNotification('error', message);
    });

    return () => {
      clearTimeout(connectionTimeout);
      newSocket.close();
    };
  }, []);

  // Add advanced visual effects
  const useAdvancedEffects = () => {
    useEffect(() => {
      // Add parallax effect to background
      const handleMouseMove = (e: MouseEvent) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        
        document.documentElement.style.setProperty('--parallax-x', `${x}px`);
        document.documentElement.style.setProperty('--parallax-y', `${y}px`);
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Add magnetic effect to buttons
    const addMagneticEffect = (element: HTMLElement) => {
      const handleMouseEnter = (e: MouseEvent) => {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        element.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px) scale(1.05)`;
        element.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      };

      const handleMouseLeave = () => {
        element.style.transform = 'translate(0, 0) scale(1)';
      };

      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
      
      return () => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      };
    };

    return { addMagneticEffect };
  };

  const { addMagneticEffect } = useAdvancedEffects();

  // Memoized haptic feedback function (declared before use)
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy') => {
    if (!hapticEnabled || !('vibrate' in navigator)) return;
    
    try {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate([50, 30, 50]);
          break;
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }, [hapticEnabled]);

  // Memoized notification system
  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    triggerHaptic(type === 'error' ? 'heavy' : 'light');
    
    // Auto-hide after 3 seconds
    const timer = setTimeout(() => {
      setNotification(null);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [triggerHaptic]);

  // Function to start the socket server (for development)
  const startSocketServer = () => {
    showNotification('info', 'To start the socket server, run: node socket-server.js');
  };

  // Memoized sound effects functions
  const playSound = useCallback((type: 'catch' | 'gameStart' | 'gameOver' | 'join') => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      switch (type) {
        case 'catch':
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);
          break;
        case 'gameStart':
          oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
          break;
        case 'gameOver':
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.5);
          oscillator.type = 'square';
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
          break;
        case 'join':
          oscillator.frequency.value = 600;
          oscillator.type = 'triangle';
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);
          break;
      }
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }, [soundEnabled]);

  const createRoom = async () => {
    console.log('Creating room with name:', playerName.trim());
    if (!socket || !playerName.trim()) {
      console.error('Cannot create room - socket or name missing', { socket: !!socket, name: playerName.trim() });
      showNotification('error', !socket ? 'Not connected to server' : 'Please enter your name');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate creation delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Emitting create-heart-room event');
      socket.emit('create-heart-room', { playerName: playerName.trim() });
      playSound('join');
      triggerHaptic('medium');
      showNotification('success', 'Room created successfully!');
    } catch (error) {
      console.error('Failed to create room:', error);
      showNotification('error', 'Failed to create room. Please try again.');
    } finally {
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const joinRoom = async () => {
    if (!socket || !playerName.trim() || !joinInput.trim()) {
      showNotification('error', !socket ? 'Not connected to server' : !playerName.trim() ? 'Please enter your name' : 'Please enter a room code');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate joining delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      socket.emit('join-heart-room', { 
        roomId: joinInput.trim().toUpperCase(), 
        playerName: playerName.trim() 
      });
      playSound('join');
      triggerHaptic('medium');
      showNotification('success', 'Joining room...');
    } catch (error) {
      console.error('Failed to join room:', error);
      showNotification('error', 'Failed to join room. Please check the room code.');
    } finally {
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const startGame = async () => {
    if (!socket || !roomId) {
      showNotification('error', 'Unable to start game');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Add countdown for better anticipation
      for (let i = 3; i > 0; i--) {
        await new Promise(resolve => setTimeout(resolve, 800));
        // Could add countdown UI here
      }
      
      socket.emit('start-heart-game', { roomId });
      playSound('gameStart');
      triggerHaptic('heavy');
      showNotification('success', 'Game started! Catch those hearts!');
    } catch (error) {
      console.error('Failed to start game:', error);
      showNotification('error', 'Failed to start game. Please try again.');
    } finally {
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  // Memoized Heart Component
  const HeartComponent = memo(({ heart }: { heart: Heart }) => {
    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      document.documentElement.style.setProperty('--mouse-x', `${x}px`);
      document.documentElement.style.setProperty('--mouse-y', `${y}px`);
      
      catchHeart(heart.id);
    }, [heart.id, catchHeart]);

    return (
      <button
        onClick={handleClick}
        disabled={gameState?.status !== 'playing'}
        className={`absolute text-4xl sm:text-5xl cursor-pointer transition-all duration-200 hover:scale-125 active:scale-150 ${
          gameState?.status === 'playing' 
            ? 'hover:drop-shadow-lg animate-pulse' 
            : 'cursor-not-allowed opacity-50'
        }`}
        style={{
          left: `${heart.x}px`,
          top: `${heart.y}px`,
          animation: `fall ${heart.lifetime}ms linear`,
          textShadow: '0 0 15px rgba(255, 105, 180, 0.7), 0 0 30px rgba(255, 105, 180, 0.3)',
          filter: gameState?.status === 'playing' ? 'brightness(1.3) saturate(1.2)' : 'brightness(0.7) saturate(0.8)',
          transform: `translate(-50%, -50%) ${gameState?.status === 'playing' ? 'scale(1)' : 'scale(0.8)'}`,
          padding: '10px',
          margin: '-10px',
        }}
      >
        <span className="relative">
          {heart.emoji}
          {gameState?.status === 'playing' && (
            <span className="absolute -top-2 -right-2 text-xs font-bold text-yellow-400 bg-pink-600 rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center animate-bounce">
              {heart.points}
            </span>
          )}
        </span>
      </button>
    );
  });

  // Memoized createCatchEffect function (declared before catchHeart)
  const createCatchEffect = useCallback((x: number, y: number, points: number) => {
    // Create floating score popup with enhanced animation
    const scorePopup = document.createElement('div');
    scorePopup.className = 'fixed text-3xl font-bold text-pink-600 pointer-events-none z-50';
    scorePopup.style.left = `${x}px`;
    scorePopup.style.top = `${y}px`;
    scorePopup.style.transform = 'translate(-50%, -50%)';
    scorePopup.style.animation = 'scoreFloat 1.5s ease-out forwards';
    scorePopup.style.textShadow = '0 0 20px rgba(255, 105, 180, 0.8)';
    scorePopup.textContent = `+${points}`;
    document.body.appendChild(scorePopup);

    // Create enhanced particle explosion with more variety
    const particles = ['💖', '💕', '💗', '💓', '✨', '⭐'];
    const particleCount = 12;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'fixed text-2xl pointer-events-none z-50';
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.transform = 'translate(-50%, -50%)';
      particle.textContent = particles[Math.floor(Math.random() * particles.length)];
      
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 4 + Math.random() * 4;
      let posX = 0;
      let posY = 0;
      let opacity = 1;
      let scale = 1;
      
      const animate = () => {
        posX += Math.cos(angle) * velocity;
        posY += Math.sin(angle) * velocity + 3; // Add gravity
        opacity -= 0.015;
        scale -= 0.01;
        
        particle.style.transform = `translate(calc(-50% + ${posX}px), calc(-50% + ${posY}px)) scale(${scale})`;
        particle.style.opacity = opacity.toString();
        particle.style.filter = `blur(${(1 - opacity) * 2}px)`;
        
        if (opacity > 0) {
          requestAnimationFrame(animate);
        } else {
          particle.remove();
        }
      };
      
      requestAnimationFrame(animate);
      document.body.appendChild(particle);
    }

    // Create ripple effect
    const ripple = document.createElement('div');
    ripple.className = 'fixed rounded-full border-4 border-pink-400 pointer-events-none z-40';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.transform = 'translate(-50%, -50%)';
    ripple.style.width = '20px';
    ripple.style.height = '20px';
    ripple.style.animation = 'ripple 0.8s ease-out forwards';
    document.body.appendChild(ripple);

    // Remove elements after animations
    setTimeout(() => {
      scorePopup.remove();
      ripple.remove();
    }, 1500);
  }, []);

  // Memoized catchHeart function
  const catchHeart = useCallback((heartId: number) => {
    console.log(`=== CATCH HEART DEBUG ===`);
    console.log(`heartId (number):`, heartId, typeof heartId);
    console.log(`gameState?.status:`, gameState?.status);
    console.log(`roomId:`, roomId);
    console.log(`socket connected:`, !!socket);
    
    if (socket && roomId && gameState?.status === 'playing') {
      // Create visual feedback at click position
      const heart = gameState.currentHearts.find(h => h.id === heartId);
      console.log(`Found heart:`, heart);
      console.log(`All current hearts:`, gameState.currentHearts.map(h => ({id: h.id, type: typeof h.id})));
      
      if (heart) {
        createCatchEffect(heart.x, heart.y, heart.points);
        playSound('catch');
        triggerHaptic('light');
        console.log(`Catching heart ${heartId} (${heart.emoji}) for ${heart.points} points`);
      } else {
        console.log(`Heart ${heartId} not found in current hearts`);
      }
      console.log(`Sending catch-heart event for room ${roomId}, heart ${heartId}`);
      socket.emit('catch-heart', { roomId, heartId });
    } else {
      console.log('Cannot catch heart - game not in playing state or missing data');
    }
    console.log(`=== END DEBUG ===`);
  }, [socket, roomId, gameState, createCatchEffect, playSound, triggerHaptic]);

  const resetGame = () => {
    if (socket && roomId) {
      socket.emit('reset-heart-game', { roomId });
    }
  };

  // Add skeleton loading component
  const SkeletonLoader = () => (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-5/6"></div>
    </div>
  );

  // Add progressive image loading
  const ProgressiveImage = memo(({ src, alt, className }: { src: string; alt: string; className?: string }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setError(true);
      img.src = src;
    }, [src]);

    if (error) {
      return (
        <div className={`flex items-center justify-center bg-gray-200 rounded-lg ${className}`}>
          <span className="text-gray-500 text-sm">Failed to load</span>
        </div>
      );
    }

    return (
      <div className={`relative ${className}`}>
        {!isLoaded && <SkeletonLoader />}
        <img
          src={src}
          alt={alt}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
          onLoad={() => setIsLoaded(true)}
        />
      </div>
    );
  });
  const currentPlayer = useMemo(() => {
    return gameState?.players.find((p: Player) => p.id === playerId);
  }, [gameState?.players, playerId]);

  const isMyTurn = useMemo(() => {
    if (!gameState || gameState.gameMode !== 'turn-based') return true;
    return gameState.currentPlayer === playerId;
  }, [gameState, playerId]);

  const gameStats = useMemo(() => {
    if (!gameState) return null;
    const maxScore = Math.max(...gameState.players.map((p: Player) => p.score), 0);
    const leader = gameState.players.find((p: Player) => p.score === maxScore);
    return { maxScore, leader };
  }, [gameState]);

  const showCatchNotification = useCallback((playerName: string, points: number, heartEmoji: string) => {
    // Create enhanced notification showing who caught the heart
    const notification = document.createElement('div');
    notification.className = 'fixed top-40 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl z-50 pointer-events-none';
    notification.style.animation = 'notificationSlide 2.5s ease-out forwards';
    
    const isMe = playerName === currentPlayer?.name;
    const bgColor = isMe ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gradient-to-r from-orange-400 to-yellow-400';
    
    notification.innerHTML = `
      <div class="text-center">
        <div class="text-5xl mb-3 animate-bounce">${heartEmoji}</div>
        <div class="font-bold text-lg mb-2 ${isMe ? 'text-green-700' : 'text-orange-700'}">
          ${isMe ? '🎉 You caught it!' : `${playerName} caught it!`}
        </div>
        <div class="text-3xl font-bold text-pink-600 animate-pulse">+${points}</div>
        <div class="mt-2 text-sm text-gray-600">Points earned!</div>
      </div>
    `;
    
    // Add glow effect
    notification.style.boxShadow = `0 0 30px ${isMe ? 'rgba(34, 197, 94, 0.5)' : 'rgba(251, 146, 60, 0.5)'}`;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2500);
  }, [currentPlayer]);


  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle keyboard shortcuts when not in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
        // Spacebar to start game (when waiting)
          if (gameState?.status === 'waiting' && gameState.players.length === 2) {
            e.preventDefault();
            startGame();
          }
          break;
        case 'r':
        case 'R':
          // R to reset game (when finished)
          if (gameState?.status === 'finished') {
            e.preventDefault();
            resetGame();
          }
          break;
        case 'Escape':
          // Escape to leave room
          if (roomId) {
            e.preventDefault();
            window.location.reload();
          }
          break;
        case 's':
        case 'S':
          // S to toggle sound
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setSoundEnabled(prev => !prev);
            showNotification('info', !soundEnabled ? 'Sound enabled' : 'Sound disabled');
          }
          break;
        case 'h':
        case 'H':
          // H to toggle haptic
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setHapticEnabled(prev => !prev);
            showNotification('info', !hapticEnabled ? 'Haptic enabled' : 'Haptic disabled');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, roomId, soundEnabled, hapticEnabled, startGame, resetGame, showNotification]);

  // Add accessibility improvements
  useEffect(() => {
    // Announce game state changes to screen readers
    if (!gameState) return;

    const announcement = gameState.status === 'waiting' 
      ? 'Game waiting for players'
      : gameState.status === 'playing'
      ? `Game in progress. ${gameState.timeLeft} seconds remaining`
      : 'Game finished';

    // Create or update live region for screen readers
    let liveRegion = document.getElementById('game-announcements');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'game-announcements';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }
    
    liveRegion.textContent = announcement;
  }, [gameState?.status, gameState?.timeLeft]);

  if (!isConnected && connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-300 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-3xl font-bold text-red-600 mb-4">Connection Failed</h1>
          <p className="text-gray-700 mb-6">{connectionError}</p>
          
          {/* Specific error guidance */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-red-800 mb-2">🔧 Quick Fix:</p>
            <div className="text-xs text-red-700 space-y-2">
              <div>
                <strong>1. Open Terminal</strong> in your project folder
              </div>
              <div>
                <strong>2. Run:</strong> <code className="bg-red-100 px-2 py-1 rounded block mt-1">node socket-server.js</code>
              </div>
              <div>
                <strong>3. Look for:</strong> <code className="bg-red-100 px-1 rounded">"Socket.IO server running on port 3001"</code>
              </div>
              <div>
                <strong>4. Refresh</strong> this page
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              🔄 Refresh Page
            </button>
            <button
              onClick={startSocketServer}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              📋 Server Help
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected && !connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-300 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center max-w-md">
          <h1 className="text-3xl font-bold text-pink-600 mb-4">Connecting to Server...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Making connection to multiplayer server...</p>
          <p className="text-sm text-gray-500 mb-4">Server: http://localhost:3001</p>
          
          {/* Add troubleshooting tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
            <p className="text-sm font-semibold text-blue-800 mb-2">💡 Troubleshooting:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Make sure the socket server is running</li>
              <li>• Run: <code className="bg-blue-100 px-1 rounded">node socket-server.js</code></li>
              <li>• Check that port 3001 is available</li>
              <li>• Ensure no firewall is blocking the connection</li>
            </ul>
          </div>
          
          <button
            onClick={startSocketServer}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            📋 How to Start Server
          </button>
        </div>
      </div>
    );
  }

  if (!roomId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-300 relative overflow-hidden">
        {/* Floating Hearts Background */}
        {hearts.map(heart => (
          <div
            key={heart.id}
            className="absolute text-pink-400 animate-pulse"
            style={{
              left: heart.left,
              top: heart.top,
              fontSize: (Math.random() * 20 + 10) + 'px',
              animationDelay: heart.delay,
              animationDuration: heart.duration,
              animation: 'float 3s ease-in-out infinite'
            }}
          >
            💝
          </div>
        ))}

        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full relative z-10">
            <h1 className="text-4xl font-bold text-pink-600 text-center mb-8">
              💕 Multiplayer Love Catch 💖
            </h1>

            {/* Connection Status */}
            {connectionError && (
              <div className="bg-yellow-100 border-2 border-yellow-300 rounded-xl p-3 mb-6">
                <p className="text-sm text-yellow-800 text-center">
                  ⚠️ {connectionError}
                </p>
              </div>
            )}
            
            {isConnected && (
              <div className="bg-green-100 border-2 border-green-300 rounded-xl p-3 mb-6">
                <p className="text-sm text-green-800 text-center">
                  ✅ Connected to server
                </p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name:</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name..."
                  maxLength={15}
                  className="w-full px-4 py-2 border-2 border-pink-300 rounded-lg focus:outline-none focus:border-pink-500 bg-white text-gray-800 placeholder-gray-500"
                />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Create New Room</h2>
                <button
                  onClick={createRoom}
                  disabled={!playerName.trim() || isLoading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-bold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 relative overflow-hidden"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    '🎮 Create Room'
                  )}
                  {isLoading && (
                    <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                  )}
                </button>
              </div>

              <div className="text-center text-gray-500">OR</div>

              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Join Existing Room</h2>
                <input
                  type="text"
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value)}
                  placeholder="Enter Room Code"
                  className="w-full px-4 py-2 border-2 border-pink-300 rounded-lg text-center font-mono text-lg focus:outline-none focus:border-pink-400 mb-3 bg-white text-gray-800 placeholder-gray-500 transition-colors duration-200"
                  maxLength={6}
                  disabled={isLoading}
                />
                <button
                  onClick={joinRoom}
                  disabled={!playerName.trim() || !joinInput.trim() || isLoading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full font-bold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 relative overflow-hidden"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Joining...
                    </span>
                  ) : (
                    '🔗 Join Room'
                  )}
                  {isLoading && (
                    <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-8 text-center text-sm text-gray-600">
              <p>Share the room code with your Valentine! 💕</p>
              <p className="mt-2">Catch hearts together from anywhere! 🌍</p>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(10deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-300 relative overflow-hidden">
      {/* Floating Hearts Background */}
      {hearts.map(heart => (
        <div
          key={heart.id}
          className="absolute text-pink-400 animate-pulse"
          style={{
            left: heart.left,
            top: heart.top,
            fontSize: (Math.random() * 20 + 10) + 'px',
            animationDelay: heart.delay,
            animationDuration: heart.duration,
            animation: 'float 3s ease-in-out infinite'
          }}
        >
          💝
        </div>
      ))}

      {/* Game Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-3 sm:p-4 shadow-lg z-100 max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-pink-600 mb-2">
            💕 Multiplayer Love Catch! 💕
          </h1>
          {roomId && (
            <div className="bg-pink-100 rounded-full px-2 py-1 sm:px-3 sm:py-1 inline-block mb-2">
              <p className="text-xs sm:text-sm font-mono font-bold text-pink-700">Room: {roomId}</p>
            </div>
          )}
        </div>
        {gameState && (
          <div className="flex justify-around items-center flex-wrap gap-2">
            {gameState.players.map((player, index) => (
              <div key={player.id} className={`p-2 sm:p-3 rounded-xl transition-all ${
                player.id === playerId ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 scale-105 shadow-lg' : 'bg-white shadow-md'
              }`}>
                <div className="font-bold text-xs sm:text-sm">{player.name} {player.id === playerId && '(You)'}</div>
                <div className="text-lg sm:text-2xl font-bold">{player.score}</div>
                {player.id === playerId && gameState.status === 'playing' && (
                  <div className="text-xs text-green-600 font-semibold">Your Turn!</div>
                )}
              </div>
            ))}
            <div className="text-center">
              <div className="text-sm text-gray-600">Time</div>
              <div className={`text-2xl font-bold ${gameState.timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
                {gameState.timeLeft}s
              </div>
              {gameState.timeLeft <= 10 && (
                <div className="text-xs text-red-600 font-semibold">Hurry!</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Game Status */}
      {gameState && (
        <div className="fixed top-20 sm:top-24 left-0 right-0 text-center z-50 px-4 max-w-7xl mx-auto">
          {gameState.status === 'waiting' && (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 sm:p-4 mx-auto max-w-sm">
              <p className="text-lg sm:text-xl font-semibold text-orange-600 mb-2">
                ⏳ Waiting for players...
              </p>
              <p className="text-xs sm:text-sm text-gray-600 mb-3">Players in room: {gameState.players.length}/2</p>
              {gameState.players.length === 2 && (
                <button
                  onClick={startGame}
                  disabled={isLoading}
                  className="px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-bold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 relative overflow-hidden text-sm sm:text-base"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Starting...
                    </span>
                  ) : (
                    '🎮 Start Game'
                  )}
                  {isLoading && (
                    <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                  )}
                </button>
              )}
              <p className="text-xs text-gray-500 mt-2">Share room code: {roomId}</p>
            </div>
          )}
          {gameState.status === 'finished' && (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 sm:p-4 mx-auto max-w-sm animate-bounce">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-pink-600 mb-2">
                  🏆 Game Over! 🏆
                </div>
                <div className="mb-4">
                  {gameStats && (
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-gray-800">
                        {gameStats.leader ? (
                          <span>
                            🏅 Winner: <span className="text-pink-600">{gameStats.leader.name}</span>
                          </span>
                        ) : (
                          <span className="text-gray-600">It's a tie!</span>
                        )}
                      </p>
                      <div className="flex justify-center gap-4 text-sm">
                        {gameState.players.map((player) => (
                          <div key={player.id} className={`px-3 py-1 rounded-lg ${
                            player.id === gameStats.leader?.id ? 'bg-yellow-100 border-yellow-300' : 'bg-gray-100 border-gray-300'
                          }`}>
                            <span className="font-semibold">{player.name}</span>
                            <span className="text-gray-600">: {player.score}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={resetGame}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full font-bold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    🔄 Play Again
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-gray-500 text-white rounded-full font-bold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    🏠 Leave Room
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game Area */}
      <div className="pt-40 sm:pt-48 min-h-screen relative">
        {/* Click effect overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: gameState?.status === 'playing' 
              ? 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 182, 193, 0.1) 0%, transparent 50%)'
              : 'none'
          }}
        />
        
        {/* Hearts */}
        {gameState?.currentHearts.map(heart => (
          <button
            key={heart.id}
            onClick={(e) => {
              // Add click effect
              const rect = e.currentTarget.getBoundingClientRect();
              const x = rect.left + rect.width / 2;
              const y = rect.top + rect.height / 2;
              document.documentElement.style.setProperty('--mouse-x', `${x}px`);
              document.documentElement.style.setProperty('--mouse-y', `${y}px`);
              
              catchHeart(heart.id);
            }}
            disabled={gameState.status !== 'playing'}
            className={`absolute text-4xl sm:text-5xl cursor-pointer transition-all duration-200 hover:scale-125 active:scale-150 ${
              gameState.status === 'playing' 
                ? 'hover:drop-shadow-lg animate-pulse' 
                : 'cursor-not-allowed opacity-50'
            }`}
            style={{
              left: `${heart.x}px`,
              top: `${heart.y}px`,
              animation: `fall ${heart.lifetime}ms linear`,
              textShadow: '0 0 15px rgba(255, 105, 180, 0.7), 0 0 30px rgba(255, 105, 180, 0.3)',
              filter: gameState.status === 'playing' ? 'brightness(1.3) saturate(1.2)' : 'brightness(0.7) saturate(0.8)',
              transform: `translate(-50%, -50%) ${gameState.status === 'playing' ? 'scale(1)' : 'scale(0.8)'}`,
              // Increase touch target for mobile
              padding: '10px',
              margin: '-10px',
            }}
          >
            <span className="relative">
              {heart.emoji}
              {gameState.status === 'playing' && (
                <span className="absolute -top-2 -right-2 text-xs font-bold text-yellow-400 bg-pink-600 rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center animate-bounce">
                  {heart.points}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Game Stats */}
      {roomId && (
        <div className="fixed top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg z-40">
          <h3 className="text-sm font-bold text-gray-700 mb-2">📊 Your Stats</h3>
          <div className="text-xs space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Games:</span>
              <span className="font-bold">{stats.gamesPlayed}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">High Score:</span>
              <span className="font-bold text-pink-600">{stats.highScore}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Wins:</span>
              <span className="font-bold text-green-600">{stats.wins}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Hearts:</span>
              <span className="font-bold text-red-500">{stats.heartsCaught}</span>
            </div>
          </div>
          
          {/* Achievements */}
          <div className="mt-3 pt-2 border-t border-gray-200">
            <h4 className="text-xs font-bold text-gray-700 mb-1">🏆 Achievements</h4>
            <div className="flex gap-1 flex-wrap">
              {stats.gamesPlayed >= 1 && (
                <span className="text-xs" title="First Game">🎮</span>
              )}
              {stats.highScore >= 100 && (
                <span className="text-xs" title="Century Club">💯</span>
              )}
              {stats.wins >= 1 && (
                <span className="text-xs" title="First Win">🏆</span>
              )}
              {stats.heartsCaught >= 10 && (
                <span className="text-xs" title="Heart Collector">💝</span>
              )}
              {stats.wins >= 5 && (
                <span className="text-xs" title="Champion">👑</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification System */}
      {notification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-4">
          <div className={`px-6 py-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 animate-bounce ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : notification.type === 'error' 
              ? 'bg-red-500 text-white' 
              : 'bg-blue-500 text-white'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}
              </span>
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Leave Room Button */}
      <div className="fixed bottom-4 right-4 flex gap-2">
        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`px-3 py-2 rounded-full text-xs sm:text-sm transition-colors shadow-lg ${
            soundEnabled 
              ? 'bg-green-500 text-white hover:bg-green-600' 
              : 'bg-gray-400 text-white hover:bg-gray-500'
          }`}
          title="Toggle Sound"
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
        
        {/* Haptic Toggle */}
        <button
          onClick={() => setHapticEnabled(!hapticEnabled)}
          className={`px-3 py-2 rounded-full text-xs sm:text-sm transition-colors shadow-lg ${
            hapticEnabled 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-400 text-white hover:bg-gray-500'
          }`}
          title="Toggle Haptic Feedback"
        >
          📳
        </button>
        
        {/* Leave Room */}
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-500 text-white rounded-full text-xs sm:text-sm hover:bg-gray-600 transition-colors shadow-lg"
        >
          🚪 Leave Room
        </button>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        
        @keyframes fall {
          from { transform: translateY(-100px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          to { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        
        @keyframes scoreFloat {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          20% { transform: translate(-50%, -60px) scale(1.3); opacity: 1; }
          50% { transform: translate(-50%, -80px) scale(1.1); opacity: 1; }
          100% { transform: translate(-50%, -120px) scale(0.9); opacity: 0; }
        }
        
        @keyframes notificationSlide {
          0% { transform: translate(-50%, -20px); opacity: 0; }
          15% { transform: translate(-50%, 0); opacity: 1; }
          85% { transform: translate(-50%, 0); opacity: 1; }
          100% { transform: translate(-50%, -20px); opacity: 0; }
        }
        
        @keyframes ripple {
          0% {
            width: 20px;
            height: 20px;
            opacity: 1;
          }
          100% {
            width: 200px;
            height: 200px;
            opacity: 0;
          }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px rgba(255, 105, 180, 0.5); }
          50% { box-shadow: 0 0 20px rgba(255, 105, 180, 0.8); }
        }
      `}</style>
    </div>
  );
}
