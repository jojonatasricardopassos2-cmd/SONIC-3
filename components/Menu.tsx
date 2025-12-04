
import React, { useState } from 'react';
import { GameState, GameSettings, CharacterType } from '../types';

interface MenuProps {
  onStart: () => void;
  gameState: GameState;
  score: number;
  message: string;
  settings: GameSettings;
  updateSettings: (s: Partial<GameSettings>) => void;
  currentLevel: number;
  superUnlocked: boolean;
  unlockedCharacters: CharacterType[];
  selectedCharacter: CharacterType;
  setSelectedCharacter: (c: CharacterType) => void;
}

const translations = {
  en: {
    title: "BLUE BLUR RUSH",
    subtitle: "Gotta go fast!",
    start: "START GAME",
    nextLevel: "NEXT LEVEL",
    controls: "WASD/ARROWS to Move. DOUBLE TAP for Abilities!",
    settings: "SETTINGS",
    gameOver: "GAME OVER",
    tryAgain: "TRY AGAIN",
    victory: "ZONE CLEAR!",
    gameComplete: "GAME COMPLETE!",
    defeated: "You defeated the Boss!",
    defeatedFinal: "You saved the world!",
    playAgain: "PLAY AGAIN",
    settingsTitle: "SETTINGS",
    language: "Language",
    mobileControls: "Mobile Controls",
    close: "CLOSE",
    on: "ON",
    off: "OFF",
    superMsg: "Super Mode Unlocked! Jump Twice with 50 Rings!",
    selectChar: "SELECT PERSONA"
  },
  pt: {
    title: "BLUE BLUR RUSH",
    subtitle: "Temos que correr!",
    start: "INICIAR JOGO",
    nextLevel: "PRÓXIMA FASE",
    controls: "WASD/SETAS Move. TOQUE DUPLO: Habilidades!",
    settings: "CONFIGURAÇÕES",
    gameOver: "FIM DE JOGO",
    tryAgain: "TENTAR NOVAMENTE",
    victory: "ZONA CONCLUÍDA!",
    gameComplete: "JOGO ZERADO!",
    defeated: "Você derrotou o Chefão!",
    defeatedFinal: "Você salvou o mundo!",
    playAgain: "JOGAR NOVAMENTE",
    settingsTitle: "CONFIGURAÇÕES",
    language: "Idioma",
    mobileControls: "Controles Celular",
    close: "FECHAR",
    on: "LIGADO",
    off: "DESLIGADO",
    superMsg: "Modo Super Liberado! Pule Duas Vezes com 50 Anéis!",
    selectChar: "SELECIONAR PERSONA"
  }
};

