import type { Card, CardColor, CardType } from '../types/game';

const COLORS: CardColor[] = ['red', 'blue', 'green', 'yellow'];
const NUMBER_CARDS = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9];
const ACTION_CARDS: CardType[] = ['skip', 'reverse', 'draw2'];
const WILD_CARDS: CardType[] = ['wild', 'wild4'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  let id = 1;

  // Add number cards
  COLORS.forEach(color => {
    NUMBER_CARDS.forEach(value => {
      deck.push({ id: String(id++), color, type: 'number', value });
    });
  });

  // Add action cards (2 of each per color)
  COLORS.forEach(color => {
    ACTION_CARDS.forEach(type => {
      deck.push({ id: String(id++), color, type });
      deck.push({ id: String(id++), color, type });
    });
  });

  // Add wild cards (4 of each)
  WILD_CARDS.forEach(type => {
    for (let i = 0; i < 4; i++) {
      deck.push({ id: String(id++), color: 'wild', type });
    }
  });

  return shuffleDeck(deck);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

export function dealCards(deck: Card[], numPlayers: number, cardsPerPlayer: number = 7) {
  const playerHands: Card[][] = Array(numPlayers).fill([]).map(() => []);
  const remainingDeck = [...deck];

  // Deal cards to each player
  for (let i = 0; i < cardsPerPlayer; i++) {
    for (let j = 0; j < numPlayers; j++) {
      if (remainingDeck.length > 0) {
        const card = remainingDeck.pop()!;
        playerHands[j] = [...playerHands[j], card];
      }
    }
  }

  // Get initial card that isn't a wild card
  let initialCardIndex = remainingDeck.findIndex(card => !card.type.includes('wild'));
  if (initialCardIndex === -1) initialCardIndex = 0;
  const initialCard = remainingDeck.splice(initialCardIndex, 1)[0];

  return {
    playerHands,
    remainingDeck,
    initialCard
  };
}