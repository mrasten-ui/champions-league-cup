import React, { useState } from 'react';
import { UserProfile, Match, Prediction, Team, LanguageCode } from '../../types';
import { Sparkles, RefreshCw, BrainCircuit, WifiOff, X } from 'lucide-react';

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

// --- PERSONA CONFIGURATION ---
const PERSONAS: Record<string, any> = {
    en: {
        title: "Coach's Report",
        coachName: "Thomas Tuchel",
        coachShort: "Tuchel",
        coachImage: "/pundit/ass-uk.png",
        loading: "Reviewing game tape...",
        error: "Connection lost. Showing cached brief.",
        noGames: "No confirmed fixtures yet. We are waiting for the bracket to populate.",
        refreshLabel: "New Brief",
        lastUpdated: "Updated",
        systemPrompt: `You are Thomas Tuchel, the England national team manager, delivering a personal briefing to one of your analysts. Precise, intense, tactically obsessive. Speak directly to the user by name. Reference the real numbers — standings, gaps, specific picks. Never generic.`,
    },
    'en-US': {
        title: "Coach's Intel",
        coachName: "Mauricio Pochettino",
        coachShort: "Pochettino",
        coachImage: "/pundit/ass-us.png",
        loading: "Crunching numbers...",
        error: "Server timeout. Showing cached intel.",
        noGames: "No active matchups. Waiting for the playoffs to fill.",
        refreshLabel: "New Intel",
        lastUpdated: "Updated",
        systemPrompt: `You are Mauricio Pochettino, the USA national team manager, giving a personal briefing. Passionate, direct, emotionally invested. Speak to the user by name. Use the actual numbers — standings, rival gaps, picks. No generic advice.`,
    },
    sco: {
        title: "The Gaffer's Word",
        coachName: "Steve Clarke",
        coachShort: "Clarke",
        coachImage: "/pundit/ass-sc.png",
        loading: "Checkin' the tactics...",
        error: "The machine's gubbed. Showing last brief.",
        noGames: "Nae games yet, lad. Waitin' on the draw.",
        refreshLabel: "New Word",
        lastUpdated: "Updated",
        systemPrompt: `You are Steve Clarke, the Scotland national team manager, giving a personal briefing. Straight-talking, dry, occasionally sardonic. Speak to the user by name. Use actual standings and picks. Light Scottish tone — blunt but knowledgeable. Never sugarcoat. Never generic.`,
    },
    no: {
        title: "Trenerens Rapport",
        coachName: "Ståle Solbakken",
        coachShort: "Solbakken",
        coachImage: "/pundit/ass-no.png",
        loading: "Kobler til studio...",
        error: "Teknisk feil. Viser siste rapport.",
        noGames: "Ingen kamper klare. Vi venter på at sluttspillet skal settes.",
        refreshLabel: "Ny Rapport",
        lastUpdated: "Oppdatert",
        systemPrompt: `Du er Ståle Solbakken, Norges landslagssjef, og gir en personlig rapport. Rolig, taktisk og gjennomtenkt. Bruk de faktiske tallene — plassering, gap til rivaler, tips. Snakk direkte til brukeren med navn. Skriv på norsk. Aldri generisk.`,
    }
};

const resolveLanguage = (code: string): string => {
    if (code === 'NO') return 'no';
    if (code === 'SCO') return 'sco';
    if (code === 'US') return 'en-US';
    return 'en';
};

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
    const langKey = resolveLanguage(langCode);
    const t = PERSONAS[langKey];

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

    const matchLines = upcoming.map(m => {
        const hTeam = teams[m.homeTeamId]?.name ?? m.homeTeamId;
        const aTeam = teams[m.awayTeamId]?.name ?? m.awayTeamId;
        const myPred = allPredictions.find(p => p.userId === currentUser.email && p.matchId === m.id);
        const pick = myPred ? `${myPred.home}-${myPred.away}` : 'no pick yet';

        const rivalPreds = allPredictions.filter(p => p.matchId === m.id && p.userId !== currentUser.email);
        let rivalry = '';
        if (rivalPreds.length > 0) {
            const homeWins = rivalPreds.filter(p => p.home > p.away).length;
            const pct = Math.round((homeWins / rivalPreds.length) * 100);
            if (pct > 65) rivalry = `rivals back ${hTeam} (${pct}%)`;
            else if (pct < 35) rivalry = `rivals back ${aTeam} (${100 - pct}%)`;
            else rivalry = 'rivals are split';
        }
        return `- ${hTeam} vs ${aTeam}: ${cleanName}'s pick is ${pick}${rivalry ? `, ${rivalry}` : ''}`;
    }).join('\n');

    const prompt = `${t.systemPrompt}

Write a personal daily briefing for ${cleanName}.

CURRENT STANDING: ${leaderboardContext}

UPCOMING MATCHES:
${matchLines}

Write 2–3 punchy sentences. Reference their actual rank battle and name the rival they're chasing or defending against. Mention at least one of their specific picks and whether the crowd agrees or not. No bullet points, no headers. Plain paragraph only. Max 100 words.`;

    const { data, error } = await supabaseClient.rpc('generate_daily_brief', { prompt });
    if (error) throw error;
    return data || t.noGames;
};

