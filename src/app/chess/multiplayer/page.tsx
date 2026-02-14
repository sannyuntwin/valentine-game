'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/hooks/useAlert';
import Alert from '@/components/Alert';
import { io, Socket } from 'socket.io-client';

// Chess piece types with romantic emojis - different colors for each side
const WHITE_PIECES = {
  'K': { emoji: '🤍', name: 'King' },
  'Q': { emoji: '👸', name: 'Queen' },
  'R': { emoji: '🏰', name: 'Rook' },
  'B': { emoji: '💝', name: 'Bishop' },
  'N': { emoji: '🦢', name: 'Knight' },
  'P': { emoji: '💕', name: 'Pawn' }
};

const BLACK_PIECES = {
  'K': { emoji: '🖤', name: 'King' },
  'Q': { emoji: '👑', name: 'Queen' },
  'R': { emoji: '�', name: 'Rook' },
  'B': { emoji: '🎁', name: 'Bishop' },
  'N': { emoji: '�', name: 'Knight' },
  'P': { emoji: '�', name: 'Pawn' }
};

interface Player {
  id: string;
  name: string;
  color: 'white' | 'black';
}

interface ChessGame {
  id: string;
  players: Player[];
  board: (string | null)[][];
  currentTurn: 'white' | 'black';
  status: 'waiting' | 'playing';
  moveHistory: Array<{
    from: { row: number; col: number };
    to: { row: number; col: number };
    piece: string;
    captured?: string;
  }>;
  capturedPieces: { white: string[]; black: string[] };
}

interface Position {
  row: number;
  col: number;
}

export default function ChessMultiplayer() {
  const { showAlert, alert, hideAlert } = useAlert();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<'menu' | 'room' | 'playing'>('menu');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [game, setGame] = useState<ChessGame | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [myColor, setMyColor] = useState<'white' | 'black' | null>(null);
  const router = useRouter();

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const newSocket = io(socketUrl, {
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

    newSocket.on('chess-room-created', ({ roomId, playerInfo }) => {
      setRoomCode(roomId);
      setMyColor('white');
      setGameState('room');
      setGame({
        id: roomId,
        players: [playerInfo],
        board: [
          ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
          ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
          [null, null, null, null, null, null, null, null],
          [null, null, null, null, null, null, null, null],
          [null, null, null, null, null, null, null, null],
          [null, null, null, null, null, null, null, null],
          ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
          ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
        ],
        currentTurn: 'white',
        status: 'waiting',
        moveHistory: [],
        capturedPieces: { white: [], black: [] }
      });
    });

    newSocket.on('chess-room-joined', ({ roomId, playerInfo }) => {
      setRoomCode(roomId);
      setMyColor('black');
      setGameState('room');
    });

    newSocket.on('player-joined-chess', (playerInfo) => {
      console.log('Player joined:', playerInfo);
    });

    newSocket.on('chess-game-state', (gameState) => {
      setGame(gameState);
      if (gameState.status === 'playing') {
        setGameState('playing');
      }
    });

    newSocket.on('chess-move-made', ({ from, to, piece, captured, playerColor }) => {
      console.log('Move made by', playerColor);
    });

    newSocket.on('player-disconnected', () => {
      showAlert('Your partner disconnected!', 'warning');
      setGameState('menu');
      setGame(null);
    });

    newSocket.on('error', (message) => {
      showAlert(message, 'error');
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const isWhitePiece = (piece: string) => piece && piece === piece.toUpperCase();
  const isBlackPiece = (piece: string) => piece && piece === piece.toLowerCase();

  const isValidMove = (from: Position, to: Position, piece: string, board: (string | null)[][]): boolean => {
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
          return isPathClear(from, to, board);
        }
        return false;

      case 'N': // Knight
        return (Math.abs(rowDiff) === 2 && colDiff === 1) || (Math.abs(rowDiff) === 1 && colDiff === 2);

      case 'B': // Bishop
        if (Math.abs(rowDiff) === colDiff) {
          return isPathClear(from, to, board);
        }
        return false;

      case 'Q': // Queen
        if (rowDiff === 0 || colDiff === 0 || Math.abs(rowDiff) === colDiff) {
          return isPathClear(from, to, board);
        }
        return false;

      case 'K': // King
        return Math.abs(rowDiff) <= 1 && colDiff <= 1;

      default:
        return false;
    }
  };

  const isPathClear = (from: Position, to: Position, board: (string | null)[][]): boolean => {
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

  const getValidMoves = (position: Position, board: (string | null)[][]): Position[] => {
    const moves: Position[] = [];
    const piece = board[position.row][position.col];
    
    if (!piece) return moves;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (isValidMove(position, { row, col }, piece, board)) {
          moves.push({ row, col });
        }
      }
    }
    
    return moves;
  };

  const handleSquareClick = (row: number, col: number) => {
    if (!game || game.status !== 'playing' || !socket) return;

    // Check if it's my turn
    if (game.currentTurn !== myColor) {
      showAlert("It's not your turn!", 'warning');
      return;
    }

    const piece = game.board[row][col];

    if (selectedPiece) {
      // Try to move
      const isValid = validMoves.some(move => move.row === row && move.col === col);
      
      if (isValid) {
        makeMove(selectedPiece, { row, col });
      } else if (piece && ((myColor === 'white' && isWhitePiece(piece)) || 
                           (myColor === 'black' && isBlackPiece(piece)))) {
        // Select new piece
        setSelectedPiece({ row, col });
        setValidMoves(getValidMoves({ row, col }, game.board));
      } else {
        // Deselect
        setSelectedPiece(null);
        setValidMoves([]);
      }
    } else if (piece && ((myColor === 'white' && isWhitePiece(piece)) || 
                        (myColor === 'black' && isBlackPiece(piece)))) {
      // Select piece
      setSelectedPiece({ row, col });
      setValidMoves(getValidMoves({ row, col }, game.board));
    }
  };

  const makeMove = (from: Position, to: Position) => {
    if (!game || !socket) return;

    const piece = game.board[from.row][from.col];
    const captured = game.board[to.row][to.col];

    socket.emit('make-chess-move', {
      roomId: game.id,
      from,
      to,
      piece: piece!,
      captured: captured || undefined
    });

    setSelectedPiece(null);
    setValidMoves([]);
  };

  const createRoom = () => {
    if (!playerName.trim() || !socket) return;
    socket.emit('create-chess-room', { playerName: playerName.trim() });
  };

  const joinRoom = () => {
    if (!playerName.trim() || !roomCode.trim() || !socket) return;
    socket.emit('join-chess-room', { 
      playerName: playerName.trim(), 
      roomId: roomCode.trim().toUpperCase() 
    });
  };

  const resetGame = () => {
    if (!game || !socket) return;
    socket.emit('reset-chess-game', { roomId: game.id });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    showAlert('Room code copied to clipboard!', 'success');
  };

  const getSquareColor = (row: number, col: number) => {
    const isLight = (row + col) % 2 === 0;
    const isSelected = selectedPiece && selectedPiece.row === row && selectedPiece.col === col;
    const isValidMove = validMoves.some(move => move.row === row && move.col === col);
    
    if (isSelected) return 'bg-yellow-400';
    if (isValidMove) return 'bg-green-300';
    return isLight ? 'bg-pink-100' : 'bg-purple-200';
  };

  const getPieceDisplay = (piece: string) => {
    if (!piece) return '';
    const isWhite = piece === piece.toUpperCase();
    const pieces = isWhite ? WHITE_PIECES : BLACK_PIECES;
    const pieceType = piece.toUpperCase();
    return pieces[pieceType as keyof typeof pieces]?.emoji || piece;
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

  if (gameState === 'menu') {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 p-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                ♟️ Love Chess
              </h1>
              <p className="text-gray-600">Play chess with your Valentine! 💕</p>
            </div>

            {/* Game content */}
            {gameState === 'menu' && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-center mb-6 text-purple-700">Multiplayer Chess</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={createRoom}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
                    >
                      Create Room
                    </button>
                    <button
                      onClick={joinRoom}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105"
                    >
                      Join Room
                    </button>
                  </div>
                </div>
              </div>
            )}

            {gameState === 'room' && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-center mb-6 text-purple-700">Room Created</h2>
                <div className="text-center space-y-4">
                  <div className="bg-purple-100 p-4 rounded-lg">
                    <p className="text-lg font-semibold text-purple-800">Room Code:</p>
                    <p className="text-3xl font-bold text-purple-900">{roomCode}</p>
                  </div>
                  <button
                    onClick={copyRoomCode}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all transform hover:scale-105"
                  >
                    Copy Room Code
                  </button>
                  <button
                    onClick={startGame}
                    className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all transform hover:scale-105"
                  >
                    Start Game
                  </button>
                  <button
                    onClick={leaveRoom}
                    className="w-full bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-all transform hover:scale-105"
                  >
                    Leave Room
                  </button>
                </div>
              </div>
            )}

            {gameState === 'playing' && game && (
              <div>
                {/* Game info */}
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 mb-6 text-center">
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-semibold">
                      {game.currentTurn === 'white' ? '⚪ White\'s Turn' : '⚫ Black\'s Turn'}
                    </div>
                    <div className="text-lg">
                      You are: {myColor === 'white' ? '⚪ White' : '⚫ Black'}
                    </div>
                    <button
                      onClick={resetGame}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all"
                    >
                      Reset Game
                    </button>
                  </div>
                </div>

                {/* Chess board */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6">
                  <div className="grid grid-cols-8 gap-0 border-4 border-purple-800 max-w-2xl mx-auto">
                    {game.board.map((row, rowIndex) => (
                      <div key={rowIndex} className="flex">
                        {row.map((piece, colIndex) => (
                          <div
                            key={colIndex}
                            onClick={() => handleSquareClick(rowIndex, colIndex)}
                            className={`w-16 h-16 border border-gray-400 flex items-center justify-center text-2xl cursor-pointer hover:bg-purple-200 transition-colors ${getSquareColor(rowIndex, colIndex)}`}
                          >
                            {piece && <span>{getPieceDisplay(piece)}</span>}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center mt-6">
                  <button
                    onClick={leaveRoom}
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-all"
                  >
                    Leave Game
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {alert.isVisible && (
          <Alert
            message={alert.message}
            type={alert.type}
            onClose={hideAlert}
          />
        )}
      </>
    );
  }

  if (gameState === 'room' && game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-blue-600 mb-4">Chess Room</h2>
              <div className="bg-blue-50 rounded-2xl p-6 mb-6">
                <p className="text-sm text-blue-600 mb-2">Room Code</p>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-4xl font-mono font-bold text-blue-800">{roomCode}</span>
                  <button
                    onClick={copyRoomCode}
                    className="bg-blue-200 hover:bg-blue-300 text-blue-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-purple-600 mb-2">Your Color</p>
                <span className="text-2xl font-bold text-purple-800">
                  {myColor === 'white' ? '🤍 White' : '🖤 Black'}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-center mb-4">Players ({game.players.length}/2)</h3>
              {game.players.map((player) => (
                <div key={player.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                  <span className="font-medium">{player.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {player.color === 'white' ? '🤍' : '🖤'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {player.id === socket?.id ? '(You)' : '(Partner)'}
                    </span>
                  </div>
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
                Current Turn: {game.currentTurn === 'white' ? '🤍 White' : '🖤 Black'}
              </span>
              <span className="bg-white/80 px-4 py-2 rounded-full">
                You are: {myColor === 'white' ? '🤍 White' : '🖤 Black'}
              </span>
              {game.currentTurn !== myColor && (
                <span className="bg-yellow-100 px-4 py-2 rounded-full text-yellow-800">
                  ⏳ Waiting for partner...
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-8 justify-center">
            {/* Captured Pieces - Black */}
            <div className="bg-white rounded-xl shadow-lg p-4 w-32">
              <h3 className="text-sm font-semibold mb-2 text-gray-700">Captured by White</h3>
              <div className="flex flex-wrap gap-1">
                {game.capturedPieces.black.map((piece, idx) => (
                  <span key={idx} className="text-xl">
                    {getPieceDisplay(piece)}
                  </span>
                ))}
              </div>
            </div>

            {/* Chess Board */}
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="grid grid-cols-8 gap-0 border-4 border-blue-300">
                {game.board.map((row, rowIndex) => 
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
                {game.capturedPieces.white.map((piece, idx) => (
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
              onClick={() => {
                socket?.disconnect();
                router.push('/');
              }}
              className="bg-white/80 hover:bg-white text-gray-700 px-6 py-3 rounded-full font-medium transition-all hover:scale-105"
            >
              ← Leave Game
            </button>
          </div>

          {/* Move History */}
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Move History</h3>
            <div className="max-h-32 overflow-y-auto">
              {game.moveHistory.length === 0 ? (
                <p className="text-gray-500">No moves yet</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {game.moveHistory.map((move, idx) => (
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
