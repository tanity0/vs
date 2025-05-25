import React from 'react';
import { useGameStore } from '../store/gameStore';

const UpgradeMenu: React.FC = () => {
  const player = useGameStore(state => state.player);
  const upgradeOptions = useGameStore(state => state.upgradeOptions);
  const selectUpgrade = useGameStore(state => state.selectUpgrade);
  
  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-80 z-20">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="px-4 pt-4 pb-2 bg-gradient-to-r from-purple-900 to-indigo-900">
          <h2 className="text-2xl font-bold text-center text-white mb-1">
            レベルアップ！
          </h2>
          <p className="text-center text-purple-200 text-sm">
            アップグレードを選択してください
          </p>
        </div>
        
        <div className="p-3">
          <div className="grid grid-cols-1 gap-2">
            {upgradeOptions.map(upgrade => (
              <div 
                key={upgrade.id}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer transform hover:scale-[1.02] transition-transform"
                onClick={() => selectUpgrade(upgrade)}
              >
                <div className="flex items-start">
                  <div className="mr-3">
                    <div className="w-8 h-8 rounded-full bg-purple-800 flex items-center justify-center">
                      {upgrade.type === 'weapon' ? (
                        <span className="text-base">⚔️</span>
                      ) : (
                        <span className="text-base">🔮</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-white mb-1">{upgrade.name}</h3>
                    <p className="text-gray-300 text-xs">{upgrade.description}</p>
                  </div>
                  
                  {upgrade.type === 'weapon' && upgrade.level > 1 && (
                    <div className="ml-2 flex items-center">
                      <div className="px-1.5 py-0.5 rounded bg-purple-700 text-white text-xs font-medium">
                        Lv{upgrade.level}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeMenu;