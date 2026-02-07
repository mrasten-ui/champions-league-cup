import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TourStep, LanguageCode } from '../types';
import { ChevronRight, ChevronLeft, Volume2, VolumeX, Play, X } from 'lucide-react';
import { AvatarDisplay } from './AvatarDisplay';
import { BROADCAST_TEAMS } from '../constants';

// --- HELPER: Avatar Wrapper ---
const TourAvatar: React.FC<{ role: 'host' | 'pundit'; lang: LanguageCode; className?: string }> = ({ role, lang, className }) => {
    // Get correct avatar from constants based on Language
    // Default to EN if not found
    const team = BROADCAST_TEAMS[lang] || BROADCAST_TEAMS['EN'];
    const person = role === 'host' ? team.host : team.pundit;
    
    return (
        <div className={`rounded-full overflow-hidden border-2 border-white shadow-2xl bg-slate-800 flex items-center justify-center ${className}`}>
            <AvatarDisplay avatar={person.image} size="lg" className="w-full h-full scale-110" />
        </div>
    );
};

interface TourGuideProps {
  steps: TourStep[];
  isOpen: boolean;
  onComplete: () => void;
  langCode: LanguageCode; 
  onStepChange?: (stepId: string) => void;
}

export const TourGuide: React.FC<TourGuideProps> = ({ steps, isOpen, onComplete, langCode, onStepChange }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  // Spotlight State (CSS positioning)
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({
    opacity: 0,
    top: '50%',
    left: '50%',
    width: '0px',
    height: '0px',
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentStep = steps[currentStepIdx];

  // --- 1. RESET ON OPEN ---
  useEffect(() => {
      if (isOpen) {
          setCurrentStepIdx(0);
          setHasStarted(false);
          setIsMuted(false);
          setSpotlightStyle({ opacity: 0, top: '50%', left: '50%', width: '0px', height: '0px' });
      } else {
          if (audioRef.current) { 
              audioRef.current.pause(); 
              audioRef.current.currentTime = 0; 
          }
      }
  }, [isOpen]);

  // --- 2. NAVIGATION & SPOTLIGHT CALCULATOR ---
  useEffect(() => {
    if (!isOpen || !hasStarted) return;

    // A. Notify Parent (App.tsx) to scroll/change tabs
    if (onStepChange) {
        onStepChange(currentStep.id);
    }

    // B. Calculate Bounding Box for Spotlight
    const calculateSpotlight = () => {
        // Collect all target IDs for this step
        const targetIds = currentStep.targets || (currentStep.targetId ? [currentStep.targetId] : []);
        
        if (targetIds.length === 0 || currentStep.id === 'welcome') {
            // No target = Spotlight fades out (or stays centered/hidden)
            setSpotlightStyle(prev => ({ ...prev, opacity: 0 }));
            return;
        }

        let minTop = Infinity;
        let minLeft = Infinity;
        let maxBottom = -Infinity;
        let maxRight = -Infinity;
        let found = false;

        targetIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const rect = el.getBoundingClientRect();
                if (rect.top < minTop) minTop = rect.top;
                if (rect.left < minLeft) minLeft = rect.left;
                if (rect.bottom > maxBottom) maxBottom = rect.bottom;
                if (rect.right > maxRight) maxRight = rect.right;
                found = true;
            }
        });

        if (found) {
            const padding = 12; 
            const width = maxRight - minLeft + (padding * 2);
            const height = maxBottom - minTop + (padding * 2);
            const top = minTop - padding;
            const left = minLeft - padding;

            setSpotlightStyle({
                opacity: 1,
                top: `${top}px`,
                left: `${left}px`,
                width: `${width}px`,
                height: `${height}px`,
                borderRadius: '16px', // Rounded corners for the "hole"
            });
        }
    };

    // Delay slightly to let the DOM update (if tabs switched)
    const timer = setTimeout(calculateSpotlight, 400);
    const resizeListener = () => calculateSpotlight();
    window.addEventListener('resize', resizeListener);
    window.addEventListener('scroll', resizeListener);

    return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', resizeListener);
        window.removeEventListener('scroll', resizeListener);
    };

  }, [currentStepIdx, isOpen, hasStarted, currentStep, onStepChange]);

  // --- 3. AUDIO PLAYER ---
  useEffect(() => {
    if (!isOpen) return;
    
    // Stop previous
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Play new if started & not muted & valid file
    if (hasStarted && !isMuted) {
      const src = currentStep.audioFiles[langCode] || currentStep.audioFiles['en'];
      if (src) {
          const audio = new Audio(src);
          audioRef.current = audio;
          
          audio.onended = () => {
              // Auto-advance after 2s delay
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
  }, [currentStepIdx, hasStarted, isMuted, isOpen, langCode, steps.length, onComplete, currentStep]);

  // --- HANDLERS ---
  const handleStart = () => {
      setHasStarted(true);
      setIsMuted(false);
      setCurrentStepIdx(1); // Skip Welcome -> Go to Step 1
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

  const content = currentStep.display?.[langCode] || currentStep.display?.['en'];
  const audioScript = currentStep.audioScript?.[langCode] || currentStep.audioScript?.['en'];
  const isWelcome = currentStep.id === 'welcome';

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden font-sans touch-none select-none">
      
      {/* 1. WELCOME SCREEN (MODAL) */}
      {isWelcome && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-300"></div>
            <div className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border-4 border-yellow-400">
                <div className="h-40 bg-[#0f2545] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/pundit-banner.png')] bg-cover bg-center opacity-40"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f2545] to-transparent"></div>
                    <div className="relative z-10 text-center">
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter drop-shadow-lg">
                            The Tour
                        </h2>
                        <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mt-1">Pre-Season Briefing</p>
                    </div>
                </div>
                
                <div className="px-6 py-8 text-center space-y-6">
                    <div className="flex justify-center -mt-16 mb-4">
                        <TourAvatar role="host" lang={langCode} className="w-20 h-20" />
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 inline-block px-3 py-1 rounded-full">
                            Your Assistant
                        </p>
                        <p className="text-slate-800 text-lg font-medium leading-relaxed italic">
                            "{audioScript?.host}"
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        <button 
                            onClick={handleStart}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-3"
                        >
                            <Play size={20} fill="currentColor" /> 
                            <span>Start Tour (Audio On)</span>
                        </button>
                        <button 
                            onClick={handleSkip}
                            className="w-full py-3 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors"
                        >
                            Skip intro, I know the game
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* 2. SPOTLIGHT OVERLAY (THE "DARKROOM" EFFECT) */}
      {!isWelcome && (
          <div 
            className="absolute inset-0 bg-slate-900/80 transition-all duration-500 ease-in-out pointer-events-auto"
            style={{
                // "Hole" Punch Logic
                maskImage: spotlightStyle.opacity > 0 
                    ? `radial-gradient(circle at ${parseInt(spotlightStyle.left as string) + parseInt(spotlightStyle.width as string)/2}px ${parseInt(spotlightStyle.top as string) + parseInt(spotlightStyle.height as string)/2}px, transparent ${parseInt(spotlightStyle.width as string)/1.8}px, black ${parseInt(spotlightStyle.width as string)/1.8 + 20}px)`
                    : 'none',
                // Alternate approach: Box Shadow if you want a rectangle hole (cleaner for cards)
                // We use a massive box-shadow on a div instead of maskImage for better rounded rect support
                backgroundColor: 'transparent' 
            }}
          >
             {/* THE ACTUAL SPOTLIGHT DIV (Use Box Shadow Trick for Rectangles) */}
             <div 
                className="absolute transition-all duration-500 ease-out"
                style={{
                    ...spotlightStyle,
                    boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.85)', // The Darkness
                }}
             >
                {/* Glowing Border around the target */}
                <div className="absolute inset-0 rounded-[inherit] ring-2 ring-white/50 shadow-[0_0_30px_rgba(255,255,255,0.3)] animate-pulse" />
             </div>
          </div>
      )}

      {/* 3. BROADCAST FOOTER (TV UI) */}
      {!isWelcome && (
          <div className="fixed bottom-0 left-0 right-0 z-[200] pointer-events-auto flex justify-center">
            
            <div className="w-full bg-[#0f172a] border-t-4 border-yellow-400 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-full duration-500">
                
                <div className="max-w-5xl mx-auto flex h-28 relative">
                    
                    {/* HOST AVATAR (Left) */}
                    <div className="w-28 relative hidden sm:block">
                        <div className="absolute bottom-0 left-4 w-32 h-32 z-20">
                            <TourAvatar role="host" lang={langCode} className="w-full h-full" />
                        </div>
                    </div>
                    {/* Mobile Host Icon */}
                    <div className="w-16 flex items-center justify-center sm:hidden bg-slate-800 border-r border-white/10">
                          <TourAvatar role="host" lang={langCode} className="w-12 h-12" />
                    </div>

                    {/* TEXT CONTENT (Middle) */}
                    <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col">
                                <h3 className="text-yellow-400 text-sm font-black uppercase tracking-[0.2em] leading-none mb-1">
                                    {content?.title}
                                </h3>
                                <div className="h-0.5 w-12 bg-blue-500 rounded-full"></div>
                            </div>
                            
                            <button 
                                onClick={() => setIsMuted(!isMuted)} 
                                className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                            >
                                {isMuted ? <VolumeX size={18}/> : <Volume2 size={18}/>}
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {content?.lines?.map((line, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></span>
                                    <span className="text-white text-xs sm:text-sm font-bold tracking-wide">{line}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CONTROLS (Right) */}
                    <div className="w-32 bg-slate-900/50 border-l border-white/10 flex flex-col items-center justify-center p-2 gap-2 relative">
                          <button 
                            onClick={handleNext} 
                            className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1 shadow-lg shadow-yellow-500/20 active:scale-95 transition-all z-20"
                          >
                            {currentStepIdx === steps.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={14} strokeWidth={3} />
                          </button>
                          
                          <div className="flex w-full gap-1 z-20">
                            <button onClick={handlePrev} disabled={currentStepIdx <= 1} className={`flex-1 py-1.5 flex justify-center rounded-md transition-colors ${currentStepIdx <= 1 ? 'text-white/10 cursor-not-allowed' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                                <ChevronLeft size={16} strokeWidth={3} />
                            </button>
                            <button onClick={handleSkip} className="flex-1 py-1.5 flex justify-center text-[9px] font-bold text-slate-500 hover:text-white uppercase tracking-widest rounded-md hover:bg-white/10 transition-colors">
                                Skip
                            </button>
                          </div>

                          {/* Pundit Avatar (Background/Subtle) */}
                          <div className="absolute -top-12 -right-4 w-20 h-20 opacity-30 pointer-events-none hidden sm:block grayscale mix-blend-screen">
                            <TourAvatar role="pundit" lang={langCode} className="w-full h-full" />
                          </div>
                    </div>
                </div>
            </div>
          </div>
      )}

      {/* Hidden Audio Element */}
      <audio ref={audioRef} className="hidden" />
    </div>
  , document.body);
};