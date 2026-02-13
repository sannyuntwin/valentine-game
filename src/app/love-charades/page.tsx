'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CARD_DECK = [
  { id: 1, emoji: '🐱', name: 'cat', hint: 'I love to cuddle and purr' },
  { id: 2, emoji: '❤️', name: 'heart', hint: 'Symbol of love and affection' },
  { id: 3, emoji: '🌹', name: 'rose', hint: 'Classic romantic flower' },
  { id: 4, emoji: '💍', name: 'ring', hint: 'Promise of forever' },
  { id: 5, emoji: '🍫', name: 'chocolate', hint: 'Sweet treat for lovers' },
  { id: 6, emoji: '🕊️', name: 'dove', hint: 'Bird of peace and love' },
  { id: 7, emoji: '🌙', name: 'moon', hint: 'Romantic night light' },
  { id: 8, emoji: '⭐', name: 'star', hint: 'Make a wish upon me' },
  { id: 9, emoji: '🦢', name: 'swan', hint: 'Symbol of eternal love' },
  { id: 10, emoji: '🎻', name: 'violin', hint: 'Romantic musical instrument' },
  { id: 11, emoji: '🍷', name: 'wine', hint: 'Romantic drink for dates' },
  { id: 12, emoji: '🕯️', name: 'candle', hint: 'Creates romantic atmosphere' },
  { id: 13, emoji: '💌', name: 'love letter', hint: 'Written expression of love' },
  { id: 14, emoji: '🌺', name: 'hibiscus', hint: 'Tropical romantic flower' },
  { id: 15, emoji: '🦋', name: 'butterfly', hint: 'Feeling of love in stomach' },
  { id: 16, emoji: '🎭', name: 'mask', hint: 'Mysterious romance' },
  { id: 17, emoji: '🌊', name: 'ocean', hint: 'Deep as my love for you' },
  { id: 18, emoji: '🌅', name: 'sunrise', hint: 'New day with my love' },
  { id: 19, emoji: '🎨', name: 'art', hint: 'Love is a work of art' },
  { id: 20, emoji: '📖', name: 'book', hint: 'Our love story' }
];

interface Player {
  id: string;
  name: string;
  card: typeof CARD_DECK[0] | null;
  isGivingHint: boolean;
}

export default function LoveCharades() {
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'roundEnd'>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [hint, setHint] = useState('');
  const [guess, setGuess] = useState('');
  const [roundWinner, setRoundWinner] = useState<string | null>(null);
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const router = useRouter();

  const startGame = (player1Name: string, player2Name: string) => {
    const newPlayers: Player[] = [
      { id: '1', name: player1Name, card: null, isGivingHint: false },
      { id: '2', name: player2Name, card: null, isGivingHint: false }
    ];
    
    // Deal random cards
    const shuffled = [...CARD_DECK].sort(() => Math.random() - 0.5);
    newPlayers[0].card = shuffled[0];
    newPlayers[1].card = shuffled[1];
    newPlayers[0].isGivingHint = true;
    
    setPlayers(newPlayers);
    setScores({ [player1Name]: 0, [player2Name]: 0 });
    setGameState('playing');
  };

  const submitHint = () => {
    if (!hint.trim()) return;
    
    setPlayers(prev => prev.map(p => 
      p.id === '1' ? { ...p, isGivingHint: false } : p
    ));
  };

  const submitGuess = () => {
    const guesser = players.find(p => p.id === '2');
    const hintGiver = players.find(p => p.id === '1');
    
    if (!guesser || !hintGiver || !hintGiver.card) return;
    
    const isCorrect = guess.toLowerCase().trim() === hintGiver.card.name.toLowerCase();
    
    if (isCorrect) {
      setScores(prev => ({
        ...prev,
        [guesser.name]: prev[guesser.name] + 1
      }));
      setRoundWinner(guesser.name);
    } else {
      setScores(prev => ({
        ...prev,
        [hintGiver.name]: prev[hintGiver.name] + 1
      }));
      setRoundWinner(hintGiver.name);
    }
    
    setGameState('roundEnd');
  };

  const nextRound = () => {
    const shuffled = [...CARD_DECK].sort(() => Math.random() - 0.5);
    
    setPlayers(prev => {
      const newPlayers = [...prev];
      // Switch roles
      newPlayers[0].isGivingHint = !newPlayers[0].isGivingHint;
      newPlayers[1].isGivingHint = !newPlayers[1].isGivingHint;
      
      // Deal new cards
      if (newPlayers[0].isGivingHint) {
        newPlayers[0].card = shuffled[0];
        newPlayers[1].card = shuffled[1];
      } else {
        newPlayers[0].card = shuffled[1];
        newPlayers[1].card = shuffled[0];
      }
      
      return newPlayers;
    });
    
    setHint('');
    setGuess('');
    setRoundWinner(null);
    setCurrentRound(prev => prev + 1);
    setGameState('playing');
  };

  const resetGame = () => {
    setGameState('setup');
    setPlayers([]);
    setCurrentRound(1);
    setHint('');
    setGuess('');
    setRoundWinner(null);
    setScores({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎭</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Love Charades
          </h1>
          <p className="text-gray-600">Choose how you want to play!</p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/love-charades/multiplayer"
            className="block w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition-all hover:scale-105 text-center"
          >
            🌐 Multiplayer
            <span className="block text-sm font-normal mt-1">Play with partner on different devices</span>
          </Link>
          
          <button
            onClick={() => startLocalGame()}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-600 transition-all hover:scale-105"
          >
            🏠 Local Play
            <span className="block text-sm font-normal mt-1">Play on the same device</span>
          </button>
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

  function startLocalGame() {
    const player1Name = prompt("Enter Player 1 name:") || "Player 1";
    const player2Name = prompt("Enter Player 2 name:") || "Player 2";
    startGame(player1Name, player2Name);
    
    // Show game board after starting
    setGameState('playing');
  }

  if (gameState === 'playing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
              🎭 Love Charades
            </h1>
            <div className="flex justify-center gap-8 text-lg">
              <span className="bg-white/80 px-4 py-2 rounded-full">Round {currentRound}</span>
              <span className="bg-white/80 px-4 py-2 rounded-full">
                {players[0]?.name}: {scores[players[0]?.name] || 0} points
              </span>
              <span className="bg-white/80 px-4 py-2 rounded-full">
                {players[1]?.name}: {scores[players[1]?.name] || 0} points
              </span>
            </div>
          </div>

          {/* Game Board */}
          {gameState === 'playing' && (
            <div className="grid md:grid-cols-2 gap-8">
              {players.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  hint={hint}
                  guess={guess}
                  onHintChange={setHint}
                  onGuessChange={setGuess}
                  onHintSubmit={submitHint}
                  onGuessSubmit={submitGuess}
                />
              ))}
            </div>
          )}

          {/* Round End */}
          {gameState === 'roundEnd' && (
            <RoundEndScreen
              winner={roundWinner}
              correctCard={players.find(p => p.isGivingHint)?.card || undefined}
              onNextRound={nextRound}
              onResetGame={resetGame}
              scores={scores}
            />
          )}

          {/* Back Button */}
          <div className="text-center mt-8">
            <button
              onClick={() => router.push('/')}
              className="bg-white/80 hover:bg-white text-gray-700 px-6 py-3 rounded-full font-medium transition-all hover:scale-105"
            >
              ← Back to Games
            </button>
          </div>
        </div>
      </div>
    );
  }
}

