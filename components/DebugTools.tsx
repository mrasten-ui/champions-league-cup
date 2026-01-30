import React, { useState } from 'react';
import { X, Database, Play, Trash2, Calendar, ShieldAlert, Lock, Unlock } from 'lucide-react';
import { Match, UserProfile, Prediction, Translation } from '../types';

interface DebugToolsProps {
  isOpen: boolean;
  onClose: () => void;
  onSeed: () => void;
  onSimulateGroups: () => void;
  onSimulateKnockouts: () => void;
  onClear: () => void;
  onTimeTravel: (timestamp: number) => void;
  onStressTest: () => void;
  isAdminMode: boolean;
  onToggleAdmin: () => void;
  // New Prop for Force Lock
  onForceLock?: (locked: boolean) => void; 
  lang: Translation;
  users: UserProfile[];
  predictions: Prediction[];
  matches: Match[];
}

export const DebugTools: React.FC<DebugToolsProps> = ({
  isOpen, onClose, onSeed, onSimulateGroups, onSimulateKnockouts, onClear, onTimeTravel, onStressTest, isAdminMode, onToggleAdmin, onForceLock, lang, users, predictions, matches
}) => {
  if (!isOpen) return null;

  const [dateInput, setDateInput] = useState('2026-06-11T14:00');
  const [isForceLocked, setIsForceLocked] = useState(false);

  const handleTimeTravelClick = () => {
      const ts = new Date(dateInput).getTime();
      onTimeTravel(ts);
  };

  const toggleForceLock = () => {
      const newState = !isForceLocked;
      setIsForceLocked(newState);
      if (onForceLock) onForceLock(newState);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER RENAMED */}
        <div className="bg-[#0f2545] p-4 flex justify-between items-center text-white border-b border-white/10">
            <div className="flex items-center gap-3">
                <div className="bg-red-500 p-2 rounded-lg"><ShieldAlert size={20} className="text-white" /></div>
                <div>
                    <h3 className="text-lg font-black uppercase tracking-widest">Management Controls</h3>
                    <p className="text-[10px] text-blue-200 font-mono">Admin & Testing Suite</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 bg-slate-50">
            
            {/* 1. TIME TRAVEL SECTION */}
            <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={14} /> Temporal Controls
                </h4>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                    <input 
                        type="datetime-local" 
                        value={dateInput} 
                        onChange={(e) => setDateInput(e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                    />
                    <button onClick={handleTimeTravelClick} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black uppercase text-xs tracking-widest shadow-md transition-all active:scale-95 whitespace-nowrap">
                        Time Travel
                    </button>
                </div>
            </div>

            {/* 2. NEW LOCK OVERRIDE SWITCH */}
            <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Lock size={14} /> Match State Overrides
                </h4>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="font-bold text-slate-800 text-sm">Force Lock All Matches</div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                            Locks upcoming matches to enable substitution testing.
                        </div>
                    </div>
                    
                    <button 
                        onClick={toggleForceLock}
                        className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none ${isForceLocked ? 'bg-red-500' : 'bg-slate-200'}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${isForceLocked ? 'translate-x-6' : 'translate-x-0'}`}>
                            {isForceLocked ? <Lock size={12} className="text-red-500" /> : <Unlock size={12} className="text-slate-400" />}
                        </div>
                    </button>
                </div>
            </div>

            {/* 3. DATA SIMULATION */}
            <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Database size={14} /> Data Simulation
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={onSeed} className="p-3 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl text-left transition-all group">
                        <div className="text-blue-600 mb-1"><Database size={18} /></div>
                        <div className="text-xs font-black text-slate-700 uppercase tracking-tight">Reset Database</div>
                    </button>
                    <button onClick={onSimulateGroups} className="p-3 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-xl text-left transition-all group">
                        <div className="text-emerald-600 mb-1"><Play size={18} /></div>
                        <div className="text-xs font-black text-slate-700 uppercase tracking-tight">Simulate Groups</div>
                    </button>
                    <button onClick={onSimulateKnockouts} className="p-3 bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 rounded-xl text-left transition-all group">
                        <div className="text-amber-600 mb-1"><Play size={18} /></div>
                        <div className="text-xs font-black text-slate-700 uppercase tracking-tight">Simulate Knockouts</div>
                    </button>
                    <button onClick={onStressTest} className="p-3 bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50 rounded-xl text-left transition-all group">
                        <div className="text-purple-600 mb-1"><Play size={18} /></div>
                        <div className="text-xs font-black text-slate-700 uppercase tracking-tight">Stress Test 3rd Place</div>
                    </button>
                </div>
            </div>

            {/* 4. DANGER ZONE */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                    Danger Zone
                </h4>
                <button onClick={onClear} className="w-full py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl border border-red-200 flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest transition-colors">
                    <Trash2 size={16} /> WIPE LOCAL DATA
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};