'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Chess piece types with romantic emojis
const PIECES = {
  'K': { emoji: '👑', name: 'King' },
  'Q': { emoji: '👸', name: 'Queen' },
  'R': { emoji: '🏰', name: 'Rook' },
  'B': { emoji: '💝', name: 'Bishop' },
  'N': { emoji: '🦢', name: 'Knight' },
  'P': { emoji: '💕', name: 'Pawn' }
};

const INITIAL_BOARD = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

interface Position {
  row: number;
  col: number;
}

interface Move {
  from: Position;
  to: Position;
  piece: string;
  captured?: string;
}

export default function ChessGame() {
  const [gameMode, setGameMode] = useState<'menu' | 'local' | 'multiplayer'>('menu');
  const [board, setBoard] = useState<(string | null)[][]>(INITIAL_BOARD);
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'check' | 'checkmate' | 'stalemate'>('playing');
  const [capturedPieces, setCapturedPieces] = useState<{ white: string[], black: string[] }>({ white: [], black: [] });
  const router = useRouter();

  const isWhitePiece = (piece: string) => piece && piece === piece.toUpperCase();
  const isBlackPiece = (piece: string) => piece && piece === piece.toLowerCase();

  const isValidMove = (from: Position, to: Position, piece: string): boolean => {
    const pieceType = piece.toUpperCase();
    const rowDiff = to.row - from.row;
    const colDiff = Math.abs(to.col - from.col);
    const targetPiece = board[to.row][to.col];

    // Can't capture own piece
    if (targetPiece && isWhitePiece(piece) === isWhitePiece(targetPiece)) {
      return false;
    }

    switch (pieceType) {
      case 'P': // Pawn
        const direction = isWhitePiece(piece) ? -1 : 1;
        const startRow = isWhitePiece(piece) ? 6 : 1;
        
        // Forward move
        if (colDiff === 0 && !targetPiece) {
          if (rowDiff === direction) return true;
          if (from.row === startRow && rowDiff === 2 * direction && !board[from.row + direction][from.col]) return true;
        }
        // Capture
        if (colDiff === 1 && rowDiff === direction && targetPiece) return true;
        return false;

      case 'R': // Rook
        if (rowDiff === 0 || colDiff === 0) {
          return isPathClear(from, to);
        }
        return false;

      case 'N': // Knight
        return (Math.abs(rowDiff) === 2 && colDiff === 1) || (Math.abs(rowDiff) === 1 && colDiff === 2);

      case 'B': // Bishop
        if (Math.abs(rowDiff) === colDiff) {
          return isPathClear(from, to);
        }
        return false;

      case 'Q': // Queen
        if (rowDiff === 0 || colDiff === 0 || Math.abs(rowDiff) === colDiff) {
          return isPathClear(from, to);
        }
        return false;

      case 'K': // King
        return Math.abs(rowDiff) <= 1 && colDiff <= 1;

      default:
        return false;
    }
  };

  const isPathClear = (from: Position, to: Position): boolean => {
    const rowStep = to.row > from.row ? 1 : to.row < from.row ? -1 : 0;
    const colStep = to.col > from.col ? 1 : to.col < from.col ? -1 : 0;
    
    let currentRow = from.row + rowStep;
    let currentCol = from.col + colStep;
    
    while (currentRow !== to.row || currentCol !== to.col) {
      if (board[currentRow][currentCol]) return false;
      currentRow += rowStep;
      currentCol += colStep;
    }
    
    return true;
  };

  const getValidMoves = (position: Position): Position[] => {
    const moves: Position[] = [];
    const piece = board[position.row][position.col];
    
    if (!piece) return moves;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (isValidMove(position, { row, col }, piece)) {
          moves.push({ row, col });
        }
      }
    }
    
    return moves;
  };

  const handleSquareClick = (row: number, col: number) => {
    if (gameStatus !== 'playing') return;

    const piece = board[row][col];

    if (selectedPiece) {
      // Try to move
      const isValid = validMoves.some(move => move.row === row && move.col === col);
      
      if (isValid) {
        makeMove(selectedPiece, { row, col });
      } else if (piece && ((currentPlayer === 'white' && isWhitePiece(piece)) || 
                           (currentPlayer === 'black' && isBlackPiece(piece)))) {
        // Select new piece
        setSelectedPiece({ row, col });
        setValidMoves(getValidMoves({ row, col }));
      } else {
        // Deselect
        setSelectedPiece(null);
        setValidMoves([]);
      }
    } else if (piece && ((currentPlayer === 'white' && isWhitePiece(piece)) || 
                        (currentPlayer === 'black' && isBlackPiece(piece)))) {
      // Select piece
      setSelectedPiece({ row, col });
      setValidMoves(getValidMoves({ row, col }));
    }
  };

  const makeMove = (from: Position, to: Position) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[from.row][from.col];
    const captured = newBoard[to.row][to.col];

    // Make the move
    newBoard[to.row][to.col] = piece;
    newBoard[from.row][from.col] = null;

    // Update captured pieces
    if (captured) {
      setCapturedPieces(prev => ({
        ...prev,
        [isWhitePiece(captured) ? 'black' : 'white']: [...prev[isWhitePiece(captured) ? 'black' : 'white'], captured]
      }));
    }

    // Add to move history
    setMoveHistory(prev => [...prev, { from, to, piece: piece!, captured: captured || undefined }]);

    // Switch player
    setCurrentPlayer(prev => prev === 'white' ? 'black' : 'white');
    
    // Update board
    setBoard(newBoard);
    setSelectedPiece(null);
    setValidMoves([]);

    // Check for game end conditions
    checkGameStatus(newBoard);
  };

  const checkGameStatus = (currentBoard: (string | null)[][]) => {
    // Simplified check - in a real chess game, you'd check for check, checkmate, stalemate
    // For now, just continue playing
    setGameStatus('playing');
  };

  const resetGame = () => {
    setBoard(INITIAL_BOARD);
    setCurrentPlayer('white');
    setSelectedPiece(null);
    setValidMoves([]);
    setMoveHistory([]);
    setGameStatus('playing');
    setCapturedPieces({ white: [], black: [] });
  };

  const getSquareColor = (row: number, col: number) => {
    const isLight = (row + col) % 2 === 0;
    const isSelected = selectedPiece && selectedPiece.row === row && selectedPiece.col === col;
    const isValidMove = validMoves.some(move => move.row === row && move.col === col);
    
    if (isSelected) return 'bg-yellow-400';
    if (isValidMove) return 'bg-green-300';
    return isLight ? 'bg-pink-100' : 'bg-purple-200';
  };

  const getPieceDisplay = (piece: string | null) => {
    if (!piece) return null;
    const pieceInfo = PIECES[piece.toUpperCase() as keyof typeof PIECES];
    return pieceInfo ? pieceInfo.emoji : piece;
  };

  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">♟️</div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Love Chess
            </h1>
            <p className="text-gray-600">Choose how you want to play!</p>
          </div>
          
          <div className="space-y-4">
            <Link
              href="/chess/multiplayer"
              className="block w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all hover:scale-105 text-center"
            >
              🌐 Multiplayer
              <span className="block text-sm font-normal mt-1">Play with partner on different devices</span>
            </Link>
            
            <button
              onClick={() => setGameMode('local')}
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
  }

  if (gameMode === 'local') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              ♟️ Love Chess
            </h1>
            <div className="flex justify-center gap-8 text-lg">
              <span className="bg-white/80 px-4 py-2 rounded-full">
                Current Turn: {currentPlayer === 'white' ? '🤍 White' : '🖤 Black'}
              </span>
              <span className="bg-white/80 px-4 py-2 rounded-full">
                Status: {gameStatus}
              </span>
            </div>
          </div>

          <div className="flex gap-8 justify-center">
            {/* Captured Pieces - Black */}
            <div className="bg-white rounded-xl shadow-lg p-4 w-32">
              <h3 className="text-sm font-semibold mb-2 text-gray-700">Captured by White</h3>
              <div className="flex flex-wrap gap-1">
                {capturedPieces.black.map((piece, idx) => (
                  <span key={idx} className="text-xl">
                    {getPieceDisplay(piece)}
                  </span>
                ))}
              </div>
            </div>

            {/* Chess Board */}
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="grid grid-cols-8 gap-0 border-4 border-purple-300">
                {board.map((row, rowIndex) => 
                  row.map((piece, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`w-16 h-16 flex items-center justify-center cursor-pointer transition-colors ${getSquareColor(rowIndex, colIndex)}`}
                      onClick={() => handleSquareClick(rowIndex, colIndex)}
                    >
                      <span className="text-3xl">
                        {getPieceDisplay(piece)}
                      </span>
                    </div>
                  ))
                )}
              </div>
              
              {/* Board Labels */}
              <div className="flex justify-around mt-2 text-sm text-gray-600">
                {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(letter => (
                  <span key={letter} className="w-16 text-center">{letter}</span>
                ))}
              </div>
            </div>

            {/* Captured Pieces - White */}
            <div className="bg-white rounded-xl shadow-lg p-4 w-32">
              <h3 className="text-sm font-semibold mb-2 text-gray-700">Captured by Black</h3>
              <div className="flex flex-wrap gap-1">
                {capturedPieces.white.map((piece, idx) => (
                  <span key={idx} className="text-xl">
                    {getPieceDisplay(piece)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Game Controls */}
          <div className="text-center mt-8">
            <button
              onClick={resetGame}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all hover:scale-105 mr-4"
            >
              🔄 New Game
            </button>
            <button
              onClick={() => setGameMode('menu')}
              className="bg-white/80 hover:bg-white text-gray-700 px-6 py-3 rounded-full font-medium transition-all hover:scale-105"
            >
              ← Back to Menu
            </button>
          </div>

          {/* Move History */}
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Move History</h3>
            <div className="max-h-32 overflow-y-auto">
              {moveHistory.length === 0 ? (
                <p className="text-gray-500">No moves yet</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {moveHistory.map((move, idx) => (
                    <div key={idx} className="text-gray-700">
                      {idx + 1}. {getPieceDisplay(move.piece)} {String.fromCharCode(97 + move.from.col)}{8 - move.from.row} → {String.fromCharCode(97 + move.to.col)}{8 - move.to.row}
                      {move.captured && ` x${getPieceDisplay(move.captured)}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
