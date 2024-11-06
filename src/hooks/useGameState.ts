import { useState, useCallback, useRef, useEffect } from 'react';
import type { Card, GameState, CardColor } from '../types/game';
import { createDeck, dealCards } from '../utils/deck';
import { isValidPlay, applyCardEffect, checkWinCondition } from '../utils/gameRules';
import { AIPlayer } from '../utils/ai';
import { useGameStore } from '../store/gameStore';

const PLAYER_NAMES = [
  "Captain Chaos",
  "Professor Panic",
  "Doctor Disaster",
  "Major Mayhem",
  "Lieutenant Lunacy",
  "Sergeant Silly",
  "General Goofy",
  "Admiral Absurd"
];

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

const createInitialState = (numPlayers: number = 4): GameState => {
  const deck = createDeck();
  const { playerHands, remainingDeck, initialCard } = dealCards(deck, numPlayers);

  return {
    players: playerHands.map((cards, index) => ({
      id: String(index + 1),
      name: PLAYER_NAMES[index],
      cards,
      isCurrentTurn: index === 0
    })),
    currentPlayer: '1',
    direction: 'clockwise',
    deck: remainingDeck,
    discardPile: [initialCard],
    gameStatus: 'playing'
  };
};

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const aiRef = useRef<AIPlayer[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const aiPlayers = useRef<Record<string, AIPlayer>>({});
  const { playCard, drawCard } = useGameStore();

  // Initialize AI players with different difficulties
  const initializeAI = useCallback((numPlayers: number) => {
    aiRef.current = Array(numPlayers - 1).fill(null).map((_, index) => 
      new AIPlayer(DIFFICULTIES[index % DIFFICULTIES.length])
    );
  }, []);

  const playCard = useCallback((playerId: string, card: Card) => {
    setGameState(currentState => {
      if (
        currentState.gameStatus !== 'playing' ||
        currentState.currentPlayer !== playerId ||
        !isValidPlay(card, currentState.discardPile[currentState.discardPile.length - 1])
      ) {
        return currentState;
      }

      const player = currentState.players.find(p => p.id === playerId)!;
      const newState: GameState = {
        ...currentState,
        players: currentState.players.map(p =>
          p.id === playerId
            ? {
                ...p,
                cards: p.cards.filter(c => c.id !== card.id),
                isCurrentTurn: false
              }
            : p
        ),
        discardPile: [...currentState.discardPile, card]
      };

      const stateAfterEffect = applyCardEffect(newState, card);
      const finalState = {
        ...stateAfterEffect,
        players: stateAfterEffect.players.map(p => ({
          ...p,
          isCurrentTurn: p.id === stateAfterEffect.currentPlayer
        }))
      };

      const winnerId = checkWinCondition(finalState);
      if (winnerId) {
        finalState.gameStatus = 'finished';
      } else {
        // Schedule AI moves
        timeoutRef.current = setTimeout(() => handleAITurn(finalState), 1000);
      }

      return finalState;
    });
  }, []);

  const handleAITurn = (state: GameState) => {
    const currentPlayerIndex = parseInt(state.currentPlayer) - 1;
    if (currentPlayerIndex === 0 || state.gameStatus !== 'playing') return;

    const ai = aiRef.current[currentPlayerIndex - 1];
    const selectedCard = ai.chooseCard(state, state.currentPlayer);

    if (selectedCard) {
      if (selectedCard.type === 'wild' || selectedCard.type === 'wild4') {
        const selectedColor = ai.chooseColor(state, state.currentPlayer);
        playCard(state.currentPlayer, { ...selectedCard, color: selectedColor });
      } else {
        playCard(state.currentPlayer, selectedCard);
      }
    } else {
      drawCard(state.currentPlayer);
    }
  };

  const drawCard = useCallback((playerId: string) => {
    setGameState(currentState => {
      if (
        currentState.gameStatus !== 'playing' ||
        currentState.currentPlayer !== playerId
      ) {
        return currentState;
      }

      const drawnCard = currentState.deck[0];
      const newDeck = currentState.deck.slice(1);
      const newState = {
        ...currentState,
        deck: newDeck,
        players: currentState.players.map(p =>
          p.id === playerId
            ? { ...p, cards: [...p.cards, drawnCard] }
            : p
        )
      };

      // If AI drew a card, give them a chance to play it
      if (parseInt(playerId) > 1) {
        timeoutRef.current = setTimeout(() => handleAITurn(newState), 500);
      }

      return newState;
    });
  }, []);

  const startNewGame = useCallback((numPlayers: number = 4) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    initializeAI(numPlayers);
    setGameState(createInitialState(numPlayers));
  }, [initializeAI]);

  useEffect(() => {
    // Initialize AI players with different difficulties
    gameState.players.forEach(player => {
      if (player.isAI && !aiPlayers.current[player.id]) {
        const difficulty = player.aiDifficulty || 'medium';
        aiPlayers.current[player.id] = new AIPlayer(difficulty);
      }
    });

    // Handle AI turns
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
    if (currentPlayer?.isAI && gameState.gameStatus === 'playing') {
      const ai = aiPlayers.current[currentPlayer.id];
      
      // Add delay to make AI moves feel more natural
      const timeout = setTimeout(() => {
        const move = ai.makeMove(gameState);
        
        if (move.action === 'play' && move.card) {
          const finalCard = move.card.type.includes('wild') 
            ? { ...move.card, color: ai.selectWildColor(currentPlayer.cards) }
            : move.card;
          playCard(finalCard);
        } else {
          drawCard();
        }
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [gameState.currentPlayer, gameState.gameStatus]);

  return {
    gameState,
    playCard,
    drawCard,
    startNewGame
  };
}