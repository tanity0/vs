import React from 'react';
import { useGameStore } from '../store/gameStore';

const MobileControls: React.FC = () => {
  const isGuarding = useGameStore(state => state.player.isGuarding);

  const setGuardInput = (active: boolean) => {
    useGameStore.setState(state => ({
      inputState: { ...state.inputState, guard: active }
    }));
  };

  const handleGuardStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
    setGuardInput(true);
  };

  const handleGuardEnd = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setGuardInput(false);
  };

  const handlePauseButton = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    useGameStore.setState(state => ({ isPaused: !state.isPaused }));
  };

  return (
    <div
      className="absolute right-0 bottom-0 z-30 flex flex-col items-end gap-3 pr-safe pb-safe"
      style={{ paddingRight: 'max(env(safe-area-inset-right), 16px)', paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
    >
      <button
        type="button"
        className="w-10 h-10 rounded-full glass-panel text-white text-xs font-semibold flex items-center justify-center"
        onPointerDown={handlePauseButton}
        aria-label="ポーズ"
      >
        II
      </button>
      <button
        type="button"
        className={`relative w-24 h-24 rounded-full flex items-center justify-center text-white text-sm font-semibold tracking-wide select-none transition-transform active:scale-95 ${
          isGuarding ? 'shadow-[0_0_24px_rgba(56,189,248,0.55)]' : ''
        }`}
        style={{
          background: isGuarding
            ? 'radial-gradient(circle at 30% 25%, rgba(125, 211, 252, 0.95), rgba(14, 165, 233, 0.85) 65%, rgba(2, 132, 199, 0.95))'
            : 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.18), rgba(255,255,255,0.08) 60%, rgba(255,255,255,0.04))',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          backdropFilter: 'saturate(160%) blur(18px)',
          WebkitBackdropFilter: 'saturate(160%) blur(18px)',
          touchAction: 'none'
        }}
        onPointerDown={handleGuardStart}
        onPointerUp={handleGuardEnd}
        onPointerCancel={handleGuardEnd}
        onPointerLeave={handleGuardEnd}
        aria-label="ガード"
      >
        ガード
      </button>
    </div>
  );
};

export default MobileControls;
