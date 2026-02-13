'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Player = 'X' | 'O' | null;
type Board = Player[];

export default function TicTacToe() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [hearts, setHearts] = useState<Array<{ id: number; left: string; top: string; delay: string; duration: string }>>([]);

  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
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

    const interval = setInterval(createHeart, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    checkWinner();
  }, [board]);

  const checkWinner = () => {
    for (const combination of winningCombinations) {
      const [a, b, c] = combination;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        setWinner(board[a]);
        setWinningLine(combination);
        return;
      }
    }

    if (board.every(cell => cell !== null)) {
      setIsDraw(true);
    }
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner || isDraw) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setIsDraw(false);
    setWinningLine([]);
  };

  const getCellContent = (player: Player) => {
    if (player === 'X') return '💕';
    if (player === 'O') return '💖';
    return '';
  };

  const isWinningCell = (index: number) => winningLine.includes(index);

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
          <h1 className="text-4xl font-bold text-pink-600 text-center mb-8">
            💕 Local Tic Tac Toe 💖
          </h1>

          {/* Game Mode Selection */}
          <div className="text-center mb-6">
            <div className="bg-pink-100 rounded-2xl p-4 mb-4">
              <p className="text-sm font-semibold text-pink-700 mb-2">🎮 Game Mode</p>
              <p className="text-xs text-gray-600">Two players on same device</p>
            </div>
            
            <Link href="/tic-tac-toe/multiplayer" className="inline-block">
              <button className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full text-sm font-bold hover:scale-105 transition-transform shadow-lg hover:shadow-xl">
                🌐 Switch to Multiplayer
              </button>
            </Link>
          </div>

          {/* Game Status */}
          <div className="text-center mb-6">
            {winner ? (
              <div className="animate-bounce">
                <p className="text-2xl font-bold text-pink-600 mb-2">
                  🎉 Player {winner === 'X' ? '💕' : '💖'} Wins! 🎉
                </p>
                <p className="text-gray-600">The winner gets a kiss! 😘</p>
              </div>
            ) : isDraw ? (
              <div>
                <p className="text-2xl font-bold text-purple-600 mb-2">
                  🤝 It's a Draw! 🤝
                </p>
                <p className="text-gray-600">Both players get kisses! 💋</p>
              </div>
            ) : (
              <div>
                <p className="text-xl font-semibold text-gray-700">
                  Current Turn: {currentPlayer === 'X' ? '💕' : '💖'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {currentPlayer === 'X' ? 'Player 1 (Hearts)' : 'Player 2 (Sparkles)'}
                </p>
              </div>
            )}
          </div>

          {/* Game Board */}
          <div className="grid grid-cols-3 gap-3 mb-8 max-w-sm mx-auto">
            {board.map((cell, index) => (
              <button
                key={index}
                onClick={() => handleCellClick(index)}
                className={`
                  aspect-square rounded-2xl text-5xl font-bold transition-all duration-300
                  ${!cell && !winner && !isDraw ? 'hover:bg-pink-100 hover:scale-105 cursor-pointer' : ''}
                  ${cell ? 'cursor-not-allowed' : ''}
                  ${isWinningCell(index) ? 'bg-gradient-to-br from-pink-400 to-purple-400 text-white animate-pulse' : 'bg-gradient-to-br from-pink-50 to-purple-50'}
                  border-2 border-pink-200
                `}
                disabled={!!cell || !!winner || isDraw}
              >
                {getCellContent(cell)}
              </button>
            ))}
          </div>

          {/* Reset Button */}
          <div className="text-center">
            <button
              onClick={resetGame}
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-bold hover:scale-105 transition-transform shadow-lg hover:shadow-xl"
            >
              🔄 New Game
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p className="mb-2">💕 Player 1: Click to place hearts</p>
            <p className="mb-2">💖 Player 2: Click to place sparkles</p>
            <p>First to get 3 in a row wins the kiss! 😘</p>
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
