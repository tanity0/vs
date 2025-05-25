import React from 'react';
import { useGameStore } from '../store/gameStore';
import { formatTime } from '../utils/renderUtils';

interface GameHUDProps {
  fps: number;
}

const GameHUD: React.FC<GameHUDProps> = ({ fps }) => {
  const player = useGameStore(state => state.player);
  const gameTime = useGameStore(state => state.gameTime);
  const gameStats = useGameStore(state => state.gameStats);
  const enemies = useGameStore(state => state.enemies);
  
  // Format time
  const formattedTime = formatTime(gameTime / 1000);
  
  // Calculate experience percentage
  const expPercentage = (player.experience / player.experienceToNextLevel) * 100;
  
  // Get health percentage
  const healthPercentage = (player.health / player.maxHealth) * 100;
  
  return (
    <div className="absolute top-0 left-0 w-full pointer-events-none">
      {/* Top Bar */}
      <div className="p-2 flex justify-between items-center">
        {/* Player Info */}
        <div className="flex items-center">
          <div className="bg-gray-800 bg-opacity-80 p-1 rounded-lg">
            <div className="text-white text-sm font-medium">レベル {player.level}</div>
          </div>
        </div>
        
        {/* Timer */}
        <div className="bg-gray-800 bg-opacity-80 p-1 rounded-lg">
          <div className="text-white text-sm font-medium">{formattedTime}</div>
        </div>
        
        {/* Enemy Count */}
        <div className="bg-gray-800 bg-opacity-80 p-1 rounded-lg">
          <div className="text-white text-sm font-medium">敵: {enemies.length}</div>
        </div>
      </div>
      
      {/* Health Bar */}
      <div className="px-2 mb-1">
        <div className="h-3 bg-gray-800 bg-opacity-70 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300"
            style={{ width: `${healthPercentage}%` }}
          ></div>
        </div>
        <div className="text-white text-xs font-medium text-center">
          {Math.floor(player.health)} / {player.maxHealth}
        </div>
      </div>
      
      {/* Experience Bar */}
      <div className="px-2">
        <div className="h-2 bg-gray-800 bg-opacity-70 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300"
            style={{ width: `${expPercentage}%` }}
          ></div>
        </div>
      </div>
      
      {/* Weapons Display */}
      <div className="absolute bottom-2 left-2">
        <div className="bg-gray-800 bg-opacity-80 p-1 rounded-lg">
          <div className="flex space-x-1">
            {player.weapons.map(weapon => (
              <div 
                key={weapon.id} 
                className="w-6 h-6 flex items-center justify-center bg-gray-700 rounded"
                title={`${weapon.name} (レベル ${weapon.level})`}
              >
                <span className="text-xs font-bold text-white">{weapon.level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Stats Display */}
      <div className="absolute bottom-2 right-2">
        <div className="bg-gray-800 bg-opacity-80 p-1 rounded-lg">
          <div className="text-white text-xs">
            <div>撃破数: {gameStats.enemiesKilled}</div>
            <div>ダメージ: {Math.floor(gameStats.damageDealt)}</div>
          </div>
        </div>
      </div>
      
      {/* FPS Counter (for development) */}
      <div className="absolute top-2 right-2 text-xs text-gray-400">
        {fps} FPS
      </div>
    </div>
  );
};

export default GameHUD;