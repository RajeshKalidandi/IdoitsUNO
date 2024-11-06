import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createGameRoom, joinGameRoom, leaveGameRoom, handlePlayCard, handleDrawCard } from './gameController.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('createRoom', ({ playerName }, callback) => {
    const { roomId, playerId } = createGameRoom(io, socket.id, playerName);
    socket.join(roomId);
    callback({ roomId, playerId });
  });

  socket.on('joinRoom', ({ roomId, playerName }, callback) => {
    const result = joinGameRoom(io, socket.id, roomId, playerName);
    if (result.success) {
      socket.join(roomId);
      callback({ playerId: result.playerId });
    }
  });

  socket.on('playCard', ({ roomId, playerId, card }) => {
    handlePlayCard(io, roomId, playerId, card);
  });

  socket.on('drawCard', ({ roomId, playerId }) => {
    handleDrawCard(io, roomId, playerId);
  });

  socket.on('leaveRoom', ({ roomId, playerId }) => {
    leaveGameRoom(io, roomId, playerId);
    socket.leave(roomId);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});