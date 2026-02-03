import React, { useState, useEffect, useRef } from 'react';
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

// --- PERSONA CONFIGURATION ---
const PERSONAS: Record<string, any> = {
    en: {
        coachTitle: "Coach's Report",
        roastTitle: "Pundit's Corner",
        roastButton: "Listen to Roast",
        coachButton: "Back to Coach",
        loading: "Analyzing tactics...",
        error: "Signal lost... try again.",
        
        // COACH: Focus on Consequences of existing picks
        coachPrompt: `
            ROLE: Fantasy League Strategist.
            CONTEXT: Predictions were made PRE-TOURNAMENT. The user CANNOT change them now (unless they use a "Sub").
            TASK: Analyze the IMPACT of the user's existing pick on the leaderboard.
            
            STRUCTURE:
            1. THE PICK: "You have Brazil to beat Argentina." (State the user's locked-in pick).
            2. THE STAKES: "If this holds, you will likely pass [Target Name]. If it fails, [Threat Name] is ready to pounce."
            3. THE GAME: "Brazil's form suggests you're safe, but watch out for [Opponent Player]."
            
            TONE: Analytical, high-stakes, focused on points.
        `,
        
        // PUNDIT: Sarah & Gaz
        roastPrompt: `
            ROLE: UK Sports Broadcast.
            CHARACTERS: Sarah (Posh Sky Sports Host) & Gaz (Scouse Pundit).
            
            MANDATORY RULES:
            1. GAZ: Must aggressively challenge the user's locked-in pick. "What were you thinking picking [Team A], [Name]?!"
            2. GAZ: Use "Lad", "Mate". NO "Kidda".
            3. SARAH: Must end the show with EXACTLY: "Well, you heard it here first. Good luck, [Name]!"
            4. NAMES: Refer to the user as [Name]. Refer to teams by their real names only.
        `
    },
    'en-US': {
        coachTitle: "Coach's Intel",
        roastTitle: "Hot Take Studio",
        roastButton: "Play Roast",
        coachButton: "Back to Stats",
        loading: "Loading audio feed...",
        error: "Server timeout...",
        coachPrompt: "ROLE: Fantasy Coach. FOCUS: The impact of the user's pre-tournament pick. Will it help them climb the standings?",
        roastPrompt: `
            ROLE: US Sports Radio. 
            CHARACTERS: Jessica (Host) & Chuck (Shock Jock).
            CHUCK: "Are you kidding me with that pick, [Name]?"
            JESSICA: "You heard it here first. Good luck!"
        `
    },
    sco: {
        coachTitle: "The Gaffer",
        roastTitle: "The Pundit's Box",
        roastButton: "Hear the Roast",
        coachButton: "Back tae Gaffer",
        loading: "Mic check...",
        error: "The machine's gubbed...",
        coachPrompt: "ROLE: The Gaffer. FOCUS: Tell the lad if his pre-tournament prediction is going to save him or sink him.",
        roastPrompt: `
            ROLE: Scottish Broadcast.
            CHARACTERS: Shona (Edinburgh Posh) & Rab (Glasgow Street).
            RAB: "Whit are ye on aboot, [Name]?"
            SHONA: "Ye heard it here first. Good luck!"
        `
    },
    no: {
        coachTitle: "Trenerens Rapport",
        roastTitle: "Studio Ekspertene",
        roastButton: "Hør Diskusjonen",
        coachButton: "Tilbake",
        loading: "Klargjør sending...",
        error: "Teknisk feil...",
        coachPrompt: "ROLLE: Fantasy-ekspert. FOKUS: Konsekvensen av brukerens forhåndstips. Vil dette tipset sikre avansement på tabellen?",
        roastPrompt: `
            ROLLE: Norsk TV-Studio.
            KARAKTERER: Silje (Host) & Nils Arne (Pundit).
            NILS ARNE: Nevn "Brasil i 98" eller "Godfoten". Klag på at tipset er feigt eller ros det for å være offensivt.
            SILJE: "Du hørte det her først. Lykke til!"
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
    
    // Karaoke State
    const [displayedText, setDisplayedText] = useState(""); 
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const typewriterRef = useRef<any>(null);

    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<'coach' | 'roast'>('coach');
    const hasFetched = useRef(false);

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

    // --- JSON PARSER (The Stability Fix) ---
    const extractJson = (text: string) => {
        try {
            // 1. Try direct parse
            return JSON.parse(text);
        } catch (e) {
            // 2. Try to find array brackets [ ... ]
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

    // --- 1. AUDIO GENERATION (RETURNS DATA, DOES NOT SET STATE) ---
    const generateAudioForScript = async (lines: ScriptLine[]): Promise<ScriptLine[]> => {
        const processedLines = [...lines];

        // Name Mapping for Voice Engine
        const getSpeakerType = (name: string): string => {
            const lowerName = name.toLowerCase();
            if (['gaz', 'chuck', 'rab', 'nils arne', 'pundit'].includes(lowerName)) return 'Pundit';
            return 'Host';
        };

        // Fetch audio for ALL lines in parallel (faster) or sequence (safer)
        // Sequential is safer to avoid rate limits/timeouts
        for (let i = 0; i < processedLines.length; i++) {
            const line = processedLines[i];
            const speakerType = getSpeakerType(line.speaker);

            try {
                const { data, error } = await supabase.functions.invoke('generate-audio', {
                    body: { 
                        input: line.text, 
                        speaker_type: speakerType,
                        lang: langKey 
                    }
                });

                if (error) throw error;

                if (data) {
                    // Handle both Base64 JSON and Blob responses
                    if (typeof data === 'string' || data.audioContent) {
                         const content = data.audioContent || data;
                         processedLines[i].audioUrl = `data:audio/mp3;base64,${content}`;
                    } else {
                        const audioBlob = new Blob([data], { type: 'audio/mpeg' });
                        if (audioBlob.size > 100) {
                            processedLines[i].audioUrl = URL.createObjectURL(audioBlob);
                        }
                    }
                }
            } catch (err) {
                console.warn(`Audio Gen Error line ${i}:`, err);
                processedLines[i].audioUrl = null; 
            }
        }
        return processedLines;
    };

    // --- 2. KARAOKE EFFECT ---
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

        return () => {
            if (typewriterRef.current) clearInterval(typewriterRef.current);
        };
    }, [currentLineIndex, script, isPlaying]);

    // --- 3. AUDIO PLAYER ---
    useEffect(() => {
        if (mode !== 'roast' || !script) return;

        const currentLine = script[currentLineIndex];
        if (!currentLine) return; 

        const advance = () => {
            if (currentLineIndex < script.length - 1) {
                setCurrentLineIndex(prev => prev + 1);
            } else {
                setIsPlaying(false);
            }
        };

        if (isPlaying) {
            if (currentLine.audioUrl) {
                if (!audioRef.current) audioRef.current = new Audio();
                const audio = audioRef.current;

                if (audio.src !== currentLine.audioUrl) {
                    audio.src = currentLine.audioUrl;
                    audio.load();
                    audio.onended = advance;
                    audio.onerror = () => setTimeout(advance, 2000); // Skip if error
                    audio.play().catch(() => setIsPlaying(false));
                }
            } else {
                // Fallback Timer if no audio
                const duration = Math.max(2000, currentLine.text.split(" ").length * 300);
                setTimeout(advance, duration);
            }
        } else {
            if (audioRef.current) audioRef.current.pause();
            if (typewriterRef.current) clearInterval(typewriterRef.current);
        }

        return () => {
            if (typewriterRef.current) clearInterval(typewriterRef.current);
        };
    }, [isPlaying, currentLineIndex, script, mode]);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    // --- 4. MAIN GENERATION LOGIC ---
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
            
            // Context
            let leaderboardContext = "You are currently isolated in the standings.";
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

            // Match Selection
            const sortedUpcoming = [...nextMatches]
                .filter(m => m.status === 'UPCOMING' && m.homeTeamId !== 'TBD')
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            const match = sortedUpcoming.length > 0 ? sortedUpcoming[0] : null;

            if (!match) {
                setAnalysis("No upcoming matches to preview.");
                setLoading(false);
                return;
            }

            const hTeam = teams[match.homeTeamId];
            const aTeam = teams[match.awayTeamId];

            if (!hTeam || !aTeam || hTeam.name === "Home Team") {
                setAnalysis("Waiting for team data...");
                setLoading(false);
                return;
            }

            const homeTeamName = hTeam.name;
            const awayTeamName = aTeam.name;
            let userScorePrediction = "No pick yet";
            let rivalStats = "No rival data";

            const mp = allPredictions.find(p => p.userId === currentUser.email && p.matchId === match.id);
            if (mp && mp.home !== undefined) {
                userScorePrediction = `${mp.home}-${mp.away}`;
                
                // Rivals
                const rivalPreds = allPredictions.filter(p => p.matchId === match.id && p.userId !== currentUser.email);
                if (rivalPreds.length > 0) {
                    const backedHome = rivalPreds.filter(p => p.home > p.away).length;
                    const homePct = Math.round((backedHome / rivalPreds.length) * 100);
                    if (homePct > 60) rivalStats = `The pack backed ${homeTeamName} (${homePct}%).`;
                    else if (homePct < 40) rivalStats = `The pack backed ${awayTeamName} (${100-homePct}%).`;
                    else rivalStats = "The pack is split.";
                }
            }

            if (targetMode === 'coach') {
                const prompt = `
                    Generate a "Coach's Tactical Report".
                    User: ${cleanName} (Rank #${myRank}). 
                    Context: ${leaderboardContext}.
                    Match: ${homeTeamName} vs ${awayTeamName}.
                    User's Locked Pick: ${userScorePrediction}.
                    Rivals: ${rivalStats}.
                    
                    INSTRUCTIONS:
                    ${t.coachPrompt}
                    
                    OUTPUT: Raw text (max 100 words).
                `;
                const res = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: [{ role: 'user', parts: [{ text: prompt }] }] });
                // @ts-ignore
                const text = typeof res.response.text === 'function' ? res.response.text() : res.response.text;
                setAnalysis(text);
                setLoading(false);
            } else {
                const prompt = `
                    Write TV Script.
                    User: ${cleanName} (#${myRank}). Match: ${homeTeamName} vs ${awayTeamName}. Pick: ${userScorePrediction}. Rivals: ${rivalStats}.
                    Instructions: ${t.roastPrompt}
                    Output: JSON Array only: [{"speaker": "Name", "text": "..."}]
                `;
                const res = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: [{ role: 'user', parts: [{ text: prompt }] }] });
                // @ts-ignore
                const text = typeof res.response.text === 'function' ? res.response.text() : res.response.text;
                
                const parsed = extractJson(text); // Use robust parser
                
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
            if (targetMode === 'roast') {
                // Gentle fallback that mimics a technical difficulty
                setScript([{ speaker: "Host", text: "We are having trouble connecting to the pundit. Please try again in a moment." }]);
            } else {
                setAnalysis("Tactical analysis unavailable at this moment.");
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!hasFetched.current && combinedStats.length > 0 && Object.keys(teams).length > 0) {
            generateInsight('coach');
            hasFetched.current = true;
        }
    }, [combinedStats, teams]);

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
                            <div className="text-white/50 text-xs"><RefreshCw size={12} className="animate-spin" /></div>
                        ) : isPlaying ? (
                            <button onClick={togglePlay} className="p-1.5 bg-red-500/20 text-red-300 rounded-full"><Pause size={14} fill="currentColor" /></button>
                        ) : (
                            <button onClick={togglePlay} className={`p-1.5 rounded-full ${audioError ? 'bg-red-500/40 text-white' : 'bg-green-500/20 text-green-300'}`}>
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