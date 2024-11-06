import { v4 as uuidv4 } from 'uuid';
import { createDeck, dealCards } from '../src/utils/deck.js';
import { isValidPlay, applyCardEffect, checkWinCondition } from '../src/utils/gameRules.js';

const gameRooms = new Map();

export function createGameRoom(io, socketId, playerName) {
  const roomId = uuidv4().slice(0, 6);
  const playerId = uuidv4();

  const gameState = {
    players: [{
      id: playerId,
      name: playerName,
      cards: [],
      isCurrentTurn: true
    }],
    currentPlayer: playerId,
    direction: 'clockwise',
    deck: [],
    discardPile: [],
    gameStatus: 'waiting'
  };

  gameRooms.set(roomId, gameState);
  return { roomId, playerId };
}

export function joinGameRoom(io, socketId, roomId, playerName) {
  const gameState = gameRooms.get(roomId);
  if (!gameState) return { success: false };

  const playerId = uuidv4();
  const newPlayer = {
    id: playerId,
    name: playerName,
    cards: [],
    isCurrentTurn: false
  };

  gameState.players.push(newPlayer);
  io.to(roomId).emit('playerJoined', newPlayer);

  if (gameState.players.length === 4) {
    startGame(io, roomId);
  }

  return { success: true, playerId };
}

function startGame(io, roomId) {
  const gameState = gameRooms.get(roomId);
  const deck = createDeck();
  const { playerHands, remainingDeck, initialCard } = dealCards(deck, gameState.players.length);

  gameState.deck = remainingDeck;
  gameState.discardPile = [initialCard];
  gameState.gameStatus = 'playing';
  gameState.players.forEach((player, index) => {
    player.cards = playerHands[index];
  });

  io.to(roomId).emit('gameStateUpdate', gameState);
}

export function handlePlayCard(io, roomId, playerId, card) {
  const gameState = gameRooms.get(roomId);
  if (!gameState || gameState.currentPlayer !== playerId) return;

  const topCard = gameState.discardPile[gameState.discardPile.length - 1];
  if (!isValidPlay(card, topCard)) return;

  const player = gameState.players.find(p => p.id === playerId);
  player.cards = player.cards.filter(c => c.id !== card.id);
  gameState.discardPile.push(card);

  const newState = applyCardEffect(gameState, card);
  const winner = checkWinCondition(newState);

  if (winner) {
    newState.gameStatus = 'finished';
  }

  gameRooms.set(roomId, newState);
  io.to(roomId).emit('gameStateUpdate', newState);
}

export function handleDrawCard(io, roomId, playerId) {
  const gameState = gameRooms.get(roomId);
  if (!gameState || gameState.currentPlayer !== playerId) return;

  const player = gameState.players.find(p => p.id === playerId);
  const drawnCard = gameState.deck.pop();
  player.cards.push(drawnCard);

  if (gameState.deck.length === 0) {
    const discardPile = gameState.discardPile.slice(0, -1);
    gameState.deck = shuffleDeck(discardPile);
    gameState.discardPile = [gameState.discardPile[gameState.discardPile.length - 1]];
  }

  io.to(roomId).emit('gameStateUpdate', gameState);
}

export function leaveGameRoom(io, roomId, playerId) {
  const gameState = gameRooms.get(roomId);
  if (!gameState) return;

  gameState.players = gameState.players.filter(p => p.id !== playerId);
  
  if (gameState.players.length === 0) {
    gameRooms.delete(roomId);
  } else {
    if (gameState.currentPlayer === playerId) {
      const nextPlayerIndex = gameState.players.findIndex(p => p.id === playerId);
      gameState.currentPlayer = gameState.players[nextPlayerIndex % gameState.players.length].id;
    }
    io.to(roomId).emit('playerLeft', playerId);
    io.to(roomId).emit('gameStateUpdate', gameState);
  }
}

// Add room management
const rooms = new Map();

const createRoom = (roomId) => {
  rooms.set(roomId, {
    players: [],
    gameState: null,
    settings: defaultSettings
  });
};

// Add game state synchronization
const syncGameState = (roomId, gameState) => {
  const room = rooms.get(roomId);
  room.gameState = gameState;
  io.to(roomId).emit('game-update', gameState);
};