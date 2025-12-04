import React, { useState } from 'react';
import { CharacterType, Language } from '../types';

interface HUDProps {
  score: number;
  rings: number;
  bossMessage: string;
  unlockedCharacters: CharacterType[];
  selectedCharacter: CharacterType;
  onSelectCharacter: (char: CharacterType) => void;
  language: Language;
}

const charColors: Record<CharacterType, string> = {
  sonic: 'bg-blue-500',
  tails: 'bg-orange-500',
  knuckles: 'bg-red-600',
  shadow: 'bg-gray-800',
  silver: 'bg-cyan-300',
  supersonic: 'bg-yellow-400'
};

const charNames: Record<CharacterType, string> = {
    sonic: 'SONIC',
    tails: 'TAILS',
    knuckles: 'NUKER',
    shadow: 'SHADOW',
    silver: 'SILVER',
    supersonic: 'SUPER'
};

export const HUD: React.FC<HUDProps> = ({ 
  score, 
  rings, 
  bossMessage, 
  unlockedCharacters, 
  selectedCharacter, 
  onSelectCharacter,
  language
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none select-none">
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <span className="text-yellow-400 font-bold text-shadow-sm font-['Press_Start_2P'] text-sm">SCORE</span>
                <span className="text-white font-['Press_Start_2P'] text-sm">{score}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-yellow-400 font-bold text-shadow-sm font-['Press_Start_2P'] text-sm">RINGS</span>
                <span className="text-white font-['Press_Start_2P'] text-sm">{rings}</span>
            </div>
        </div>

        {/* Character Selector Button */}
        <div className="pointer-events-auto mt-2">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="bg-blue-900/80 border-2 border-yellow-400 text-yellow-400 px-2 py-1 rounded text-[10px] hover:bg-blue-800 transition-colors font-bold shadow-md"
            >
                {language === 'pt' ? 'SELECIONE PERSONAGEM' : 'SELECT CHARACTER'}
            </button>

            {isOpen && (
                <div className="mt-2 flex flex-col gap-1 bg-black/60 p-2 rounded border border-gray-600">
                    {unlockedCharacters.map(char => (
                        <button
                            key={char}
                            onClick={() => {
                                onSelectCharacter(char);
                                setIsOpen(false);
                            }}
                            className={`flex items-center gap-2 px-2 py-1 rounded hover:opacity-80 transition-all ${selectedCharacter === char ? 'ring-2 ring-white' : ''} ${charColors[char]}`}
                        >
                            <div className={`w-2 h-2 rounded-full bg-white`}></div>
                            <span className={`text-[8px] font-bold ${char === 'silver' || char === 'supersonic' || char === 'tails' ? 'text-black' : 'text-white'}`}>
                                {charNames[char]}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>
      
      {bossMessage && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-full max-w-lg z-10 pointer-events-none">
             <div className="bg-red-900/80 border-2 border-red-500 text-white p-3 rounded text-center animate-pulse">
                <span className="text-xs text-red-300 block mb-1">DR. ROBO TRANSMISSION:</span>
                "{bossMessage}"
             </div>
        </div>
      )}
    </>
  );
};