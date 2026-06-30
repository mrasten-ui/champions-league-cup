import React from 'react';
import { MatchEvent, Match, Team, Translation } from '../types';

interface PenaltyShootoutProps {
    match: Match;
    events: MatchEvent[];
    teams: Record<string, Team>;
    lang: Translation;
}

const PLAYER_PHOTO = (id: number) => `https://media.api-sports.io/football/players/${id}.png`;

const MissLabel: Record<string, string> = {
    'Missed Penalty': 'Off Target',
    'Saved Penalty': 'Saved',
    'Post': 'Post',
    'Woodwork': 'Post',
};

// API-Football returns ALL PSO kicks as type:'Goal' — detail tells us if it was scored or missed.
const MISSED_DETAILS = new Set(['Missed Penalty', 'Saved Penalty', 'Post', 'Woodwork']);
const isPsoScored = (e: MatchEvent) => !MISSED_DETAILS.has(e.detail ?? '') && e.type !== 'Miss';
const isPsoMissed = (e: MatchEvent) => e.type === 'Miss' || MISSED_DETAILS.has(e.detail ?? '');

// Positions inside the goal net (scored kicks). Bottom row fills first.
// Percentages relative to the goal image container (source: 1200×480px).
const SCORED_SLOTS = [
    { left: '24%', top: '67%' },
    { left: '38%', top: '67%' },
    { left: '62%', top: '67%' },
    { left: '76%', top: '67%' },
    { left: '35%', top: '40%' },
    { left: '50%', top: '40%' },
    { left: '65%', top: '40%' },
    { left: '50%', top: '22%' },
];

// Positions outside the posts but safely inside the image boundary (alternating left/right).
// left/right kept at ≥11% so 40px circles don't clip on narrow panels.
const MISSED_SLOTS = [
    { left: '11%', top: '65%' },
    { left: '89%', top: '65%' },
    { left: '11%', top: '43%' },
    { left: '89%', top: '43%' },
    { left: '11%', top: '26%' },
];

// ─── Sub-components defined at module level to avoid remount on parent re-render ───

interface PenCircleProps {
    event: MatchEvent;
    scored: boolean;
    large?: boolean;
    delay?: number;
}

const PenCircle: React.FC<PenCircleProps> = ({ event, scored, large = false, delay }) => {
    const [photoOk, setPhotoOk] = React.useState(true);
    const playerId = event.playerId;

    return (
        <div
            className={`shrink-0 rounded-full border-2 overflow-hidden
                ${large ? 'w-10 h-10' : 'w-9 h-9'}
                ${scored
                    ? 'border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.55)]'
                    : 'border-red-400 shadow-[0_0_8px_rgba(248,113,113,0.45)]'}`}
            style={large
                ? { animation: `penCircleIn 0.45s cubic-bezier(0.34,1.56,0.64,1) ${delay ?? 0}s both` }
                : undefined}
        >
            {playerId && photoOk ? (
                <img
                    src={PLAYER_PHOTO(playerId)}
                    alt={event.player ?? ''}
                    className="w-full h-full object-cover"
                    onError={() => setPhotoOk(false)}
                />
            ) : (
                <div className={`w-full h-full flex items-center justify-center font-black
                    ${large ? 'text-[8px]' : 'text-[9px]'}
                    ${scored ? 'bg-emerald-900/80 text-emerald-300' : 'bg-red-900/60 text-red-300'}`}>
                    {(event.player ?? '?').split(' ').pop()?.slice(0, 3).toUpperCase()}
                </div>
            )}
        </div>
    );
};

interface GoalPanelProps {
    team: Team | undefined;
    kicks: MatchEvent[];
}