// ── Widget (display only — no self-triggering) ───────────────────────────────
export const AIAnalystWidget: React.FC<AIAnalystProps> = ({
    currentLang, preloadedAnalysis, onRefresh, isRefreshing, compact, userName,
}) => {
    const langKey = resolveLanguage(currentLang || 'EN');
    const t = PERSONAS[langKey];

    const [portraitOpen, setPortraitOpen] = useState(false);

    const loading = isRefreshing || (!preloadedAnalysis && preloadedAnalysis !== '');

    const inner = (
        <div className="flex gap-3 items-stretch">
            {/* LEFT: header + commentary text */}
            <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <Sparkles size={13} className="text-indigo-300 shrink-0" />
                        <div className="min-w-0">
                            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-200 leading-none">
                                {userName ? `${userName}'s Brief` : t.title}
                            </div>
                            <div className="text-[8px] text-indigo-400/60 font-semibold tracking-wide mt-0.5">
                                {t.coachShort} · Assistant Coach
                            </div>
                        </div>
                    </div>
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={loading}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all disabled:opacity-40"
                        >
                            <RefreshCw size={11} className={`text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
                            <span className="text-[9px] font-black text-indigo-200 uppercase tracking-wide">{t.refreshLabel}</span>
                        </button>
                    )}
                </div>

                {/* Content */}
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
            </div>

            {/* RIGHT: pundit portrait — click to expand */}
            {t.coachImage && (
                <div
                    className="shrink-0 w-16 sm:w-20 min-h-[80px] relative overflow-hidden rounded-xl self-stretch cursor-pointer"
                    onClick={() => setPortraitOpen(true)}
                >
                    <img
                        src={t.coachImage}
                        alt={t.coachName}
                        className="absolute inset-0 w-full h-full object-cover object-top"
                        onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                    />
                    <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-[#1e1b4b] to-transparent pointer-events-none" />
                    {/* name + role overlay at bottom */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent pt-4 pb-1 px-1 text-center">
                        <div className="text-[7px] font-black uppercase tracking-widest text-white leading-none">{t.coachShort}</div>
                        <div className="text-[6px] text-white/60 font-semibold tracking-wide mt-0.5">Asst. Coach</div>
                    </div>
                </div>
            )}
        </div>
    );

    const portraitModal = portraitOpen ? (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
            onClick={() => setPortraitOpen(false)}
        >
            <div
                className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#0f172a]"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={t.coachImage}
                    alt={t.coachName}
                    className="w-full object-cover object-top max-h-56"
                />
                <div className="px-5 pt-4 pb-2 border-b border-white/10 text-center">
                    <div className="text-base font-black uppercase tracking-widest text-white">{t.coachName}</div>
                    <div className="text-xs text-indigo-400/70 font-semibold tracking-wide mt-0.5">Assistant Coach</div>
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
                    onClick={() => setPortraitOpen(false)}
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
            {portraitModal}
        </>
    );

    return (
        <div id="tour-ai-coach-brief" className="relative overflow-hidden rounded-2xl px-4 py-3 shadow-lg bg-gradient-to-br from-[#1e1b4b] to-[#312e81] border border-indigo-700">
            <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                <BrainCircuit size={80} />
            </div>
            <div className="relative z-10">{inner}</div>
            {portraitModal}
        </div>
    );
};
