
import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Wand2, Trash2, AlertCircle, Check } from 'lucide-react';
import { Translation } from '../types';

interface MagicWandProps {
  onOpen: () => void;
  onClear?: () => void;
  showClear?: boolean;
  lang: Translation;
}

export const MagicWand: React.FC<MagicWandProps> = ({ onOpen, onClear, showClear, lang }) => {
  const [isActive, setIsActive] = useState(true);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const deleteBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsActive(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Handle clicking outside to cancel delete confirmation
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deleteBtnRef.current && !deleteBtnRef.current.contains(event.target as Node)) {
        setIsConfirmingDelete(false);
      }
    };

    if (isConfirmingDelete) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isConfirmingDelete]);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConfirmingDelete) {
        if (onClear) {
            onClear();
            setIsConfirmingDelete(false);
        }
    } else {
        setIsConfirmingDelete(true);
    }
  };

  return (
    <div className="fixed bottom-24 md:bottom-10 right-6 z-40 flex flex-col items-center gap-4 pointer-events-none">
      
      {/* Delete Button - 2-Step Confirmation */}
      {showClear && onClear && (
        <button
          ref={deleteBtnRef}
          type="button"
          onClick={handleDeleteClick}
          className={`pointer-events-auto group relative w-14 h-14 rounded-2xl border-2 flex items-center justify-center transform transition-all duration-300 shadow-xl animate-in zoom-in slide-in-from-bottom-4 ${
            isConfirmingDelete 
                ? 'bg-red-600 border-red-700 scale-110' 
                : 'bg-white border-slate-100 hover:scale-105 hover:border-red-100'
          }`}
          title={isConfirmingDelete ? "Confirm Delete?" : lang.clearAll}
        >
           {/* Background Glow */}
           <div className={`absolute inset-0 rounded-2xl transition-colors duration-300 ${
               isConfirmingDelete ? 'bg-red-600' : 'bg-red-500/0 group-hover:bg-red-50/50'
           }`}></div>
           
           {/* Icons */}
           <div className="relative z-10 flex items-center justify-center">
                {isConfirmingDelete ? (
                    <AlertCircle size={24} className="text-white animate-pulse" strokeWidth={3} />
                ) : (
                    <Trash2 size={24} className="text-red-500 group-hover:scale-110 transition-transform duration-300" />
                )}
           </div>
           
           {/* Tooltip Label */}
           <span className={`absolute right-full mr-4 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl transition-all whitespace-nowrap pointer-events-none border shadow-2xl translate-x-2 group-hover:translate-x-0 ${
               isConfirmingDelete 
                ? 'bg-red-600 text-white border-red-500 opacity-100 translate-x-0' 
                : 'bg-[#0f172a] text-white border-white/10 opacity-0 group-hover:opacity-100'
           }`}>
             {isConfirmingDelete ? "Sure?" : lang.clearAll}
           </span>
        </button>
      )}

      {/* Main Magic Wand */}
      <button
        type="button"
        onClick={(e) => {
            e.stopPropagation();
            onOpen();
        }}
        className={`pointer-events-auto relative bg-[#0f172a] text-white p-4 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-all duration-700 border-2 ${
          isActive 
            ? 'border-yellow-400 scale-110 animate-bounce' 
            : 'border-yellow-500/20 hover:border-yellow-400/60 scale-100'
        } group active:scale-95`}
        aria-label={lang.openHand}
      >
        <div className={`absolute inset-0 bg-yellow-500/10 rounded-2xl blur-2xl transition-opacity duration-1000 ${isActive ? 'opacity-100 animate-pulse' : 'opacity-0 group-hover:opacity-100'}`}></div>
        <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-tr from-transparent via-yellow-400/20 to-transparent transition-opacity duration-1000 ${isActive ? 'opacity-100 animate-spin-slow' : 'opacity-0 group-hover:opacity-100'}`}></div>
        
        <div className="relative z-10">
           <Wand2 size={28} className={`transition-all duration-500 ${isActive ? 'text-yellow-400 scale-110 rotate-12' : 'text-slate-400 group-hover:text-yellow-400 group-hover:rotate-12'}`} />
           <Sparkles size={16} className={`absolute -top-3 -right-3 text-yellow-300 transition-all duration-1000 ${isActive ? 'opacity-100 animate-pulse' : 'opacity-0 group-hover:opacity-100'}`} />
        </div>

        <div className={`absolute -inset-2 border border-yellow-400/5 rounded-[1.5rem] transition-all duration-1000 ${isActive ? 'scale-100 opacity-100' : 'scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100'}`}></div>
      </button>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}</style>
    </div>
  );
};
