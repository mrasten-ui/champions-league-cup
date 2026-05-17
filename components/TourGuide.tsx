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
  defaultMode?: 'audio' | 'text';
}

// --- LOCALIZATION DICTIONARY ---
const UI_STRINGS = {
  EN:  { title: 'The Tour', subtitle: 'Pre-Season Briefing', liveSubtitle: 'Live Season Briefing', assistant: 'Your Assistant', start: 'Audio Tour', startText: 'Read-Only Tour', skip: "I've played before", next: 'Next', finish: 'Finish', host: 'Host', pundit: 'Pundit' },
  US:  { title: 'The Tour', subtitle: 'Pre-Season Briefing', liveSubtitle: 'Live Season Update',   assistant: 'Your Assistant', start: 'Audio Tour', startText: 'Read-Only Tour', skip: "I've played before", next: 'Next', finish: 'Finish', host: 'Host', pundit: 'Pundit' },
  NO:  { title: 'Omvisning', subtitle: 'Før-sesong Brief',   liveSubtitle: 'Livesesong Brief',     assistant: 'Din Assistent', start: 'Lydtur', startText: 'Tekstomvisning', skip: 'Jeg har spilt før', next: 'Neste', finish: 'Ferdig', host: 'Programleder', pundit: 'Ekspert' },
  SCO: { title: 'The Tour', subtitle: 'Pre-Season Briefing', liveSubtitle: 'Live Season Briefing', assistant: 'Your Assistant', start: 'Audio Tour', startText: 'Text Tour', skip: "Aye, I ken the game", next: 'Next', finish: 'Finish', host: 'Host', pundit: 'Pundit' },
};

