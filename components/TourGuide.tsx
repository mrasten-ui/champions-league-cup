import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TourStep, LanguageCode } from '../types';
import { ChevronRight, ChevronLeft, Volume2, VolumeX, Play, RotateCcw } from 'lucide-react';

interface TourGuideProps {
  steps: TourStep[];
  isOpen: boolean;
  onComplete: () => void;
  langCode: LanguageCode; 
  onStepChange?: (stepId: string) => void;
}

// --- LOCALIZATION DICTIONARY ---
const UI_STRINGS = {
  EN: { title: 'The Tour', subtitle: 'Pre-Season Briefing', assistant: 'Your Assistant', start: 'Start Tour (Audio On)', skip: 'Skip intro, I know the game', next: 'Next', finish: 'Finish' },
  US: { title: 'The Tour', subtitle: 'Pre-Season Briefing', assistant: 'Your Assistant', start: 'Start Tour (Audio On)', skip: 'Skip intro, I know the game', next: 'Next', finish: 'Finish' },
  NO: { title: 'Omvisning', subtitle: 'Før-sesong Brief', assistant: 'Din Assistent', start: 'Start Tour (Med Lyd)', skip: 'Hopp over, jeg kan spillet', next: 'Neste', finish: 'Ferdig' },
  SCO: { title: 'The Tour', subtitle: 'Pre-Season Briefing', assistant: 'Your Assistant', start: 'Start Tour (Audio On)', skip: 'Skip intro, I ken the game', next: 'Next', finish: 'Finish' }, // 'Ken' = Know in Scots
};

