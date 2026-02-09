import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TourStep, LanguageCode } from '../types';
import { ChevronRight, ChevronLeft, Volume2, VolumeX, Play, RotateCcw } from 'lucide-react';
import { AvatarDisplay } from './AvatarDisplay';
import { BROADCAST_TEAMS } from '../constants';

// --- HELPER: Avatar Wrapper ---
const TourAvatar: React.FC<{ role: 'host' | 'pundit'; lang: LanguageCode; className?: string }> = ({ role, lang, className }) => {
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
  
  // State for the "Frame" position
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<number | null>(null); 
  
  const currentStep = steps[currentStepIdx];

  // --- 1. RESET ON OPEN ---
  useEffect(() => {
      if (isOpen) {
          setCurrentStepIdx(0);
          setHasStarted(false);
          setIsMuted(false);
          setHighlightStyle(null);
      } else {
          if (audioRef.current) { 
              audioRef.current.pause(); 
              audioRef.current.currentTime = 0; 
          }
          if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
      }
  }, [isOpen]);

  // --- 2. SMART SCROLL & HIGHLIGHT ---
  useEffect(() => {
    if (!isOpen || !hasStarted) return;

    if (onStepChange) {
        onStepChange(currentStep.id);
    }

    // --- FIX: ONE-WAY SCROLL ONLY ---
    // We ONLY scroll if the element is hidden above the top.
    // We DO NOT scroll if the element is hidden below the bottom.
    // This prevents the "Jump" that hides the header.
    const ensureVisible = (rect: DOMRect) => {
        const HEADER_OFFSET = 140; // Approx height of Header + Padding

        // 1. Is the Top hidden behind the header?
        const isTopHidden = rect.top < HEADER_OFFSET;

        if (isTopHidden) {
            // SCROLL UP: Align top of element to HEADER_OFFSET
            const amountToScroll = rect.top - HEADER_OFFSET;
            window.scrollBy({ top: amountToScroll, behavior: 'smooth' });
        } 
        
        // DELETED: The "else if (isBottomHidden)" block. 
        // We accept that the bottom might be cut off by the footer, 
        // rather than risking the top being cut off by the header.
    };

    let hasScrolledForStep = false;

    // --- FRAME TRACKING LOOP ---
    const updateHighlight = () => {
        const targetIds = currentStep.targets || (currentStep.targetId ? [currentStep.targetId] : []);
        
        let minTop = Infinity;
        let minLeft = Infinity;
        let maxBottom = -Infinity;
        let maxRight = -Infinity;
        let foundAny = false;

        // 1. Calculate Union Bounding Box
        targetIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const rect = el.getBoundingClientRect();
                if (rect.top < minTop) minTop = rect.top;
                if (rect.left < minLeft) minLeft = rect.left;
                if (rect.bottom > maxBottom) maxBottom = rect.bottom;
                if (rect.right > maxRight) maxRight = rect.right;
                foundAny = true;
            }
        });

        if (foundAny) {
            const unionRect = {
                top: minTop,
                left: minLeft,
                width: maxRight - minLeft,
                height: maxBottom - minTop,
                bottom: maxBottom,
                right: maxRight
            } as DOMRect;

            setHighlightStyle({
                top: unionRect.top - 8,   
                left: unionRect.left - 8,
                width: unionRect.width + 16,
                height: unionRect.height + 16,
                borderRadius: '16px',
                opacity: 1
            });

            // 2. Trigger Scroll ONLY ONCE per step
            if (!hasScrolledForStep) {
                setTimeout(() => ensureVisible(unionRect), 50);
                hasScrolledForStep = true;
            }

        } else {
            setHighlightStyle({ opacity: 0 });
        }

        requestRef.current = requestAnimationFrame(updateHighlight);
    };

    // Reset scroll flag when step changes
    hasScrolledForStep = false;
    requestRef.current = requestAnimationFrame(updateHighlight);

    return () => {
        if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    };

  }, [currentStepIdx, isOpen, hasStarted, currentStep, onStepChange]);

  // --- 3. AUDIO PLAYER ---
  useEffect(() => {
    if (!isOpen) return;
    
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }

    if (hasStarted && !isMuted) {
      const src = currentStep.audioFiles[langCode] || currentStep.audioFiles['en'];
      if (src) {
          const audio = new Audio(src);
          audioRef.current = audio;
          
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
  }, [currentStepIdx, hasStarted, isMuted, isOpen, langCode, steps.length, onComplete, currentStep]);

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

  const handleReplay = () => {
      if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
      }
  };

  if (!isOpen) return null;

  const content = currentStep.display?.[langCode] || currentStep.display?.['en'];
  const audioScript = currentStep.audioScript?.[langCode] || currentStep.audioScript?.['en'];
  const isWelcome = currentStep.id === 'welcome';

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden font-sans touch-none select-none pointer-events-none">
      
      {/* 0. PULSING FRAME STYLE */}
      <style>{`
        @keyframes tour-frame-pulse {
            0% { box-shadow: 0 0 0 4px #fbbf24, 0 0 20px 4px rgba(251, 191, 36, 0.6), 0 0 0 9999px rgba(15, 23, 42, 0.85); }
            50% { box-shadow: 0 0 0 6px #f59e0b, 0 0 30px 8px rgba(251, 191, 36, 0.8), 0 0 0 9999px rgba(15, 23, 42, 0.85); }
            100% { box-shadow: 0 0 0 4px #fbbf24, 0 0 20px 4px rgba(251, 191, 36, 0.6), 0 0 0 9999px rgba(15, 23, 42, 0.85); }
        }
        .tour-frame-active {
            animation: tour-frame-pulse 2.5s infinite ease-in-out;
        }
      `}</style>

      {/* 1. WELCOME SCREEN (MODAL) */}
      {isWelcome && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 pointer-events-auto">
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

      {/* 2. THE HIGHLIGHTER FRAME */}
      {!isWelcome && highlightStyle && (
          <div 
            className="fixed z-[9998] transition-opacity duration-300 ease-out pointer-events-none tour-frame-active"
            style={{
                ...highlightStyle,
                backgroundColor: 'transparent',
                // Shadow handles the backdrop
                boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.85), 0 0 0 4px #fbbf24, 0 0 30px 4px rgba(251, 191, 36, 0.5)',
            }}
          />
      )}

      {/* 3. BROADCAST FOOTER (TV UI) */}
      {!isWelcome && (
          <div className="fixed bottom-0 left-0 right-0 z-[9999] pointer-events-auto flex justify-center">
            
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
                            
                            <div className="flex gap-2">
                                <button onClick={handleReplay} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full" title="Replay">
                                    <RotateCcw size={18} />
                                </button>
                                <button 
                                    onClick={() => setIsMuted(!isMuted)} 
                                    className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                                >
                                    {isMuted ? <VolumeX size={18}/> : <Volume2 size={18}/>}
                                </button>
                            </div>
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