import React from 'react';
import { GameStats } from '../types/game';
import { formatTime } from '../utils/renderUtils';

interface GameOverScreenProps {
  stats: GameStats;
  onReturnToMenu: () => void;
  onPlayAgain: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  stats,
  onReturnToMenu,
  onPlayAgain
}) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-900 bg-opacity-90">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="px-4 pt-4 pb-2 bg-gradient-to-r from-red-900 to-purple-900">
          <h2 className="text-2xl font-bold text-center text-white mb-1">
            ゲームオーバー
          </h2>
          <p className="text-center text-red-200 text-sm">
            闇があなたを飲み込みました
          </p>
        </div>
        
        <div className="p-4">
          <h3 className="text-xl font-semibold text-white mb-4 text-center">プレイ統計</h3>
          
          <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-6">
            <div className="text-center">
              <div className="text-gray-400 text-xs mb-1">生存時間</div>
              <div className="text-lg text-white font-semibold">{formatTime(stats.timeAlive)}</div>
            </div>
            
            <div className="text-center">
              <div className="text-gray-400 text-xs mb-1">撃破した敵</div>
              <div className="text-lg text-white font-semibold">{stats.enemiesKilled}</div>
            </div>
            
            <div className="text-center">
              <div className="text-gray-400 text-xs mb-1">与えたダメージ</div>
              <div className="text-lg text-white font-semibold">{Math.floor(stats.damageDealt)}</div>
            </div>
            
            <div className="text-center">
              <div className="text-gray-400 text-xs mb-1">最高レベル</div>
              <div className="text-lg text-white font-semibold">{stats.maxLevel}</div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onPlayAgain}
              className="w-full sm:w-auto px-4 py-2 text-base font-medium rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg transform transition-all duration-300 hover:scale-105"
            >
              もう一度プレイ
            </button>
            
            <button
              onClick={onReturnToMenu}
              className="w-full sm:w-auto px-4 py-2 text-base font-medium rounded-lg bg-gray-700 hover:bg-gray-600 text-white shadow-lg transform transition-all duration-300 hover:scale-105"
            >
              メニューに戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameOverScreen;