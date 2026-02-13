const { Server } = require('socket.io');
const http = require('http');

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Socket.IO server is running!');
});

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Game rooms storage
const games = new Map();
const heartGames = new Map();
const charadesGames = new Map();

// Unique ID generator
let heartIdCounter = 0;
const generateUniqueId = () => {
  return ++heartIdCounter;
};

// Helper function to generate room ID
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Card deck for Love Charades
const CHARADES_CARDS = [
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

// Helper function to deal cards for charades
function dealCards(game) {
  const shuffled = [...CHARADES_CARDS].sort(() => Math.random() - 0.5);
  game.currentCard = shuffled[0];
}

// Helper function to check winner
function checkWinner(board) {
  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
  ];

  for (const combination of winningCombinations) {
    const [a, b, c] = combination;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: combination };
    }
  }

  if (board.every(cell => cell !== null)) {
    return { winner: 'draw', line: [] };
  }

  return null;
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Tic Tac Toe events
  socket.on('create-room', () => {
    const roomId = generateRoomId();
    const game = {
      id: roomId,
      players: [{ id: socket.id, symbol: 'X' }],
      board: Array(9).fill(null),
      currentTurn: 'X',
      status: 'waiting',
      winner: null,
      winningLine: []
    };

    games.set(roomId, game);
    socket.join(roomId);
    socket.emit('room-created', { roomId, playerSymbol: 'X' });

    console.log(`Room ${roomId} created by ${socket.id}`);
  });

  socket.on('join-room', (roomId) => {
    const game = games.get(roomId);

    if (!game) {
      socket.emit('error', 'Room not found');
      return;
    }

    if (game.players.length >= 2) {
      socket.emit('error', 'Room is full');
      return;
    }

    game.players.push({ id: socket.id, symbol: 'O' });
    game.status = 'playing';
    socket.join(roomId);

    // Notify both players
    socket.emit('room-joined', { roomId, playerSymbol: 'O' });
    socket.to(roomId).emit('player-joined', { playerSymbol: 'O' });

    // Send current game state to both players
    io.to(roomId).emit('game-state', game);

    console.log(`Player ${socket.id} joined room ${roomId}`);
  });

  socket.on('make-move', ({ roomId, index }) => {
    const game = games.get(roomId);

    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }

    // Validate move
    if (game.status !== 'playing') return;
    if (game.board[index] !== null) return;
    if (game.currentTurn !== game.players.find(p => p.id === socket.id)?.symbol) return;

    // Make move
    game.board[index] = game.currentTurn;

    // Check for winner
    const result = checkWinner(game.board);
    if (result) {
      game.winner = result.winner;
      game.winningLine = result.line;
      game.status = 'finished';
    } else {
      // Switch turn
      game.currentTurn = game.currentTurn === 'X' ? 'O' : 'X';
    }

    // Broadcast updated game state
    io.to(roomId).emit('game-state', game);

    console.log(`Move made in room ${roomId}: ${index} by ${socket.id}`);
  });

  socket.on('reset-game', (roomId) => {
    const game = games.get(roomId);

    if (!game) return;

    game.board = Array(9).fill(null);
    game.currentTurn = 'X';
    game.status = 'playing';
    game.winner = null;
    game.winningLine = [];

    io.to(roomId).emit('game-state', game);

    console.log(`Game reset in room ${roomId}`);
  });

  // Heart Chase events
  socket.on('create-heart-room', ({ playerName }) => {
    const roomId = generateRoomId();
    const game = {
      id: roomId,
      players: [{ id: socket.id, name: playerName, score: 0, color: '#ff6b6b' }],
      currentHearts: [],
      timeLeft: 60,
      status: 'waiting',
      gameMode: 'simultaneous'
    };

    heartGames.set(roomId, game);
    socket.join(roomId);
    socket.emit('heart-room-created', { roomId, playerInfo: game.players[0] });

    console.log(`Heart room ${roomId} created by ${socket.id} (${playerName})`);
  });

  socket.on('join-heart-room', ({ roomId, playerName }) => {
    const game = heartGames.get(roomId);

    if (!game) {
      socket.emit('error', 'Heart room not found');
      return;
    }

    if (game.players.length >= 2) {
      socket.emit('error', 'Heart room is full');
      return;
    }

    const newPlayer = { id: socket.id, name: playerName, score: 0, color: '#6b9bff' };
    game.players.push(newPlayer);
    socket.join(roomId);

    // Notify both players
    socket.emit('heart-room-joined', { roomId, playerInfo: newPlayer });
    socket.to(roomId).emit('player-joined-heart', newPlayer);

    // Send current game state to both players
    io.to(roomId).emit('heart-game-state', game);

    console.log(`Player ${socket.id} (${playerName}) joined heart room ${roomId}`);
  });

  socket.on('start-heart-game', ({ roomId }) => {
    const game = heartGames.get(roomId);

    if (!game) {
      socket.emit('error', 'Heart game not found');
      return;
    }

    if (game.players.length < 2) {
      socket.emit('error', 'Need at least 2 players to start');
      return;
    }

    // Reset heart ID counter for new game
    heartIdCounter = 0;

    game.status = 'playing';
    game.timeLeft = 60;
    game.currentHearts = [];

    // Start spawning hearts immediately
    const spawnHearts = () => {
      if (game.status !== 'playing') {
        clearInterval(spawnInterval);
        clearInterval(gameTimer);
        return;
      }

      // Spawn 1-3 hearts
      const heartCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < heartCount; i++) {
        const heart = {
          id: generateUniqueId(), // Use unique incremental ID
          x: Math.random() * 800 + 50, // Use fixed width instead of window.innerWidth
          y: -50,
          emoji: ['💖', '💕', '💗', '💓', '💝'][Math.floor(Math.random() * 5)],
          points: Math.floor(Math.random() * 20) + 10,
          lifetime: 3000 + Math.random() * 2000
        };
        game.currentHearts.push(heart);
      }

      io.to(roomId).emit('heart-game-state', game);
    };

    // Spawn hearts immediately and then every second
    spawnHearts(); // Initial spawn
    const spawnInterval = setInterval(spawnHearts, 1000);

    // Start game timer
    const gameTimer = setInterval(() => {
      if (game.status !== 'playing') {
        clearInterval(spawnInterval);
        clearInterval(gameTimer);
        return;
      }

      game.timeLeft--;

      if (game.timeLeft <= 0) {
        game.status = 'finished';
        clearInterval(spawnInterval);
        clearInterval(gameTimer);
        game.currentHearts = [];
      }

      io.to(roomId).emit('heart-game-state', game);
    }, 1000);

    io.to(roomId).emit('heart-game-state', game);
    console.log(`Heart game started in room ${roomId}`);
  });

  socket.on('catch-heart', ({ roomId, heartId }) => {
    console.log(`Received catch-heart event: roomId=${roomId}, heartId=${heartId}, socketId=${socket.id}`);

    const game = heartGames.get(roomId);

    if (!game) {
      console.log(`Heart game not found for room ${roomId}`);
      socket.emit('error', 'Heart game not found');
      return;
    }

    if (game.status !== 'playing') {
      console.log(`Game not in playing state, status: ${game.status}`);
      return;
    }

    console.log(`Current hearts in game: ${game.currentHearts.length}`);
    console.log(`Heart IDs: ${game.currentHearts.map(h => h.id).join(', ')}`);

    // Find the heart
    const heartIndex = game.currentHearts.findIndex(h => h.id === heartId);
    if (heartIndex === -1) {
      console.log(`Heart ${heartId} not found or already caught`);
      return; // Heart already caught or doesn't exist
    }

    const heart = game.currentHearts[heartIndex];
    console.log(`Found heart ${heartId}: ${heart.emoji}, points: ${heart.points}`);

    // Remove heart immediately so no one else can catch it
    game.currentHearts.splice(heartIndex, 1);

    // Update player score
    const player = game.players.find(p => p.id === socket.id);
    if (player) {
      player.score += heart.points;
      console.log(`Updated player ${player.name} score: ${player.score}`);
    } else {
      console.log(`Player ${socket.id} not found in game`);
    }

    // Notify all players who caught the heart and for how many points
    io.to(roomId).emit('heart-caught', {
      playerId: socket.id,
      heartId,
      points: heart.points,
      playerName: player?.name || 'Unknown',
      heartEmoji: heart.emoji
    });

    // Send updated game state
    io.to(roomId).emit('heart-game-state', game);

    console.log(`Player ${socket.id} (${player?.name}) caught heart ${heartId} for ${heart.points} points`);
  });

  socket.on('reset-heart-game', ({ roomId }) => {
    const game = heartGames.get(roomId);

    if (!game) return;

    game.players.forEach(p => p.score = 0);
    game.timeLeft = 60;
    game.status = 'waiting';
    game.currentHearts = [];

    io.to(roomId).emit('heart-game-state', game);

    console.log(`Heart game reset in room ${roomId}`);
  });

  // Love Charades events
  socket.on('create-charades-room', ({ playerName }) => {
    const roomId = generateRoomId();
    const game = {
      id: roomId,
      players: [{ id: socket.id, name: playerName, score: 0 }],
      currentRound: 1,
      status: 'waiting',
      currentHintGiver: null,
      currentHint: '',
      currentCard: null,
      roundWinner: null
    };

    charadesGames.set(roomId, game);
    socket.join(roomId);
    socket.emit('charades-room-created', { roomId, playerInfo: game.players[0] });

    console.log(`Charades room ${roomId} created by ${socket.id} (${playerName})`);
  });

  socket.on('join-charades-room', ({ roomId, playerName }) => {
    const game = charadesGames.get(roomId);

    if (!game) {
      socket.emit('error', 'Charades room not found');
      return;
    }

    if (game.players.length >= 2) {
      socket.emit('error', 'Charades room is full');
      return;
    }

    const newPlayer = { id: socket.id, name: playerName, score: 0 };
    game.players.push(newPlayer);
    socket.join(roomId);

    // Start the game when 2 players join
    if (game.players.length === 2) {
      game.status = 'playing';
      game.currentHintGiver = game.players[0].id;
      dealCards(game);
    }

    // Notify both players
    socket.emit('charades-room-joined', { roomId, playerInfo: newPlayer });
    socket.to(roomId).emit('player-joined-charades', newPlayer);

    // Send current game state to both players
    io.to(roomId).emit('charades-game-state', game);

    console.log(`Player ${socket.id} (${playerName}) joined charades room ${roomId}`);
  });

  socket.on('submit-hint', ({ roomId, hint }) => {
    const game = charadesGames.get(roomId);

    if (!game) {
      socket.emit('error', 'Charades game not found');
      return;
    }

    if (socket.id !== game.currentHintGiver) {
      socket.emit('error', 'Not your turn to give hint');
      return;
    }

    game.currentHint = hint;
    io.to(roomId).emit('hint-submitted', { hint, game });
    console.log(`Hint submitted in room ${roomId}: ${hint}`);
  });

  socket.on('submit-guess', ({ roomId, guess }) => {
    const game = charadesGames.get(roomId);

    if (!game) {
      socket.emit('error', 'Charades game not found');
      return;
    }

    if (socket.id === game.currentHintGiver) {
      socket.emit('error', 'You cannot guess your own card');
      return;
    }

    const isCorrect = guess.toLowerCase().trim() === game.currentCard.name.toLowerCase();
    
    if (isCorrect) {
      // Guesser gets a point
      const guesser = game.players.find(p => p.id === socket.id);
      if (guesser) {
        guesser.score += 1;
        game.roundWinner = guesser.name;
      }
    } else {
      // Hint giver gets a point
      const hintGiver = game.players.find(p => p.id === game.currentHintGiver);
      if (hintGiver) {
        hintGiver.score += 1;
        game.roundWinner = hintGiver.name;
      }
    }

    game.status = 'roundEnd';
    io.to(roomId).emit('round-ended', { game, correctCard: game.currentCard });
    console.log(`Round ended in room ${roomId}. Winner: ${game.roundWinner}`);
  });

  socket.on('next-charades-round', ({ roomId }) => {
    const game = charadesGames.get(roomId);

    if (!game) {
      socket.emit('error', 'Charades game not found');
      return;
    }

    // Switch hint giver
    const currentIndex = game.players.findIndex(p => p.id === game.currentHintGiver);
    game.currentHintGiver = game.players[(currentIndex + 1) % game.players.length].id;
    
    // Reset for new round
    game.currentRound += 1;
    game.currentHint = '';
    game.roundWinner = null;
    game.status = 'playing';
    
    dealCards(game);
    io.to(roomId).emit('charades-game-state', game);
    console.log(`Next round started in room ${roomId}. Hint giver: ${game.currentHintGiver}`);
  });

  socket.on('reset-charades-game', ({ roomId }) => {
    const game = charadesGames.get(roomId);

    if (!game) return;

    game.players.forEach(p => p.score = 0);
    game.currentRound = 1;
    game.currentHint = '';
    game.roundWinner = null;
    game.status = 'waiting';
    game.currentHintGiver = null;
    game.currentCard = null;

    io.to(roomId).emit('charades-game-state', game);
    console.log(`Charades game reset in room ${roomId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Clean up Tic Tac Toe games
    for (const [roomId, game] of games.entries()) {
      const playerIndex = game.players.findIndex(p => p.id === socket.id);

      if (playerIndex !== -1) {
        game.players.splice(playerIndex, 1);

        if (game.players.length === 0) {
          // Delete empty games
          games.delete(roomId);
          console.log(`Room ${roomId} deleted`);
        } else {
          // Notify remaining player
          game.status = 'waiting';
          game.players = [{ ...game.players[0], symbol: 'X' }]; // Reset to single player
          socket.to(roomId).emit('player-disconnected');
          io.to(roomId).emit('game-state', game);
        }
        break;
      }
    }

    // Clean up Heart Chase games
    for (const [roomId, game] of heartGames.entries()) {
      const playerIndex = game.players.findIndex(p => p.id === socket.id);

      if (playerIndex !== -1) {
        game.players.splice(playerIndex, 1);

        if (game.players.length === 0) {
          // Delete empty games
          heartGames.delete(roomId);
          console.log(`Heart room ${roomId} deleted`);
        } else {
          // Notify remaining player
          game.status = 'waiting';
          socket.to(roomId).emit('player-disconnected');
          io.to(roomId).emit('heart-game-state', game);
        }
        break;
      }
    }

    // Clean up Charades games
    for (const [roomId, game] of charadesGames.entries()) {
      const playerIndex = game.players.findIndex(p => p.id === socket.id);

      if (playerIndex !== -1) {
        game.players.splice(playerIndex, 1);

        if (game.players.length === 0) {
          // Delete empty games
          charadesGames.delete(roomId);
          console.log(`Charades room ${roomId} deleted`);
        } else {
          // Notify remaining player
          game.status = 'waiting';
          game.currentHintGiver = null;
          game.currentCard = null;
          socket.to(roomId).emit('player-disconnected');
          io.to(roomId).emit('charades-game-state', game);
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || process.env.SOCKET_PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
