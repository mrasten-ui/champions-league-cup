import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Match, Prediction, Team, Translation, LanguageCode } from '../../types'; 
import { GoogleGenAI } from "@google/genai";
import { HOST_KEYS } from '../../constants';
import { Sparkles, Flame, RefreshCw, BrainCircuit } from 'lucide-react';

interface AIAnalystProps {
    currentUser: UserProfile;
    // Updated to include 'diff' to match AnalysisDashboard data
    combinedStats: { user: UserProfile, score: number, rank: number, diff: number }[];
    nextMatches: Match[];
    allPredictions: Prediction[];
    lang: Translation;
    currentLang: LanguageCode; // Added this required prop
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
        promptLang: "AMERICAN ENGLISH (Use terms like 'Soccer', 'Tie', 'Standings', 'Roster', 'Clinch')"
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
        promptLang: "SCOTTISH/SCOTS DIALECT (Use terms like 'Gaffer', 'Lad', 'Aye', 'Table', but keep it tactically sharp)"
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

const resolveLanguage = (code: string): string => {
    if (code === 'NO' || code === 'nb' || code === 'nn' || code === 'no-NO') return 'no';
    if (code === 'SCO') return 'sco';
    if (code === 'US' || code === 'en-US') return 'en-US';
    return 'en';
};

export const AIAnalystWidget: React.FC<AIAnalystProps> = ({ currentUser, combinedStats, nextMatches, allPredictions, lang, currentLang, teams }) => {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<'coach' | 'roast'>('coach');
    const hasFetched = useRef(false);

    // Force correct dictionary based on currentLang
    const langKey = resolveLanguage(currentLang || 'EN');
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
            let conflictText = "Predictions align closely with your rivals for the next 3 games.";
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
                            conflictText = `${t.conflict}: You ${t.picked} ${myRes}, ${rivalAbove.user.name} ${t.picked} ${rivalRes} for ${keyMatch}`;
                            break;
                        }
                    }
                }
            }

            // 2. CONSTRUCT PROMPT (UPDATED FOR DEPTH)
            const languageInstruction = `WRITE THE RESPONSE IN ${t.promptLang}. Ensure the content is STRATEGICALLY USEFUL first, with the personality/dialect second.`;
            
            const baseContext = `
                Context: Football/Soccer Prediction Game Analysis.
                User: ${currentUser.name}, Rank: #${myRank}.
                Rival Directly Above: ${rivalAbove ? `${rivalAbove.user.name} (#${rivalAbove.rank})` : "None (Currently 1st Place)"}.
                Key Strategic Data: ${conflictText}.
                Match Context: The next 3 games are crucial.
                ${languageInstruction}
            `;

            let prompt = "";
            if (targetMode === 'coach') {
                prompt = `${baseContext}
                Act as a highly intelligent strategic football analyst/coach. Write a detailed, useful analysis (approx 80-100 words).
                
                Required Structure:
                1. **Situation & Form**: Briefly analyze their current rank (#${myRank}). Are they chasing the pack or leading it? Mention their recent form/momentum.
                2. **The Tactical Battle**: Focus deeply on the rival above (${rivalAbove?.user.name}). Analyze the specific difference in prediction (${conflictText}). Explain *why* the user's choice might be the smarter risk (or the safer bet).
                3. **Scenario Planning**: Paint a concrete picture. "If [Team A] wins by 2 goals, you don't just catch [Rival], you put pressure on the top 3."
                4. **Closing Advice**: Give a sharp recommendation. Should they hold firm? Or use a SUB chip because the lineup looks shaky?
                
                Tone: Insightful, Tactical, Encouraging but Real.
                `;
            } else {
                prompt = `${baseContext}
                Act as a savage, knowledgeable football pundit/troll. Write a stinging, detailed critique (approx 80-100 words).
                
                Required Structure:
                1. **The Reality Check**: Mock their current rank (#${myRank}). If high, call it "luck that's running out". If low, ask if they're even watching the games.
                2. **The Comparison**: Explain why ${rivalAbove?.user.name} clearly knows ball better than the user.
                3. **The Bad Bet**: Roast the specific prediction in ${keyMatch || 'the next game'}. Use data to explain why that pick is delusional.
                4. **The Doom**: Predict exactly how they will fall further behind if they don't wake up.
                
                Tone: Funny, Mean, but rooted in actual football knowledge.
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
            <div className="flex justify-between items-start relative z-10 mb-3">
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
            <div className="relative z-10 min-h-[80px]">
                {loading ? (
                    <div className="space-y-3 animate-pulse">
                        <div className="h-2 bg-white/10 rounded w-3/4"></div>
                        <div className="h-2 bg-white/10 rounded w-full"></div>
                        <div className="h-2 bg-white/10 rounded w-full"></div>
                        <div className="h-2 bg-white/10 rounded w-5/6"></div>
                    </div>
                ) : (
                    <p className="text-sm font-medium text-white/90 leading-relaxed drop-shadow-md whitespace-pre-line">
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