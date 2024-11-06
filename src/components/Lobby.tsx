import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Skull } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import toast from 'react-hot-toast';

export const Lobby: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const { createRoom, joinRoom } = useGameStore();

  const handlePlayGame = async () => {
    if (!playerName.trim()) {
      toast.error('Please enter your name!');
      return;
    }

    try {
      if (roomName.trim()) {
        // Join existing room
        await joinRoom(roomName.trim(), playerName.trim());
      } else {
        // Create new room
        await createRoom(playerName.trim());
      }
    } catch (error) {
      toast.error('Failed to join/create room. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700"
    >
      <div className="bg-[#1e293b]/90 p-8 rounded-xl backdrop-blur-md w-[480px] shadow-2xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Skull className="w-6 h-6 text-orange-400" />
          <h1 className="text-2xl font-bold text-orange-400">
            IdiotsUNO
          </h1>
          <Skull className="w-6 h-6 text-orange-400" />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Let's play UNO with friends</h2>
            <p className="text-white/70 text-sm">
              To get started, enter your player name and a game room.
              Other players can join your game with the same room name.
            </p>
          </div>

          <div className="space-y-4">
            {/* Player Name Input */}
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white 
                        placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />

            {/* Room Name Input */}
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value.toUpperCase())}
              placeholder="Room name (ex: fun-1)"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white 
                        placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />

            <p className="text-white/50 text-sm text-center">
              Other players can join using the same room name on their device.
            </p>

            {/* Play Button */}
            <button
              onClick={handlePlayGame}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-400 to-pink-500 
                       text-white font-semibold hover:from-orange-500 hover:to-pink-600 
                       transition-all duration-200"
            >
              Play UNO
            </button>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-white/60 text-center text-sm mt-6 italic">
          "Because Smart People Are Too Busy Playing Chess!"
        </p>
      </div>
    </motion.div>
  );
};