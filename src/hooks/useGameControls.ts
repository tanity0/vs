import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

const isGuardKey = (key: string) => {
  const k = key.toLowerCase();
  return k === ' ' || k === 'spacebar' || k === 'space' || k === 'shift' || k === 'j';
};

export const useGameControls = () => {
  // Set up keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { key } = e;
      const inputState = { ...useGameStore.getState().inputState };

      switch (key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          inputState.up = true;
          break;
        case 's':
        case 'arrowdown':
          inputState.down = true;
          break;
        case 'a':
        case 'arrowleft':
          inputState.left = true;
          break;
        case 'd':
        case 'arrowright':
          inputState.right = true;
          break;
      }

      if (isGuardKey(key)) {
        // Prevent the page from scrolling on Space and avoid auto-repeat noise
        e.preventDefault();
        if (!e.repeat) {
          inputState.guard = true;
        }
      }

      useGameStore.setState({ inputState });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const { key } = e;
      const inputState = { ...useGameStore.getState().inputState };

      switch (key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          inputState.up = false;
          break;
        case 's':
        case 'arrowdown':
          inputState.down = false;
          break;
        case 'a':
        case 'arrowleft':
          inputState.left = false;
          break;
        case 'd':
        case 'arrowright':
          inputState.right = false;
          break;
      }

      if (isGuardKey(key)) {
        inputState.guard = false;
      }

      useGameStore.setState({ inputState });
    };

    // Add event listeners for keyboard
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
};