import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    this.socket = io('http://localhost:3001', {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server');
      toast.success('Connected to game server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      toast.error('Failed to connect to game server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      toast.error('Disconnected from game server');
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        this.socket?.connect();
      }
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      this.reconnectAttempts = attemptNumber;
      toast.loading(`Reconnecting... Attempt ${attemptNumber}/${this.maxReconnectAttempts}`);
    });

    this.socket.on('reconnect_failed', () => {
      toast.error('Failed to reconnect. Please refresh the page.');
    });
  }

  joinRoom(roomId: string, playerName: string) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to server'));
        return;
      }

      this.socket.emit('join-room', { roomId, playerName }, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  syncGameState(gameState: any) {
    if (!this.socket?.connected) {
      toast.error('Cannot sync game state: Not connected');
      return;
    }

    this.socket.emit('sync-game', gameState);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export const socketService = new SocketService();