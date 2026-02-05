import React, { useState } from 'react';
import { AlertTriangle, X, Lock, Unlock } from 'lucide-react';
import { Translation } from '../types';

interface SecondChanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  lang: Translation;
}

export const SecondChanceModal: React.FC<SecondChanceModalProps> = ({ isOpen, onClose, onConfirm, lang }) => {
  const [confirmText, setConfirmText] = useState('');
  const REQUIRED_TEXT = "RESET"; // Simple, universal keyword

  if (!isOpen) return null;

  const isConfirmed = confirmText.toUpperCase() === REQUIRED_TEXT;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#0f2545] to-[#1e3a8a] border border-red-500/30 rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 overflow-hidden">
        
        {/* Warning Banner */}
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
        
        <div className="flex justify-between items-start mb-6">
          <div className="p-3 bg-red-500/20 rounded-full text-red-400">
            <AlertTriangle size={32} strokeWidth={2} />
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
            <X size={20} />
          </button>
        </div>

        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 leading-none">
          {lang.secondChanceTitle}
        </h3>
        
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
          <p className="text-red-200 text-sm font-medium leading-relaxed">
            {lang.secondChanceUnlockWarn}
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-blue-200 uppercase tracking-widest">
              Type "<span className="text-white select-all">{REQUIRED_TEXT}</span>" to confirm:
            </label>
            <input 
              type="text" 
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder={REQUIRED_TEXT}
              className="w-full bg-[#0a1a2f] border border-blue-500/30 rounded-xl px-4 py-3 text-center text-white font-mono font-bold tracking-widest focus:outline-none focus:border-red-500 transition-colors uppercase"
              autoFocus
            />
          </div>

          <button 
            onClick={onConfirm} 
            disabled={!isConfirmed}
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${isConfirmed ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 scale-100' : 'bg-slate-700/50 text-slate-500 cursor-not-allowed scale-95'}`}
          >
            {isConfirmed ? <Unlock size={18} /> : <Lock size={18} />}
            {lang.secondChanceBtn}
          </button>
          
          <button onClick={onClose} className="w-full py-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-colors">
            {lang.cancelBtn}
          </button>
        </div>
      </div>
    </div>
  );
};