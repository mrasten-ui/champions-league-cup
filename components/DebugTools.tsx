import React, { useState } from 'react';
import { X, Database, Calendar, ShieldAlert, Link, Users, Trash2, Tv, Check, Globe } from 'lucide-react';
import { Match, UserProfile, Prediction, Translation, LanguageCode } from '../types';
import { LEAGUES, BROADCAST_CHANNELS, LANGUAGES } from '../constants';

interface DebugToolsProps {
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
  onTimeTravel: (timestamp: number) => void;
  onUpdateUserLeagues: (email: string, leagues: string[]) => Promise<void>;
  onUpdateMatchChannels: (matchId: string, channels: Record<string, string>) => Promise<void>;
  onBulkUpdateChannels: (locale: string, scope: 'all' | 'groups' | 'knockout', channel: string) => Promise<void>;
  leagueLangs: Record<string, LanguageCode>;
  onUpdateLeagueLang: (slug: string, lang: LanguageCode) => Promise<void>;
  onToggleAdmin: (email: string, isAdmin: boolean) => Promise<void>;
  onRenameUser: (email: string, newName: string) => Promise<void>;
  onDeleteUser: (email: string) => Promise<void>;
  onAutoFillAllUsers: () => Promise<{ filled: number; users: number }>;
  lang: Translation;
  users: UserProfile[];
  predictions: Prediction[];
  matches: Match[];
}

