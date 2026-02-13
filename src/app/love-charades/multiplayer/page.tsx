'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

interface Player {
  id: string;
  name: string;
  score: number;
}

interface Game {
  id: string;
  players: Player[];
  currentRound: number;
  status: 'waiting' | 'playing' | 'roundEnd';
  currentHintGiver: string | null;
  currentHint: string;
  currentCard: { id: number; emoji: string; name: string; hint: string } | null;
  roundWinner: string | null;
}

export default function LoveCharadesMultiplayer() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<'menu' | 'room' | 'playing'>('menu');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [game, setGame] = useState<Game | null>(null);
  const [hint, setHint] = useState('');
  const [guess, setGuess] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const newSocket = io('http://localhost:3001', {
      transports: ['polling'],
      timeout: 10000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server with transport:', newSocket.io.engine.transport.name);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('Disconnected from server:', reason);
    });

    newSocket.on('charades-room-created', ({ roomId, playerInfo }) => {
      setRoomCode(roomId);
      setGameState('room');
      // Set initial game state
      setGame({
        id: roomId,
        players: [playerInfo],
        currentRound: 1,
        status: 'waiting',
        currentHintGiver: null,
        currentHint: '',
        currentCard: null,
        roundWinner: null
      });
    });

    newSocket.on('charades-room-joined', ({ roomId, playerInfo }) => {
      setRoomCode(roomId);
      setGameState('room');
    });

    newSocket.on('player-joined-charades', (playerInfo) => {
      console.log('Player joined:', playerInfo);
    });

    newSocket.on('charades-game-state', (gameState) => {
      setGame(gameState);
      if (gameState.status === 'playing') {
        setGameState('playing');
      }
    });

    newSocket.on('hint-submitted', ({ hint, game }) => {
      setGame(game);
      setHint('');
    });

    newSocket.on('round-ended', ({ game, correctCard }) => {
      setGame(game);
      setGuess('');
    });

    newSocket.on('player-disconnected', () => {
      alert('Your partner disconnected!');
      setGameState('menu');
      setGame(null);
    });

    newSocket.on('error', (message) => {
      alert(message);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const createRoom = () => {
    if (!playerName.trim() || !socket) return;
    socket.emit('create-charades-room', { playerName: playerName.trim() });
  };

  const joinRoom = () => {
    if (!playerName.trim() || !roomCode.trim() || !socket) return;
    socket.emit('join-charades-room', { 
      playerName: playerName.trim(), 
      roomId: roomCode.trim().toUpperCase() 
    });
  };

  const submitHint = () => {
    if (!hint.trim() || !socket || !game) return;
    socket.emit('submit-hint', { roomId: game.id, hint: hint.trim() });
  };

  const submitGuess = () => {
    if (!guess.trim() || !socket || !game) return;
    socket.emit('submit-guess', { roomId: game.id, guess: guess.trim() });
  };

  const nextRound = () => {
    if (!socket || !game) return;
    socket.emit('next-charades-round', { roomId: game.id });
  };

  const resetGame = () => {
    if (!socket || !game) return;
    socket.emit('reset-charades-game', { roomId: game.id });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    alert('Room code copied to clipboard!');
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">⏳</div>
          <p className="text-xl text-gray-600">Connecting to server...</p>
          <p className="text-sm text-gray-500 mt-2">Make sure socket-server.js is running on port 3001</p>
        </div>
      </div>
    );
  }

  console.log('Current gameState:', gameState);
  console.log('Current game:', game);

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎭</div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Love Charades
            </h1>
            <p className="text-gray-600">Multiplayer mode - Play with your partner!</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-400 transition-colors"
                placeholder="Enter your name"
              />
            </div>
            
            <div className="border-t pt-4">
              <button
                onClick={createRoom}
                disabled={!playerName.trim()}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
              >
                Create Room 💕
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>
              
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-400 transition-colors text-center font-mono text-lg"
                  placeholder="Enter room code"
                  maxLength={6}
                />
                <button
                  onClick={joinRoom}
                  disabled={!playerName.trim() || !roomCode.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-600 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Join Room 🎮
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Games
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'room' && game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-purple-600 mb-4">Game Room</h2>
              <div className="bg-purple-50 rounded-2xl p-6 mb-6">
                <p className="text-sm text-purple-600 mb-2">Room Code</p>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-4xl font-mono font-bold text-purple-800">{roomCode}</span>
                  <button
                    onClick={copyRoomCode}
                    className="bg-purple-200 hover:bg-purple-300 text-purple-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-center mb-4">Players ({game.players.length}/2)</h3>
              {game.players.map((player) => (
                <div key={player.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                  <span className="font-medium">{player.name}</span>
                  <span className="text-sm text-gray-500">
                    {player.id === socket?.id ? '(You)' : '(Partner)'}
                  </span>
                </div>
              ))}
            </div>
            
            {game.players.length < 2 && (
              <div className="mt-6 text-center">
                <div className="text-6xl mb-4 animate-pulse">⏳</div>
                <p className="text-gray-600">Waiting for your partner to join...</p>
                <p className="text-sm text-gray-500 mt-2">Share the room code above!</p>
              </div>
            )}
            
            {game.players.length === 2 && game.status === 'waiting' && (
              <div className="mt-6 text-center">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <p className="text-green-600 font-semibold">Game starting soon...</p>
              </div>
            )}
            
            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  socket?.disconnect();
                  router.push('/');
                }}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'playing' && game) {
    const isHintGiver = socket?.id === game.currentHintGiver;
    const currentPlayer = game.players.find(p => p.id === socket?.id);

    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
              🎭 Love Charades
            </h1>
            <div className="flex justify-center gap-8 text-lg">
              <span className="bg-white/80 px-4 py-2 rounded-full">Round {game.currentRound}</span>
              {game.players.map((player) => (
                <span key={player.id} className="bg-white/80 px-4 py-2 rounded-full">
                  {player.name}: {player.score} points
                </span>
              ))}
            </div>
          </div>

          {/* Game Status */}
          {game.status === 'roundEnd' ? (
            <RoundEndScreen
              winner={game.roundWinner}
              correctCard={game.currentCard}
              onNextRound={nextRound}
              onResetGame={resetGame}
              scores={game.players.reduce((acc, p) => ({ ...acc, [p.name]: p.score }), {})}
            />
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Hint Giver View */}
              {isHintGiver && game.currentCard && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold text-center mb-4 text-purple-600">
                    Your Turn to Give Hints!
                  </h3>
                  
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-2">{game.currentCard.emoji}</div>
                    <p className="text-sm text-gray-500 mb-4">Your card (keep secret!)</p>
                    <p className="font-medium text-lg">{game.currentCard.name}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Give a hint about your card:
                      </label>
                      <textarea
                        value={hint}
                        onChange={(e) => setHint(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-400 transition-colors"
                        rows={3}
                        placeholder="Describe your card without saying the name..."
                      />
                    </div>
                    
                    <button
                      onClick={submitHint}
                      disabled={!hint.trim()}
                      className="w-full bg-purple-500 text-white py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Hint
                    </button>
                  </div>
                </div>
              )}

              {/* Guesser View */}
              {!isHintGiver && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold text-center mb-4 text-pink-600">
                    Your Turn to Guess!
                  </h3>
                  
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">❓</div>
                    <p className="text-gray-600">Guess your partner's card!</p>
                  </div>
                  
                  {game.currentHint && (
                    <div className="bg-purple-50 p-4 rounded-lg mb-6">
                      <p className="text-sm font-medium text-purple-700 mb-1">Hint:</p>
                      <p className="text-gray-700">{game.currentHint}</p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your guess:
                      </label>
                      <input
                        type="text"
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-pink-200 rounded-lg focus:outline-none focus:border-pink-400 transition-colors"
                        placeholder="What's the card?"
                      />
                    </div>
                    
                    <button
                      onClick={submitGuess}
                      disabled={!guess.trim() || !game.currentHint}
                      className="w-full bg-pink-500 text-white py-2 rounded-lg font-medium hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Guess
                    </button>
                  </div>
                </div>
              )}

              {/* Waiting for hint */}
              {isHintGiver && !game.currentHint && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="text-center">
                    <div className="text-6xl mb-4 animate-pulse">✍️</div>
                    <p className="text-gray-600">Waiting for you to give a hint...</p>
                  </div>
                </div>
              )}

              {/* Waiting for guess */}
              {!isHintGiver && !game.currentHint && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="text-center">
                    <div className="text-6xl mb-4 animate-pulse">🤔</div>
                    <p className="text-gray-600">Waiting for hint from your partner...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Back Button */}
          <div className="text-center mt-8">
            <button
              onClick={() => {
                socket?.disconnect();
                router.push('/');
              }}
              className="bg-white/80 hover:bg-white text-gray-700 px-6 py-3 rounded-full font-medium transition-all hover:scale-105"
            >
              ← Leave Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function RoundEndScreen({ 
  winner, 
  correctCard, 
  onNextRound, 
  onResetGame, 
  scores 
}: {
  winner: string | null;
  correctCard: { id: number; emoji: string; name: string; hint: string } | null;
  onNextRound: () => void;
  onResetGame: () => void;
  scores: { [key: string]: number };
}) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold mb-4 text-purple-600">
        {winner} wins this round!
      </h2>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-2">The card was:</p>
        <div className="text-4xl mb-2">{correctCard?.emoji || '❓'}</div>
        <p className="font-medium text-lg">{correctCard?.name || 'Unknown'}</p>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <p className="font-medium mb-2">Current Scores:</p>
        {Object.entries(scores).map(([name, score]) => (
          <p key={name} className="text-lg">
            {name}: {score} points
          </p>
        ))}
      </div>
      
      <div className="flex gap-4 justify-center">
        <button
          onClick={onNextRound}
          className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition-all hover:scale-105"
        >
          Next Round →
        </button>
        <button
          onClick={onResetGame}
          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all hover:scale-105"
        >
          New Game
        </button>
      </div>
    </div>
  );
}
