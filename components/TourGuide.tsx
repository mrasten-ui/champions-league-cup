import React, { useState, useEffect, useRef } from 'react';
import { TourStep } from '../types';
import { ChevronRight, ChevronLeft, Volume2, VolumeX, Play, SkipForward } from 'lucide-react';
import { AvatarDisplay } from './AvatarDisplay';

interface TourGuideProps {
  steps: TourStep[];
  isOpen: boolean;
  onComplete: () => void;
  langCode: string; 
  onStepChange?: (stepId: string) => void;
}

export const TourGuide: React.FC<TourGuideProps> = ({ steps, isOpen, onComplete, langCode, onStepChange }) => {
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

  // 1. Navigation Effect
  useEffect(() => {
      if (isOpen && onStepChange && hasStarted) {
          onStepChange(currentStep.id);
      }
  }, [currentStepIdx, isOpen, hasStarted, onStepChange, currentStep.id]);

  // 2. Spotlight Position
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
    const timer = setTimeout(updatePosition, 600); // Wait for App scroll to finish

    return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
        clearTimeout(timer);
    };
  }, [currentStepIdx, isOpen, currentStep]);

  // 3. Audio & Auto-Advance Logic
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
          
          // AUTO-ADVANCE: Wait 2s after audio finishes
          audio.onended = () => {
              setTimeout(() => {
                  if (currentStepIdx < steps.length - 1) {
                      setCurrentStepIdx(prev => prev + 1);
                  } else {
                      onComplete();
                  }
              }, 2000); 
          };

          audio.play().catch(e => console.warn("Audio autoplay blocked", e));
      }
    }
  }, [currentStepIdx, isMuted, isOpen, safeLang, currentStep, hasStarted, steps.length, onComplete]);

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

  const handlePrev = () => {
      if (currentStepIdx > 1) {
          setCurrentStepIdx(prev => prev - 1);
      }
  };

  const handleSkip = () => onComplete();

  if (!isOpen) return null;

  const content = currentStep.display?.[safeLang] || currentStep.display?.['en'];
  const audioScript = currentStep.audioScript?.[safeLang] || currentStep.audioScript?.['en'];
  const isWelcome = currentStep.id === 'welcome';

  // --- WELCOME MODAL ---
  if (isWelcome) {
      return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
    <div className="fixed inset-0 z-[100] overflow-hidden font-sans touch-none">
      
      {/* 1. DIMMER & CLICK BLOCKER */}
      <div className="absolute inset-0 bg-black/50 transition-all duration-700 ease-in-out pointer-events-auto"
        style={position ? {
           clipPath: `polygon(0% 0%, 0% 100%, ${position.left}px 100%, ${position.left}px ${position.top}px, ${position.left + position.width}px ${position.top}px, ${position.left + position.width}px ${position.top + position.height}px, ${position.left}px ${position.top + position.height}px, ${position.left}px 100%, 100% 100%, 100% 0%)`
        } : {}}></div>

      {/* 2. GLOWING BORDER */}
      {position && (
        <div className="absolute border-4 border-yellow-400/80 rounded-xl shadow-[0_0_30px_rgba(250,204,21,0.5)] transition-all duration-700 box-border animate-pulse pointer-events-none"
          style={{ top: position.top, left: position.left, width: position.width, height: position.height }}></div>
      )}

      {/* 3. FIXED FOOTER (Full Width TV) */}
      <div className="fixed bottom-0 left-0 right-0 z-[200] pointer-events-auto flex justify-center">
        
        {/* TV CONTAINER: Full width, dark background, top border */}
        <div className="w-full bg-[#0f172a] border-t-4 border-yellow-400 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full duration-500">
            
            {/* Centered Content Wrapper */}
            <div className="max-w-4xl mx-auto flex h-24 sm:h-28 relative">
                
                {/* Left: Host Avatar */}
                <div className="w-24 bg-[#1e293b] flex items-end justify-center relative border-r border-white/10 shrink-0">
                    <AvatarDisplay avatar="/avatars/host.png" size="lg" className="translate-y-2 scale-125 drop-shadow-2xl" />
                </div>

                {/* Middle: Content */}
                <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center min-w-0">
                    <div className="flex justify-between items-center mb-1.5">
                        <h3 className="text-sm sm:text-base font-black text-yellow-400 uppercase tracking-widest italic truncate pr-2">{content?.title}</h3>
                        <button onClick={() => setIsMuted(!isMuted)} className="text-white/40 hover:text-white transition-colors shrink-0">
                            {isMuted ? <VolumeX size={16}/> : <Volume2 size={16}/>}
                        </button>
                    </div>
                    <div className="space-y-1">
                        {content?.lines?.map((line, i) => (
                            <div key={i} className="flex items-center gap-2 text-white/90 text-xs sm:text-sm font-bold truncate">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0"></span>
                                <span className="truncate">{line}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Controls */}
                <div className="w-28 bg-[#1e293b] flex flex-col items-center justify-center gap-2 p-2 border-l border-white/10 shrink-0">
                     <button 
                        onClick={handleNext} 
                        className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1 shadow-lg shadow-yellow-500/20 active:scale-95 transition-all"
                     >
                        {currentStepIdx === steps.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={14} strokeWidth={3} />
                     </button>
                     
                     <div className="flex w-full gap-1">
                        <button onClick={handlePrev} disabled={currentStepIdx <= 1} className={`flex-1 py-1.5 flex justify-center rounded-md transition-colors ${currentStepIdx <= 1 ? 'text-white/10 cursor-not-allowed' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                            <ChevronLeft size={14} strokeWidth={3} />
                        </button>
                        <button onClick={handleSkip} className="flex-1 py-1.5 flex justify-center text-[9px] font-bold text-white/40 hover:text-white uppercase tracking-widest rounded-md hover:bg-white/10 transition-colors">
                            Skip
                        </button>
                     </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};