export const TourGuide: React.FC<TourGuideProps> = ({ steps, isOpen, onComplete, langCode, onStepChange, defaultMode = 'audio' }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [tourMode, setTourMode] = useState<'audio' | 'text'>('audio');
  
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties | null>(null);
  const [primaryIconPos, setPrimaryIconPos] = useState<{ left: string; top: string }>({ left: '50%', top: '50%' });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<number | null>(null); 
  
  const currentStep = steps[currentStepIdx];
  const ui = UI_STRINGS[langCode] || UI_STRINGS['EN'];

  // --- 1. SMART MAPPING ---
  const assetLang = langCode === 'SCO' ? 'sc' : langCode.toLowerCase();
  const configLang = langCode === 'US' ? 'en-US' : langCode === 'SCO' ? 'sco' : langCode.toLowerCase();

  // Images (String concatenation prevents Vercel build errors)
  const bannerUrlJpeg = "/pundit/banner-" + assetLang + ".jpeg";
  const bannerUrlJpg = "/pundit/banner-" + assetLang + ".jpg"; 
  const teamUrl = "/pundit/team-" + assetLang + ".png";
  const hostUrl = "/pundit/host-" + assetLang + ".png";

  // --- 2. WAKE LOCK ---
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isOpen) {
        try { wakeLock = await (navigator as any).wakeLock.request('screen'); } 
        catch (err) { console.warn('Wake Lock error:', err); }
      }
    };
    if (isOpen) requestWakeLock();
    return () => { if (wakeLock) wakeLock.release(); };
  }, [isOpen]);

  // --- 3. RESET ON OPEN ---
  useEffect(() => {
      if (isOpen) {
          setCurrentStepIdx(0);
          setHasStarted(false);
          setIsMuted(false);
          setTourMode(defaultMode);
          setHighlightStyle(null);
          setPrimaryIconPos({ left: '50%', top: '50%' });
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

    const updateHighlight = () => {
        const targetIds = currentStep.targets || (currentStep.targetId ? [currentStep.targetId] : []);

        let minTop = Infinity; let minLeft = Infinity;
        let maxBottom = -Infinity; let maxRight = -Infinity;
        let foundAny = false;
        let firstValidRect: DOMRect | null = null;

        targetIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const rect = el.getBoundingClientRect();
                if (rect.width === 0 && rect.height === 0) return; // skip hidden / display:none
                if (!firstValidRect) firstValidRect = rect;
                if (rect.top < minTop) minTop = rect.top;
                if (rect.left < minLeft) minLeft = rect.left;
                if (rect.bottom > maxBottom) maxBottom = rect.bottom;
                if (rect.right > maxRight) maxRight = rect.right;
                foundAny = true;
            }
        });

        if (foundAny) {
            const PADDING = 12;
            const frameLeft = minLeft - PADDING;
            const frameTop = minTop - PADDING;
            const frameWidth = (maxRight - minLeft) + PADDING * 2;
            const frameHeight = (maxBottom - minTop) + PADDING * 2;
            setHighlightStyle({
                top: frameTop,
                left: frameLeft,
                width: frameWidth,
                height: frameHeight,
                borderRadius: '16px',
                opacity: 1
            });
            if (firstValidRect) {
                const iconX = ((firstValidRect.left + firstValidRect.right) / 2 - frameLeft) / frameWidth * 100;
                const iconY = ((firstValidRect.top + firstValidRect.bottom) / 2 - frameTop) / frameHeight * 100;
                setPrimaryIconPos({ left: `${iconX}%`, top: `${iconY}%` });
            }
        } else {
            setHighlightStyle({ opacity: 0 });
            setPrimaryIconPos({ left: '50%', top: '50%' });
        }
        requestRef.current = requestAnimationFrame(updateHighlight);
    };

    // Delay start so React has time to re-render after any tab switch triggered by onStepChange
    const highlightTimer = setTimeout(() => {
        const targetIds = currentStep.targets || (currentStep.targetId ? [currentStep.targetId] : []);
        if (targetIds.length > 0) {
            const el = document.getElementById(targetIds[0]);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
        requestRef.current = requestAnimationFrame(updateHighlight);
    }, 350);

    return () => {
        clearTimeout(highlightTimer);
        if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    };
  }, [currentStep.id, isOpen, hasStarted, onStepChange]); 

  // --- 5. AUDIO PLAYER ---
  useEffect(() => {
    if (!isOpen) return;
    
    if (!hasStarted || isMuted) {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        return;
    }

    const src = currentStep.audioFiles[configLang as any] || currentStep.audioFiles['en'];
    
    if (src) {
        if (audioRef.current && !audioRef.current.paused && audioRef.current.src.endsWith(src)) {
            return; 
        }

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
            }, 600);
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
  }, [currentStep.id, hasStarted, isMuted, isOpen, configLang, currentStepIdx, steps.length, onComplete]); 

  // --- HANDLERS ---
  const handleStart = () => {
      setHasStarted(true);
      setIsMuted(false);
      setTourMode('audio');
  };

  const handleStartText = () => {
      setHasStarted(true);
      setIsMuted(true);
      setTourMode('text');
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

  const content = currentStep.display?.[configLang as any] || currentStep.display?.['en'];
  const audioScript = currentStep.audioScript?.[configLang as any] || currentStep.audioScript?.['en'];
    
  const isWelcome = currentStepIdx === 0 && !hasStarted;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden font-sans touch-none select-none pointer-events-none">
      
      <style>{`
        @keyframes tour-frame-pulse {
            0% { box-shadow: 0 0 0 4px #fbbf24, 0 0 20px 4px rgba(251, 191, 36, 0.6), 0 0 0 9999px rgba(15, 23, 42, 0.85); }
            50% { box-shadow: 0 0 0 6px #f59e0b, 0 0 30px 8px rgba(251, 191, 36, 0.8), 0 0 0 9999px rgba(15, 23, 42, 0.85); }
            100% { box-shadow: 0 0 0 4px #fbbf24, 0 0 20px 4px rgba(251, 191, 36, 0.6), 0 0 0 9999px rgba(15, 23, 42, 0.85); }
        }
        .tour-frame-active { animation: tour-frame-pulse 2.5s infinite ease-in-out; }
        @keyframes tour-sparkle { 0%,100% { transform: scale(0) rotate(0deg); opacity:0; } 50% { transform: scale(1) rotate(180deg); opacity:1; } }
        .tour-sparkle { animation: tour-sparkle 1.4s infinite ease-in-out; }
        @keyframes tour-swipe { 0%,100% { transform: translateX(0); opacity:0.4; } 50% { transform: translateX(14px); opacity:1; } }
        .tour-swipe { animation: tour-swipe 1.2s infinite ease-in-out; }
        @keyframes tour-ripple { 0% { transform: scale(0.4); opacity:1; } 100% { transform: scale(2); opacity:0; } }
        .tour-ripple { animation: tour-ripple 1.2s infinite ease-out; }
        @keyframes tour-arrow-up { 0%,100% { transform: translateY(0); opacity:0.5; } 50% { transform: translateY(-6px); opacity:1; } }
        @keyframes tour-arrow-down { 0%,100% { transform: translateY(0); opacity:0.5; } 50% { transform: translateY(6px); opacity:1; } }
        .tour-arrow-up { animation: tour-arrow-up 1s infinite ease-in-out; }
        .tour-arrow-down { animation: tour-arrow-down 1s infinite ease-in-out; }
      `}</style>

      {/* 1. WELCOME SCREEN (MODAL) */}
      {isWelcome && (
        <div className="absolute inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto">
            <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-300"></div>
            <div className="relative w-full sm:max-w-sm bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 border-t-4 sm:border-4 border-yellow-400" style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - 8px)', overflowY: 'auto' }}>
                <div className="h-32 sm:h-40 bg-[#0f2545] flex items-center justify-center relative overflow-hidden transition-all duration-500">
                    
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-40"
                        style={{ backgroundImage: "url('/pundit-banner.png')" }}
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f2545] to-transparent"></div>
                    <div className="relative z-10 text-center">
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter drop-shadow-lg">
                            {ui.title}
                        </h2>
                        <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mt-1">{steps[0]?.id?.startsWith('live_') ? ui.liveSubtitle : ui.subtitle}</p>
                    </div>
                </div>
                
                <div className="px-5 py-5 sm:py-8 text-center space-y-4 sm:space-y-6" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}>
                    <div className="flex justify-center -mt-12 sm:-mt-16 mb-2 sm:mb-4 relative z-20">
                        <div className="w-24 h-24 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-800 flex items-center justify-center">
                             <img 
                                src={hostUrl}
                                onError={(e) => { e.currentTarget.src = '/pundit/host-en.png'; }}
                                className="w-full h-full object-cover scale-110" 
                                alt="Host"
                             />
                        </div>
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                        <p className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 inline-block px-3 py-1 rounded-full">
                            {ui.assistant}
                        </p>
                        <p className="text-slate-800 text-sm sm:text-lg font-medium leading-relaxed italic">
                            "{content?.lines?.[0]}"
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:gap-3 pt-1 sm:pt-2">
                        {defaultMode === 'text' ? (
                            <>
                                <button
                                    onClick={handleStartText}
                                    className="w-full py-4 bg-[#0f2545] text-white rounded-xl font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-3"
                                >
                                    <VolumeX size={20} className="text-yellow-400" />
                                    <div className="flex flex-col items-start leading-none gap-0.5">
                                        <span>{ui.startText}</span>
                                        <span className="text-[9px] font-normal opacity-50 normal-case tracking-normal">~30 sec</span>
                                    </div>
                                </button>
                                <button
                                    onClick={handleStart}
                                    className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-300 text-[#0f2545] rounded-xl font-black uppercase tracking-widest text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    <Play size={16} fill="currentColor" />
                                    <div className="flex flex-col items-start leading-none gap-0.5">
                                        <span>{ui.start}</span>
                                        <span className="text-[9px] font-normal opacity-60 normal-case tracking-normal">~60 sec</span>
                                    </div>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleStart}
                                    className="w-full py-4 bg-[#0f2545] text-white rounded-xl font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-3"
                                >
                                    <Play size={20} fill="currentColor" className="text-yellow-400" />
                                    <div className="flex flex-col items-start leading-none gap-0.5">
                                        <span>{ui.start}</span>
                                        <span className="text-[9px] font-normal opacity-50 normal-case tracking-normal">~60 sec</span>
                                    </div>
                                </button>
                                <button
                                    onClick={handleStartText}
                                    className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-300 text-[#0f2545] rounded-xl font-black uppercase tracking-widest text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    <VolumeX size={16} />
                                    <div className="flex flex-col items-start leading-none gap-0.5">
                                        <span>{ui.startText}</span>
                                        <span className="text-[9px] font-normal opacity-60 normal-case tracking-normal">~30 sec</span>
                                    </div>
                                </button>
                            </>
                        )}
                        <button
                            onClick={handleSkip}
                            className="w-full py-3 border-2 border-slate-300 hover:border-slate-400 bg-transparent text-slate-500 hover:text-slate-700 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors"
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
          >
            {/* Overlay graphics driven by overlayType */}
            {currentStep.overlayType === 'sparkles' && (
                <div className="absolute inset-0 flex items-center justify-center gap-3 pointer-events-none">
                    {[0, 0.3, 0.6].map((delay, i) => (
                        <span key={i} className="tour-sparkle text-yellow-300 text-xl" style={{ animationDelay: `${delay}s` }}>✦</span>
                    ))}
                </div>
            )}
            {currentStep.overlayType === 'swipe-hand' && (
                <div className="absolute pointer-events-none" style={{ left: primaryIconPos.left, top: primaryIconPos.top, transform: 'translate(-50%, -50%)' }}>
                    <span className="tour-swipe text-3xl">👆</span>
                </div>
            )}
            {currentStep.overlayType === 'tap-target' && (
                <div className="absolute pointer-events-none" style={{ left: primaryIconPos.left, top: primaryIconPos.top, transform: 'translate(-50%, -50%)' }}>
                    <div className="relative w-10 h-10">
                        <div className="tour-ripple absolute inset-0 rounded-full border-2 border-yellow-400" />
                        <div className="absolute inset-0 flex items-center justify-center text-lg">👆</div>
                    </div>
                </div>
            )}
            {currentStep.overlayType === 'score-arrows' && (
                <div className="absolute inset-0 flex items-center justify-center gap-4 pointer-events-none">
                    <span className="tour-arrow-up text-yellow-400 text-2xl font-black">▲</span>
                    <span className="tour-arrow-down text-yellow-400 text-2xl font-black">▼</span>
                </div>
            )}
          </div>
      )}

      {/* 3. BROADCAST FOOTER (TV UI) */}
      {!isWelcome && (
          <div className="fixed bottom-0 left-0 right-0 z-[10000] pointer-events-auto flex justify-center px-0 sm:px-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>

            {/* mb-16 md:mb-0: lifts the panel above the mobile bottom nav bar (64px) */}
            <div className="w-full max-w-[1200px] relative mb-16 md:mb-0">

              {/* THE CHARACTER LAYER: Anchored to the bottom-left of the max-width container */}
              <div className="absolute bottom-0 left-0 z-[105] pointer-events-none flex items-end">
                  {/* Desktop Image */}
                  <img 
                      src={teamUrl} 
                      onError={(e) => { e.currentTarget.src = '/pundit/team-en.png'; }}
                      alt="Studio Team" 
                      className="hidden sm:block w-[280px] lg:w-[320px] h-auto object-contain object-bottom drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
                  />
                  {/* Mobile Image */}
                  <img
                      src={teamUrl}
                      onError={(e) => { e.currentTarget.src = '/pundit/team-en.png'; }}
                      className="sm:hidden block w-[110px] h-auto object-contain object-bottom drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)] -ml-2"
                      alt="Hosts"
                  />
              </div>

              {/* THE BACKGROUND BOX LAYER (Z-100) */}
              <div className="w-full bg-[#0f172a] border-t-4 border-yellow-400 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-full duration-500 flex flex-col h-28 sm:h-36 relative z-[100] rounded-t-none sm:rounded-t-2xl">
                  {/* Progress bar */}
                  <div className="w-full h-0.5 bg-white/10 shrink-0">
                    <div
                      className="h-full bg-yellow-400 transition-all duration-500 ease-out"
                      style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}
                    />
                  </div>
                  
                  {/* Row: text content + controls */}
                  <div className="flex flex-1 min-h-0">

                  {/* TEXT CONTENT: Padding-left acts as a physical barrier preventing text from going behind the images */}
                  <div className="flex-1 py-2 sm:py-3 pr-2 pl-[120px] sm:pl-[290px] lg:pl-[330px] flex flex-col justify-center min-w-0 z-[101]">
                      
                      {/* Header row: tag + step counter + audio controls */}
                      <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest border border-yellow-400/40 rounded px-1.5 py-0.5 leading-none">
                                  {content?.title}
                              </span>
                              <span className="text-[9px] font-bold text-slate-600">
                                  {currentStepIdx}/{steps.length - 1}
                              </span>
                          </div>
                          <div className="flex gap-1">
                              {tourMode === 'audio' && (
                                  <button onClick={handleReplay} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full" title="Replay">
                                      <RotateCcw size={14} />
                                  </button>
                              )}
                              <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full">
                                  {isMuted ? <VolumeX size={14}/> : <Volume2 size={14}/>}
                              </button>
                          </div>
                      </div>

                      {/* Headline + quip — no scroll, always fits */}
                      <div className="flex flex-col gap-1" style={{ maxHeight: '58px', overflow: 'hidden' }}>
                          <p className="text-white text-[13px] sm:text-[15px] font-black leading-tight">
                              {tourMode === 'text'
                                  ? (audioScript?.host || content?.lines?.[0])
                                  : (content?.lines?.[0] || audioScript?.host)
                              }
                          </p>
                          <p className="text-slate-400 text-[11px] sm:text-[12px] leading-snug italic">
                              {tourMode === 'text'
                                  ? (audioScript?.pundit || content?.lines?.[1])
                                  : content?.lines?.[1]
                              }
                          </p>
                      </div>
                  </div>

                  {/* CONTROLS (Right Edge) */}
                  <div className="w-20 sm:w-32 bg-slate-900/80 border-l border-white/10 flex flex-col items-center justify-center p-2 sm:p-3 gap-2 relative z-[101] rounded-tr-none sm:rounded-tr-2xl">
                        <button 
                          onClick={handleNext} 
                          className="w-full py-2 sm:py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-[10px] sm:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-1 shadow-lg shadow-yellow-500/20 active:scale-95 transition-all"
                        >
                          {currentStepIdx === steps.length - 1 ? ui.finish : ui.next} <ChevronRight size={14} strokeWidth={3} />
                        </button>
                        
                        <div className="flex w-full gap-1">
                          <button onClick={handlePrev} disabled={currentStepIdx <= 1} className={"flex-1 py-1.5 sm:py-2 flex justify-center rounded-md transition-colors " + (currentStepIdx <= 1 ? "text-white/10 cursor-not-allowed" : "bg-white/10 text-white hover:bg-white/20")}>
                              <ChevronLeft size={14} strokeWidth={3} />
                          </button>
                          <button onClick={handleSkip} className="flex-1 py-1.5 sm:py-2 flex justify-center text-[9px] sm:text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest rounded-md hover:bg-white/10 transition-colors">
                              Skip
                          </button>
                        </div>
                  </div>
                  </div>{/* end row */}
              </div>

            </div>
          </div>
      )}
    </div>
  , document.body);
};