export const TourGuide: React.FC<TourGuideProps> = ({ steps, isOpen, onComplete, langCode, onStepChange }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties | null>(null);
  
  // Audio & Frame Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<number | null>(null); 
  
  const currentStep = steps[currentStepIdx];
  const ui = UI_STRINGS[langCode] || UI_STRINGS['EN'];

  // --- 1. SETUP ASSETS ---
  const normalizedLang = langCode === 'SCO' ? 'sc' : langCode.toLowerCase();
  
  // Images
  const bannerUrlJpeg = `/pundit/banner-${normalizedLang}.jpeg`;
  const bannerUrlJpg = `/pundit/banner-${normalizedLang}.jpg`; 
  const teamUrl = `/pundit/team-${normalizedLang}.png`;
  const hostUrl = `/pundit/host-${normalizedLang}.png`;

  // --- 2. WAKE LOCK (PREVENT SCREEN SLEEP) ---
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isOpen) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('Screen Wake Lock acquired');
        } catch (err) {
          console.warn('Wake Lock error:', err);
        }
      }
    };

    if (isOpen) requestWakeLock();

    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, [isOpen]);

  // --- 3. RESET ON OPEN ---
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

  // --- 4. FRAME TRACKING & SCROLL ---
  useEffect(() => {
    if (!isOpen || !hasStarted) return;

    if (onStepChange) {
        onStepChange(currentStep.id);
    }

    // Scroll Logic: Run ONCE when step ID changes
    // We use setTimeout to allow the DOM to render the new tab content first
    const scrollTimer = setTimeout(() => {
        const targetIds = currentStep.targets || (currentStep.targetId ? [currentStep.targetId] : []);
        if (targetIds.length > 0) {
            const el = document.getElementById(targetIds[0]);
            if (el) {
                // block: 'center' is CRITICAL for mobile. 
                // It forces the element to the middle of the viewport, avoiding the header/footer cut-off.
                el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }
        }
    }, 100);

    // Frame Update Loop (Keeps the yellow box stuck to the element)
    const updateHighlight = () => {
        const targetIds = currentStep.targets || (currentStep.targetId ? [currentStep.targetId] : []);
        
        let minTop = Infinity;
        let minLeft = Infinity;
        let maxBottom = -Infinity;
        let maxRight = -Infinity;
        let foundAny = false;

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
            const PADDING = 12;
            setHighlightStyle({
                top: minTop - PADDING,
                left: minLeft - PADDING,
                width: (maxRight - minLeft) + (PADDING * 2),
                height: (maxBottom - minTop) + (PADDING * 2),
                borderRadius: '16px',
                opacity: 1
            });
        } else {
            setHighlightStyle({ opacity: 0 });
        }
        requestRef.current = requestAnimationFrame(updateHighlight);
    };

    requestRef.current = requestAnimationFrame(updateHighlight);

    return () => {
        clearTimeout(scrollTimer);
        if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    };

  // DEPENDENCY FIX: Only re-run if step ID changes. 
  // 'steps' or 'currentStep' objects change on every render, causing loops. 'currentStep.id' is stable.
  }, [currentStep.id, isOpen, hasStarted]); 

  // --- 5. AUDIO PLAYER (FIXED RESTART ISSUE) ---
  const getAudioSource = () => {
      const files = currentStep.audioFiles;
      if (!files) return null;
      if (files[normalizedLang]) return files[normalizedLang];
      if (files[langCode]) return files[langCode];
      if (files[langCode.toLowerCase()]) return files[langCode.toLowerCase()];
      if (langCode === 'SCO' && files['sco']) return files['sco'];
      if (langCode === 'US' && files['us']) return files['us'];
      return files['en'];
  };

  useEffect(() => {
    if (!isOpen) return;
    
    // Stop audio if tour closed or muted
    if (!hasStarted || isMuted) {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        return;
    }

    const src = getAudioSource();
    if (src) {
        // PREVENT RESTART: Check if we are already playing this exact URL
        if (audioRef.current && !audioRef.current.paused && audioRef.current.src.endsWith(src)) {
            return; // Already playing correctly, do nothing.
        }

        // If different, load new audio
        if (audioRef.current) {
             audioRef.current.pause();
             audioRef.current.currentTime = 0;
        }

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

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                if (error.name !== 'AbortError') {
                    console.error("[TourGuide] Audio playback error:", error);
                }
            });
        }
    }
  }, [currentStep.id, hasStarted, isMuted, isOpen, langCode]); // Depend on ID, not object

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
          audioRef.current.play().catch(() => {});
      }
  };

  if (!isOpen) return null;

  const content = currentStep.display?.[langCode] || currentStep.display?.['en'];
  const audioScript = currentStep.audioScript?.[langCode] || currentStep.audioScript?.['en'];
  const isWelcome = currentStep.id === 'welcome';

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden font-sans touch-none select-none pointer-events-none">
      
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
                <div className="h-40 bg-[#0f2545] flex items-center justify-center relative overflow-hidden transition-all duration-500">
                    
                    {/* BANNER (With Fallback) */}
                    <div 
                        className="absolute inset-0 bg-cover bg-center opacity-40 transition-all duration-500"
                        style={{ backgroundImage: `url('${bannerUrlJpeg}')` }}
                    >
                        <img 
                            src={bannerUrlJpeg} 
                            onError={(e) => { 
                                const parent = e.currentTarget.parentElement;
                                e.currentTarget.onerror = null; 
                                if (parent) {
                                    const img = new Image();
                                    img.src = bannerUrlJpg;
                                    img.onload = () => { if(parent) parent.style.backgroundImage = `url('${bannerUrlJpg}')`; };
                                    img.onerror = () => { if(parent) parent.style.backgroundImage = "url('/pundit/banner-en.jpeg')"; }; 
                                }
                            }}
                            className="hidden" 
                            alt="" 
                        />
                    </div>
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f2545] to-transparent"></div>
                    <div className="relative z-10 text-center">
                        {/* LOCALIZED INTRO TEXT */}
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter drop-shadow-lg">
                            {ui.title}
                        </h2>
                        <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mt-1">{ui.subtitle}</p>
                    </div>
                </div>
                
                <div className="px-6 py-8 text-center space-y-6">
                    {/* HOST AVATAR (Welcome Screen Only) */}
                    <div className="flex justify-center -mt-16 mb-4 relative z-20">
                        <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-800 flex items-center justify-center">
                             <img 
                                src={hostUrl}
                                onError={(e) => { e.currentTarget.src = '/pundit/host-en.png'; }}
                                className="w-full h-full object-cover scale-110" 
                                alt="Host"
                             />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 inline-block px-3 py-1 rounded-full">
                            {ui.assistant}
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
                            <span>{ui.start}</span>
                        </button>
                        <button 
                            onClick={handleSkip}
                            className="w-full py-3 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors"
                        >
                            {ui.skip}
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
                boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.85), 0 0 0 4px #fbbf24, 0 0 30px 4px rgba(251, 191, 36, 0.5)',
            }}
          />
      )}

      {/* 3. BROADCAST FOOTER (TV UI) */}
      {!isWelcome && (
          <div className="fixed bottom-0 left-0 right-0 z-[10000] pointer-events-auto flex justify-center">
            
            <div className="w-full bg-[#0f172a] border-t-4 border-yellow-400 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-full duration-500">
                
                <div className="max-w-5xl mx-auto flex h-28 relative">
                    
                    {/* LEFT: THE STUDIO DESK (Unified Team Image) */}
                    <div className="w-48 relative hidden sm:block">
                        <div className="absolute bottom-0 left-0 w-64 h-52 z-50 flex items-end transition-transform hover:scale-105 duration-300 origin-bottom-left">
                            <img 
                                src={teamUrl} 
                                onError={(e) => { 
                                    const target = e.currentTarget;
                                    target.onerror = null; 
                                    target.src = '/pundit/team-en.png'; 
                                }}
                                alt="Studio Team" 
                                className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                            />
                        </div>
                    </div>

                    {/* Mobile Host Icon */}
                    <div className="w-20 flex items-center justify-center sm:hidden bg-slate-800 border-r border-white/10 overflow-hidden relative">
                          <img 
                                src={teamUrl}
                                onError={(e) => { e.currentTarget.src = '/pundit/team-en.png'; }}
                                className="w-24 h-24 object-contain mt-4" 
                                alt="Hosts"
                          />
                    </div>

                    {/* TEXT CONTENT (Middle) */}
                    <div className="flex-1 p-4 flex flex-col justify-center min-w-0 pl-4 sm:pl-56">
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
                            {currentStepIdx === steps.length - 1 ? ui.finish : ui.next} <ChevronRight size={14} strokeWidth={3} />
                          </button>
                          
                          <div className="flex w-full gap-1 z-20">
                            <button onClick={handlePrev} disabled={currentStepIdx <= 1} className={`flex-1 py-1.5 flex justify-center rounded-md transition-colors ${currentStepIdx <= 1 ? 'text-white/10 cursor-not-allowed' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                                <ChevronLeft size={16} strokeWidth={3} />
                            </button>
                            <button onClick={handleSkip} className="flex-1 py-1.5 flex justify-center text-[9px] font-bold text-slate-500 hover:text-white uppercase tracking-widest rounded-md hover:bg-white/10 transition-colors">
                                Skip
                            </button>
                          </div>
                    </div>
                </div>
            </div>
          </div>
      )}
    </div>
  , document.body);
};