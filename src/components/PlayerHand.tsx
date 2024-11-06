import React from 'react';
import { motion } from 'framer-motion';
import { Card as CardComponent } from './Card';
import type { Card } from '../types/game';

interface PlayerHandProps {
  cards: Card[];
  onPlayCard: (card: Card) => void;
  isCurrentTurn: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({ cards = [], onPlayCard, isCurrentTurn }) => {
  if (!Array.isArray(cards) || cards.length === 0) {
    return null;
  }

  const validCards = cards.filter((card): card is Card => {
    return card !== null && 
           typeof card === 'object' && 
           'type' in card && 
           (card.id !== undefined || card.type !== undefined);
  });

  const cardsWithIds = validCards.map((card, index) => ({
    ...card,
    id: card.id || `card-${index}-${card.type}-${card.color || 'wild'}`
  }));

  if (cardsWithIds.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 
                 p-4 rounded-xl backdrop-blur-sm border border-white/10
                 ${isCurrentTurn ? 'bg-white/10' : 'bg-black/30'}`}
    >
      <div className="flex items-center gap-2">
        {cardsWithIds.map((card) => (
          <motion.div
            key={card.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: cardsWithIds.indexOf(card) * 0.1 }}
            style={{
              marginLeft: cardsWithIds.indexOf(card) > 0 ? '-2rem' : 0,
              zIndex: cardsWithIds.indexOf(card),
            }}
          >
            <CardComponent
              card={card}
              isPlayable={isCurrentTurn}
              onClick={() => isCurrentTurn && onPlayCard(card)}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};