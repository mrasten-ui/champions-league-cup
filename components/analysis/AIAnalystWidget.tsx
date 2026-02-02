import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Match, Prediction, Team, Translation, LanguageCode } from '../../types'; 
import { GoogleGenAI } from "@google/genai";
import { HOST_KEYS } from '../../constants';
import { Sparkles, Flame, RefreshCw, BrainCircuit, Mic, Play, Pause, Radio } from 'lucide-react';

interface AIAnalystProps {
    currentUser: UserProfile;
    combinedStats: { user: UserProfile, score: number, rank: number, diff: number }[];
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
        roastTitle: "Pundit's Corner",
        roastButton: "Listen to Roast",
        coachButton: "Back to Coach",
        loading: "Connecting to studio...",
        error: "Signal lost... try again.",
        home: "Home",
        away: "Away",
        draw: "Draw",
        conflict: "Conflict",
        picked: "picked",
        promptLang: "ENGLISH"
    },
    'en-US': {
        coachTitle: "Coach's Intel",
        roastTitle: "Hot Take Studio",
        roastButton: "Play Roast",
        coachButton: "Back to Stats",
        loading: "Going live...",
        error: "Technical difficulties...",
        home: "Home",
        away: "Away",
        draw: "Tie",
        conflict: "Clash",
        picked: "took",
        promptLang: "AMERICAN ENGLISH"
    },
    sco: {
        coachTitle: "The Gaffer",
        roastTitle: "The Pundit's Box",
        roastButton: "Hear the Roast",
        coachButton: "Back tae Gaffer",
        loading: "Mic check...",
        error: "Mic's broken...",
        home: "Hame",
        away: "Awa",
        draw: "Draw",
        conflict: "Battle",
        picked: "backed",
        promptLang: "SCOTTISH ENGLISH"
    },
    no: {
        coachTitle: "Trenerens Rapport",
        roastTitle: "Studio Ekspertene",
        roastButton: "Hør Diskusjonen",
        coachButton: "Tilbake",
        loading: "Kobler til studio...",
        error: "Teknisk feil...",
        home: "Hjemme",
        away: "Borte",
        draw: "Uavgjort",
        conflict: "Konflikt",
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

// Interface for the Script format
interface ScriptLine {
    speaker: 'Host' | 'Pundit';
    text: string;
}

export const AIAnalystWidget: React.FC<AIAnalystProps> = ({ currentUser, combinedStats, nextMatches, allPredictions, lang, currentLang, teams }) => {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [script, setScript] = useState<ScriptLine[] | null>(null);
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<'coach' | 'roast'>('coach');
    const hasFetched = useRef(false);

    const langKey = resolveLanguage(currentLang || 'EN');
    const t = TEXT[langKey];

    // Podcast Player Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (mode === 'roast' && isPlaying && script && currentLineIndex < script.length) {
            // Calculate reading time based on word count (approx 200ms per word)
            const words = script[currentLineIndex].text.split(' ').length;
            const duration = Math.max(2000, words * 300); // Minimum 2s display

            interval = setTimeout(() => {
                if (currentLineIndex < script.length - 1) {
                    setCurrentLineIndex(prev => prev + 1);
                } else {
                    setIsPlaying(false); // End of script
                }
            }, duration);
        }
        return () => clearTimeout(interval);
    }, [isPlaying, currentLineIndex, script, mode]);

    const generateInsight = async (targetMode: 'coach' | 'roast') => {
        setLoading(true);
        setMode(targetMode);
        setScript(null);
        setAnalysis(null);
        setCurrentLineIndex(0);
        setIsPlaying(false);
        
        try {
            const apiKey = process.env.API_KEY || HOST_KEYS[Math.floor(Math.random() * HOST_KEYS.length)];
            const ai = new GoogleGenAI({ apiKey });

            const myStat = combinedStats.find(s => s.user.email === currentUser.email);
            const myRank = myStat?.rank || 99;
            const rivalAbove = combinedStats.find(s => s.rank === myRank - 1);
            
            let conflictText = "Predictions align closely.";
            let keyMatch = "Upcoming matches";

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
                            conflictText = `${t.conflict}: User ${t.picked} ${myRes}, Rival ${t.picked} ${rivalRes}`;
                            break;
                        }
                    }
                }
            }

            if (targetMode === 'coach') {
                const prompt = `
                    Context: Football Prediction Game. User: ${currentUser.name}, Rank: #${myRank}.
                    Rival Above: ${rivalAbove ? rivalAbove.user.name : "None"}.
                    Key Data: ${conflictText} in ${keyMatch}.
                    Task: Write a short, strategic advice summary (max 60 words).
                    Language: ${t.promptLang}.
                    Tone: Professional Coach.
                `;
                const response = await ai.models.generateContent({
                    model: 'gemini-2.0-flash',
                    contents: [{ role: 'user', parts: [{ text: prompt }] }]
                });
                const responseData: any = response; 
                setAnalysis(typeof responseData.text === 'function' ? responseData.text() : responseData.text);
            } else {
                // ROAST MODE: GENERATE JSON SCRIPT
                const prompt = `
                    Context: Football Pundit Show discussing the user ${currentUser.name} (Rank #${myRank}).
                    Rival: ${rivalAbove ? rivalAbove.user.name : "the top of the table"}.
                    Key Match: ${keyMatch}.
                    Data: ${conflictText}.
                    
                    Task: Generate a dialogue script between a HOST and a PUNDIT.
                    Format: JSON Array of objects with keys "speaker" (Host/Pundit) and "text".
                    Language: ${t.promptLang}. 
                    Style: TV Sports Debate.
                    Length: 4 exchanges (approx 45 seconds spoken).
                    
                    Characters:
                    - HOST: Professional, sets up the question.
                    - PUNDIT: opinionated, slightly mean/funny, roasting the user's rank/choices.
                    
                    Example output format:
                    [
                        {"speaker": "Host", "text": "Welcome back. Let's talk about ${currentUser.name}..."},
                        {"speaker": "Pundit", "text": "Honestly, at rank #${myRank}, it's embarrassing..."}
                    ]
                    RETURN ONLY JSON. NO MARKDOWN.
                `;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.0-flash',
                    contents: [{ role: 'user', parts: [{ text: prompt }] }]
                });
                
                const responseData: any = response; 
                const text = typeof responseData.text === 'function' ? responseData.text() : responseData.text;
                
                try {
                    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
                    const parsedScript = JSON.parse(cleanJson);
                    setScript(parsedScript);
                    setIsPlaying(true); // Auto-play
                } catch (err) {
                    console.error("JSON Parse Error", err);
                    setScript([{ speaker: "Host", text: "We are having technical difficulties receiving the pundit's feed." }]);
                }
            }

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
                {mode === 'roast' ? <Radio size={120} /> : <BrainCircuit size={120} />}
            </div>

            {/* Header */}
            <div className="flex justify-between items-start relative z-10 mb-3">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${mode === 'roast' ? 'bg-orange-500/20 text-orange-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                        {mode === 'roast' ? <Mic size={18} /> : <Sparkles size={18} />}
                    </div>
                    <span className={`text-xs font-black uppercase tracking-widest ${mode === 'roast' ? 'text-orange-200' : 'text-indigo-200'}`}>
                        {mode === 'roast' ? t.roastTitle : t.coachTitle}
                    </span>
                </div>
                {mode === 'roast' && script && (
                    <div className="flex items-center gap-2">
                        {isPlaying ? (
                            <button onClick={() => setIsPlaying(false)} className="p-1.5 bg-red-500/20 text-red-300 rounded-full hover:bg-red-500/40"><Pause size={14} fill="currentColor" /></button>
                        ) : (
                            <button onClick={() => setIsPlaying(true)} className="p-1.5 bg-green-500/20 text-green-300 rounded-full hover:bg-green-500/40"><Play size={14} fill="currentColor" /></button>
                        )}
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="relative z-10 min-h-[100px] flex flex-col justify-center">
                {loading ? (
                    <div className="space-y-3 animate-pulse">
                        <div className="h-2 bg-white/10 rounded w-3/4"></div>
                        <div className="h-2 bg-white/10 rounded w-full"></div>
                        <div className="h-2 bg-white/10 rounded w-1/2"></div>
                    </div>
                ) : mode === 'coach' ? (
                    <p className="text-sm font-medium text-white/90 leading-relaxed drop-shadow-md whitespace-pre-line">
                        {analysis}
                    </p>
                ) : (
                    // ROAST / SCRIPT UI
                    <div className="flex flex-col gap-3">
                        {script && script.map((line, idx) => {
                            // Only show current and previous lines (chat history style)
                            if (idx > currentLineIndex) return null;
                            const isCurrent = idx === currentLineIndex;
                            const isHost = line.speaker === 'Host';
                            
                            return (
                                <div key={idx} className={`flex gap-3 ${isHost ? 'flex-row' : 'flex-row-reverse'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isHost ? 'bg-blue-500/20 text-blue-200' : 'bg-orange-500/20 text-orange-200'}`}>
                                        {isHost ? 'H' : 'P'}
                                    </div>
                                    <div className={`rounded-2xl p-3 text-xs max-w-[85%] ${isHost ? 'bg-white/10 text-white rounded-tl-none' : 'bg-orange-500/10 text-orange-100 rounded-tr-none border border-orange-500/20'}`}>
                                        <div className="font-black text-[9px] uppercase opacity-50 mb-1">{line.speaker}</div>
                                        <p className={isCurrent && isPlaying ? "animate-pulse" : ""}>{line.text}</p>
                                    </div>
                                </div>
                            );
                        })}
                        {isPlaying && <div className="text-[10px] text-white/30 text-center animate-pulse mt-2">... pundit is speaking</div>}
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="relative z-10 mt-6 flex justify-end border-t border-white/5 pt-3">
                {mode === 'coach' ? (
                    <button 
                        onClick={() => generateInsight('roast')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 transition-all group"
                    >
                        <Radio size={14} className="text-orange-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black text-orange-200 uppercase tracking-wide">{t.roastButton}</span>
                    </button>
                ) : (
                    <button 
                        onClick={() => generateInsight('coach')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all"
                    >
                        <RefreshCw size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-200 uppercase tracking-wide">{t.coachButton}</span>
                    </button>
                )}
            </div>
        </div>
    );
};