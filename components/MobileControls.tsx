import React from 'react';
import { MobileInputState } from '../types';

interface MobileControlsProps {
  setInput: React.Dispatch<React.SetStateAction<MobileInputState>>;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ setInput }) => {
  const handleTouch = (key: keyof MobileInputState, active: boolean) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setInput(prev => ({ ...prev, [key]: active }));
  };

  return (
    <div className="absolute bottom-4 left-0 right-0 px-4 flex justify-between z-30 pointer-events-none select-none">
      {/* D-Pad */}
      <div className="pointer-events-auto flex items-end gap-2">
         <button 
            className="w-16 h-16 bg-white/20 rounded-full border-2 border-white/50 active:bg-white/40 flex items-center justify-center text-white text-2xl"
            onTouchStart={handleTouch('left', true)} onTouchEnd={handleTouch('left', false)}
            onMouseDown={handleTouch('left', true)} onMouseUp={handleTouch('left', false)}
         >
           ←
         </button>
         <div className="flex flex-col gap-2">
             <button 
                className="w-16 h-16 bg-white/20 rounded-full border-2 border-white/50 active:bg-white/40 flex items-center justify-center text-white text-xl"
                onTouchStart={handleTouch('up', true)} onTouchEnd={handleTouch('up', false)}
                onMouseDown={handleTouch('up', true)} onMouseUp={handleTouch('up', false)}
             >
               ↑
             </button>
             <button 
                className="w-16 h-16 bg-white/20 rounded-full border-2 border-white/50 active:bg-white/40 flex items-center justify-center text-white text-xl"
                onTouchStart={handleTouch('down', true)} onTouchEnd={handleTouch('down', false)}
                onMouseDown={handleTouch('down', true)} onMouseUp={handleTouch('down', false)}
             >
               ↓
             </button>
         </div>
         <button 
            className="w-16 h-16 bg-white/20 rounded-full border-2 border-white/50 active:bg-white/40 flex items-center justify-center text-white text-2xl"
            onTouchStart={handleTouch('right', true)} onTouchEnd={handleTouch('right', false)}
            onMouseDown={handleTouch('right', true)} onMouseUp={handleTouch('right', false)}
         >
           →
         </button>
      </div>

      {/* Action Button */}
      <div className="pointer-events-auto flex items-end">
          <button 
            className="w-20 h-20 bg-yellow-500/50 rounded-full border-2 border-yellow-400 active:bg-yellow-500/80 flex items-center justify-center text-white font-bold"
            onTouchStart={handleTouch('up', true)} onTouchEnd={handleTouch('up', false)}
            onMouseDown={handleTouch('up', true)} onMouseUp={handleTouch('up', false)}
          >
            JUMP
          </button>
      </div>
    </div>
  );
};