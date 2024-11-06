import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Create Supabase client with proper configuration
export const supabase = createClient(supabaseUrl, supabaseKey);

// Add helper functions for game operations
export const gameRooms = {
  async create(gameState: any) {
    try {
      console.log('Creating room with state:', gameState); // Debug log
      const { data, error } = await supabase
        .from('game_rooms')
        .insert([{
          room_id: gameState.room_id,
          game_state: gameState.game_state,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }
      console.log('Room created successfully:', data); // Debug log
      return data;
    } catch (error: any) {
      console.error('Failed to create room:', error);
      throw new Error(error.message || 'Failed to create room');
    }
  },

  async get(roomId: string) {
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }
      return data;
    } catch (error: any) {
      console.error('Failed to get room:', error);
      throw new Error(error.message || 'Failed to get room');
    }
  },

  async update(roomId: string, gameState: any) {
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .update({ game_state: gameState })
        .eq('room_id', roomId)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }
      return data;
    } catch (error: any) {
      console.error('Failed to update room:', error);
      throw new Error(error.message || 'Failed to update room');
    }
  },

  async delete(roomId: string) {
    try {
      const { error } = await supabase
        .from('game_rooms')
        .delete()
        .eq('room_id', roomId);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Failed to delete room:', error);
      throw new Error(error.message || 'Failed to delete room');
    }
  }
};

// Add realtime subscription helper
export const subscribeToRoom = (roomId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_rooms',
        filter: `room_id=eq.${roomId}`
      },
      callback
    )
    .subscribe();
}; 