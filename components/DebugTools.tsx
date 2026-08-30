import React, { useState } from 'react';
import { X, ShieldAlert, Users, Trash2, Bell, Check, Calendar } from 'lucide-react';
import { UserProfile } from '../types';
import { LEAGUES } from '../constants';

interface DebugToolsProps {
  isOpen: boolean;
  onClose: () => void;
  onRevealRealResults: (upToMatchday: number) => Promise<void>;
  onResetToFuture: () => Promise<void>;
  onUpdateUserLeagues: (email: string, leagues: string[]) => Promise<void>;
  onToggleAdmin: (email: string, isAdmin: boolean) => Promise<void>;
  onRenameUser: (email: string, newName: string) => Promise<void>;
  onDeleteUser: (email: string) => Promise<void>;
  onTestNotification: (type: 'goal' | 'var' | 'og' | 'pen' | 'kit') => void;
  users: UserProfile[];
}

export const DebugTools: React.FC<DebugToolsProps> = ({
  isOpen, onClose, onRevealRealResults, onResetToFuture, onUpdateUserLeagues, onToggleAdmin, onRenameUser, onDeleteUser, onTestNotification, users
}) => {
  if (!isOpen) return null;

  const [revealMatchday, setRevealMatchday] = useState(1);
  const [revealing, setRevealing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [savingLeague, setSavingLeague] = useState<string | null>(null);
  const [renamingEmail, setRenamingEmail] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameSaving, setRenameSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);
  const [lastFiredNotif, setLastFiredNotif] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* HEADER */}
        <div className="bg-[#0f2545] p-4 flex justify-between items-center text-white border-b border-white/10">
            <div className="flex items-center gap-3">
                <div className="bg-cyan-600 p-2 rounded-lg"><ShieldAlert size={20} className="text-white" /></div>
                <div>
                    <h3 className="text-lg font-black uppercase tracking-widest">Management</h3>
                    <p className="text-[10px] text-cyan-200 font-mono">League & Tournament Controls</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 bg-slate-900">

            {/* TIME TRAVEL (real 2024/25 results) */}
            <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={14} /> Time Travel — Real 2024/25 Results
                </h4>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                    <p className="text-[11px] text-slate-400">
                        Replays the actual results from the real 2024/25 Champions League League Phase onto your seeded fixtures, so you can test standings and knockout qualification with real result patterns instead of typing scores by hand.
                    </p>
                    <div className="flex flex-col md:flex-row gap-3 items-center">
                        <select
                            value={revealMatchday}
                            onChange={(e) => setRevealMatchday(Number(e.target.value))}
                            className="flex-1 px-4 py-2 border border-white/15 rounded-lg text-sm font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-white/5 w-full md:w-auto"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(md => (
                                <option key={md} value={md} className="bg-slate-900">Through Round {md}</option>
                            ))}
                        </select>
                        <button
                            disabled={revealing}
                            onClick={async () => { setRevealing(true); try { await onRevealRealResults(revealMatchday); } finally { setRevealing(false); } }}
                            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg font-black uppercase text-xs tracking-widest shadow-md transition-all active:scale-95 whitespace-nowrap"
                        >
                            {revealing ? 'Revealing…' : 'Reveal Results'}
                        </button>
                        <button
                            disabled={resetting}
                            onClick={async () => { setResetting(true); try { await onResetToFuture(); } finally { setResetting(false); } }}
                            className="px-6 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-50 text-slate-300 rounded-lg font-black uppercase text-xs tracking-widest shadow-sm transition-all active:scale-95 whitespace-nowrap"
                        >
                            {resetting ? 'Resetting…' : 'Reset to Future'}
                        </button>
                    </div>
                </div>
            </div>

            {/* LEAGUE MEMBERS */}
            <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Users size={14} /> League Members
                </h4>
                <div className="bg-white/5 rounded-xl border border-white/10 shadow-sm overflow-hidden divide-y divide-white/10">
                    {users.sort((a, b) => a.name.localeCompare(b.name)).map(u => (
                        <div key={u.email} className="p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    {renamingEmail === u.email ? (
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={renameValue}
                                                onChange={e => setRenameValue(e.target.value)}
                                                maxLength={30}
                                                className="flex-1 text-xs font-black text-white bg-white/5 border border-cyan-500/50 rounded-lg px-2 py-1 focus:outline-none"
                                                onKeyDown={async e => {
                                                    if (e.key === 'Enter') {
                                                        const t = renameValue.trim();
                                                        if (!t) return;
                                                        setRenameSaving(true);
                                                        await onRenameUser(u.email, t);
                                                        setRenameSaving(false);
                                                        setRenamingEmail(null);
                                                    }
                                                    if (e.key === 'Escape') setRenamingEmail(null);
                                                }}
                                            />
                                            <button
                                                onClick={async () => {
                                                    const t = renameValue.trim();
                                                    if (!t) return;
                                                    setRenameSaving(true);
                                                    await onRenameUser(u.email, t);
                                                    setRenameSaving(false);
                                                    setRenamingEmail(null);
                                                }}
                                                disabled={renameSaving || !renameValue.trim()}
                                                className="shrink-0 px-2 py-1 bg-cyan-600 text-white rounded-lg text-[10px] font-black disabled:opacity-40"
                                            >
                                                {renameSaving ? '…' : '✓'}
                                            </button>
                                            <button onClick={() => setRenamingEmail(null)} className="shrink-0 px-2 py-1 bg-white/10 text-slate-300 rounded-lg text-[10px] font-black">✕</button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => { setRenamingEmail(u.email); setRenameValue(u.name); }}
                                            className="text-left group"
                                        >
                                            <div className="text-xs font-black text-white group-hover:text-cyan-400 transition-colors">{u.name} <span className="text-slate-500 text-[9px]">✎</span></div>
                                            <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
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
                                        className="px-2 py-1 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        All Leagues
                                    </button>
                                    <button
                                        onClick={() => onToggleAdmin(u.email, !u.isAdmin)}
                                        title={u.isAdmin ? 'Revoke admin' : 'Grant admin'}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors ${u.isAdmin ? 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25' : 'bg-white/5 text-slate-500 border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'}`}
                                    >
                                        {u.isAdmin ? '★ Admin' : 'Admin'}
                                    </button>
                                    {pendingDelete === u.email ? (
                                        <div className="flex items-center gap-1">
                                            <button
                                                disabled={deletingEmail === u.email}
                                                onClick={async () => {
                                                    setDeletingEmail(u.email);
                                                    await onDeleteUser(u.email);
                                                    setPendingDelete(null);
                                                    setDeletingEmail(null);
                                                }}
                                                className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                                            >
                                                {deletingEmail === u.email ? '…' : 'Confirm'}
                                            </button>
                                            <button
                                                onClick={() => setPendingDelete(null)}
                                                className="px-2 py-1 bg-white/10 hover:bg-white/15 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setPendingDelete(u.email)}
                                            title="Delete account"
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors"
                                        >
                                            <Trash2 size={12} strokeWidth={2.5} />
                                        </button>
                                    )}
                                </div>
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
                                            className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all ${isMember ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30' : 'bg-white/5 text-slate-500 border-white/10 hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/30'}`}
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

            {/* NOTIFICATION TESTER */}
            <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Bell size={14} /> Notification Tester
                </h4>
                <div className="bg-white/5 rounded-xl border border-white/10 shadow-sm p-4 space-y-3">
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                        Fire a test notification to preview how they appear. Uses Real Madrid vs Bayern München as a sample fixture.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {([
                            { type: 'goal', label: '⚽ Regular Goal',    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' },
                            { type: 'pen',  label: '⚽ Penalty Goal',    color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20' },
                            { type: 'og',   label: '⚽ Own Goal',        color: 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20' },
                            { type: 'var',  label: '🚫 VAR Disallowed', color: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30 hover:bg-fuchsia-500/20' },
                            { type: 'kit',  label: '🎽 Kits Locked In', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20', wide: true },
                        ] as Array<{ type: 'goal'|'var'|'og'|'pen'|'kit'; label: string; color: string; wide?: boolean }>).map(({ type, label, color, wide }) => (
                            <button
                                key={type}
                                onClick={() => {
                                    onTestNotification(type);
                                    setLastFiredNotif(label);
                                    setTimeout(() => setLastFiredNotif(null), 3000);
                                }}
                                className={`${wide ? 'col-span-2' : ''} px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 ${color}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {lastFiredNotif && (
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                            <Check size={11} /> Fired: {lastFiredNotif}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
