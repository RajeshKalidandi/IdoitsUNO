import React from 'react';
import { motion } from 'framer-motion';
import type { CardColor } from '../types/game';

interface ColorPickerProps {
  onColorSelect: (color: CardColor) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ onColorSelect }) => {
  const colors: CardColor[] = ['red', 'blue', 'green', 'yellow'];
  
  return (
    <motion.div 
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
        bg-white/20 backdrop-blur-md p-6 rounded-xl shadow-xl border border-white/30"
    >
      <h3 className="text-white text-center mb-4 font-bold">Choose a Color</h3>
      <div className="grid grid-cols-2 gap-4">
        {colors.map((color) => (
          <motion.button
            key={color}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onColorSelect(color)}
            className={`w-20 h-20 rounded-lg shadow-lg cursor-pointer
              ${color === 'red' ? 'bg-red-500' : ''}
              ${color === 'blue' ? 'bg-blue-500' : ''}
              ${color === 'green' ? 'bg-green-500' : ''}
              ${color === 'yellow' ? 'bg-yellow-400' : ''}
            `}
          />
        ))}
      </div>
    </motion.div>
  );
};