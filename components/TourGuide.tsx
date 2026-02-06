import React, { useState, useEffect, useRef } from 'react';
import { TourStep } from '../types';
import { X, ChevronRight, Volume2, VolumeX, Play, SkipForward } from 'lucide-react';
import { AvatarDisplay } from './AvatarDisplay';

interface TourGuideProps {
  steps: TourStep[];
  isOpen: boolean;
  onComplete: () => void;
  langCode: string; // 'EN', 'US', 'NO', 'SCO'
}

export const TourGuide: React.FC<TourGuideProps> = ({ steps, isOpen, onComplete, langCode }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(false); // Default to unmuted, but browser might block autoplay
  const [position, setPosition] = useState<{ top: number, left: number, width: number, height: number } | null>(null);
  const [hasStarted, setHasStarted] = useState(false); // Tracks if user clicked "Start"
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentStep = steps[currentStepIdx];

  // Helper to map App language to Config language keys
  const getSafeLangKey = (code: string) => {
      if (code === 'US') return 'en-US';
      if (code === 'NO') return 'no';
      if (code === 'SCO') return 'sco';
      return 'en';
  };

  const safeLang = getSafeLangKey(langCode);

  // 1. Calculate Spotlight Position (Only for non-welcome steps)
  useEffect(() => {
    if (!isOpen) return;
    
    const updatePosition = () => {
        // If it's the Welcome step, we don't need a spotlight
        if (currentStep.id === 'welcome') {
            setPosition(null);
            return;
        }

        if (currentStep.targetId) {
          const el = document.getElementById(currentStep.targetId);
          if (el) {
            const rect = el.getBoundingClientRect();
            // Add padding (10px)
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
    
    // Slight delay to allow UI to settle (e.g. tabs sliding in)
    const timer = setTimeout(updatePosition, 500);

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

    // Only play audio if:
    // 1. We have started (clicked "Start Tour") - prevents unsolicited noise on Welcome screen
    // 2. It is not muted
    // 3. We are past the Welcome step (Index > 0)
    if (hasStarted && !isMuted && currentStepIdx > 0) {
      const src = currentStep.audioFiles[safeLang] || currentStep.audioFiles['en'];
      
      if (src) {
          const audio = new Audio(src);
          audioRef.current = audio;
          audio.play().catch(e => {
              console.warn("Audio autoplay blocked. User interaction needed first.", e);
          });
      }
    }
  }, [currentStepIdx, isMuted, isOpen, safeLang, currentStep, hasStarted]);

  const handleStart = () => {
      setHasStarted(true);
      setIsMuted(false); // Enable audio on start
      setCurrentStepIdx(1); // Jump to first real step
  };

  const handleNext = () => {
      if (currentStepIdx < steps.length - 1) {
          setCurrentStepIdx(prev => prev + 1);
      } else {
          onComplete();
      }
  };

  const handleSkip = () => {
      onComplete();
  };

  if (!isOpen) return null;

  const script = currentStep.script[safeLang] || currentStep.script['en'];
  const isWelcome = currentStep.id === 'welcome';

  // --- RENDER: WELCOME MODAL (Hybrid Mode 1) ---
  if (isWelcome) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"></div>
            <div className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Hero Image Area */}
                <div className="h-32 bg-[#0f2545] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/public/pundit-banner.png')] bg-cover bg-center opacity-50"></div>
                    <h2 className="relative z-10 text-2xl font-black text-white italic uppercase tracking-tighter drop-shadow-lg">
                        Stadium Tour
                    </h2>
                </div>
                
                <div className="p-6 text-center space-y-6">
                    <div className="space-y-2">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Welcome Manager</p>
                        <p className="text-slate-800 text-lg font-medium leading-relaxed">
                            "{script.host}"
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={handleStart}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                        >
                            <Play size={18} fill="currentColor" /> Start Tour (Audio On)
                        </button>
                        <button 
                            onClick={handleSkip}
                            className="w-full py-3 text-slate-400 font-bold uppercase tracking-widest text-xs hover:text-slate-600 transition-colors"
                        >
                            No thanks, I know the game
                        </button>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // --- RENDER: TV OVERLAY (Hybrid Mode 2) ---
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden font-sans touch-none pointer-events-none">
      
      {/* 1. DIMMER (With Hole) */}
      <div 
        className="absolute inset-0 bg-black/60 transition-all duration-700 ease-in-out"
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

      {/* 2. GLOWING BORDER AROUND TARGET */}
      {position && (
        <div 
          className="absolute border-4 border-yellow-400/80 rounded-xl shadow-[0_0_30px_rgba(250,204,21,0.5)] transition-all duration-700 box-border animate-pulse"
          style={{ top: position.top, left: position.left, width: position.width, height: position.height }}
        ></div>
      )}

      {/* 3. TV FRAME (The Commentary Box) */}
      {/* pointer-events-auto is crucial here so we can click Next/Skip, but the rest of the screen allows clicks through if you want (or blocks if dim is set) */}
      <div className={`absolute left-0 right-0 p-4 flex justify-center transition-all duration-700 pointer-events-auto ${
          currentStep.position === 'top' || (position?.top && position.top > window.innerHeight / 2) 
            ? 'top-20' 
            : 'bottom-8'
        }`}>
        
        {/* THE TV FRAME CONTAINER - REPLACE 'bg-slate-900' with your TV Image later */}
        <div className="relative w-full max-w-lg bg-[#1a1a1a] rounded-2xl shadow-2xl border-4 border-slate-800 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-500">
            
            {/* Screen Glare Effect (Optional Polish) */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-10"></div>

            {/* TV Header / Controls */}
            <div className="bg-black/50 p-2 flex justify-between items-center border-b border-white/10 relative z-20">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_red]"></div>
                    <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">Live Feed • Step {currentStepIdx}/{steps.length - 1}</span>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setIsMuted(!isMuted)} className="text-white/60 hover:text-white transition-colors">
                        {isMuted ? <VolumeX size={14}/> : <Volume2 size={14}/>}
                    </button>
                    <button onClick={handleSkip} className="text-white/60 hover:text-white transition-colors flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest">
                        Skip <SkipForward size={12}/>
                    </button>
                </div>
            </div>

            {/* TV Content (Script) */}
            <div className="p-5 bg-gradient-to-b from-[#222] to-[#111] relative z-20">
                 {/* Host Line */}
                 <div className="flex gap-4 items-start mb-4">
                    <AvatarDisplay avatar="/avatars/host.png" size="md" className="ring-2 ring-blue-500/50 shadow-lg" />
                    <div className="flex-1">
                        <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Host</p>
                        <p className="text-sm text-slate-200 leading-snug font-medium">"{script.host}"</p>
                    </div>
                 </div>

                 {/* Pundit Line */}
                 <div className="flex gap-4 items-start flex-row-reverse text-right">
                    <AvatarDisplay avatar="/avatars/pundit.png" size="md" className="ring-2 ring-orange-500/50 shadow-lg" />
                    <div className="flex-1">
                        <p className="text-[10px] font-black text-orange-400 uppercase mb-1">Pundit</p>
                        <p className="text-sm text-slate-200 leading-snug font-medium italic">"{script.pundit}"</p>
                    </div>
                 </div>
            </div>

            {/* TV Footer / Next Button */}
            <div className="bg-black/80 p-3 flex justify-end border-t border-white/10 relative z-20">
                <button 
                    onClick={handleNext}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all active:scale-95"
                >
                    {currentStepIdx === steps.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={14} strokeWidth={3} />
                </button>
            </div>

        </div>
      </div>

    </div>
  );
};