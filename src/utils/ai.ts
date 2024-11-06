import { Card, GameState, CardColor, CardType } from '../types/game';
import { isValidPlay } from './gameRules';

type Difficulty = 'easy' | 'medium' | 'hard';

interface AIStrategy {
  evaluateMove: (card: Card, gameState: GameState) => number;
  shouldDrawCard: (hand: Card[], topCard: Card) => boolean;
}

const strategies: Record<Difficulty, AIStrategy> = {
  easy: {
    evaluateMove: () => Math.random(),
    shouldDrawCard: (hand, topCard) => !hand.some(card => isValidPlay(card, topCard))
  },

  medium: {
    evaluateMove: (card, gameState) => {
      let score = Math.random();
      
      // Prefer action cards
      if (['skip', 'reverse', 'draw2', 'wild4'].includes(card.type)) {
        score += 2;
      }
      
      // Prefer matching colors
      const topCard = gameState.discardPile[gameState.discardPile.length - 1];
      if (card.color === topCard.color) {
        score += 1;
      }

      return score;
    },
    shouldDrawCard: (hand, topCard) => !hand.some(card => isValidPlay(card, topCard))
  },

  hard: {
    evaluateMove: (card, gameState) => {
      let score = 0;
      const topCard = gameState.discardPile[gameState.discardPile.length - 1];
      const nextPlayer = getNextPlayer(gameState);
      
      // Strategic scoring
      if (nextPlayer.cards.length <= 2) {
        // Defensive play against players close to winning
        if (card.type === 'draw2') score += 5;
        if (card.type === 'wild4') score += 6;
        if (card.type === 'skip') score += 4;
      }

      // Value different card types
      switch (card.type) {
        case 'wild4': score += 3;
        case 'wild': score += 2;
        case 'draw2': score += 2.5;
        case 'skip': score += 2;
        case 'reverse': score += 1.5;
        default: score += 1;
      }

      // Color matching strategy
      if (card.color === topCard.color) {
        score += 1;
      }

      // Consider color frequency in hand
      const colorFrequency = getColorFrequency(gameState.players[gameState.currentPlayer].cards);
      if (card.color && colorFrequency[card.color] > 2) {
        score += 1.5;
      }

      return score;
    },
    shouldDrawCard: (hand, topCard) => {
      const validPlays = hand.filter(card => isValidPlay(card, topCard));
      return validPlays.length === 0 || 
             (validPlays.every(card => card.type === 'wild' || card.type === 'wild4') && 
              hand.length < 5);
    }
  }
};

function getColorFrequency(cards: Card[]): Record<CardColor, number> {
  return cards.reduce((freq, card) => {
    if (card.color) {
      freq[card.color] = (freq[card.color] || 0) + 1;
    }
    return freq;
  }, {} as Record<CardColor, number>);
}

function getNextPlayer(gameState: GameState) {
  const currentIndex = gameState.players.findIndex(p => p.id === gameState.currentPlayer);
  const nextIndex = (currentIndex + 1) % gameState.players.length;
  return gameState.players[nextIndex];
}

export class AIPlayer {
  private difficulty: Difficulty;
  private strategy: AIStrategy;

  constructor(difficulty: Difficulty = 'medium') {
    this.difficulty = difficulty;
    this.strategy = strategies[difficulty];
  }

  makeMove(gameState: GameState): { action: 'play' | 'draw', card?: Card } {
    const player = gameState.players.find(p => p.id === gameState.currentPlayer);
    if (!player) throw new Error('Current player not found');

    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    const validMoves = player.cards.filter(card => isValidPlay(card, topCard));

    if (this.strategy.shouldDrawCard(player.cards, topCard)) {
      return { action: 'draw' };
    }

    // Evaluate and select the best move
    const bestMove = validMoves.reduce((best, card) => {
      const score = this.strategy.evaluateMove(card, gameState);
      return score > best.score ? { card, score } : best;
    }, { card: validMoves[0], score: -Infinity });

    return { action: 'play', card: bestMove.card };
  }

  selectWildColor(hand: Card[]): CardColor {
    const colorFreq = getColorFrequency(hand);
    return Object.entries(colorFreq)
      .reduce((best, [color, freq]) => freq > best.freq ? { color: color as CardColor, freq } : best,
        { color: 'red' as CardColor, freq: -1 })
      .color;
  }
}