'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

type Player = 'X' | 'O' | null;
type Board = Player[];
type GameState = {
  id: string;
  players: Array<{ id: string; symbol: Player }>;
  board: Board;
  currentTurn: Player;
  status: 'waiting' | 'playing' | 'finished';
  winner: Player | 'draw';
  winningLine: number[];
};

export default function MultiplayerTicTacToe() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerSymbol, setPlayerSymbol] = useState<Player>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [joinInput, setJoinInput] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [hearts, setHearts] = useState<Array<{ id: number; left: string; top: string; delay: string; duration: string }>>([]);

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
    // Initialize socket connection
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const newSocket = io(socketUrl);
    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    newSocket.on('room-created', ({ roomId, playerSymbol: symbol }) => {
      setRoomId(roomId);
      setPlayerSymbol(symbol);
      console.log('Room created:', roomId);
    });

    newSocket.on('room-joined', ({ roomId, playerSymbol: symbol }) => {
      setRoomId(roomId);
      setPlayerSymbol(symbol);
      console.log('Room joined:', roomId);
    });

    newSocket.on('player-joined', ({ playerSymbol: symbol }) => {
      console.log('Other player joined with symbol:', symbol);
    });

    newSocket.on('game-state', (state: GameState) => {
      setGameState(state);
    });

    newSocket.on('player-disconnected', () => {
      console.log('Other player disconnected');
    });

    newSocket.on('error', (message: string) => {
      alert(message);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const createRoom = () => {
    if (socket) {
      socket.emit('create-room');
    }
  };

  const joinRoom = () => {
    if (socket && joinInput.trim()) {
      socket.emit('join-room', joinInput.trim().toUpperCase());
    }
  };

  const makeMove = (index: number) => {
    if (socket && gameState && roomId) {
      socket.emit('make-move', { roomId, index });
    }
  };

  const resetGame = () => {
    if (socket && roomId) {
      socket.emit('reset-game', roomId);
    }
  };

  const getCellContent = (player: Player) => {
    if (player === 'X') return '💕';
    if (player === 'O') return '💖';
    return '';
  };

  const isWinningCell = (index: number) => gameState?.winningLine.includes(index) || false;

  const canMakeMove = (index: number) => {
    return gameState &&
      gameState.status === 'playing' &&
      gameState.board[index] === null &&
      gameState.currentTurn === playerSymbol;
  };

  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    // Timeout to stop showing loading screen if connection fails
    const timer = setTimeout(() => {
      if (!isConnected) {
        setConnectionError(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [isConnected]);

  if (!isConnected && !connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-300 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center">
          <h1 className="text-3xl font-bold text-pink-600 mb-4">Connecting to Server...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
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
              💕 Multiplayer Tic Tac Toe 💖
            </h1>

            {connectionError && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r" role="alert">
                <p className="font-bold">Connection Error</p>
                <p>Could not connect to the game server. You can still look around, but multiplayer features are disabled.</p>
                <p className="text-xs mt-1">Server URL: {process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}</p>
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
                  disabled={!isConnected}
                  className="w-full px-4 py-2 border-2 border-pink-300 rounded-lg focus:outline-none focus:border-pink-500 bg-white text-gray-800 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Create New Room</h2>
                <button
                  onClick={createRoom}
                  disabled={!playerName.trim() || !isConnected}
                  className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-bold hover:scale-105 transition-transform shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🎮 Create Room
                </button>
              </div>

              <div className="text-center text-gray-500">OR</div>

              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Join Existing Room</h2>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name..."
                  maxLength={15}
                  disabled={!isConnected}
                  className="w-full px-4 py-2 border-2 border-pink-300 rounded-lg focus:outline-none focus:border-pink-500 bg-white text-gray-800 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <input
                  type="text"
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value)}
                  placeholder="Enter Room Code"
                  className="w-full px-4 py-2 border-2 border-pink-200 rounded-full text-center font-mono text-lg focus:outline-none focus:border-pink-400 mb-3 bg-white text-gray-800 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  maxLength={6}
                  disabled={!isConnected}
                />
                <button
                  onClick={joinRoom}
                  disabled={!playerName.trim() || !joinInput.trim() || !isConnected}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full font-bold hover:scale-105 transition-transform shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🔗 Join Room
                </button>
              </div>
            </div>

            <div className="mt-8 text-center text-sm text-gray-600">
              <p>Share the room code with your Valentine! 💕</p>
              <p className="mt-2">Play together from anywhere! 🌍</p>
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

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-lg w-full relative z-10">
          {/* Room Info */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-pink-600 mb-2">
              💕 Multiplayer Tic Tac Toe 💖
            </h1>
            <div className="bg-pink-100 rounded-full px-4 py-2 inline-block">
              <p className="text-sm font-mono font-bold text-pink-700">Room: {roomId}</p>
            </div>
            <p className="text-xs text-gray-600 mt-1">You are: {playerSymbol === 'X' ? '💕' : '💖'}</p>
          </div>

          {/* Game Status */}
          {gameState && (
            <div className="text-center mb-6">
              {gameState.status === 'waiting' && (
                <div>
                  <p className="text-xl font-semibold text-orange-600 mb-2">
                    ⏳ Waiting for another player...
                  </p>
                  <p className="text-sm text-gray-600">Share room code: {roomId}</p>
                </div>
              )}
              {gameState.status === 'playing' && (
                <div>
                  <p className="text-xl font-semibold text-gray-700">
                    Current Turn: {gameState.currentTurn === 'X' ? '💕' : '💖'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {gameState.currentTurn === playerSymbol ? 'Your turn!' : "Opponent's turn"}
                  </p>
                </div>
              )}
              {gameState.status === 'finished' && gameState.winner === 'draw' && (
                <div>
                  <p className="text-2xl font-bold text-purple-600 mb-2">
                    🤝 It's a Draw! 🤝
                  </p>
                  <p className="text-gray-600">Both get kisses! 💋</p>
                </div>
              )}
              {gameState.status === 'finished' && gameState.winner !== 'draw' && (
                <div className="animate-bounce">
                  <p className="text-2xl font-bold text-pink-600 mb-2">
                    🎉 {gameState.winner === playerSymbol ? 'You' : 'Opponent'} Win! 🎉
                  </p>
                  <p className="text-gray-600">
                    {gameState.winner === playerSymbol ? 'You get the kiss! 😘' : 'They get the kiss! 💋'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Game Board */}
          {gameState && (
            <div className="grid grid-cols-3 gap-3 mb-8 max-w-sm mx-auto">
              {gameState.board.map((cell, index) => (
                <button
                  key={index}
                  onClick={() => makeMove(index)}
                  className={`
                    aspect-square rounded-2xl text-5xl font-bold transition-all duration-300
                    ${canMakeMove(index) ? 'hover:bg-pink-100 hover:scale-105 cursor-pointer' : ''}
                    ${cell || !canMakeMove(index) ? 'cursor-not-allowed' : ''}
                    ${isWinningCell(index) ? 'bg-gradient-to-br from-pink-400 to-purple-400 text-white animate-pulse' : 'bg-gradient-to-br from-pink-50 to-purple-50'}
                    border-2 border-pink-200
                  `}
                  disabled={!canMakeMove(index)}
                >
                  {getCellContent(cell)}
                </button>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="text-center space-y-3">
            {gameState && gameState.status === 'finished' && (
              <button
                onClick={resetGame}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-bold hover:scale-105 transition-transform shadow-lg hover:shadow-xl"
              >
                🔄 Play Again
              </button>
            )}

            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-gray-500 text-white rounded-full text-sm hover:bg-gray-600 transition-colors"
            >
              🚪 Leave Room
            </button>
          </div>

          {/* Players Info */}
          {gameState && (
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Players in room: {gameState.players.length}/2</p>
              <p className="mt-1">💕 Player 1: Hearts | 💖 Player 2: Sparkles</p>
            </div>
          )}
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
