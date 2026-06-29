import React, { useState } from 'react';
import { PenaltyShootout } from './PenaltyShootout';
import { Match, MatchEvent, Team } from '../types';

const MOCK_MATCH: Match = {
    id: 'DEV_PSO',
    homeTeamId: 'ENG',
    awayTeamId: 'ESP',
    homeScore: 1,
    awayScore: 1,
    date: '2026-07-14T20:00:00Z',
    venue: 'MetLife Stadium',
    status: 'PEN',
    isLocked: true,
    round: 'FIN',
};

const MOCK_TEAMS: Record<string, Team> = {
    ENG: {
        id: 'ENG', name: 'England',
        flag: 'https://media.api-sports.io/flags/gb-eng.svg',
        rank: 4, rating: 1850, att: 85, mid: 83, def: 82,
    },
    ESP: {
        id: 'ESP', name: 'Spain',
        flag: 'https://media.api-sports.io/flags/es.svg',
        rank: 7, rating: 1820, att: 86, mid: 88, def: 81,
    },
};

// Full mock shootout: 5 rounds + 1 sudden death. England win 4-3.
const ALL_KICKS: MatchEvent[] = [
    { id: 1,  matchId: 'DEV_PSO', minute: 121, type: 'Goal', detail: 'Penalty',       teamId: 'ENG', player: 'Jude Bellingham',   playerId: null },
    { id: 2,  matchId: 'DEV_PSO', minute: 121, type: 'Goal', detail: 'Penalty',       teamId: 'ESP', player: 'Alvaro Morata',      playerId: null },
    { id: 3,  matchId: 'DEV_PSO', minute: 122, type: 'Miss', detail: 'Saved Penalty', teamId: 'ENG', player: 'Bukayo Saka',        playerId: null },
    { id: 4,  matchId: 'DEV_PSO', minute: 122, type: 'Goal', detail: 'Penalty',       teamId: 'ESP', player: 'Pedri',              playerId: null },
    { id: 5,  matchId: 'DEV_PSO', minute: 123, type: 'Goal', detail: 'Penalty',       teamId: 'ENG', player: 'Harry Kane',         playerId: null },
    { id: 6,  matchId: 'DEV_PSO', minute: 123, type: 'Miss', detail: 'Post',          teamId: 'ESP', player: 'Lamine Yamal',       playerId: null },
    { id: 7,  matchId: 'DEV_PSO', minute: 124, type: 'Miss', detail: 'Missed Penalty',teamId: 'ENG', player: 'Marcus Rashford',    playerId: null },
    { id: 8,  matchId: 'DEV_PSO', minute: 124, type: 'Goal', detail: 'Penalty',       teamId: 'ESP', player: 'Rodri',              playerId: null },
    { id: 9,  matchId: 'DEV_PSO', minute: 125, type: 'Goal', detail: 'Penalty',       teamId: 'ENG', player: 'Kieran Trippier',    playerId: null },
    { id: 10, matchId: 'DEV_PSO', minute: 125, type: 'Miss', detail: 'Saved Penalty', teamId: 'ESP', player: 'Dani Olmo',          playerId: null },
    // Sudden death
    { id: 11, matchId: 'DEV_PSO', minute: 126, type: 'Goal', detail: 'Penalty',       teamId: 'ENG', player: 'Phil Foden',         playerId: null },
    { id: 12, matchId: 'DEV_PSO', minute: 126, type: 'Miss', detail: 'Saved Penalty', teamId: 'ESP', player: 'Marco Asensio',      playerId: null },
];

const KICK_LABELS = ALL_KICKS.map((k, i) => {
    const team = k.teamId === 'ENG' ? 'ENG' : 'ESP';
    const result = k.type === 'Goal' ? '⚽' : '✕';
    const name = (k.player ?? '').split(' ').pop() ?? '';
    return `${i + 1}. ${result} ${team} — ${name}`;
});

export const PenaltyShootoutPreview: React.FC = () => {
    const [kickCount, setKickCount] = useState(ALL_KICKS.length);
    const [isLive, setIsLive]       = useState(false);

    const visibleKicks = ALL_KICKS.slice(0, kickCount);
    const match: Match = { ...MOCK_MATCH, status: isLive ? 'P' : 'PEN' };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center py-8 px-4 gap-6">
            {/* Dev header */}
            <div className="w-full max-w-2xl flex items-center justify-between">
                <div>
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Dev Preview</span>
                    <h1 className="text-white font-black text-lg leading-none">Penalty Shootout</h1>
                </div>
                <a href="/" className="text-[11px] text-white/40 hover:text-white/70 underline">← back to app</a>
            </div>

            {/* Controls */}
            <div className="w-full max-w-2xl bg-slate-900/80 rounded-xl p-4 flex flex-col gap-4 border border-white/10">
                <div className="flex items-center gap-3">
                    <span className="text-[11px] text-white/50 font-semibold w-20 shrink-0">Kicks shown</span>
                    <input
                        type="range"
                        min={0}
                        max={ALL_KICKS.length}
                        value={kickCount}
                        onChange={e => setKickCount(Number(e.target.value))}
                        className="flex-1 accent-emerald-400"
                    />
                    <span className="text-[11px] font-black text-emerald-300 w-6 text-right">{kickCount}</span>
                </div>

                {kickCount > 0 && (
                    <div className="text-[10px] text-white/40 font-mono">
                        {KICK_LABELS[kickCount - 1]}
                    </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                        onClick={() => setIsLive(v => !v)}
                        className={`relative w-8 h-4 rounded-full transition-colors ${isLive ? 'bg-red-500' : 'bg-slate-700'}`}
                    >
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform
                            ${isLive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-[11px] text-white/60 font-semibold">
                        {isLive ? 'Live (status: P)' : 'Finished (status: PEN)'}
                    </span>
                </label>
            </div>

            {/* Component preview — wrapped like a MatchCard */}
            <div className="w-full max-w-2xl bg-slate-900 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                {/* Fake match card header */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-800/60 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <img src="https://media.api-sports.io/flags/gb-eng.svg" alt="" className="w-6 h-5 object-cover rounded-sm" />
                        <span className="text-sm font-black text-white">England</span>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-black text-white">1 – 1</div>
                        <div className="text-[9px] font-black text-amber-400 uppercase tracking-widest">AET · Pens</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-white">Spain</span>
                        <img src="https://media.api-sports.io/flags/es.svg" alt="" className="w-6 h-5 object-cover rounded-sm" />
                    </div>
                </div>

                {/* The actual component */}
                <PenaltyShootout
                    match={match}
                    events={visibleKicks}
                    teams={MOCK_TEAMS}
                    lang={{} as never}
                />
            </div>

            <p className="text-[10px] text-white/20 text-center">
                Access via <code className="text-white/40">?pens</code> in the URL · circles use initials (no player IDs in mock data)
            </p>
        </div>
    );
};
