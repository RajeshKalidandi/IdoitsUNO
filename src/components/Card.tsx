import React from 'react';
import { motion } from 'framer-motion';
import type { Card as CardType } from '../types/game';

interface CardProps {
  card: CardType;
  isPlayable?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ card, isPlayable = false, onClick }) => {
  if (!card || typeof card !== 'object' || !('type' in card)) {
    console.warn('Invalid card data:', card);
    return null;
  }

  const getCardColor = () => {
    if (!card.color) return 'from-gray-700 to-gray-800';
    
    switch (card.color) {
      case 'red': return 'from-red-500 to-red-600';
      case 'blue': return 'from-blue-500 to-blue-600';
      case 'green': return 'from-green-500 to-green-600';
      case 'yellow': return 'from-yellow-500 to-yellow-600';
      default: return 'from-gray-700 to-gray-800';
    }
  };

  const getCardContent = () => {
    if (!card.type) return '';
    if (card.type === 'number' && typeof card.value === 'number') {
      return card.value.toString();
    }
    return card.type.toUpperCase();
  };

  return (
    <motion.div
      whileHover={isPlayable ? { y: -10, scale: 1.1 } : {}}
      whileTap={isPlayable ? { scale: 0.95 } : {}}
      className={`w-24 h-36 rounded-xl cursor-${isPlayable ? 'pointer' : 'default'}
                 bg-gradient-to-br ${getCardColor()}
                 flex items-center justify-center
                 font-bold text-2xl text-white
                 shadow-lg transition-transform
                 ${isPlayable ? 'hover:shadow-xl' : ''}`}
      onClick={isPlayable ? onClick : undefined}
    >
      {getCardContent()}
    </motion.div>
  );
};