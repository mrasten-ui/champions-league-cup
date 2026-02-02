import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Match, Prediction, Team, Translation, LanguageCode } from '../../types'; 
import { GoogleGenAI } from "@google/genai";
import { HOST_KEYS } from '../../constants';
import { Sparkles, Flame, RefreshCw, BrainCircuit } from 'lucide-react';

interface AIAnalystProps {
    currentUser: UserProfile;
    combinedStats: { user: UserProfile, score: number, rank: number }[];
    nextMatches: Match[];
    allPredictions: Prediction[];
    lang: Translation;
    currentLang: LanguageCode;
    teams: Record<string, Team>;
}

// LOCAL TRANSLATIONS
const TEXT: Record<string, any> = {
    en: {
        coachTitle: "Coach's Report",
        roastTitle: "Reality Check",
        roastButton: "Roast My Picks",
        coachButton: "Reset to Coach",
        loading: "Analyzing rival strategies...",
        error: "The tactical computer is overheating... try again later.",
        home: "Home",
        away: "Away",
        draw: "Draw",
        conflict: "Conflict found",
        picked: "picked",
        promptLang: "ENGLISH"
    },
    'en-US': {
        coachTitle: "Coach's Intel",
        roastTitle: "Hot Take",
        roastButton: "Roast My Bracket",
        coachButton: "Back to Coach",
        loading: "Crunching the stats...",
        error: "Server timeout on the play... try again.",
        home: "Home",
        away: "Away",
        draw: "Tie",
        conflict: "Matchup conflict",
        picked: "picked",
        promptLang: "AMERICAN ENGLISH (Use terms like 'Soccer', 'Tie', 'Standings', 'Roster')"
    },
    sco: {
        coachTitle: "The Gaffer's Report",
        roastTitle: "Get a Grip",
        roastButton: "Roast Ma Picks",
        coachButton: "Back tae the Gaffer",
        loading: "Checkin' the tactics...",
        error: "The machine's gubbed... gie it a minute.",
        home: "Hame",
        away: "Awa",
        draw: "Draw",
        conflict: "Heads gone",
        picked: "went fur",
        promptLang: "SCOTTISH/SCOTS DIALECT (Use terms like 'Gaffer', 'Lad', 'Aye', 'Nae bother')"
    },
    no: {
        coachTitle: "Trenerens Rapport",
        roastTitle: "Realitetssjekk",
        roastButton: "Grill Mine Valg",
        coachButton: "Tilbake til Trener",
        loading: "Analyserer rivalenes strategier...",
        error: "Den taktiske datamaskinen er overopphetet... prøv igjen senere.",
        home: "Hjemme",
        away: "Borte",
        draw: "Uavgjort",
        conflict: "Konflikt funnet",
        picked: "valgte",
        promptLang: "NORWEGIAN"
    }
};

const resolveLanguage = (code: LanguageCode): string => {
    if (code === 'NO') return 'no';
    if (code === 'SCO') return 'sco';
    if (code === 'US') return 'en-US';
    return 'en';
};

