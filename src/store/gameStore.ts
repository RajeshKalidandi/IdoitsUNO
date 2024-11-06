import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, gameRooms, subscribeToRoom } from '../services/supabase';
import { createDeck, dealCards } from '../utils/deck';
import type { GameState, Card, Player, GameStatus } from '../types/game';

interface GameStore {
  gameState: GameState;
  playerId: string | null;
  roomId: string | null;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  
  // Room Management
  createRoom: (playerName: string, maxPlayers: number, cardsPerPlayer: number) => Promise<void>;
  joinRoom: (roomId: string, playerName: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  startGame: () => Promise<void>;
  
  // Game Actions
  playCard: (card: Card) => Promise<void>;
  drawCard: () => Promise<void>;
  callUno: () => Promise<void>;
  
  // State Management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Realtime Updates
  subscribeToRoom: (roomId: string) => void;
  unsubscribeFromRoom: () => void;
}

const initialGameState: GameState = {
  players: [],
  currentPlayer: null,
  direction: 'clockwise',
  deck: [],
  discardPile: [],
  gameStatus: 'waiting',
  roomId: null,
  maxPlayers: 15,
  offlineData: null
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      gameState: initialGameState,
      playerId: null,
      roomId: null,
      loading: false,
      error: null,
      isOffline: false,
      
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      createRoom: async (playerName: string, maxPlayers = 4, cardsPerPlayer = 7) => {
        set({ loading: true, error: null });
        try {
          const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
          const playerId = Math.random().toString(36).substring(2, 10);

          const newGameState: GameState = {
            ...initialGameState,
            roomId,
            maxPlayers,
            cardsPerPlayer,
            players: [{
              id: playerId,
              name: playerName,
              cards: [],
              isCurrentTurn: true,
              isAI: false
            }],
            currentPlayer: playerId,
            gameStatus: 'waiting'
          };

          // Create room in Supabase with correct structure
          await gameRooms.create({
            room_id: roomId,
            game_state: newGameState
          });

          // Subscribe to real-time updates
          const subscription = subscribeToRoom(roomId, (payload: any) => {
            if (payload.new && payload.new.game_state) {
              set({ gameState: payload.new.game_state });
            }
          });

          // Store subscription for cleanup
          (get() as any).subscription = subscription;

          set({ 
            gameState: newGameState,
            playerId,
            roomId,
            loading: false 
          });

        } catch (error: any) {
          console.error('Error creating room:', error);
          set({ 
            error: error.message || 'Failed to create room', 
            loading: false 
          });
          throw error;
        }
      },

      joinRoom: async (roomId: string, playerName: string) => {
        set({ loading: true, error: null });
        try {
          const playerId = Math.random().toString(36).substring(2, 10);
          
          // Get current room state
          const roomData = await gameRooms.get(roomId);
          if (!roomData) throw new Error('Room not found');

          const currentState = roomData.game_state;
          if (currentState.players.length >= currentState.maxPlayers) {
            throw new Error('Room is full');
          }

          // Add player to room
          const updatedGameState = {
            ...currentState,
            players: [
              ...currentState.players,
              {
                id: playerId,
                name: playerName,
                cards: [],
                isCurrentTurn: false,
                isAI: false
              }
            ]
          };

          // Update room in Supabase
          await gameRooms.update(roomId, updatedGameState);

          // Subscribe to real-time updates
          get().subscribeToRoom(roomId);

          set({
            gameState: updatedGameState,
            playerId,
            roomId,
            loading: false
          });

        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      startGame: async () => {
        const { roomId, gameState } = get();
        if (!roomId) return;

        try {
          const deck = createDeck();
          const { playerHands, remainingDeck, initialCard } = dealCards(
            deck, 
            gameState.players.length, 
            gameState.cardsPerPlayer || 7
          );

          const updatedGameState: GameState = {
            ...gameState,
            deck: remainingDeck,
            discardPile: [initialCard],
            gameStatus: 'playing',
            players: gameState.players.map((player, index) => ({
              ...player,
              cards: playerHands[index]
            }))
          };

          await gameRooms.update(roomId, updatedGameState);
          set({ gameState: updatedGameState });
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      subscribeToRoom: (roomId: string) => {
        const subscription = supabase
          .channel(`room:${roomId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'game_rooms',
              filter: `room_id=eq.${roomId}`
            },
            (payload) => {
              if (payload.new) {
                set({ gameState: payload.new.game_state });
              }
            }
          )
          .subscribe();

        // Store subscription for cleanup
        (get() as any).subscription = subscription;
      },

      unsubscribeFromRoom: () => {
        const subscription = (get() as any).subscription;
        if (subscription) {
          subscription.unsubscribe();
        }
      },

      leaveRoom: async () => {
        const { roomId, playerId, gameState } = get();
        if (!roomId || !playerId) return;

        try {
          const updatedPlayers = gameState.players.filter(p => p.id !== playerId);
          const updatedGameState = {
            ...gameState,
            players: updatedPlayers,
            gameStatus: updatedPlayers.length === 0 ? 'finished' : gameState.gameStatus
          };

          if (updatedPlayers.length === 0) {
            // Delete room if empty
            await supabase.from('game_rooms').delete().eq('room_id', roomId);
          } else {
            // Update room state
            await gameRooms.update(roomId, updatedGameState);
          }

          get().unsubscribeFromRoom();
          set({ ...initialGameState, playerId: null, roomId: null });

        } catch (error: any) {
          set({ error: error.message });
        }
      },

      playCard: async (card: Card) => {
        const { roomId, playerId, gameState } = get();
        if (!roomId || !playerId || gameState.currentPlayer !== playerId) return;

        try {
          const updatedGameState = {
            ...gameState,
            players: gameState.players.map(p => 
              p.id === playerId
                ? { ...p, cards: p.cards.filter(c => c.id !== card.id) }
                : p
            ),
            discardPile: [...gameState.discardPile, card],
            currentPlayer: getNextPlayer(gameState)
          };

          await gameRooms.update(roomId, updatedGameState);
          set({ gameState: updatedGameState });
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      drawCard: async () => {
        const { roomId, playerId, gameState } = get();
        if (!roomId || !playerId || gameState.currentPlayer !== playerId) return;

        try {
          const [drawnCard, ...remainingDeck] = gameState.deck;
          const updatedGameState = {
            ...gameState,
            deck: remainingDeck,
            players: gameState.players.map(p =>
              p.id === playerId
                ? { ...p, cards: [...p.cards, drawnCard] }
                : p
            ),
            currentPlayer: getNextPlayer(gameState)
          };

          await gameRooms.update(roomId, updatedGameState);
          set({ gameState: updatedGameState });
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      callUno: async () => {
        const { roomId, playerId, gameState } = get();
        if (!roomId || !playerId) return;

        try {
          const player = gameState.players.find(p => p.id === playerId);
          if (!player || player.cards.length !== 1) return;

          const updatedGameState = {
            ...gameState,
            players: gameState.players.map(p =>
              p.id === playerId
                ? { ...p, calledUno: true }
                : p
            )
          };

          await gameRooms.update(roomId, updatedGameState);
          set({ gameState: updatedGameState });
        } catch (error: any) {
          set({ error: error.message });
        }
      },
    }),
    {
      name: 'idiotsuno-storage',
      partialize: (state) => ({
        gameState: state.gameState,
        playerId: state.playerId,
        roomId: state.roomId
      })
    }
  )
);

// Helper function to get next player
function getNextPlayer(gameState: GameState): string {
  const currentIndex = gameState.players.findIndex(p => p.id === gameState.currentPlayer);
  const nextIndex = (currentIndex + 1) % gameState.players.length;
  return gameState.players[nextIndex].id;
}