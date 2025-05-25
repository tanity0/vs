import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

interface PauseMenuProps {
  onResume: () => void;
  onQuit: () => void;
}

const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onQuit }) => {
  // Ensure pause menu handles events correctly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p') {
        onResume();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onResume]);

  // Stop any existing touch events from propagating to the game
  const preventTouchEvent = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-80 z-20"
      onTouchStart={preventTouchEvent}
      onTouchMove={preventTouchEvent}
      onTouchEnd={preventTouchEvent}
    >
      <div className="max-w-xs w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="px-4 pt-4 pb-2 bg-gradient-to-r from-purple-900 to-indigo-900">
          <h2 className="text-2xl font-bold text-center text-white mb-1">
            ゲーム一時停止
          </h2>
        </div>
        
        <div className="p-4 flex flex-col items-center">
          <button
            onClick={onResume}
            className="w-full py-2 mb-3 text-base font-medium rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg transform transition-all duration-300 hover:scale-105"
          >
            ゲーム再開
          </button>
          
          <button
            onClick={onQuit}
            className="w-full py-2 text-base font-medium rounded-lg bg-gray-700 hover:bg-gray-600 text-white shadow-lg transform transition-all duration-300 hover:scale-105"
          >
            メニューに戻る
          </button>
          
          <p className="mt-3 text-gray-400 text-xs text-center">
            ESCまたはPキーでゲームを再開
          </p>
        </div>
      </div>
    </div>
  );
};

export default PauseMenu;