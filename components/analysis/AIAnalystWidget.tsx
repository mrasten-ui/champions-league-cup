import React, { useState } from 'react';
import { UserProfile, Match, Prediction, Team, LanguageCode } from '../../types';
import { Sparkles, RefreshCw, BrainCircuit, WifiOff, X, ZoomIn } from 'lucide-react';

export interface AIAnalystProps {
    currentLang: LanguageCode;
    // Pre-generated from App.tsx — displayed immediately without a fresh API call
    preloadedAnalysis?: string | null;
    onRefresh?: () => void;
    isRefreshing?: boolean;
    // compact: renders without the outer card shell — for embedding inside another card
    compact?: boolean;
    userName?: string;
}

// Generic, no-persona copy — a personal stats brief, not a fictional named
// pundit. Kept deliberately plain so a different presentation (avatar,
// mascot, whatever) can be layered on later without touching the generation
// logic below.
const COPY: Record<'en' | 'sco', any> = {
    en: {
        title: "Your Brief",
        loading: "Crunching the numbers...",
        error: "Connection lost. Showing cached brief.",
        noGames: "No confirmed fixtures yet.",
        refreshLabel: "Refresh",
        systemPrompt: `You are a sharp football data analyst writing a short personal briefing for a player in a Champions League prediction game. Precise, direct, focused on real numbers. Speak directly to the user by name. Reference the real numbers — standings, gaps, specific picks. Never generic.`,
    },
    sco: {
        title: "Yer Brief",
        loading: "Crunchin' the numbers...",
        error: "Connection's gubbed. Showin' the last brief.",
        noGames: "Nae games confirmed yet.",
        refreshLabel: "Refresh",
        systemPrompt: `You are a sharp football data analyst writing a short personal briefing for a player in a Champions League prediction game. Blunt, dry, occasionally sardonic Scottish tone — but never twee, never generic. Speak directly to the user by name. Reference the real numbers — standings, gaps, specific picks.`,
    },
};

const resolveLanguage = (code: string): 'en' | 'sco' => (code === 'SCO' ? 'sco' : 'en');

// ── Exported helper: build and fire the AI call. Used both here (refresh) and in App.tsx (pre-generate).
export const generateDailyBrief = async (
    currentUser: UserProfile,
    combinedStats: { user: UserProfile, score: number, rank: number, diff: number }[],
    nextMatches: Match[],
    allPredictions: Prediction[],
    teams: Record<string, Team>,
    langCode: LanguageCode,
    supabaseClient: any,
): Promise<string> => {
    const t = COPY[resolveLanguage(langCode)];

    const cleanName = (() => {
        const n = currentUser?.name || 'Manager';
        return n === n.toLowerCase() && !n.includes(' ')
            ? n.charAt(0).toUpperCase() + n.slice(1)
            : n;
    })();

    const myStat = combinedStats.find(s => s.user.email === currentUser.email);
    const myRank  = myStat?.rank  ?? 99;
    const myScore = myStat?.score ?? 0;
    const myIndex = combinedStats.findIndex(s => s.user.email === currentUser.email);

    // Leaderboard battle context — name the actual rivals
    const leaderboardContext = (() => {
        if (myIndex < 0) return 'Standing isolated from the pack.';
        const parts: string[] = [];
        if (myIndex === 0) {
            const behind = combinedStats[1];
            parts.push(`leading the league with ${myScore} pts`);
            if (behind) parts.push(`${behind.user.name} is breathing down their neck, only ${myScore - behind.score} pts back`);
        } else {
            const ahead  = combinedStats[myIndex - 1];
            const behind = combinedStats[myIndex + 1];
            parts.push(`ranked #${myRank} with ${myScore} pts`);
            if (ahead)  parts.push(`${myScore - ahead.score < 0 ? Math.abs(myScore - ahead.score) : ahead.score - myScore} pts behind ${ahead.user.name} in ${myIndex === 1 ? '1st' : `#${myIndex}`}`);
            if (behind) parts.push(`${myScore - behind.score} pts clear of ${behind.user.name}`);
        }
        return parts.join(', ') + '.';
    })();

    // Upcoming matches with user's picks and rival consensus
    const upcoming = [...nextMatches]
        .filter(m => m.status === 'UPCOMING' || m.status === 'NS')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);

    if (upcoming.length === 0) return t.noGames;

    const leagueMemberEmails = new Set(combinedStats.map(s => s.user.email));
    const matchLines = upcoming.map(m => {
        const hTeam = teams[m.homeTeamId]?.name ?? m.homeTeamId;
        const aTeam = teams[m.awayTeamId]?.name ?? m.awayTeamId;
        const isKnockout = !!m.round;
        const myPred = allPredictions.find(p => p.userId === currentUser.email && p.matchId === m.id);
        const pick = (() => {
            if (!myPred) return 'no pick yet';
            if (isKnockout) {
                const winner = myPred.home > myPred.away ? hTeam : myPred.away > myPred.home ? aTeam : null;
                return winner ? `${winner} to advance` : 'no pick yet';
            }
            return `${myPred.home}-${myPred.away}`;
        })();

        const rivalPreds = allPredictions.filter(p => p.matchId === m.id && p.userId !== currentUser.email && leagueMemberEmails.has(p.userId));
        let rivalry = '';
        if (rivalPreds.length > 0) {
            const homeWins = rivalPreds.filter(p => p.home > p.away).length;
            const pct = Math.round((homeWins / rivalPreds.length) * 100);
            if (pct > 65) rivalry = `rivals back ${hTeam} (${pct}%)`;
            else if (pct < 35) rivalry = `rivals back ${aTeam} (${100 - pct}%)`;
            else rivalry = 'rivals are split';
        }
        const roundLabel = m.round ? ` [${m.round}]` : '';
        return `- ${hTeam} vs ${aTeam}${roundLabel}: ${cleanName}'s pick is ${pick}${rivalry ? `, ${rivalry}` : ''}`;
    }).join('\n');

    const stageContext = upcoming.some(m => m.round)
        ? `\nSTAGE: Knockout rounds — single elimination. Players predict exact scores one round in advance, same as the League Phase; points scale up each round.\n`
        : '';

    const prompt = `${t.systemPrompt}

Write a personal daily briefing for ${cleanName}.

CURRENT STANDING: ${leaderboardContext}
${stageContext}
UPCOMING MATCHES:
${matchLines}

Write 2–3 punchy sentences. Reference their actual rank battle and name the rival they're chasing or defending against. Mention at least one of their specific picks and whether the crowd agrees or not. No bullet points, no headers. Plain paragraph only. Max 100 words.`;

    const { data, error } = await supabaseClient.functions.invoke('daily-brief', { body: { prompt } });
    if (error) throw error;
    return data?.text || t.noGames;
};