export const AIAnalystWidget: React.FC<AIAnalystProps> = ({ currentUser, combinedStats, nextMatches, allPredictions, lang, currentLang, teams }) => {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<'coach' | 'roast'>('coach');
    const hasFetched = useRef(false);

    // Force correct dictionary based on currentLang prop
    const langKey = resolveLanguage(currentLang);
    const t = TEXT[langKey];

    const generateInsight = async (targetMode: 'coach' | 'roast') => {
        setLoading(true);
        setMode(targetMode);
        
        try {
            const apiKey = process.env.API_KEY || HOST_KEYS[Math.floor(Math.random() * HOST_KEYS.length)];
            const ai = new GoogleGenAI({ apiKey });

            // 1. GATHER CONTEXT
            const myStat = combinedStats.find(s => s.user.email === currentUser.email);
            const myRank = myStat?.rank || 99;
            const rivalAbove = combinedStats.find(s => s.rank === myRank - 1);
            
            // Find a "Conflict Match"
            let conflictText = "predictions align closely with your rivals";
            let keyMatch = null;

            if (rivalAbove) {
                const myPreds = allPredictions.filter(p => p.userId === currentUser.email);
                const rivalPreds = allPredictions.filter(p => p.userId === rivalAbove.user.email);

                for (const match of nextMatches.slice(0, 3)) { 
                    const mp = myPreds.find(p => p.matchId === match.id);
                    const rp = rivalPreds.find(p => p.matchId === match.id);
                    
                    if (mp && rp) {
                        const myRes = mp.home > mp.away ? t.home : mp.home < mp.away ? t.away : t.draw;
                        const rivalRes = rp.home > rp.away ? t.home : rp.home < rp.away ? t.away : t.draw;
                        
                        if (myRes !== rivalRes) {
                            const homeName = teams[match.homeTeamId]?.name || "Home";
                            const awayName = teams[match.awayTeamId]?.name || "Away";
                            keyMatch = `${homeName} vs ${awayName}`;
                            // Pass translated context to the AI
                            conflictText = `${t.conflict}: User ${t.picked} ${myRes}, Rival ${t.picked} ${rivalRes} for ${keyMatch}`;
                            break;
                        }
                    }
                }
            }

            // 2. CONSTRUCT PROMPT
            const languageInstruction = `WRITE THE RESPONSE IN ${t.promptLang}.`;
            
            const baseContext = `
                Context: Football/Soccer Prediction Game Analysis.
                User: ${currentUser.name}, Rank: #${myRank}.
                Rival Above: ${rivalAbove ? `${rivalAbove.user.name} (#${rivalAbove.rank})` : "None (1st Place)"}.
                Key Insight Data: ${conflictText}.
                ${languageInstruction}
            `;

            let prompt = "";
            if (targetMode === 'coach') {
                prompt = `${baseContext}
                Act as a strategic football analyst/coach. Write a 30-second read (max 40 words) summary.
                Structure:
                1. Acknowledge current rank.
                2. Mention the rival above and the specific match disagreement (${keyMatch || 'upcoming games'}) as the key to overtaking them.
                3. End with a specific outcome needed (e.g. "If Brazil wins...") and a reminder to use the SUB chip if unsure.
                Tone: Professional, Encouraging, Sharp.
                `;
            } else {
                prompt = `${baseContext}
                Act as a mean, funny internet troll roasting the user.
                Structure:
                1. Mock their rank #${myRank}.
                2. If they have a rival, tell them why ${rivalAbove?.user.name} is better.
                3. Mock their specific prediction for ${keyMatch || 'the next game'}.
                Tone: Savage, Funny, Short (Max 40 words).
                `;
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            });

            // Safe text check
            const responseData: any = response; 
            const text = typeof responseData.text === 'function' ? responseData.text() : responseData.text;
            
            setAnalysis(text || t.error);
        } catch (e) {
            console.error(e);
            setAnalysis(t.error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!hasFetched.current && combinedStats.length > 0) {
            generateInsight('coach');
            hasFetched.current = true;
        }
    }, [combinedStats]);

    return (
        <div className={`relative overflow-hidden rounded-2xl p-5 mb-4 shadow-lg transition-all duration-500 ${mode === 'roast' ? 'bg-gradient-to-br from-orange-900 to-red-900 border border-orange-700' : 'bg-gradient-to-br from-[#1e1b4b] to-[#312e81] border border-indigo-700'}`}>
            
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
                {mode === 'roast' ? <Flame size={120} /> : <BrainCircuit size={120} />}
            </div>

            {/* Header */}
            <div className="flex justify-between items-start relative z-10 mb-2">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${mode === 'roast' ? 'bg-orange-500/20 text-orange-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                        {mode === 'roast' ? <Flame size={18} /> : <Sparkles size={18} />}
                    </div>
                    <span className={`text-xs font-black uppercase tracking-widest ${mode === 'roast' ? 'text-orange-200' : 'text-indigo-200'}`}>
                        {mode === 'roast' ? t.roastTitle : t.coachTitle}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 min-h-[60px]">
                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        <div className="h-2 bg-white/10 rounded w-3/4"></div>
                        <div className="h-2 bg-white/10 rounded w-full"></div>
                        <div className="h-2 bg-white/10 rounded w-5/6"></div>
                    </div>
                ) : (
                    <p className="text-sm font-medium text-white/90 leading-relaxed drop-shadow-md">
                        {analysis}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="relative z-10 mt-4 flex justify-end">
                {mode === 'coach' ? (
                    <button 
                        onClick={() => generateInsight('roast')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-[10px] font-bold text-red-300 hover:text-red-200 uppercase tracking-wide group"
                    >
                        <Flame size={12} className="group-hover:scale-110 transition-transform" /> {t.roastButton}
                    </button>
                ) : (
                    <button 
                        onClick={() => generateInsight('coach')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-[10px] font-bold text-indigo-300 hover:text-indigo-200 uppercase tracking-wide"
                    >
                        <RefreshCw size={12} /> {t.coachButton}
                    </button>
                )}
            </div>
        </div>
    );
};