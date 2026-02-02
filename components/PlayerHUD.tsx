import React from 'react';
import { PlayerState } from '../types';
import { Shield, Zap, Heart } from 'lucide-react';

interface PlayerHUDProps {
  player: PlayerState;
  isActive: boolean;
  isRightSide?: boolean; // For mirroring layout
}

export const PlayerHUD: React.FC<PlayerHUDProps> = ({ player, isActive, isRightSide = false }) => {
  const hpPercent = (player.hp / player.maxHp) * 100;

  return (
    <div className={`flex flex-col ${isRightSide ? 'items-end text-right' : 'items-start text-left'} w-full max-w-sm transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
      
      {/* Name and Status */}
      <h2 className={`text-xl font-bold font-display tracking-wider mb-2 flex items-center gap-2 ${isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-slate-500'}`}>
        {isRightSide && player.shield > 0 && <Shield className="text-blue-400" size={20} />}
        {player.name}
        {!isRightSide && player.shield > 0 && <Shield className="text-blue-400" size={20} />}
        {player.shield > 0 && <span className="text-blue-400 font-mono text-sm">+{player.shield}</span>}
      </h2>

      {/* HP Bar */}
      <div className="w-full h-6 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative shadow-inner mb-2">
        <div 
            className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500 ease-out"
            style={{ width: `${Math.max(0, hpPercent)}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">
            <Heart size={12} className="mr-1 inline" /> {player.hp} / {player.maxHp}
        </div>
      </div>

      {/* Energy */}
      <div className={`flex items-center gap-1 ${isRightSide ? 'flex-row-reverse' : 'flex-row'}`}>
        <span className="text-xs text-cyan-300 uppercase tracking-widest font-semibold">Energy</span>
        <div className="flex gap-1">
          {Array.from({ length: player.maxEnergy }).map((_, i) => (
            <div 
                key={i}
                className={`
                    w-4 h-6 rounded-sm border transform skew-x-[-12deg] transition-all duration-300
                    ${i < player.energy 
                        ? 'bg-cyan-400 border-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.6)]' 
                        : 'bg-slate-800 border-slate-600'}
                `}
            />
          ))}
        </div>
      </div>
      
    </div>
  );
};