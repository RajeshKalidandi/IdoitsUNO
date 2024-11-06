import React from 'react';
import { PlayerHand } from './components/PlayerHand';
import { Card } from './components/Card';
import { ColorPicker } from './components/ColorPicker';
import { GameNotification } from './components/GameNotification';
import { Lobby } from './components/Lobby';
import { Skull } from 'lucide-react';
import { useGameStore } from './store/gameStore';
import { useSound } from './hooks/useSound';
import { motion } from 'framer-motion';
import type { Card as CardType, CardColor } from './types/game';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Toaster } from 'react-hot-toast';

function App() {
  const { gameState, playerId, roomId, playCard, drawCard, loading } = useGameStore();
  const { playSound } = useSound();
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [pendingWildCard, setPendingWildCard] = React.useState<CardType | null>(null);
  const [notification, setNotification] = React.useState('');
  const [showUnoButton, setShowUnoButton] = React.useState(false);

  const currentPlayer = gameState?.players?.find(p => p?.id === gameState?.currentPlayer);
  const humanPlayer = gameState?.players?.find(p => p?.id === playerId);

  const handlePlayCard = (card: CardType) => {
    if (currentPlayer && playerId === currentPlayer.id) {
      if (card.type === 'wild' || card.type === 'wild4') {
        setShowColorPicker(true);
        setPendingWildCard(card);
        return;
      }

      playCard(card);
      playSound('play');
      checkUnoCondition();
    }
  };

  const handleColorSelect = (color: CardColor) => {
    if (pendingWildCard && currentPlayer) {
      const wildCardWithColor = { ...pendingWildCard, color };
      playCard(wildCardWithColor);
      playSound('play');
      checkUnoCondition();
      setShowColorPicker(false);
      setPendingWildCard(null);
    }
  };

  const handleDrawCard = () => {
    if (currentPlayer && playerId === currentPlayer.id) {
      drawCard();
      playSound('draw');
      setShowUnoButton(false);
    }
  };

  const checkUnoCondition = () => {
    if (humanPlayer && humanPlayer.cards.length === 2) {
      setShowUnoButton(true);
    }
  };

  const handleCallUno = () => {
    playSound('uno');
    setShowUnoButton(false);
    setNotification(`${humanPlayer?.name} called UNO!`);
    setTimeout(() => setNotification(''), 2000);
  };

  const handleFailedUno = (playerName: string) => {
    setNotification(`${playerName} didn't call UNO!`);
    setTimeout(() => setNotification(''), 2000);
  };

  if (!roomId || !playerId) {
    return <Lobby />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black overflow-hidden">
        <Toaster position="top-right" />
        {loading && <LoadingSpinner />}

        {/* Room Info */}
        <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center bg-black/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Skull className="w-6 h-6 text-orange-400" />
            <h1 className="text-xl font-bold text-white">IdiotsUNO</h1>
          </div>
          <div className="text-white text-sm">
            Room: {roomId}
          </div>
        </div>

        {/* Other Players */}
        <div className="fixed inset-0 pointer-events-none">
          {gameState.players
            .filter(p => p.id !== playerId)
            .map((player, index) => (
              <div
                key={player.id}
                className={`absolute ${
                  index === 0 ? 'top-20 left-1/2 -translate-x-1/2' :
                  index === 1 ? 'top-1/2 -translate-y-1/2 right-20' :
                  'top-1/2 -translate-y-1/2 left-20'
                }`}
              >
                <div className={`flex items-center gap-2 ${player.isCurrentTurn ? 'bg-blue-500/20' : ''} p-2 rounded-lg`}>
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                    {player.name[0]}
                  </div>
                  <div>
                    <div className="text-white text-sm">{player.name}</div>
                    <div className="text-white/60 text-xs">{player.cards.length} cards</div>
                  </div>
                </div>
                <div className="flex gap-1 mt-2">
                  {Array.from({ length: Math.min(player.cards.length, 7) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-12 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg transform rotate-180"
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>

        {/* Game Table */}
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
          {/* Last Played Card */}
          {gameState.discardPile.length > 0 && (
            <Card 
              card={gameState.discardPile[gameState.discardPile.length - 1]} 
              isPlayable={false} 
            />
          )}
          
          {/* Draw Card Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDrawCard}
            className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Draw card
          </motion.button>
        </div>

        {/* UNO Button */}
        {showUnoButton && (
          <div className="fixed bottom-40 left-1/2 transform -translate-x-1/2 flex gap-2">
            <button
              onClick={handleCallUno}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Call UNO!
            </button>
            <button
              onClick={() => handleFailedUno(humanPlayer?.name || '')}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Didn't call UNO
            </button>
          </div>
        )}

        {/* Player Hand */}
        {humanPlayer && Array.isArray(humanPlayer.cards) && (
          <PlayerHand
            cards={humanPlayer.cards}
            onPlayCard={handlePlayCard}
            isCurrentTurn={humanPlayer.id === currentPlayer?.id}
          />
        )}

        {/* Color Picker Modal */}
        {showColorPicker && (
          <ColorPicker onColorSelect={handleColorSelect} />
        )}

        {/* Game Notification */}
        <GameNotification message={notification} isVisible={!!notification} />
      </div>
    </ErrorBoundary>
  );
}

export default App;