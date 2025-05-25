import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { renderGame } from '../utils/renderUtils';

interface GameCanvasProps {
  width: number;
  height: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const player = useGameStore(state => state.player);
  const enemies = useGameStore(state => state.enemies);
  const projectiles = useGameStore(state => state.projectiles);
  const pickups = useGameStore(state => state.pickups);
  const isPaused = useGameStore(state => state.isPaused);
  const camera = useGameStore(state => state.camera);
  
  // Prevent default touch events on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const preventDefaultTouch = (e: TouchEvent) => {
      e.preventDefault();
    };
    
    canvas.addEventListener('touchmove', preventDefaultTouch, { passive: false });
    canvas.addEventListener('touchstart', preventDefaultTouch, { passive: false });
    
    return () => {
      canvas.removeEventListener('touchmove', preventDefaultTouch);
      canvas.removeEventListener('touchstart', preventDefaultTouch);
    };
  }, []);
  
  // Draw game on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Clear the canvas
    context.clearRect(0, 0, width, height);
    
    // Draw a background color to verify the canvas is visible
    context.fillStyle = '#111827';
    context.fillRect(0, 0, width, height);
    
    // Render the game
    renderGame(context, {
      player,
      enemies,
      projectiles,
      pickups,
      width,
      height,
      camera
    });
    
    // Debug - draw player position info
    context.fillStyle = 'rgba(255, 255, 255, 0.7)';
    context.font = '12px Arial';
    context.fillText(`Player: ${Math.floor(player.x)},${Math.floor(player.y)}`, 10, height - 20);
    context.fillText(`Camera: ${Math.floor(camera.x)},${Math.floor(camera.y)}`, 10, height - 5);
    
  }, [player, enemies, projectiles, pickups, width, height, isPaused, camera]);
  
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute top-0 left-0"
      style={{ touchAction: 'none' }}
    />
  );
};

export default GameCanvas;