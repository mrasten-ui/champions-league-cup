import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LanguageCode } from '../types';
import { StarField } from './StarField';

interface LiveSplashScreenProps {
  isOpen: boolean;
  onDone: () => void;
  langCode: LanguageCode;
}

const STRINGS: Record<LanguageCode, { line1: string; line2: string; cta: string }> = {
  EN:  { line1: 'THE RASTEN CUP', line2: 'IS LIVE',         cta: "LET'S GO!" },
  US:  { line1: 'THE RASTEN CUP', line2: 'HAS TIPPED OFF',  cta: 'LET\'S GO!' },
  SCO: { line1: 'THE RASTEN CUP', line2: 'IS LIVE',         cta: "LET'S GO!" },
  NO:  { line1: 'RASTEN CUP',     line2: 'ER I GANG',       cta: 'LA OSS GÅ!' },
};

export const LiveSplashScreen: React.FC<LiveSplashScreenProps> = ({ isOpen, onDone, langCode }) => {
  const [exiting, setExiting] = useState(false);
  const s = STRINGS[langCode] ?? STRINGS.EN;

  useEffect(() => {
    if (!isOpen) { setExiting(false); return; }

    // Start fade-out at 2000ms, call onDone at 2500ms
    const fadeTimer = setTimeout(() => setExiting(true), 2000);
    const doneTimer = setTimeout(() => onDone(), 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [isOpen, onDone]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 transition-opacity duration-500 ${exiting ? 'opacity-0' : 'opacity-100'}`}
    >
      <style>{`
        @keyframes live-pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        .live-dot { animation: live-pulse 1s infinite ease-in-out; }
        @keyframes live-scale-in { from { transform:scale(0.85); opacity:0; } to { transform:scale(1); opacity:1; } }
        .live-scale-in { animation: live-scale-in 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(34,211,238,0.15),_transparent_60%)] pointer-events-none" />
      <StarField density={50} variant="vivid" />

      {/* LIVE badge */}
      <div className="flex items-center gap-2 mb-8 live-scale-in relative" style={{ animationDelay: '0ms' }}>
        <span className="live-dot w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
        <span className="text-red-400 text-sm font-black uppercase tracking-[0.3em]">Live</span>
      </div>

      {/* Main title */}
      <div className="text-center live-scale-in relative" style={{ animationDelay: '100ms' }}>
        <h1 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tight leading-none bg-gradient-to-br from-cyan-300 via-cyan-200 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(34,211,238,0.4)]">
          {s.line1}
        </h1>
        <p className="text-3xl sm:text-5xl font-black text-white uppercase tracking-widest mt-2">
          {s.line2}
        </p>
      </div>

      {/* Divider */}
      <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-fuchsia-400 rounded-full mt-8 mb-8 live-scale-in relative" style={{ animationDelay: '200ms' }} />

      {/* Skip button */}
      <button
        onClick={onDone}
        className="live-scale-in text-slate-400 text-xs font-black uppercase tracking-[0.3em] hover:text-white transition-colors px-6 py-3 rounded-full border border-white/10 hover:border-white/30"
        style={{ animationDelay: '300ms' }}
      >
        {s.cta}
      </button>
    </div>,
    document.body
  );
};
