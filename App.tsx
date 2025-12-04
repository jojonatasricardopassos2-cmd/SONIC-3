import React, { useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { Menu } from './components/Menu';
import { HUD } from './components/HUD';
import { MobileControls } from './components/MobileControls';
import { GameState, GameSettings, MobileInputState, CharacterType } from './types';

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [rings, setRings] = useState(0);
  const [bossMessage, setBossMessage] = useState('');
  
  // Progression State
  const [currentLevel, setCurrentLevel] = useState(1);
  const [superUnlocked, setSuperUnlocked] = useState(true); // Enabled by default for selection
  
  // Character System - Super Sonic unlocked by default as requested
  const [unlockedCharacters, setUnlockedCharacters] = useState<CharacterType[]>(['sonic', 'supersonic']);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType>('sonic');
  
  // Settings State
  const [settings, setSettings] = useState<GameSettings>({
    language: 'en',
    mobileMode: false
  });

  // Mobile Input State
  const [mobileInput, setMobileInput] = useState<MobileInputState>({
    left: false, right: false, up: false, down: false
  });

  const updateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const startGame = () => {
    if (gameState === GameState.VICTORY && currentLevel >= 4) {
        // New Game + (if beat level 4)
        setCurrentLevel(1);
    }
    setGameState(GameState.PLAYING);
    setScore(0);
    setRings(0);
    setBossMessage('');
  };

  const handleLevelComplete = () => {
      // Unlock characters based on progress
      // Order: Sonic -> Tails (L1) -> Knuckles (L2) -> Shadow (L3) -> Silver (L4)
      
      if (currentLevel === 1) {
          if (!unlockedCharacters.includes('tails')) {
              setUnlockedCharacters(prev => [...prev, 'tails']);
          }
      } else if (currentLevel === 2) {
           if (!unlockedCharacters.includes('knuckles')) {
              setUnlockedCharacters(prev => [...prev, 'knuckles']);
          }
      } else if (currentLevel === 3) {
          if (!unlockedCharacters.includes('shadow')) {
              setUnlockedCharacters(prev => [...prev, 'shadow']);
          }
      } else if (currentLevel === 4) {
          if (!unlockedCharacters.includes('silver')) {
              setUnlockedCharacters(prev => [...prev, 'silver']);
          }
          setGameState(GameState.VICTORY);
      }
      
      if (currentLevel < 4) {
          setCurrentLevel(prev => prev + 1);
          setGameState(GameState.VICTORY); 
          setBossMessage('');
      }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden select-none">
        {/* Retro scanline overlay */}
        <div className="scanlines"></div>
        
        <div className="relative w-full max-w-[800px]">
            <HUD 
                score={score} 
                rings={rings} 
                bossMessage={bossMessage} 
                unlockedCharacters={unlockedCharacters}
                selectedCharacter={selectedCharacter}
                onSelectCharacter={setSelectedCharacter}
                language={settings.language}
            />
            
            <GameCanvas 
                gameState={gameState} 
                setGameState={setGameState}
                setScore={setScore}
                rings={rings}
                setRings={setRings}
                setBossMessage={setBossMessage}
                mobileInput={mobileInput}
                currentLevel={currentLevel}
                onLevelComplete={handleLevelComplete}
                superUnlocked={superUnlocked}
                selectedCharacter={selectedCharacter}
            />
            
            <Menu 
                onStart={startGame} 
                gameState={gameState} 
                score={score}
                message={bossMessage}
                settings={settings}
                updateSettings={updateSettings}
                currentLevel={currentLevel}
                superUnlocked={superUnlocked}
                unlockedCharacters={unlockedCharacters}
                selectedCharacter={selectedCharacter}
                setSelectedCharacter={setSelectedCharacter}
            />

            {/* Render mobile controls if enabled and game is playing */}
            {settings.mobileMode && (gameState === GameState.PLAYING || gameState === GameState.BOSS_FIGHT) && (
              <MobileControls setInput={setMobileInput} />
            )}
        </div>
        
        <div className="absolute bottom-4 text-gray-500 text-xs text-center w-full pointer-events-none">
            Blue Blur Rush • React + Canvas + Gemini • Arrow Keys / WASD + Double Tap for Abilities
        </div>
    </div>
  );
}

export default App;