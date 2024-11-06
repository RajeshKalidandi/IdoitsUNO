import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameNotificationProps {
  message: string;
  isVisible: boolean;
}

export const GameNotification: React.FC<GameNotificationProps> = ({ message, isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-32 left-1/2 transform -translate-x-1/2 
            bg-black/70 text-white px-6 py-3 rounded-full shadow-lg
            backdrop-blur-sm border border-white/20"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};