function SetupForm({ onStartGame }: { onStartGame: (p1: string, p2: string) => void }) {
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (player1Name.trim() && player2Name.trim()) {
      onStartGame(player1Name.trim(), player2Name.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Player 1 Name
        </label>
        <input
          type="text"
          value={player1Name}
          onChange={(e) => setPlayer1Name(e.target.value)}
          className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-400 transition-colors"
          placeholder="Enter name"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Player 2 Name
        </label>
        <input
          type="text"
          value={player2Name}
          onChange={(e) => setPlayer2Name(e.target.value)}
          className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-400 transition-colors"
          placeholder="Enter name"
          required
        />
      </div>
      
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition-all hover:scale-105"
      >
        Start Game 💕
      </button>
    </form>
  );
}

function PlayerCard({ 
  player, 
  hint, 
  guess, 
  onHintChange, 
  onGuessChange, 
  onHintSubmit, 
  onGuessSubmit 
}: {
  player: Player;
  hint: string;
  guess: string;
  onHintChange: (hint: string) => void;
  onGuessChange: (guess: string) => void;
  onHintSubmit: () => void;
  onGuessSubmit: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h3 className="text-xl font-bold text-center mb-4 text-purple-600">
        {player.name}
      </h3>
      
      {player.isGivingHint ? (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-6xl mb-2">{player.card?.emoji}</div>
            <p className="text-sm text-gray-500 mb-4">Your card (keep secret!)</p>
            <p className="font-medium text-lg">{player.card?.name}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Give a hint about your card:
            </label>
            <textarea
              value={hint}
              onChange={(e) => onHintChange(e.target.value)}
              className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-400 transition-colors"
              rows={3}
              placeholder="Describe your card without saying the name..."
            />
          </div>
          
          <button
            onClick={onHintSubmit}
            disabled={!hint.trim()}
            className="w-full bg-purple-500 text-white py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Hint
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-6xl mb-4">❓</div>
            <p className="text-gray-600">Guess your partner's card!</p>
          </div>
          
          {hint && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-purple-700 mb-1">Hint:</p>
              <p className="text-gray-700">{hint}</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your guess:
            </label>
            <input
              type="text"
              value={guess}
              onChange={(e) => onGuessChange(e.target.value)}
              className="w-full px-3 py-2 border-2 border-pink-200 rounded-lg focus:outline-none focus:border-pink-400 transition-colors"
              placeholder="What's the card?"
            />
          </div>
          
          <button
            onClick={onGuessSubmit}
            disabled={!guess.trim() || !hint}
            className="w-full bg-pink-500 text-white py-2 rounded-lg font-medium hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Guess
          </button>
        </div>
      )}
    </div>
  );
}

function RoundEndScreen({ 
  winner, 
  correctCard, 
  onNextRound, 
  onResetGame, 
  scores 
}: {
  winner: string | null;
  correctCard: typeof CARD_DECK[0] | undefined;
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
