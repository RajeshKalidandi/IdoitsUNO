export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | null;
export type CardType = 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';
export type GameStatus = 'waiting' | 'playing' | 'finished';
export type Direction = 'clockwise' | 'counterclockwise';

export interface Card {
  id: string;
  color: CardColor;
  type: CardType;
  value?: number;
}

export interface Player {
  id: string;
  name: string;
  cards: Card[];
  isCurrentTurn: boolean;
  isAI?: boolean;
  aiDifficulty?: 'easy' | 'medium' | 'hard';
  calledUno?: boolean;
}

export interface GameState {
  players: Player[];
  currentPlayer: string | null;
  direction: Direction;
  deck: Card[];
  discardPile: Card[];
  gameStatus: GameStatus;
  roomId: string | null;
  maxPlayers: number;
  cardsPerPlayer: number;
  offlineData: GameState | null;
}