// ── Widget (display only — no self-triggering) ───────────────────────────────
export const AIAnalystWidget: React.FC<AIAnalystProps> = ({
    currentLang, preloadedAnalysis, onRefresh, isRefreshing, compact, userName,
}) => {
    const t = COPY[resolveLanguage(currentLang || 'EN')];

    const [expanded, setExpanded] = useState(false);

    const loading = isRefreshing || (!preloadedAnalysis && preloadedAnalysis !== '');

    const inner = (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 min-w-0">
                    <Sparkles size={13} className="text-indigo-300 shrink-0" />
                    <div className="text-[10px] font-black uppercase tracking-widest text-indigo-200 leading-none truncate">
                        {userName ? `${userName}'s Brief` : t.title}
                    </div>
                </div>
                {onRefresh && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onRefresh(); }}
                        disabled={loading}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all disabled:opacity-40 shrink-0"
                    >
                        <RefreshCw size={11} className={`text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
                        <span className="text-[9px] font-black text-indigo-200 uppercase tracking-wide">{t.refreshLabel}</span>
                    </button>
                )}
            </div>

            {/* Content — clickable to expand modal */}
            <div className="flex-1 cursor-pointer" onClick={() => setExpanded(true)}>
                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        <div className="text-center text-[10px] text-white/40">{t.loading}</div>
                        <div className="h-1.5 bg-white/10 rounded w-3/4 mx-auto" />
                        <div className="h-1.5 bg-white/10 rounded w-5/6 mx-auto" />
                        <div className="h-1.5 bg-white/10 rounded w-1/2 mx-auto" />
                    </div>
                ) : preloadedAnalysis ? (
                    <p className="text-xs text-white/85 leading-relaxed animate-in fade-in duration-500">
                        {preloadedAnalysis}
                    </p>
                ) : (
                    <div className="flex items-center gap-2 text-white/40 text-xs">
                        <WifiOff size={13} />
                        <span>{t.error}</span>
                    </div>
                )}
                <div className="flex justify-end mt-1.5">
                    <ZoomIn size={11} className="text-indigo-300/40" />
                </div>
            </div>
        </div>
    );

    const expandedModal = expanded ? (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
            onClick={() => setExpanded(false)}
        >
            <div
                className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#0f172a]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-5 pt-5 pb-3 border-b border-white/10 flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-300" />
                    <div className="text-sm font-black uppercase tracking-widest text-white">
                        {userName ? `${userName}'s Brief` : t.title}
                    </div>
                </div>
                <div className="px-5 py-4">
                    {loading ? (
                        <div className="space-y-2 animate-pulse">
                            <div className="text-center text-xs text-white/40">{t.loading}</div>
                            <div className="h-2 bg-white/10 rounded w-3/4 mx-auto" />
                            <div className="h-2 bg-white/10 rounded w-5/6 mx-auto" />
                            <div className="h-2 bg-white/10 rounded w-1/2 mx-auto" />
                        </div>
                    ) : preloadedAnalysis ? (
                        <p className="text-sm text-white/90 leading-relaxed">{preloadedAnalysis}</p>
                    ) : (
                        <div className="flex items-center gap-2 text-white/40 text-sm justify-center">
                            <WifiOff size={14} />
                            <span>{t.error}</span>
                        </div>
                    )}
                </div>
                {onRefresh && (
                    <div className="px-5 pb-5">
                        <button
                            onClick={onRefresh}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 transition-all disabled:opacity-40"
                        >
                            <RefreshCw size={13} className={`text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
                            <span className="text-xs font-black text-indigo-200 uppercase tracking-wide">{t.refreshLabel}</span>
                        </button>
                    </div>
                )}
                <button
                    onClick={() => setExpanded(false)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white/70 hover:text-white transition-colors"
                >
                    <X size={14} strokeWidth={3} />
                </button>
            </div>
        </div>
    ) : null;

    if (compact) return (
        <>
            <div className="relative z-10">{inner}</div>
            {expandedModal}
        </>
    );

    return (
        <div id="tour-ai-coach-brief" className="relative overflow-hidden rounded-2xl px-4 py-3 shadow-lg bg-gradient-to-br from-[#1e1b4b] to-[#312e81] border border-indigo-700">
            <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                <BrainCircuit size={80} />
            </div>
            <div className="relative z-10">{inner}</div>
            {expandedModal}
        </div>
    );
};
