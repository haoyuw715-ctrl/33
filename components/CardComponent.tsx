import React from 'react';
import { Card } from '../types';
import { Shield, Zap, Sword, Heart, AlertCircle } from 'lucide-react';

interface CardProps {
  card: Card;
  onClick?: (card: Card) => void;
  disabled?: boolean;
  playable?: boolean;
}

export const CardComponent: React.FC<CardProps> = ({ card, onClick, disabled, playable }) => {
  const getTypeColor = (type: Card['type']) => {
    switch (type) {
      case 'ATTACK': return 'border-red-500 bg-red-900/20 text-red-200';
      case 'DEFEND': return 'border-blue-500 bg-blue-900/20 text-blue-200';
      case 'HEAL': return 'border-green-500 bg-green-900/20 text-green-200';
      case 'SPECIAL': return 'border-purple-500 bg-purple-900/20 text-purple-200';
      default: return 'border-slate-500';
    }
  };

  const getIcon = (type: Card['type']) => {
    switch (type) {
      case 'ATTACK': return <Sword size={16} />;
      case 'DEFEND': return <Shield size={16} />;
      case 'HEAL': return <Heart size={16} />;
      default: return <Zap size={16} />;
    }
  };

  return (
    <div
      onClick={() => !disabled && onClick && onClick(card)}
      className={`
        relative w-32 h-48 rounded-xl border-2 p-3 flex flex-col justify-between transition-all duration-200
        ${getTypeColor(card.type)}
        ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer card-hover hover:z-10'}
        ${playable ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-900' : ''}
        glass-panel
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <span className="font-bold text-xs leading-tight">{card.name}</span>
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500 text-slate-900 font-bold text-xs shadow-lg shadow-cyan-500/50">
          {card.cost}
        </div>
      </div>

      {/* Image Placeholder/Icon */}
      <div className="flex-grow flex items-center justify-center my-2 opacity-80">
         <div className={`p-3 rounded-full border ${getTypeColor(card.type).split(' ')[0]}`}>
            {getIcon(card.type)}
         </div>
      </div>

      {/* Description */}
      <div className="text-[10px] text-center opacity-90 font-medium font-sans">
        {card.description}
      </div>

      {/* Value Badge */}
      <div className="absolute -bottom-3 -right-3">
         {card.value > 0 && (
             <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 border border-slate-600 shadow-xl text-white font-bold text-sm">
                 {card.value}
             </div>
         )}
      </div>
    </div>
  );
};