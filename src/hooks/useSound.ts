import { useCallback } from 'react';

export function useSound() {
  const playSound = useCallback((type: 'play' | 'draw' | 'win' | 'error') => {
    const audio = new Audio();
    
    switch (type) {
      case 'play':
        audio.src = 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3';
        break;
      case 'draw':
        audio.src = 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3';
        break;
      case 'win':
        audio.src = 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3';
        break;
      case 'error':
        audio.src = 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3';
        break;
    }

    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignore autoplay errors
    });
  }, []);

  return { playSound };
}