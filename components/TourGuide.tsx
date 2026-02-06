import React, { useState, useEffect, useRef } from 'react';
import { TourStep } from '../types';
import { ChevronRight, ChevronLeft, Volume2, VolumeX, Play, ArrowRight, ArrowLeft, Hand, Sparkles, User, Mic2 } from 'lucide-react';
import { AvatarDisplay } from './AvatarDisplay';

// Placeholder Avatar Wrapper to give it the "Broadcast" look
const TourAvatar: React.FC<{ role: 'host' | 'pundit', className?: string }> = ({ role, className }) => {
    // You can replace these with your actual image paths from public/avatars/
    const avatarSrc = role === 'host' ? '/avatars/host.png' : '/avatars/pundit.png';
    
    return (
        <div className={`rounded-full overflow-hidden border-2 border-white shadow-2xl bg-slate-800 flex items-center justify-center ${className}`}>
            <AvatarDisplay avatar={avatarSrc} size="lg" className="w-full h-full scale-110" />
        </div>
    );
};

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
  
  // Spotlight: The main "Soft Focus" area (Camera center)
  const [spotlight, setSpotlight] = useState<{ x: number, y: number, r: number } | null>(null);
  
  // Highlights: Specific UI elements to circle/mark (The "Marker Pen")
  const [highlights, setHighlights] = useState<{ top: number, left: number, width: number, height: number, id: string }[]>([]);
  
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

  // --- 1. RESET ON OPEN ---
  useEffect(() => {
      if (isOpen) {
          setCurrentStepIdx(0);
          setHasStarted(false);
          setIsMuted(false);
          setHighlights([]);
          setSpotlight(null);
      } else {
          if (audioRef.current) { 
              audioRef.current.pause(); 
              audioRef.current.currentTime = 0; 
          }
      }
  }, [isOpen]);

  // --- 2. NAVIGATION HANDLER ---
  useEffect(() => {
      if (isOpen && onStepChange && hasStarted) {
          onStepChange(currentStep.id);
      }
  }, [currentStepIdx, isOpen, hasStarted, onStepChange, currentStep.id]);

  // --- 3. SPOTLIGHT & HIGHLIGHT CALCULATOR ---
  useEffect(() => {
    if (!isOpen || !hasStarted) return;
    
    // Clear previous state immediately to avoid artifacts
    setHighlights([]);
    setSpotlight(null);

    if (currentStep.id === 'welcome') return;

    // Helper to get rect
    const calcRect = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return null;
            return rect;
        }
        return null;
    };

    const updateVisuals = () => {
        // A. Calculate Soft Spotlight (Main Target)
        if (currentStep.targetId) {
            const rect = calcRect(currentStep.targetId);
            if (rect) {
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                // Make the hole big enough to breathe
                const radius = Math.max(rect.width, rect.height) / 1.4 + 60; 
                setSpotlight({ x: centerX, y: centerY, r: radius });
            }
        }

        // B. Calculate Specific Highlights (The "Marker Pen" Circles)
        const idsToFind = currentStep.targets || (currentStep.targetId ? [currentStep.targetId] : []);
        
        idsToFind.forEach((tid, index) => {
            // Stagger the highlights for a "drawing" effect (1st then 2nd)
            setTimeout(() => {
                const rect = calcRect(tid);
                if (rect) {
                    setHighlights(prev => {
                        if (prev.find(h => h.id === tid)) return prev; // Dedup
                        return [...prev, {
                            top: rect.top - 8,
                            left: rect.left - 8,
                            width: rect.width + 16,
                            height: rect.height + 16,
                            id: tid
                        }];
                    });
                }
            }, index * 500 + 100); // 500ms delay between multiple targets
        });
    };

    // Poll briefly to allow for scrolling/tab switching animation
    updateVisuals();
    const interval = setInterval(updateVisuals, 200);
    const timeout = setTimeout(() => clearInterval(interval), 1500); 

    window.addEventListener('resize', updateVisuals);
    window.addEventListener('scroll', updateVisuals);

    return () => {
        clearInterval(interval);
        clearTimeout(timeout);
        window.removeEventListener('resize', updateVisuals);
        window.removeEventListener('scroll', updateVisuals);
    };
  }, [currentStepIdx, isOpen, currentStep, hasStarted]);

  // --- 4. AUDIO PLAYER & AUTO-ADVANCE ---
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
          
          audio.onended = () => {
              // Wait 2 seconds after audio finishes, then auto-next
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

  // --- HANDLERS ---
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

  // --- RENDER: WELCOME SCREEN (MODAL) ---
  if (isWelcome) {
      return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-300"></div>
            <div className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border-4 border-yellow-400">
                <div className="h-40 bg-[#0f2545] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/public/pundit-banner.png')] bg-cover bg-center opacity-40"></div>
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
                        <TourAvatar role="host" className="w-20 h-20" />
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
      );
  }

  // --- RENDER: BROADCAST OVERLAY (TV MODE) ---
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden font-sans touch-none select-none">
      
      {/* 1. SOFT FOCUS MASK (THE DARKROOM EFFECT) */}
      <div 
        className="absolute inset-0 bg-slate-900/80 transition-all duration-700 ease-in-out pointer-events-auto"
        style={{
            // This creates a "hole" in the darkness
            maskImage: spotlight 
                ? `radial-gradient(circle ${spotlight.r}px at ${spotlight.x}px ${spotlight.y}px, transparent 0%, black 100%)`
                : 'none',
            WebkitMaskImage: spotlight 
                ? `radial-gradient(circle ${spotlight.r}px at ${spotlight.x}px ${spotlight.y}px, transparent 0%, black 100%)`
                : 'none'
        }}
      ></div>

      {/* 2. HIGHLIGHT RINGS ("MARKER PEN") */}
      {highlights.map((h, i) => (
        <div 
          key={h.id}
          className="absolute z-[120] pointer-events-none transition-all duration-500 ease-out animate-in zoom-in fade-in"
          style={{ 
            top: h.top, 
            left: h.left, 
            width: h.width, 
            height: h.height 
          }}
        >
            {/* Outer Glow */}
            <div className="absolute inset-0 rounded-[2rem] shadow-[0_0_50px_rgba(250,204,21,0.6)] animate-pulse"></div>
            {/* The Solid Ring */}
            <div className="absolute inset-0 border-[6px] border-yellow-400 rounded-[2rem] opacity-80"></div>
        </div>
      ))}

      {/* 3. TELESTRATOR GRAPHICS (The Floating Animations) */}
      {spotlight && currentStep.overlayType === 'score-arrows' && (
          <div className="absolute pointer-events-none animate-in fade-in zoom-in duration-700 z-[130]" 
               style={{ top: spotlight.y - 30, left: spotlight.x - 100, width: 200 }}>
              <div className="flex justify-between items-center w-full">
                  <ArrowRight className="text-yellow-400 w-16 h-16 animate-pulse drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] filter" strokeWidth={4} />
                  <ArrowLeft className="text-yellow-400 w-16 h-16 animate-pulse drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] filter" strokeWidth={4} />
              </div>
          </div>
      )}

      {spotlight && currentStep.overlayType === 'swipe-hand' && (
          <div className="absolute pointer-events-none z-[130]" style={{ top: spotlight.y, left: spotlight.x }}>
              <Hand className="text-white w-20 h-20 drop-shadow-2xl animate-[wiggle_1.5s_ease-in-out_infinite]" strokeWidth={2} />
              <style>{`@keyframes wiggle { 0%, 100% { transform: translateX(-30px) rotate(-15deg); } 50% { transform: translateX(30px) rotate(15deg); } }`}</style>
          </div>
      )}

      {spotlight && currentStep.overlayType === 'sparkles' && (
          <div className="absolute pointer-events-none z-[130]" style={{ top: spotlight.y - 40, left: spotlight.x - 40 }}>
              <Sparkles className="text-yellow-300 w-24 h-24 animate-spin-slow drop-shadow-[0_0_30px_rgba(253,224,71,1)]" />
          </div>
      )}

      {spotlight && currentStep.overlayType === 'tap-target' && (
          <div className="absolute pointer-events-none z-[130]" style={{ top: spotlight.y - 20, left: spotlight.x - 20 }}>
              <div className="w-10 h-10 rounded-full bg-white/50 animate-ping"></div>
              <div className="absolute inset-0 w-10 h-10 rounded-full border-4 border-white"></div>
          </div>
      )}

      {/* 4. FIXED FOOTER (LOWER THIRD - BROADCAST STYLE) */}
      <div className="fixed bottom-0 left-0 right-0 z-[200] pointer-events-auto flex justify-center">
        
        {/* TV Container */}
        <div className="w-full bg-[#0f172a] border-t-4 border-yellow-400 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-full duration-500">
            
            <div className="max-w-5xl mx-auto flex h-28 relative">
                
                {/* HOST (Left) - Breaking the 4th wall */}
                <div className="w-28 relative hidden sm:block">
                    <div className="absolute bottom-0 left-4 w-32 h-32 z-20">
                        <TourAvatar role="host" className="w-full h-full" />
                    </div>
                </div>
                {/* Mobile Host Icon */}
                <div className="w-16 flex items-center justify-center sm:hidden bg-slate-800 border-r border-white/10">
                     <TourAvatar role="host" className="w-12 h-12" />
                </div>

                {/* CONTENT (Middle) */}
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

                {/* PUNDIT (Right) & CONTROLS */}
                <div className="w-32 bg-slate-900/50 border-l border-white/10 flex flex-col items-center justify-center p-2 gap-2 relative">
                     {/* Next Button */}
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
                        <TourAvatar role="pundit" className="w-full h-full" />
                     </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};