export const DebugTools: React.FC<DebugToolsProps> = ({
  isOpen, onClose, onClear, onTimeTravel, onUpdateUserLeagues, onUpdateMatchChannels, onBulkUpdateChannels, users, matches, predictions, leagueLangs, onUpdateLeagueLang, onToggleAdmin, onRenameUser, onDeleteUser, onAutoFillAllUsers
}) => {
  if (!isOpen) return null;

  const [dateInput, setDateInput] = useState('2026-06-11T14:00');
  const [savingLeague, setSavingLeague] = useState<string | null>(null);
  const [renamingEmail, setRenamingEmail] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameSaving, setRenameSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);
  const [filling, setFilling] = useState(false);
  const [fillResult, setFillResult] = useState<{ filled: number; users: number } | null>(null);
  const [fillConfirm, setFillConfirm] = useState(false);

  // Bulk channel state
  const [bulkLocale, setBulkLocale] = useState('NO');
  const [bulkScope, setBulkScope] = useState<'all' | 'groups' | 'knockout'>('groups');
  const [bulkChannel, setBulkChannel] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkDone, setBulkDone] = useState(false);

  // Per-match override state
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [channelInputs, setChannelInputs] = useState<Record<string, string>>({ NO: '', EN: '', SCO: '', US: '' });
  const [savingChannels, setSavingChannels] = useState(false);
  const [channelsSaved, setChannelsSaved] = useState(false);

  const allMatches = [...matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    setChannelsSaved(false);
    const m = matches.find(x => x.id === matchId);
    setChannelInputs({
      NO:  m?.channels?.['NO']  || '',
      EN:  m?.channels?.['EN']  || '',
      SCO: m?.channels?.['SCO'] || '',
      US:  m?.channels?.['US']  || '',
    });
  };

  const handleSaveChannels = async () => {
    if (!selectedMatchId) return;
    setSavingChannels(true);
    const cleaned = Object.fromEntries(Object.entries(channelInputs).filter(([, v]) => v.trim()));
    await onUpdateMatchChannels(selectedMatchId, cleaned);
    setSavingChannels(false);
    setChannelsSaved(true);
  };

  const handleBulkApply = async () => {
    if (!bulkChannel.trim()) return;
    setBulkSaving(true);
    setBulkDone(false);
    await onBulkUpdateChannels(bulkLocale, bulkScope, bulkChannel.trim());
    setBulkSaving(false);
    setBulkDone(true);
  };

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

            {/* 0. UNASSIGNED PLAYERS */}
            {(() => {
              const unassigned = users.filter(u => !u.leagues || u.leagues.length === 0);
              if (unassigned.length === 0) return null;
              return (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                    <Users size={14} />
                    Unassigned Players
                    <span className="bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded-full text-[10px] font-black">{unassigned.length}</span>
                  </h4>
                  <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                    {unassigned.map(u => (
                      <div key={u.email} className="p-3 space-y-2">
                        <div>
                          <div className="text-xs font-black text-slate-800">{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(LEAGUES).map(([slug, leagueName]) => (
                            <button
                              key={slug}
                              onClick={async () => {
                                setSavingLeague(u.email + slug);
                                await onUpdateUserLeagues(u.email, [slug]);
                                setSavingLeague(null);
                              }}
                              disabled={savingLeague === u.email + slug}
                              className="px-2 py-1 rounded-md text-[10px] font-bold border bg-slate-100 text-slate-500 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all disabled:opacity-40"
                            >
                              + {leagueName}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 1. LEAGUE DEFAULT LANGUAGES */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Globe size={14} /> League Default Languages
              </h4>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                {Object.entries(LEAGUES).map(([slug, leagueName]) => (
                  <div key={slug} className="p-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-black text-slate-700">{leagueName}</div>
                      <div className="text-[10px] font-mono text-slate-400">?invite={slug}</div>
                    </div>
                    <select
                      value={leagueLangs[slug] || 'EN'}
                      onChange={(e) => onUpdateLeagueLang(slug, e.target.value as LanguageCode)}
                      className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      {LANGUAGES.map(l => (
                        <option key={l.code} value={l.code}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. TIME TRAVEL */}
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
                                                className="flex-1 text-xs font-black text-slate-800 border border-blue-400 rounded-lg px-2 py-1 focus:outline-none"
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
                                                className="shrink-0 px-2 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-black disabled:opacity-40"
                                            >
                                                {renameSaving ? '…' : '✓'}
                                            </button>
                                            <button onClick={() => setRenamingEmail(null)} className="shrink-0 px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black">✕</button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => { setRenamingEmail(u.email); setRenameValue(u.name); }}
                                            className="text-left group"
                                        >
                                            <div className="text-xs font-black text-slate-800 group-hover:text-blue-600 transition-colors">{u.name} <span className="text-slate-300 text-[9px]">✎</span></div>
                                            <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
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
                                        className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        All Leagues
                                    </button>
                                    <button
                                        onClick={() => onToggleAdmin(u.email, !u.isAdmin)}
                                        title={u.isAdmin ? 'Revoke admin' : 'Grant admin'}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors ${u.isAdmin ? 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200'}`}
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
                                                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                                            >
                                                {deletingEmail === u.email ? '…' : 'Confirm'}
                                            </button>
                                            <button
                                                onClick={() => setPendingDelete(null)}
                                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setPendingDelete(u.email)}
                                            title="Delete account"
                                            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
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

            {/* 4. CHANNEL EDITOR */}
            <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Tv size={14} /> TV Channels
                </h4>

                {/* Bulk apply */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bulk Apply</div>
                    <div className="flex gap-2">
                        <select
                            value={bulkLocale}
                            onChange={(e) => { setBulkLocale(e.target.value); setBulkDone(false); }}
                            className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                            {['NO', 'EN', 'SCO', 'US'].map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <select
                            value={bulkScope}
                            onChange={(e) => { setBulkScope(e.target.value as any); setBulkDone(false); }}
                            className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                            <option value="groups">Group Stage only</option>
                            <option value="knockout">Knockout only</option>
                            <option value="all">All matches</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={bulkChannel}
                            onChange={(e) => { setBulkChannel(e.target.value); setBulkDone(false); }}
                            placeholder={`e.g. ${BROADCAST_CHANNELS[bulkLocale] || 'TV2'}`}
                            className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                        <button
                            onClick={handleBulkApply}
                            disabled={bulkSaving || !bulkChannel.trim()}
                            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-1 shrink-0 ${bulkDone ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40'}`}
                        >
                            {bulkDone ? <><Check size={11} /> Done</> : bulkSaving ? '...' : 'Apply'}
                        </button>
                    </div>
                </div>

                {/* Per-match override */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Override Specific Match</div>
                    <select
                        value={selectedMatchId}
                        onChange={(e) => handleSelectMatch(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                        <option value="">— Select a match —</option>
                        {allMatches.map(m => (
                            <option key={m.id} value={m.id}>
                                {m.homeTeamId} vs {m.awayTeamId} · {m.date}
                            </option>
                        ))}
                    </select>
                    {selectedMatchId && (
                        <div className="space-y-2">
                            {(['NO', 'EN', 'SCO', 'US'] as const).map(loc => (
                                <div key={loc} className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-500 w-8 shrink-0">{loc}</span>
                                    <input
                                        type="text"
                                        value={channelInputs[loc]}
                                        onChange={(e) => { setChannelInputs(prev => ({ ...prev, [loc]: e.target.value })); setChannelsSaved(false); }}
                                        placeholder={BROADCAST_CHANNELS[loc] || 'e.g. TV2'}
                                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    />
                                </div>
                            ))}
                            <button
                                onClick={handleSaveChannels}
                                disabled={savingChannels}
                                className={`w-full py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 ${channelsSaved ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                            >
                                {channelsSaved ? <><Check size={12} /> Saved</> : savingChannels ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 5. PREDICTIONS */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Users size={14} /> Predictions
                </h4>
                {(() => {
                    const upcoming = matches.filter(m => m.groupId && (m.status === 'UPCOMING' || m.status === 'NS') && !m.isLocked);
                    const incomplete = users.filter(u => {
                        const userPreds = predictions.filter(p => p.userId === u.email);
                        return upcoming.some(m => !userPreds.some(p => p.matchId === m.id));
                    });
                    return (
                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-3">
                            <div className="text-xs text-slate-600">
                                <span className="font-black text-slate-800">{incomplete.length}</span> of {users.length} players have incomplete group-stage picks
                                {incomplete.length > 0 && (
                                    <div className="mt-1 text-[10px] text-slate-500 truncate">
                                        {incomplete.map(u => u.name || u.email.split('@')[0]).join(', ')}
                                    </div>
                                )}
                            </div>
                            {fillResult ? (
                                <div className="flex items-center gap-2 text-xs font-black text-emerald-700">
                                    <Check size={13} /> Filled {fillResult.filled} predictions across {fillResult.users} players
                                </div>
                            ) : fillConfirm ? (
                                <div className="space-y-2">
                                    <p className="text-[10px] text-amber-700 font-bold">Only UPCOMING matches get filled. Already-played matches stay empty (0 pts — they missed the deadline). Confirm?</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={async () => {
                                                setFilling(true);
                                                try {
                                                    const result = await onAutoFillAllUsers();
                                                    setFillResult(result);
                                                } finally {
                                                    setFilling(false);
                                                    setFillConfirm(false);
                                                }
                                            }}
                                            disabled={filling}
                                            className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                                        >
                                            {filling ? 'Filling…' : 'Yes, Fill Now'}
                                        </button>
                                        <button onClick={() => setFillConfirm(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-black uppercase tracking-widest transition-colors">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setFillConfirm(true)}
                                    disabled={incomplete.length === 0}
                                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-40"
                                >
                                    Auto-fill missing predictions
                                </button>
                            )}
                        </div>
                    );
                })()}
            </div>

            {/* 6. DANGER ZONE */}
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
