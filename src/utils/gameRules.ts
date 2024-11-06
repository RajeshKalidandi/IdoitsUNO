import type { Card, GameState } from '../types/game';

export function isValidPlay(card: Card, topCard: Card): boolean {
  // Wild cards can always be played
  if (card.type === 'wild' || card.type === 'wild4') {
    return true;
  }

  // Match color or type/value
  return (
    card.color === topCard.color ||
    (card.type === topCard.type && card.type === 'number' && card.value === topCard.value) ||
    (card.type === topCard.type)
  );
}

export function applyCardEffect(gameState: GameState, playedCard: Card): GameState {
  const newState = { ...gameState };
  const currentPlayerIndex = gameState.players.findIndex(p => p.id === gameState.currentPlayer);
  const numPlayers = gameState.players.length;

  switch (playedCard.type) {
    case 'skip':
      // Skip next player's turn
      newState.currentPlayer = gameState.players[
        (currentPlayerIndex + 2) % numPlayers
      ].id;
      break;

    case 'reverse':
      // Reverse direction and move to next player
      newState.direction = gameState.direction === 'clockwise' ? 'counterclockwise' : 'clockwise';
      newState.currentPlayer = gameState.players[
        gameState.direction === 'clockwise'
          ? (currentPlayerIndex - 1 + numPlayers) % numPlayers
          : (currentPlayerIndex + 1) % numPlayers
      ].id;
      break;

    case 'draw2':
      // Next player draws 2 cards and loses turn
      const nextPlayerIndex = (currentPlayerIndex + 1) % numPlayers;
      const nextPlayer = newState.players[nextPlayerIndex];
      const drawnCards = newState.deck.splice(0, 2);
      nextPlayer.cards.push(...drawnCards);
      newState.currentPlayer = gameState.players[
        (nextPlayerIndex + 1) % numPlayers
      ].id;
      break;

    case 'wild4':
      // Next player draws 4 cards and loses turn
      const targetPlayerIndex = (currentPlayerIndex + 1) % numPlayers;
      const targetPlayer = newState.players[targetPlayerIndex];
      const wildDrawnCards = newState.deck.splice(0, 4);
      targetPlayer.cards.push(...wildDrawnCards);
      newState.currentPlayer = gameState.players[
        (targetPlayerIndex + 1) % numPlayers
      ].id;
      break;

    default:
      // Normal cards just move to next player
      newState.currentPlayer = gameState.players[
        (currentPlayerIndex + 1) % numPlayers
      ].id;
  }

  return newState;
}

export function checkWinCondition(gameState: GameState): string | null {
  const winner = gameState.players.find(player => player.cards.length === 0);
  return winner ? winner.id : null;
}