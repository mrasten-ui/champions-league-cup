import React, { useState, useEffect, useRef } from 'react';
import { TourStep } from '../types';
import { X, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { AvatarDisplay } from './AvatarDisplay';

interface TourGuideProps {
  steps: TourStep[];
  isOpen: boolean;
  onComplete: () => void;
  langCode: string; // 'EN', 'US', 'NO', 'SCO' - from your App state
}

export const TourGuide: React.FC<TourGuideProps> = ({ steps, isOpen, onComplete, langCode }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [position, setPosition] = useState<{ top: number, left: number, width: number, height: number } | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentStep = steps[currentStepIdx];

  // Helper to map your App's language codes to the config keys
  const getSafeLangKey = (code: string) => {
      if (code === 'US') return 'en-US';
      if (code === 'NO') return 'no';
      if (code === 'SCO') return 'sco';
      return 'en';
  };

  const safeLang = getSafeLangKey(langCode);

  // 1. Calculate Spotlight Position
  useEffect(() => {
    if (!isOpen) return;
    
    const updatePosition = () => {
        if (currentStep.targetId) {
          const el = document.getElementById(currentStep.targetId);
          if (el) {
            const rect = el.getBoundingClientRect();
            // Add padding (10px) around the target
            setPosition({ 
              top: rect.top - 10, 
              left: rect.left - 10, 
              width: rect.width + 20, 
              height: rect.height + 20 
            });
          }
        } else {
          setPosition(null); // Null means "Center Screen Modal"
        }
    };

    // Run immediately and on resize
    updatePosition();
    // Allow a small delay for UI to settle (e.g. mobile tabs sliding in)
    const timer = setTimeout(updatePosition, 100); 
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition); // Handle scroll too
    
    return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
        clearTimeout(timer);
    };
  }, [currentStepIdx, isOpen, currentStep]);

  // 2. Handle Audio
  useEffect(() => {
    if (!isOpen) return;
    
    // Stop previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (!isMuted) {
      // Fallback: Try specific lang -> default to 'en'
      const src = currentStep.audioFiles[safeLang] || currentStep.audioFiles['en'];
      
      if (src) {
          const audio = new Audio(src);
          audioRef.current = audio;
          audio.play().catch(e => {
              console.warn("Audio autoplay blocked by browser policy", e);
          });
      }
    }
  }, [currentStepIdx, isMuted, isOpen, safeLang, currentStep]);

  if (!isOpen) return null;

  const script = currentStep.script[safeLang] || currentStep.script['en'];

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden font-sans touch-none">
      {/* BACKGROUND DIMMER WITH CSS CLIP-PATH FOR SPOTLIGHT */}
      <div 
        className="absolute inset-0 bg-black/80 transition-all duration-500 ease-in-out"
        style={position ? {
           clipPath: `polygon(
             0% 0%, 
             0% 100%, 
             ${position.left}px 100%, 
             ${position.left}px ${position.top}px, 
             ${position.left + position.width}px ${position.top}px, 
             ${position.left + position.width}px ${position.top + position.height}px, 
             ${position.left}px ${position.top + position.height}px, 
             ${position.left}px 100%, 
             100% 100%, 
             100% 0%
           )`
        } : {}}
      ></div>

      {/* HIGHLIGHT BORDER (The Glowing Box) */}
      {position && (
        <div 
          className="absolute border-2 border-yellow-400 rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.6)] pointer-events-none transition-all duration-500 box-border"
          style={{ top: position.top, left: position.left, width: position.width, height: position.height }}
        ></div>
      )}

      {/* DIALOG BOX */}
      <div className={`absolute left-0 right-0 p-4 flex justify-center transition-all duration-500 ${
          currentStep.position === 'top' || (position?.top && position.top > window.innerHeight / 2) 
            ? 'top-20' 
            : 'bottom-20'
        }`}>
        <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 relative z-50">
          
          {/* Header */}
          <div className="bg-[#0f2545] p-3 flex justify-between items-center">
             <span className="text-xs font-black text-white uppercase tracking-widest">Stadium Tour</span>
             <div className="flex gap-3">
               <button onClick={() => setIsMuted(!isMuted)} className="text-white/50 hover:text-white">
                 {isMuted ? <VolumeX size={16}/> : <Volume2 size={16}/>}
               </button>
               <button onClick={onComplete} className="text-white/50 hover:text-white"><X size={16}/></button>
             </div>
          </div>

          {/* Persona Script */}
          <div className="p-5 space-y-4">
             {/* Host */}
             <div className="flex gap-3 items-start animate-in fade-in slide-in-from-left-2 duration-500">
                <AvatarDisplay avatar="/avatars/host.png" size="md" /> 
                <div className="bg-blue-50 p-3 rounded-r-xl rounded-bl-xl text-xs text-blue-900 leading-relaxed shadow-sm">
                   <span className="block font-black text-blue-700 mb-1 uppercase text-[9px]">Host</span>
                   {script.host}
                </div>
             </div>

             {/* Pundit */}
             <div className="flex gap-3 items-start flex-row-reverse animate-in fade-in slide-in-from-right-2 duration-500 delay-300">
                <AvatarDisplay avatar="/avatars/pundit.png" size="md" /> 
                <div className="bg-orange-50 p-3 rounded-l-xl rounded-br-xl text-xs text-orange-900 leading-relaxed text-right shadow-sm border border-orange-100">
                   <span className="block font-black text-orange-700 mb-1 uppercase text-[9px]">Pundit</span>
                   {script.pundit}
                </div>
             </div>
          </div>

          {/* Footer Controls */}
          <div className="p-3 border-t border-slate-100 flex justify-between items-center bg-slate-50">
             <div className="flex gap-1">
                {steps.map((_, i) => (
                  <div key={i} className={`h-1.5 w-4 rounded-full transition-colors ${i === currentStepIdx ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                ))}
             </div>
             <button 
               onClick={() => {
                 if (currentStepIdx < steps.length - 1) setCurrentStepIdx(prev => prev + 1);
                 else onComplete();
               }}
               className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-md transition-transform active:scale-95"
             >
               {currentStepIdx === steps.length - 1 ? 'Finish Tour' : 'Next'} <ChevronRight size={14} />
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};