import React, { useState } from 'react';
import { X, Database, Calendar, ShieldAlert, Link, Users, Trash2 } from 'lucide-react';
import { Match, UserProfile, Prediction, Translation } from '../types';
import { LEAGUES } from '../constants';

interface DebugToolsProps {
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
  onTimeTravel: (timestamp: number) => void;
  onUpdateUserLeagues: (email: string, leagues: string[]) => Promise<void>;
  lang: Translation;
  users: UserProfile[];
  predictions: Prediction[];
  matches: Match[];
}

export const DebugTools: React.FC<DebugToolsProps> = ({
  isOpen, onClose, onClear, onTimeTravel, onUpdateUserLeagues, users
}) => {
  if (!isOpen) return null;

  const [dateInput, setDateInput] = useState('2026-06-11T14:00');
  const [savingLeague, setSavingLeague] = useState<string | null>(null);

  const MIN_DATE = "2026-06-08T00:00";
  const MAX_DATE = "2026-07-21T23:59";

  const handleTimeTravelClick = () => {
      const ts = new Date(dateInput).getTime();
      onTimeTravel(ts);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* HEADER */}
        <div className="bg-[#0f2545] p-4 flex justify-between items-center text-white border-b border-white/10">
            <div className="flex items-center gap-3">
                <div className="bg-blue-500 p-2 rounded-lg"><ShieldAlert size={20} className="text-white" /></div>
                <div>
                    <h3 className="text-lg font-black uppercase tracking-widest">Management</h3>
                    <p className="text-[10px] text-blue-200 font-mono">League & Tournament Controls</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 bg-slate-50">

            {/* 1. TIME TRAVEL */}
            <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={14} /> Temporal Controls
                </h4>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                    <input
                        type="datetime-local"
                        value={dateInput}
                        min={MIN_DATE}
                        max={MAX_DATE}
                        onChange={(e) => setDateInput(e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                    />
                    <button onClick={handleTimeTravelClick} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black uppercase text-xs tracking-widest shadow-md transition-all active:scale-95 whitespace-nowrap">
                        Time Travel
                    </button>
                </div>
                <p className="text-[10px] text-slate-400 text-center italic">
                    Range: Jun 8 – Jul 21, 2026
                </p>
            </div>

            {/* 2. LEAGUE INVITE LINKS */}
            <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Link size={14} /> League Invite Links
                </h4>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                    {Object.entries(LEAGUES).map(([slug, name]) => (
                        <div key={slug} className="p-3 flex items-center justify-between gap-3">
                            <div>
                                <div className="text-xs font-black text-slate-700">{name}</div>
                                <div className="text-[10px] font-mono text-slate-400">?invite={slug}</div>
                            </div>
                            <button
                                onClick={() => navigator.clipboard.writeText(`${window.location.origin}?invite=${slug}`)}
                                className="shrink-0 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                            >
                                Copy Link
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. LEAGUE MEMBER MANAGER */}
            <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Users size={14} /> League Members
                </h4>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                    {users.sort((a, b) => a.name.localeCompare(b.name)).map(u => (
                        <div key={u.email} className="p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xs font-black text-slate-800">{u.name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                                </div>
                                <button
                                    onClick={async () => {
                                        const allSlugs = Object.keys(LEAGUES);
                                        const current = u.leagues || [];
                                        const missing = allSlugs.filter(s => !current.includes(s));
                                        if (missing.length === 0) return;
                                        setSavingLeague(u.email + '_all');
                                        await onUpdateUserLeagues(u.email, [...current, ...missing]);
                                        setSavingLeague(null);
                                    }}
                                    disabled={savingLeague === u.email + '_all' || Object.keys(LEAGUES).every(s => (u.leagues || []).includes(s))}
                                    className="shrink-0 px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    All Leagues
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {Object.entries(LEAGUES).map(([slug, leagueName]) => {
                                    const isMember = (u.leagues || []).includes(slug);
                                    return (
                                        <button
                                            key={slug}
                                            onClick={async () => {
                                                const current = u.leagues || [];
                                                const updated = isMember
                                                    ? current.filter(s => s !== slug)
                                                    : [...current, slug];
                                                setSavingLeague(u.email + slug);
                                                await onUpdateUserLeagues(u.email, updated);
                                                setSavingLeague(null);
                                            }}
                                            disabled={savingLeague === u.email + slug}
                                            className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all ${isMember ? 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300'}`}
                                            title={isMember ? `Remove from ${leagueName}` : `Add to ${leagueName}`}
                                        >
                                            {isMember ? '✓ ' : '+ '}{leagueName}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. DANGER ZONE */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                    <Database size={14} /> Danger Zone
                </h4>
                <button onClick={onClear} className="w-full py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl border border-red-200 flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest transition-colors">
                    <Trash2 size={16} /> Wipe Local Data
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