export const Menu: React.FC<MenuProps> = ({ 
  onStart, gameState, score, message, settings, updateSettings, 
  currentLevel, superUnlocked, unlockedCharacters, selectedCharacter, setSelectedCharacter 
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const t = translations[settings.language];

  const characters = [
      { id: 'sonic', name: 'SONIC', color: 'bg-blue-500', text: 'white' },
      { id: 'tails', name: 'TAILS', color: 'bg-orange-500', text: 'white' },
      { id: 'knuckles', name: 'NUKER', color: 'bg-red-600', text: 'white' },
      { id: 'shadow', name: 'SHADOW', color: 'bg-gray-800', text: 'white' },
      { id: 'silver', name: 'SILVER', color: 'bg-cyan-300', text: 'black' },
      { id: 'supersonic', name: 'SUPER', color: 'bg-yellow-400', text: 'black' },
  ];

  if (showSettings) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-30">
        <div className="bg-gray-800 border-4 border-yellow-400 p-8 rounded-lg max-w-sm w-full text-center">
            <h2 className="text-2xl text-yellow-400 mb-6 font-bold">{t.settingsTitle}</h2>
            
            <div className="flex justify-between items-center mb-4 text-white">
                <span>{t.language}</span>
                <button 
                  onClick={() => updateSettings({ language: settings.language === 'en' ? 'pt' : 'en' })}
                  className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-500 w-24"
                >
                    {settings.language === 'en' ? 'English' : 'Português'}
                </button>
            </div>

            <div className="flex justify-between items-center mb-8 text-white">
                <span>{t.mobileControls}</span>
                <button 
                  onClick={() => updateSettings({ mobileMode: !settings.mobileMode })}
                  className={`px-3 py-1 rounded w-24 ${settings.mobileMode ? 'bg-green-600' : 'bg-red-600'}`}
                >
                    {settings.mobileMode ? t.on : t.off}
                </button>
            </div>

            <button 
              onClick={() => setShowSettings(false)}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded"
            >
              {t.close}
            </button>
        </div>
      </div>
    );
  }

  if (gameState === GameState.PLAYING || gameState === GameState.BOSS_FIGHT) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
      <div className="bg-blue-900 border-4 border-yellow-400 p-8 rounded-lg max-w-md w-full text-center shadow-[0_0_20px_rgba(234,179,8,0.5)]">
        {gameState === GameState.MENU && (
          <>
            <h1 className="text-4xl text-yellow-400 mb-2 font-bold tracking-widest drop-shadow-md">{t.title}</h1>
            <p className="text-blue-200 mb-6 text-sm">{t.subtitle}</p>

            {/* Character Select */}
            <div className="mb-6">
                <h3 className="text-white text-xs mb-2">{t.selectChar}</h3>
                <div className="flex justify-center gap-2 flex-wrap">
                    {characters.map((char) => {
                        const isUnlocked = unlockedCharacters.includes(char.id as CharacterType);
                        const isSelected = selectedCharacter === char.id;
                        return (
                            <button
                                key={char.id}
                                disabled={!isUnlocked}
                                onClick={() => setSelectedCharacter(char.id as CharacterType)}
                                className={`w-12 h-12 rounded-full border-2 transition-all relative ${
                                    isSelected ? 'border-white scale-110 shadow-[0_0_10px_white]' : 'border-gray-500'
                                } ${isUnlocked ? char.color : 'bg-gray-700'}`}
                                title={isUnlocked ? char.name : 'LOCKED'}
                            >
                                {!isUnlocked && <span className="absolute inset-0 flex items-center justify-center text-gray-500 text-xl font-bold">?</span>}
                            </button>
                        );
                    })}
                </div>
                <div className="text-white text-xs mt-2 font-mono h-4 font-bold text-yellow-300">
                    {characters.find(c => c.id === selectedCharacter)?.name}
                </div>
            </div>

            <div className="space-y-4">
              <div className="text-white text-xs mb-4">
                {t.controls}
              </div>
              <button 
                onClick={onStart}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-6 rounded transition-transform hover:scale-105 active:scale-95"
              >
                {t.start}
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded text-xs"
              >
                {t.settings}
              </button>
            </div>
          </>
        )}

        {gameState === GameState.GAME_OVER && (
          <>
            <h1 className="text-4xl text-red-500 mb-4 font-bold">{t.gameOver}</h1>
            <p className="text-white mb-6">Score: {score}</p>
            <button 
              onClick={onStart}
              className="bg-white hover:bg-gray-200 text-black font-bold py-3 px-6 rounded"
            >
              {t.tryAgain}
            </button>
          </>
        )}

        {gameState === GameState.VICTORY && (
          <>
            <h1 className="text-4xl text-green-400 mb-4 font-bold">{currentLevel >= 4 ? t.gameComplete : t.victory}</h1>
            <p className="text-white mb-2">{currentLevel >= 4 ? t.defeatedFinal : t.defeated}</p>
            <p className="text-yellow-400 text-xl mb-6">Final Score: {score}</p>
             <p className="text-gray-400 text-xs italic mb-4">"{(message || "Drat! Foiled again!")}" - Dr. Robo</p>
             
             {/* Unlock Messages */}
             {currentLevel === 1 && <p className="text-orange-500 font-bold mb-4 animate-pulse">UNLOCKED: TAILS!</p>}
             {currentLevel === 2 && <p className="text-red-500 font-bold mb-4 animate-pulse">UNLOCKED: KNUCKLES!</p>}
             {currentLevel === 3 && <p className="text-gray-400 font-bold mb-4 animate-pulse">UNLOCKED: SHADOW!</p>}
             {currentLevel >= 4 && <p className="text-cyan-300 font-bold mb-4 animate-pulse">UNLOCKED: SILVER!</p>}

            <button 
              onClick={onStart}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-6 rounded"
            >
              {currentLevel >= 4 ? t.playAgain : t.nextLevel}
            </button>
          </>
        )}
      </div>
    </div>
  );
};