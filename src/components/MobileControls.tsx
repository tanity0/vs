import React from 'react';
import { useGameStore } from '../store/gameStore';

interface MobileControlsProps {
  showDirectionalButtons?: boolean;
}

const MobileControls: React.FC<MobileControlsProps> = ({ showDirectionalButtons = false }) => {
  const isPaused = useGameStore(state => state.isPaused);

  const setInputState = (direction: 'up' | 'down' | 'left' | 'right', active: boolean) => {
    useGameStore.setState(state => ({
      inputState: {
        ...state.inputState,
        [direction]: active
      }
    }));
  };

  const handleTouchStart = (direction: 'up' | 'down' | 'left' | 'right') => (e: React.TouchEvent) => {
    e.preventDefault(); // タッチイベント時のスクロールを防止
    setInputState(direction, true);
  };

  const handleTouchEnd = (direction: 'up' | 'down' | 'left' | 'right') => (e: React.TouchEvent) => {
    e.preventDefault();
    setInputState(direction, false);
  };

  const handlePauseButton = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    useGameStore.setState(state => ({ isPaused: !state.isPaused }));
  };

  return (
    <div className="fixed bottom-4 left-0 right-0 z-10 px-4">
      <div className="flex justify-between">
        {showDirectionalButtons && (
          <div className="touch-none">
            <div className="grid grid-cols-3 gap-1">
              <div className="col-start-1 col-end-2">
                <button
                  className="w-12 h-12 bg-gray-800 bg-opacity-70 rounded-full flex items-center justify-center"
                  onTouchStart={handleTouchStart('left')}
                  onTouchEnd={handleTouchEnd('left')}
                  onTouchCancel={handleTouchEnd('left')}
                  aria-label="左"
                >
                  <span className="text-white text-xl">←</span>
                </button>
              </div>
              <div className="col-start-2 col-end-3 flex flex-col gap-1">
                <button
                  className="w-12 h-12 bg-gray-800 bg-opacity-70 rounded-full flex items-center justify-center"
                  onTouchStart={handleTouchStart('up')}
                  onTouchEnd={handleTouchEnd('up')}
                  onTouchCancel={handleTouchEnd('up')}
                  aria-label="上"
                >
                  <span className="text-white text-xl">↑</span>
                </button>
                <button
                  className="w-12 h-12 bg-gray-800 bg-opacity-70 rounded-full flex items-center justify-center"
                  onTouchStart={handleTouchStart('down')}
                  onTouchEnd={handleTouchEnd('down')}
                  onTouchCancel={handleTouchEnd('down')}
                  aria-label="下"
                >
                  <span className="text-white text-xl">↓</span>
                </button>
              </div>
              <div className="col-start-3 col-end-4">
                <button
                  className="w-12 h-12 bg-gray-800 bg-opacity-70 rounded-full flex items-center justify-center"
                  onTouchStart={handleTouchStart('right')}
                  onTouchEnd={handleTouchEnd('right')}
                  onTouchCancel={handleTouchEnd('right')}
                  aria-label="右"
                >
                  <span className="text-white text-xl">→</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className={showDirectionalButtons ? "" : "ml-auto"}>
          <button
            className="w-12 h-12 bg-gray-800 bg-opacity-70 rounded-full flex items-center justify-center"
            onClick={handlePauseButton}
            aria-label="ポーズ"
          >
            <span className="text-white text-base">II</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileControls;