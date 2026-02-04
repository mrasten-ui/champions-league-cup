import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserProfile, Match, Prediction, Team, Translation, LanguageCode } from '../../types'; 
import { GoogleGenAI } from "@google/genai";
import { HOST_KEYS } from '../../constants';
import { Sparkles, RefreshCw, BrainCircuit, Mic, Play, Pause, Radio, Volume2, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabase';

interface AIAnalystProps {
    currentUser: UserProfile;
    combinedStats: { user: UserProfile, score: number, rank: number, diff: number }[];
    nextMatches: Match[];
    allPredictions: Prediction[];
    lang: Translation;
    currentLang: LanguageCode;
    teams: Record<string, Team>;
}

// --- PERSONA CONFIGURATION  ---
const PERSONAS: Record<string, any> = {
    en: {
        coachTitle: "Coach's Report",
        roastTitle: "Pundit's Corner",
        roastButton: "Listen to Roast",
        coachButton: "Back to Coach",
        loading: "Reviewing game tape...",
        error: "Connection lost. Try again later.",
        noGamesCoach: "No confirmed fixtures yet. We are waiting for the bracket to populate.",
        
        // COACH
        coachPrompt: `
            ROLE: Fantasy League Manager & Tactician.
            GOAL: Analyze the "Points Swing" for the user.
            CONTEXT TO USE:
            - RIVALS: Mention specific names of who is ahead (Target) and behind (Threat).
            - RISK: Is the user's pick different from the pack? (Differential)
            STRUCTURE:
            1. THE SITUATION: "You are chasing [Name Ahead] but [Name Behind] is closing in."
            2. THE PLAY: "You've backed [Team] to win. Most rivals went for [Other Team]."
            3. THE OUTCOME: "If this hits, you climb. If it misses, you're in trouble."
            TONE: Serious, competitive, focused on winning the league.
        `,
        
        // PUNDIT
        roastPrompt: `
            ROLE: UK Sports Broadcast.
            CHARACTERS: Sarah (Host, Posh) & Gaz (Pundit, Scouse).
            RULES:
            1. GAZ: Challenge the user by name. "What are you on about, [Name]?!"
            2. GAZ: Reference the specific match. "There is NO WAY [Team A] beats [Team B]!"
            3. SARAH: Sign-off MUST be: "Well, you heard it here first. Good luck, [Name]!"
        `
    },
    'en-US': {
        coachTitle: "Coach's Intel",
        roastTitle: "Hot Take Studio",
        roastButton: "Play Roast",
        coachButton: "Back to Stats",
        loading: "Crunching numbers...",
        error: "Server timeout...",
        noGamesCoach: "No active matchups. Waiting for the playoffs to fill.",
        coachPrompt: "ROLE: Fantasy Coach. FOCUS: Beating the rivals. Use names. Explain the points swing.",
        roastPrompt: `
            ROLE: US Sports Radio. 
            CHARACTERS: Jessica (Host) & Chuck (Shock Jock).
            CHUCK: Challenge the user ("Are you kidding me, [Name]?"). 
            JESSICA Sign-off: "You heard it here first. Good luck!"
        `
    },
    sco: {
        coachTitle: "The Gaffer",
        roastTitle: "The Pundit's Box",
        roastButton: "Hear the Roast",
        coachButton: "Back tae Gaffer",
        loading: "Checkin' the tactics...",
        error: "The machine's gubbed...",
        noGamesCoach: "Nae games yet, lad. Waitin' on the draw.",
        coachPrompt: "ROLE: The Gaffer. FOCUS: The League Table. Tell the lad who he needs to beat.",
        roastPrompt: `
            ROLE: Scottish Broadcast Team.
            CHARACTERS: Shona (Host) & Rab (Pundit).
            RAB: "Whit are ye on aboot, [Name]?"
            SHONA Sign-off: "Ye heard it here first. Good luck!"
        `
    },
    no: {
        coachTitle: "Trenerens Rapport",
        roastTitle: "Studio Ekspertene",
        roastButton: "Hør Diskusjonen",
        coachButton: "Tilbake",
        loading: "Kobler til studio...",
        error: "Teknisk feil...",
        noGamesCoach: "Ingen kamper klare. Vi venter på at sluttspillet skal settes.",
        coachPrompt: "ROLLE: Fantasy-ekspert. FOKUS: Tabellen. Nevn navn på rivalene. Forklar at tipset er nøkkelen.",
        roastPrompt: `
            ROLLE: Norsk TV-Studio.
            KARAKTERER: Silje (Host) & Nils Arne (Pundit).
            REGLER:
            1. NILS ARNE: Må være entusiastisk. Nevn "Brasil i 98" eller "Godfoten".
            2. UTFORDRING: "Hva er det du driver med, [Name]?!"
            3. SIGNATUR: "Du hørte det her først. Lykke til!"
        `
    }
};

const resolveLanguage = (code: string): string => {
    if (code === 'NO' || code === 'nb' || code === 'nn' || code === 'no-NO') return 'no';
    if (code === 'SCO') return 'sco';
    if (code === 'US' || code === 'en-US') return 'en-US';
    return 'en';
};

interface ScriptLine {
    speaker: 'Host' | 'Pundit' | string;
    text: string;
    audioUrl?: string | null;
}

export const AIAnalystWidget: React.FC<AIAnalystProps> = ({ currentUser, combinedStats, nextMatches, allPredictions, lang, currentLang, teams }) => {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [script, setScript] = useState<ScriptLine[] | null>(null);
    
    // Playback State
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [audioError, setAudioError] = useState(false);
    const [displayedText, setDisplayedText] = useState(""); 
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const typewriterRef = useRef<any>(null);

    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<'coach' | 'roast'>('coach');
    
    // Track the "Next Match ID" to trigger updates when time travels
    const nextMatchId = useMemo(() => {
        const upcoming = nextMatches
            .filter(m => m.status === 'UPCOMING')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return upcoming.length > 0 ? upcoming[0].id : 'none';
    }, [nextMatches]);

    const langKey = resolveLanguage(currentLang || 'EN');
    const t = PERSONAS[langKey];

    const getFormattedName = () => {
        if (!currentUser?.name) return "Manager";
        const name = currentUser.name;
        if (name === name.toLowerCase() && !name.includes(' ')) {
            return name.charAt(0).toUpperCase() + name.slice(1);
        }
        return name;
    };

    // --- JSON PARSER ---
    const extractJson = (text: string) => {
        try {
            return JSON.parse(text);
        } catch (e) {
            const start = text.indexOf('[');
            const end = text.lastIndexOf(']');
            if (start !== -1 && end !== -1) {
                try {
                    return JSON.parse(text.substring(start, end + 1));
                } catch (e2) { return null; }
            }
            return null;
        }
    };

    // --- AUDIO GENERATION ---
    const generateAudioForScript = async (lines: ScriptLine[]): Promise<ScriptLine[]> => {
        const processedLines = [...lines];
        
        const getSpeakerType = (name: string): string => {
            const lowerName = name.toLowerCase();
            if (['gaz', 'chuck', 'rab', 'nils arne', 'pundit'].includes(lowerName)) return 'Pundit';
            return 'Host';
        };

        for (let i = 0; i < processedLines.length; i++) {
            const line = processedLines[i];
            try {
                const { data, error } = await supabase.functions.invoke('generate-audio', {
                    body: { 
                        input: line.text, 
                        speaker_type: getSpeakerType(line.speaker), 
                        lang: langKey 
                    }
                });

                if (error) throw error;

                if (data && data.audioContent) {
                    processedLines[i].audioUrl = `data:audio/mp3;base64,${data.audioContent}`;
                } 
            } catch (err) {
                console.warn(`Audio Gen Error line ${i}:`, err);
                processedLines[i].audioUrl = null; 
                setAudioError(true);
            }
        }
        return processedLines;
    };

    // --- PLAYBACK CONTROL ---
    useEffect(() => {
        if (!script || !isPlaying) return;
        const currentLine = script[currentLineIndex];
        if (!currentLine) return;

        if (typewriterRef.current) clearInterval(typewriterRef.current);
        
        const words = currentLine.text.split(" ");
        let wordIdx = 0;
        setDisplayedText(""); 
        
        const isPundit = ['Gaz', 'Chuck', 'Rab', 'Nils Arne', 'Pundit'].includes(currentLine.speaker);
        const baseSpeed = isPundit ? 180 : 230; 
        
        typewriterRef.current = setInterval(() => {
            if (wordIdx < words.length) {
                setDisplayedText(prev => (prev ? prev + " " : "") + words[wordIdx]);
                wordIdx++;
            } else {
                clearInterval(typewriterRef.current);
            }
        }, baseSpeed);

        const advance = () => {
            if (currentLineIndex < script.length - 1) {
                setCurrentLineIndex(prev => prev + 1);
            } else {
                setIsPlaying(false);
            }
        };

        if (currentLine.audioUrl) {
            if (!audioRef.current) audioRef.current = new Audio();
            const audio = audioRef.current;
            if (audio.src !== currentLine.audioUrl) {
                audio.src = currentLine.audioUrl;
                audio.load();
                audio.onended = advance;
                audio.onerror = () => setTimeout(advance, 2000);
                audio.play().catch(e => console.warn("Autoplay blocked", e));
            }
        } else {
            const duration = Math.max(2000, currentLine.text.split(" ").length * 300);
            setTimeout(advance, duration);
        }

        return () => { if (typewriterRef.current) clearInterval(typewriterRef.current); };
    }, [currentLineIndex, script, isPlaying]);

    const togglePlay = () => setIsPlaying(!isPlaying);

    // --- MAIN LOGIC ---
    const generateInsight = async (targetMode: 'coach' | 'roast') => {
        setLoading(true);
        setMode(targetMode);
        setScript(null);
        setAnalysis(null);
        setCurrentLineIndex(0);
        setDisplayedText("");
        setIsPlaying(false);
        setAudioError(false);
        
        try {
            const apiKey = process.env.API_KEY || HOST_KEYS[Math.floor(Math.random() * HOST_KEYS.length)];
            const ai = new GoogleGenAI({ apiKey });

            const myStat = combinedStats.find(s => s.user.email === currentUser.email);
            const myRank = myStat?.rank || 99;
            const myScore = myStat?.score || 0;
            const cleanName = getFormattedName();
            
            // --- MATCH FINDER ---
            // 1. Sort by date
            const sortedMatches = [...nextMatches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            // 2. Find ANY upcoming match
            const nextMatch = sortedMatches.find(m => m.status === 'UPCOMING');

            // 3. Check for TBD
            const isTBD = nextMatch && (nextMatch.homeTeamId === 'TBD' || nextMatch.awayTeamId === 'TBD');

            // --- SCENARIO 1: NO MATCHES AT ALL (Season Over) ---
            if (!nextMatch) {
                setAnalysis(t.noGamesCoach);
                
                // Fallback Pundit
                const fallbackScript = [
                    { speaker: "Host", text: `Welcome back, ${cleanName}. The schedule is completely clear.` },
                    { speaker: "Pundit", text: "Nothing to talk about? That's a first for me!" },
                    { speaker: "Host", text: "We'll be back when the new season starts." }
                ];
                const audioFallback = await generateAudioForScript(fallbackScript);
                setScript(audioFallback);
                setLoading(false);
                if (targetMode === 'roast') setIsPlaying(true);
                return;
            }

            // --- SCENARIO 2: WAITING FOR KNOCKOUTS (TBD) ---
            if (isTBD) {
                setAnalysis("The bracket is taking shape. We are waiting for the teams to be confirmed.");
                
                // Fallback Pundit for TBD
                const fallbackScript = [
                    { speaker: "Host", text: "The next round is coming up, but we're still waiting for the teams to be confirmed." },
                    { speaker: "Pundit", text: "Come on! Get the draw done! I need to know who we're smashing next!" },
                    { speaker: "Host", text: "Patience, please. Check back once the bracket updates." }
                ];
                const audioFallback = await generateAudioForScript(fallbackScript);
                setScript(audioFallback);
                setLoading(false);
                if (targetMode === 'roast') setIsPlaying(true);
                return;
            }

            // --- SCENARIO 3: REAL MATCH FOUND ---
            const match = nextMatch;
            const hTeam = teams[match.homeTeamId];
            const aTeam = teams[match.awayTeamId];

            if (!hTeam || !aTeam) {
                setAnalysis("Syncing data...");
                setLoading(false);
                return;
            }

            const homeName = hTeam.name;
            const awayName = aTeam.name;
            let userScorePrediction = "No pick yet";
            let rivalStats = "No rival data";
            let leaderboardContext = "You are currently isolated.";

            // Context Builders...
            const myIndex = combinedStats.findIndex(s => s.user.email === currentUser.email);
            if (myIndex !== -1) {
                const rivalAhead = combinedStats[myIndex - 1]; 
                const rivalBehind = combinedStats[myIndex + 1];
                const parts = [];
                if (rivalAhead) parts.push(`chasing ${rivalAhead.user.name} (${rivalAhead.score - myScore} pts ahead)`);
                else parts.push("leading the pack");
                if (rivalBehind) parts.push(`hunted by ${rivalBehind.user.name} (${myScore - rivalBehind.score} pts behind)`);
                if (parts.length > 0) leaderboardContext = `You are ${parts.join(' and ')}.`;
            }

            const mp = allPredictions.find(p => p.userId === currentUser.email && p.matchId === match.id);
            if (mp && mp.home !== undefined) {
                userScorePrediction = `${mp.home}-${mp.away}`;
                // Rivals
                const rivalPreds = allPredictions.filter(p => p.matchId === match.id && p.userId !== currentUser.email);
                if (rivalPreds.length > 0) {
                    const h = rivalPreds.filter(p => p.home > p.away).length;
                    const hPct = Math.round((h/rivalPreds.length)*100);
                    if (hPct > 60) rivalStats = `The pack backed ${homeName} (${hPct}%)`;
                    else if (hPct < 40) rivalStats = `The pack backed ${awayName} (${100-hPct}%)`;
                    else rivalStats = "The pack is split";
                }
            }

            if (targetMode === 'coach') {
                const prompt = `
                    Generate "Coach Report".
                    User: ${cleanName} (#${myRank}). Context: ${leaderboardContext}.
                    Match: ${homeName} vs ${awayName}. Pick: ${userScorePrediction}. Rivals: ${rivalStats}.
                    Instructions: ${t.coachPrompt}
                    Output: Plain text only. Max 80 words.
                `;
                const res = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: [{ role: 'user', parts: [{ text: prompt }] }] });
                // @ts-ignore
                const text = typeof res.response.text === 'function' ? res.response.text() : res.response.text;
                setAnalysis(text);
                setLoading(false);
            } else {
                const prompt = `
                    Write TV Script.
                    User: ${cleanName} (#${myRank}). Match: ${homeName} vs ${awayName}. Pick: ${userScorePrediction}. Rivals: ${rivalStats}.
                    Instructions: ${t.roastPrompt}
                    Output: JSON Array only: [{"speaker": "Name", "text": "..."}]
                `;
                const res = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: [{ role: 'user', parts: [{ text: prompt }] }] });
                // @ts-ignore
                const text = typeof res.response.text === 'function' ? res.response.text() : res.response.text;
                
                const parsed = extractJson(text);
                
                if (parsed) {
                    const audioScript = await generateAudioForScript(parsed);
                    setScript(audioScript);
                    setLoading(false);
                    setIsPlaying(true);
                } else {
                    throw new Error("Failed to parse script");
                }
            }

        } catch (e) {
            console.error(e);
            setAnalysis("Signal lost.");
            // Fallback script for error
            setScript([{ speaker: "Host", text: "We are having trouble connecting to the studio. Please try again." }]);
            setLoading(false);
        }
    };

    // RE-FETCH TRIGGER: Runs when stats change OR the Next Match changes (Time Travel)
    useEffect(() => {
        if (combinedStats.length > 0 && Object.keys(teams).length > 0) {
            generateInsight('coach');
        }
    }, [combinedStats, teams, nextMatchId]);

    return (
        <div className={`relative overflow-hidden rounded-2xl p-5 mb-4 shadow-lg transition-all duration-500 ${mode === 'roast' ? 'bg-gradient-to-br from-orange-900 to-red-900 border border-orange-700' : 'bg-gradient-to-br from-[#1e1b4b] to-[#312e81] border border-indigo-700'}`}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
                {mode === 'roast' ? <Radio size={120} /> : <BrainCircuit size={120} />}
            </div>

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
                        {isAudioLoading ? (
                            <div className="text-white/50 text-xs flex items-center gap-1"><RefreshCw size={12} className="animate-spin" /> Audio</div>
                        ) : isPlaying ? (
                            <button onClick={togglePlay} className="p-1.5 bg-red-500/20 text-red-300 rounded-full hover:bg-red-500/40"><Pause size={14} fill="currentColor" /></button>
                        ) : (
                            <button onClick={togglePlay} className={`p-1.5 rounded-full ${audioError ? 'bg-red-500/40 text-white' : 'bg-green-500/20 text-green-300 hover:bg-green-500/40'}`}>
                                {audioError ? <AlertCircle size={14} /> : <Play size={14} fill="currentColor" />}
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="relative z-10 min-h-[100px] flex flex-col justify-center">
                {loading ? (
                    <div className="space-y-3 animate-pulse">
                        <div className="text-center text-xs text-white/50">{t.loading}</div>
                        <div className="h-2 bg-white/10 rounded w-3/4 mx-auto"></div>
                        <div className="h-2 bg-white/10 rounded w-1/2 mx-auto"></div>
                    </div>
                ) : mode === 'coach' ? (
                    <p className="text-sm font-medium text-white/90 leading-relaxed drop-shadow-md whitespace-pre-line">{analysis}</p>
                ) : (
                    <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {/* FALLBACK MESSAGE IF SCRIPT IS EMPTY BUT NOT LOADING */}
                        {!script && <div className="text-center text-white/50 text-xs">Microphone check...</div>}
                        
                        {script && script.map((line, idx) => {
                            if (idx > currentLineIndex) return null;
                            const isCurrent = idx === currentLineIndex;
                            const isPundit = ['Gaz', 'Chuck', 'Rab', 'Nils Arne', 'Pundit'].includes(line.speaker);
                            return (
                                <div key={idx} className={`flex gap-3 ${!isPundit ? 'flex-row' : 'flex-row-reverse'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10 ${!isPundit ? 'bg-blue-500/20 text-blue-200' : 'bg-orange-500/20 text-orange-200'}`}>
                                        {!isPundit ? 'H' : 'P'}
                                    </div>
                                    <div className={`rounded-2xl p-3 text-xs max-w-[85%] relative ${!isPundit ? 'bg-white/10 text-white rounded-tl-none' : 'bg-orange-500/10 text-orange-100 rounded-tr-none border border-orange-500/20'}`}>
                                        <div className="font-black text-[9px] uppercase opacity-50 mb-1 flex justify-between">
                                            {line.speaker}
                                            {isCurrent && !isPlaying && <button onClick={togglePlay} className="p-1 hover:bg-white/10 rounded"><Volume2 size={10}/></button>}
                                            {isCurrent && isPlaying && <Volume2 size={10} className="animate-pulse text-green-400" />}
                                        </div>
                                        <p className="opacity-100 min-h-[1.5em] leading-relaxed">
                                            {isCurrent ? displayedText : line.text}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="relative z-10 mt-6 flex justify-end border-t border-white/5 pt-3">
                {mode === 'coach' ? (
                    <button onClick={() => generateInsight('roast')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 transition-all group">
                        <Radio size={14} className="text-orange-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black text-orange-200 uppercase tracking-wide">{t.roastButton}</span>
                    </button>
                ) : (
                    <button onClick={() => generateInsight('coach')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all">
                        <RefreshCw size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-200 uppercase tracking-wide">{t.coachButton}</span>
                    </button>
                )}
            </div>
        </div>
    );
};