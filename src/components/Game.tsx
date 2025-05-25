import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import GameCanvas from './GameCanvas';
import GameHUD from './GameHUD';
import UpgradeMenu from './UpgradeMenu';
import PauseMenu from './PauseMenu';
import MobileControls from './MobileControls';
import FullscreenButton from './FullscreenButton';
import { useGameLoop } from '../hooks/useGameLoop';
import { useGameControls } from '../hooks/useGameControls';
import { useSwipeControls } from '../hooks/useSwipeControls';

interface GameProps {
  onGameOver: () => void;
}

const Game: React.FC<GameProps> = ({ onGameOver }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const isPaused = useGameStore(state => state.isPaused);
  const showUpgradeMenu = useGameStore(state => state.showUpgradeMenu);
  const player = useGameStore(state => state.player);
  const setGameBounds = useGameStore(state => state.setGameBounds);
  const setPaused = useGameStore(state => state.setPaused);
  
  // Set up game controls
  useGameControls();
  
  // Set up swipe controls for mobile
  useSwipeControls();
  
  // Start game loop
  const { fps } = useGameLoop(onGameOver);
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Update window size and game bounds on resize or fullscreen change
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setWindowSize({ width, height });
        setGameBounds({ width, height });
      } else {
        const width = window.innerWidth;
        const height = window.innerHeight;
        setWindowSize({ width, height });
        setGameBounds({ width, height });
      }
    };
    
    updateSize();
    
    window.addEventListener('resize', updateSize);
    document.addEventListener('fullscreenchange', updateSize);
    
    return () => {
      window.removeEventListener('resize', updateSize);
      document.removeEventListener('fullscreenchange', updateSize);
    };
  }, [setGameBounds]);
  
  // Check if player is dead
  useEffect(() => {
    if (player.health <= 0) {
      onGameOver();
    }
  }, [player.health, onGameOver]);
  
  // Handle keyboard pause toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p') {
        if (!showUpgradeMenu) {
          setPaused(!isPaused);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, setPaused, showUpgradeMenu]);
  
  // Prevent default touch events
  useEffect(() => {
    const preventDefaultTouch = (e: TouchEvent) => {
      e.preventDefault();
    };
    
    if (containerRef.current) {
      containerRef.current.addEventListener('touchmove', preventDefaultTouch, { passive: false });
      containerRef.current.addEventListener('touchstart', preventDefaultTouch, { passive: false });
    }
    
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('touchmove', preventDefaultTouch);
        containerRef.current.removeEventListener('touchstart', preventDefaultTouch);
      }
    };
  }, []);
  
  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full bg-gray-900"
      style={{ 
        touchAction: 'none',
        overflow: 'hidden'
      }}
    >
      <GameCanvas width={windowSize.width} height={windowSize.height} />
      <GameHUD fps={fps} />
      <FullscreenButton target={containerRef} />
      
      {/* Mobile controls for pause button only, swipes handle movement */}
      {isMobile && <MobileControls showDirectionalButtons={false} />}
      
      {isPaused && !showUpgradeMenu && (
        <PauseMenu onResume={() => setPaused(false)} onQuit={onGameOver} />
      )}
      
      {showUpgradeMenu && (
        <UpgradeMenu />
      )}
    </div>
  );
};

export default Game;