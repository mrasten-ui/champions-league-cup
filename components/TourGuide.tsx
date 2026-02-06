import React, { useState, useEffect, useRef } from 'react';
import { TourStep } from '../types';
import { X, ChevronRight, ChevronLeft, Volume2, VolumeX, Play, SkipForward } from 'lucide-react';
import { AvatarDisplay } from './AvatarDisplay';

interface TourGuideProps {
  steps: TourStep[];
  isOpen: boolean;
  onComplete: () => void;
  langCode: string; // 'EN', 'US', 'NO', 'SCO'
}

export const TourGuide: React.FC<TourGuideProps> = ({ steps, isOpen, onComplete, langCode }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [position, setPosition] = useState<{ top: number, left: number, width: number, height: number } | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentStep = steps[currentStepIdx];

  const getSafeLangKey = (code: string) => {
      if (code === 'US') return 'en-US';
      if (code === 'NO') return 'no';
      if (code === 'SCO') return 'sco';
      return 'en';
  };

  const safeLang = getSafeLangKey(langCode);

  useEffect(() => {
    if (!isOpen) return;
    
    const updatePosition = () => {
        if (currentStep.id === 'welcome') {
            setPosition(null);
            return;
        }

        if (currentStep.targetId) {
          const el = document.getElementById(currentStep.targetId);
          if (el) {
            const rect = el.getBoundingClientRect();
            setPosition({ 
              top: rect.top - 10, 
              left: rect.left - 10, 
              width: rect.width + 20, 
              height: rect.height + 20 
            });
          }
        } else {
          setPosition(null);
        }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    const timer = setTimeout(updatePosition, 500);

    return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
        clearTimeout(timer);
    };
  }, [currentStepIdx, isOpen, currentStep]);

  useEffect(() => {
    if (!isOpen) return;
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (hasStarted && !isMuted && currentStepIdx > 0) {
      const src = currentStep.audioFiles[safeLang] || currentStep.audioFiles['en'];
      if (src) {
          const audio = new Audio(src);
          audioRef.current = audio;
          audio.play().catch(e => console.warn("Audio autoplay blocked", e));
      }
    }
  }, [currentStepIdx, isMuted, isOpen, safeLang, currentStep, hasStarted]);

  const handleStart = () => {
      setHasStarted(true);
      setIsMuted(false);
      setCurrentStepIdx(1);
  };

  const handleNext = () => {
      if (currentStepIdx < steps.length - 1) {
          setCurrentStepIdx(prev => prev + 1);
      } else {
          onComplete();
      }
  };

  // NEW: Handle Previous
  const handlePrev = () => {
      if (currentStepIdx > 1) {
          setCurrentStepIdx(prev => prev - 1);
      }
  };

  const handleSkip = () => onComplete();

  if (!isOpen) return null;

  // Use the NEW 'display' content for UI text
  const content = currentStep.display?.[safeLang] || currentStep.display?.['en'];
  const audioScript = currentStep.audioScript?.[safeLang] || currentStep.audioScript?.['en']; // Fallback for welcome screen text
  const isWelcome = currentStep.id === 'welcome';

  // --- WELCOME MODAL ---
  if (isWelcome) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"></div>
            <div className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="h-32 bg-[#0f2545] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/public/pundit-banner.png')] bg-cover bg-center opacity-50"></div>
                    <h2 className="relative z-10 text-2xl font-black text-white italic uppercase tracking-tighter drop-shadow-lg">Stadium Tour</h2>
                </div>
                <div className="p-6 text-center space-y-6">
                    <div className="space-y-2">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Welcome Manager</p>
                        <p className="text-slate-800 text-lg font-medium leading-relaxed">"{audioScript?.host}"</p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button onClick={handleStart} className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                            <Play size={18} fill="currentColor" /> Start Tour (Audio On)
                        </button>
                        <button onClick={handleSkip} className="w-full py-3 text-slate-400 font-bold uppercase tracking-widest text-xs hover:text-slate-600 transition-colors">
                            No thanks, I know the game
                        </button>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // --- TV GRAPHIC OVERLAY ---
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden font-sans touch-none pointer-events-none">
      
      {/* 1. DIMMER */}
      <div className="absolute inset-0 bg-black/60 transition-all duration-700 ease-in-out"
        style={position ? {
           clipPath: `polygon(0% 0%, 0% 100%, ${position.left}px 100%, ${position.left}px ${position.top}px, ${position.left + position.width}px ${position.top}px, ${position.left + position.width}px ${position.top + position.height}px, ${position.left}px ${position.top + position.height}px, ${position.left}px 100%, 100% 100%, 100% 0%)`
        } : {}}></div>

      {/* 2. GLOWING BORDER */}
      {position && (
        <div className="absolute border-4 border-yellow-400/80 rounded-xl shadow-[0_0_30px_rgba(250,204,21,0.5)] transition-all duration-700 box-border animate-pulse"
          style={{ top: position.top, left: position.left, width: position.width, height: position.height }}></div>
      )}

      {/* 3. BROADCAST LOWER-THIRD */}
      <div className={`absolute left-0 right-0 px-4 flex justify-center transition-all duration-700 pointer-events-auto ${currentStep.position === 'top' || (position?.top && position.top > window.innerHeight / 2) ? 'top-20' : 'bottom-10'}`}>
        
        <div className="relative w-full max-w-lg overflow-hidden rounded-xl shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-500">
            {/* Background */}
            <div className="absolute inset-0 bg-[#0f172a] border-t-4 border-yellow-400"></div>
            
            {/* Layout */}
            <div className="relative z-10 flex h-24">
                
                {/* Left: Host Avatar */}
                <div className="w-20 bg-[#1e293b] flex items-end justify-center relative border-r border-white/10">
                    <AvatarDisplay avatar="/avatars/host.png" size="lg" className="translate-y-2 scale-110 drop-shadow-xl" />
                </div>

                {/* Middle: Content */}
                <div className="flex-1 p-3 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-1">
                        <h3 className="text-sm font-black text-yellow-400 uppercase tracking-widest italic">{content?.title}</h3>
                        <div className="flex gap-2">
                             <button onClick={() => setIsMuted(!isMuted)} className="text-white/40 hover:text-white transition-colors">{isMuted ? <VolumeX size={14}/> : <Volume2 size={14}/>}</button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        {content?.lines?.map((line, i) => (
                            <div key={i} className="flex items-center gap-2 text-white/90 text-xs font-bold">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                {line}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Controls & Pundit */}
                <div className="w-24 bg-[#1e293b] flex flex-col items-center justify-between p-2 border-l border-white/10">
                     <div className="flex gap-1 w-full justify-center">
                        {/* Prev Button */}
                        <button onClick={handlePrev} disabled={currentStepIdx <= 1} className={`p-1.5 rounded-lg transition-colors ${currentStepIdx <= 1 ? 'text-white/10 cursor-not-allowed' : 'text-white hover:bg-white/10'}`}>
                            <ChevronLeft size={16} strokeWidth={3} />
                        </button>
                        {/* Next Button */}
                        <button onClick={handleNext} className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-lg active:scale-95">
                            <ChevronRight size={16} strokeWidth={3} />
                        </button>
                     </div>
                     <button onClick={handleSkip} className="text-[9px] font-bold text-white/30 hover:text-white uppercase tracking-widest mt-1">
                        Skip
                     </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};