import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

interface TouchPosition {
  x: number;
  y: number;
}

export const useSwipeControls = () => {
  // Min distance to trigger swipe (pixels)
  const MIN_SWIPE_DISTANCE = 10;
  
  useEffect(() => {
    let startPos: TouchPosition | null = null;
    let isMoving = false;
    
    // Handle touch start
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        startPos = {
          x: touch.clientX,
          y: touch.clientY
        };
      }
    };
    
    // Handle touch move
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      
      if (!startPos || e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      const currentPos = {
        x: touch.clientX,
        y: touch.clientY
      };
      
      const deltaX = currentPos.x - startPos.x;
      const deltaY = currentPos.y - startPos.y;
      
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Check if swipe distance is enough
      if (distance > MIN_SWIPE_DISTANCE) {
        // Normalize direction vector
        const dirX = deltaX / distance;
        const dirY = deltaY / distance;
        
        // Set swipe direction in game store and keep track of last direction
        useGameStore.getState().setSwipeDirection({ x: dirX, y: dirY });
        useGameStore.getState().setLastDirection({ x: dirX, y: dirY });
        isMoving = true;
      }
    };
    
    // Handle touch end
    const handleTouchEnd = () => {
      if (isMoving) {
        // Stop player movement but preserve last direction for attacks
        useGameStore.getState().setSwipeDirection(null);
        // Last direction is already set in handleTouchMove, so we don't need to reset it here
        isMoving = false;
      }
      
      startPos = null;
    };
    
    // Add event listeners
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
    
    // Cleanup
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);
};