const GoalPanel: React.FC<GoalPanelProps> = ({ team, kicks }) => {
    const scored = kicks.filter(isPsoScored);
    const missed  = kicks.filter(isPsoMissed);

    return (
        <div className="flex-1 min-w-0">
            {/* Goal graphic with overlaid player circles */}
            <div className="relative w-full" style={{ paddingBottom: '40%' }}>
                <img
                    src="/penalty-goal.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    draggable={false}
                />

                {/* Scored players — inside the net */}
                {scored.map((kick, i) => {
                    const slot = SCORED_SLOTS[i];
                    if (!slot) return null;
                    return (
                        <div
                            key={kick.id ?? `s${i}`}
                            className="absolute -translate-x-1/2 -translate-y-1/2"
                            style={{ left: slot.left, top: slot.top }}
                        >
                            <PenCircle event={kick} scored large delay={i * 0.12} />
                        </div>
                    );
                })}

                {/* Missed players — outside the posts */}
                {missed.map((kick, i) => {
                    const slot = MISSED_SLOTS[i];
                    if (!slot) return null;
                    return (
                        <div
                            key={kick.id ?? `m${i}`}
                            className="absolute -translate-x-1/2 -translate-y-1/2"
                            style={{ left: slot.left, top: slot.top }}
                        >
                            <PenCircle event={kick} scored={false} large delay={i * 0.12} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────────

export const PenaltyShootout: React.FC<PenaltyShootoutProps> = ({ match, events, teams }) => {
    const homeTeam = teams[match.homeTeamId];
    const awayTeam = teams[match.awayTeamId];

    // API-Football represents PSO kicks as type:'Goal' at minute 120 with minuteExtra 1,2,3…
    // (not at minute 121+ as previously assumed). Missed PSO kicks use detail:'Missed Penalty'
    // rather than type:'Miss'. This filter catches all three observed formats.
    const isPsoMatch = match.status === 'P' || match.status === 'PEN';
    const isPsoKick = (e: MatchEvent): boolean => {
        if (e.type === 'Miss') return true;
        if (e.type !== 'Goal') return false;
        if (MISSED_DETAILS.has(e.detail ?? '')) return true;
        const min = e.minute ?? 0, extra = e.minuteExtra ?? 0;
        if (e.detail === 'Penalty') return min >= 121 || (min >= 120 && extra > 0);
        return isPsoMatch && (min >= 121 || (min >= 120 && extra > 0));
    };

    // Deduplicate: the sync sometimes inserts the same kick twice — once without a player name
    // and once with. Keep the one that has a player name.
    const deduped = events
        .filter(isPsoKick)
        .reduce((acc, e) => {
            const key = `${e.teamId}_${e.minute}_${e.minuteExtra ?? 0}_${e.detail}`;
            const prev = acc.get(key);
            if (!prev || (!prev.player && e.player)) acc.set(key, e);
            return acc;
        }, new Map<string, MatchEvent>());

    const kicks = [...deduped.values()].sort((a, b) => {
        const aMin = (a.minute ?? 0) * 1000 + (a.minuteExtra ?? 0);
        const bMin = (b.minute ?? 0) * 1000 + (b.minuteExtra ?? 0);
        return aMin - bMin;
    });

    // With the new filter all kicks are already PSO-only — no pre-match pen separation needed.
    const psoKicks = kicks;
    const preMatchPens: MatchEvent[] = [];

    const homeKicks = psoKicks.filter(e => e.teamId === match.homeTeamId);
    const awayKicks  = psoKicks.filter(e => e.teamId === match.awayTeamId);

    const homeTally = homeKicks.map(isPsoScored);
    const awayTally = awayKicks.map(isPsoScored);

    // Build running score for kick-by-kick list
    let runningHome = 0;
    let runningAway = 0;
    const rows = psoKicks.map((e, idx) => {
        const isHome = e.teamId === match.homeTeamId;
        const scored = isPsoScored(e);
        if (scored && isHome) runningHome++;
        if (scored && !isHome) runningAway++;
        return { e, isHome, scored, runningHome, runningAway, idx };
    });

    const finalHome = runningHome;
    const finalAway = runningAway;

    return (
        <div className="border-t border-white/10">
            <style>{`
                @keyframes penCircleIn {
                    from { opacity: 0; transform: translate(-50%, -65%) scale(0.4); }
                    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
            `}</style>

            {/* PSO Score Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#0f2545] via-[#1a3a6c] to-[#0f2545] border-b border-yellow-500/20">
                {/* Home team + kick tally dots */}
                <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        {homeTeam?.flag && (
                            <img src={homeTeam.flag} alt="" className="w-5 h-4 object-cover rounded-sm shrink-0" />
                        )}
                        <span className="text-[10px] font-black text-white/70 uppercase tracking-widest truncate">
                            {homeTeam?.name ?? match.homeTeamId}
                        </span>
                    </div>
                    {homeTally.length > 0 && (
                        <div className="flex items-center gap-1">
                            {homeTally.map((scored, i) => (
                                <span key={i} className={`w-2 h-2 rounded-full shrink-0
                                    ${scored ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            ))}
                        </div>
                    )}
                </div>

                {/* PSO score */}
                <div className="flex items-center gap-2 shrink-0 px-3">
                    <span className="text-xl font-black text-emerald-300">{finalHome}</span>
                    <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest">PSO</span>
                    <span className="text-xl font-black text-emerald-300">{finalAway}</span>
                </div>

                {/* Away team + kick tally dots */}
                <div className="flex flex-col gap-1 items-end min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-white/70 uppercase tracking-widest truncate">
                            {awayTeam?.name ?? match.awayTeamId}
                        </span>
                        {awayTeam?.flag && (
                            <img src={awayTeam.flag} alt="" className="w-5 h-4 object-cover rounded-sm shrink-0" />
                        )}
                    </div>
                    {awayTally.length > 0 && (
                        <div className="flex items-center gap-1">
                            {awayTally.map((scored, i) => (
                                <span key={i} className={`w-2 h-2 rounded-full shrink-0
                                    ${scored ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Pre-match penalties note */}
            {preMatchPens.length > 0 && (
                <div className="px-4 py-1.5 bg-amber-900/20 border-y border-amber-500/20 text-[9px] text-amber-400/70 text-center font-semibold tracking-wide">
                    {preMatchPens.length} match penalt{preMatchPens.length === 1 ? 'y' : 'ies'} scored before shootout
                </div>
            )}

            {/* Goal panels — always visible once match is in PSO, fills as kicks arrive */}
            {(match.status === 'P' || match.status === 'PEN') && (
                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10">
                    <GoalPanel team={homeTeam} kicks={homeKicks} />
                    <GoalPanel team={awayTeam} kicks={awayKicks} />
                </div>
            )}

            {/* Kick-by-kick list */}
            <div className="divide-y divide-white/5">
                {rows.length === 0 && (
                    <div className="py-8 text-center text-white/30 text-xs">
                        No shootout data yet
                        <div className="mt-1 text-[9px] text-white/20">
                            {events.length} events in · {kicks.length} pso kicks found
                        </div>
                    </div>
                )}
                {rows.map(({ e, isHome, scored, runningHome, runningAway, idx }) => {
                    const missLabel = !scored ? (MissLabel[e.detail ?? ''] ?? 'Missed') : null;
                    const playerName = e.player ? e.player.split(' ').slice(-1)[0] : '—';
                    return (
                        <div key={e.id ?? idx} className={`flex items-center gap-2 px-3 py-2.5
                            ${scored ? 'bg-white/[0.02]' : 'bg-black/10'}`}
                        >
                            {/* HOME side */}
                            <div className="flex-1 flex items-center gap-2 justify-end min-w-0">
                                {isHome ? (
                                    <>
                                        <div className="flex flex-col items-end min-w-0">
                                            <span className="text-[11px] font-bold text-white/90 leading-tight truncate">
                                                {playerName}
                                            </span>
                                            {!scored && (
                                                <span className="text-[9px] text-red-400/80 leading-none">{missLabel}</span>
                                            )}
                                        </div>
                                        <PenCircle event={e} scored={scored} />
                                        <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                                            ${scored ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}
                                        >
                                            {scored
                                                ? <img src="/wc26-ball.png" className="w-3 h-3 object-contain" alt="" />
                                                : <span className="text-red-400 text-[10px] font-black leading-none">✕</span>}
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-white/10 text-[9px]">—</span>
                                )}
                            </div>

                            {/* Running score */}
                            <div className="shrink-0 w-14 text-center">
                                <span className="text-[11px] font-black text-white/60">
                                    {runningHome}
                                    <span className="text-white/25 mx-0.5">–</span>
                                    {runningAway}
                                </span>
                            </div>

                            {/* AWAY side */}
                            <div className="flex-1 flex items-center gap-2 min-w-0">
                                {!isHome ? (
                                    <>
                                        <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                                            ${scored ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}
                                        >
                                            {scored
                                                ? <img src="/wc26-ball.png" className="w-3 h-3 object-contain" alt="" />
                                                : <span className="text-red-400 text-[10px] font-black leading-none">✕</span>}
                                        </div>
                                        <PenCircle event={e} scored={scored} />
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[11px] font-bold text-white/90 leading-tight truncate">
                                                {playerName}
                                            </span>
                                            {!scored && (
                                                <span className="text-[9px] text-red-400/80 leading-none">{missLabel}</span>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-white/10 text-[9px]">—</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Live indicator */}
            {match.status === 'P' && (
                <div className="flex items-center justify-center gap-1.5 py-2 border-t border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Live — Penalties</span>
                </div>
            )}
        </div>
    );
};
