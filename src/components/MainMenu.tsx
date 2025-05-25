import React, { useState } from 'react';
import { Skull, Wand2, Swords } from 'lucide-react';

interface MainMenuProps {
  onStartGame: (characterClass: string) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  const [selectedClass, setSelectedClass] = useState('warrior');
  
  const characterClasses = [
    {
      id: 'warrior',
      name: 'ウォーリア',
      description: 'バランスの取れた剣士で、強力な剣撃を放ちます。',
      icon: <Swords className="w-8 h-8 text-red-500" />,
      stats: {
        health: 'High',
        speed: 'Medium',
        damage: 'Medium'
      }
    },
    {
      id: 'mage',
      name: 'メイジ',
      description: '魔法を使って遠距離から敵を攻撃します。',
      icon: <Wand2 className="w-8 h-8 text-purple-500" />,
      stats: {
        health: 'Low',
        speed: 'Medium',
        damage: 'High'
      }
    },
    {
      id: 'rogue',
      name: 'ローグ',
      description: '素早く俊敏で、攻撃速度が速いです。',
      icon: <Swords className="w-8 h-8 text-green-500" />,
      stats: {
        health: 'Low',
        speed: 'High',
        damage: 'Medium'
      }
    },
    {
      id: 'necromancer',
      name: 'ネクロマンサー',
      description: '闇の力を操り、近くの敵にダメージを与えます。',
      icon: <Skull className="w-8 h-8 text-indigo-500" />,
      stats: {
        health: 'Medium',
        speed: 'Low',
        damage: 'High'
      }
    }
  ];
  
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-gray-900 p-2 overflow-auto">
      <div className="max-w-3xl w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="px-4 pt-4 pb-2 bg-gradient-to-r from-purple-900 to-indigo-900">
          <h1 className="text-3xl font-bold text-center text-white mb-1">
            ダークサバイバーズ
          </h1>
          <p className="text-center text-purple-200 text-sm">
            終わりなき闇の大群から生き残れ
          </p>
        </div>
        
        <div className="p-3">
          <h2 className="text-xl font-semibold text-white mb-3">キャラクターを選択</h2>
          
          <div className="grid grid-cols-2 gap-2 mb-4">
            {characterClasses.map((charClass) => (
              <div
                key={charClass.id}
                className={`relative p-2 rounded-lg transition-all duration-300 cursor-pointer ${
                  selectedClass === charClass.id
                    ? 'bg-purple-800 ring-2 ring-purple-500 shadow-lg transform scale-105'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                onClick={() => setSelectedClass(charClass.id)}
              >
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0">
                    {charClass.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-white">{charClass.name}</h3>
                    <p className="mt-1 text-xs text-gray-300">{charClass.description}</p>
                    
                    <div className="mt-2 grid grid-cols-3 w-full text-center text-xs text-gray-300">
                      <div>
                        <div className="font-semibold mb-1 text-[10px]">体力</div>
                        <div className={`text-[10px] ${
                          charClass.stats.health === 'High' ? 'text-green-400' : 
                          charClass.stats.health === 'Medium' ? 'text-yellow-400' : 
                          'text-red-400'
                        }`}>
                          {charClass.stats.health === 'High' ? '高い' : 
                           charClass.stats.health === 'Medium' ? '普通' : 
                           '低い'}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold mb-1 text-[10px]">速度</div>
                        <div className={`text-[10px] ${
                          charClass.stats.speed === 'High' ? 'text-green-400' : 
                          charClass.stats.speed === 'Medium' ? 'text-yellow-400' : 
                          'text-red-400'
                        }`}>
                          {charClass.stats.speed === 'High' ? '高い' : 
                           charClass.stats.speed === 'Medium' ? '普通' : 
                           '低い'}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold mb-1 text-[10px]">攻撃力</div>
                        <div className={`text-[10px] ${
                          charClass.stats.damage === 'High' ? 'text-green-400' : 
                          charClass.stats.damage === 'Medium' ? 'text-yellow-400' : 
                          'text-red-400'
                        }`}>
                          {charClass.stats.damage === 'High' ? '高い' : 
                           charClass.stats.damage === 'Medium' ? '普通' : 
                           '低い'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedClass === charClass.id && (
                  <div className="absolute top-1 right-1">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex flex-col items-center">
            <button
              onClick={() => onStartGame(selectedClass)}
              className="px-6 py-2 text-base font-medium rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg transform transition-all duration-300 hover:scale-105"
            >
              ゲームスタート
            </button>
            
            <div className="mt-3 text-gray-400 text-xs">
              <p className="text-center">
                WASDキーまたは矢印キーで移動。できるだけ長く生き残りましょう！
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;