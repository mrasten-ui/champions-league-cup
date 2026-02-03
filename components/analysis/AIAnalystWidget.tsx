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
        loading: "Scouting opposition...",
        error: "Signal lost... try again.",
        
        // COACH: Leaderboard-Focused Strategy
        coachPrompt: `
            ROLE: Fantasy League Strategist.
            TASK: Analyze the stakes of the upcoming match for the user's ranking (80-100 words).
            
            STRUCTURE:
            1. THE PLAY: Analyze the User's pick vs the Rivals' consensus.
            2. THE STAKES: You MUST reference the specific "Rival Context" (e.g. "If you hit this, you catch Paul").
            3. THE GAME: Mention one tactical fact (e.g. "Their defense is leaking") to justify the risk.
            
            TONE: Competitive, calculated.
        `,
        
        // PUNDIT: Sarah (Posh) & Gaz (Scouse)
        roastPrompt: `
            ROLE: TV Pundit "Gaz" (Scouse) & Host "Sarah" (Posh).
            SCENARIO: Pre-match discussion for the NEXT upcoming game.
            
            CHARACTERS:
            - Sarah (Host): Posh, professional Sky Sports presenter. Articulate, calm.
            - Gaz (Pundit): Scouse accent (Liverpool). Passionate, loud. Terms: 'Lad', 'Sound', 'Boss', 'Gaffer'. (DO NOT USE 'Kidda').
            
            MANDATORY SCRIPT RULES:
            1. PUNDIT: Must aggressively challenge the user by name. Example: "What are you on about, [Name]?! There is NO WAY [Team A] beats [Team B]!"
            2. HOST: Must end the show with this exact Sign-Off: "You heard it here first. Good luck, [Name]!"
            3. CONTENT: Focus purely on the specific match.
        `
    },
    'en-US': {
        coachTitle: "Coach's Intel",
        roastTitle: "Hot Take Studio",
        roastButton: "Play Roast",
        coachButton: "Back to Stats",
        loading: "Crunching numbers...",
        error: "Server timeout...",
        coachPrompt: "ROLE: Fantasy Coach. TASK: Analyze leaderboard impact. MENTION RIVALS BY NAME. Explain if this pick helps catch the leader.",
        roastPrompt: `
            ROLE: US Sports Radio. 
            CHARACTERS: "Jessica" (ESPN Host) & "Chuck" (Shock Jock).
            PUNDIT: Challenge the user ('Are you kidding me, [Name]?'). 
            HOST Sign-off: 'You heard it here first. Good luck!'
        `
    },
    sco: {
        coachTitle: "The Gaffer",
        roastTitle: "The Pundit's Box",
        roastButton: "Hear the Roast",
        coachButton: "Back tae Gaffer",
        loading: "Checkin' the tactics...",
        error: "The machine's gubbed...",
        coachPrompt: "ROLE: The Gaffer. TASK: Points analysis. Tell the lad who he needs to beat (use rival names).",
        roastPrompt: `
            ROLE: Scottish Broadcast Team.
            
            CHARACTERS:
            - Shona (Host): Edinburgh dialect. Educated, softer accent, articulate.
            - Rab (Pundit): Heavy Glasgow accent. Aggressive banter. Terms: "Belter", "Mince", "Numpty".
            
            RULES:
            1. PUNDIT: "Whit are ye on aboot, [Name]?"
            2. HOST Sign-off: "Ye heard it here first. Good luck!"
        `
    },
    no: {
        coachTitle: "Trenerens Rapport",
        roastTitle: "Studio Ekspertene",
        roastButton: "Hør Diskusjonen",
        coachButton: "Tilbake",
        loading: "Kobler til studio...",
        error: "Teknisk feil...",
        coachPrompt: "ROLLE: Fantasy-ekspert. OPPGAVE: Analyser tabellsituasjonen. DU MÅ NEVNE RIVALENE. Forklar konsekvensen av tipset.",
        roastPrompt: `
            ROLLE: Norsk TV-Studio.
            
            KARAKTERER:
            - Silje (Host): Profesjonell, saklig (Standard Østnorsk).
            - Nils Arne (Pundit): Legendarisk Trønder (Nils Arne Eggen-stil). Entusiastisk, høylytt.
            
            VIKTIGE REGLER:
            1. NILS ARNE MÅ ALLTID NEVNE "BRASIL I 98" eller "MARSEILLE" som bevis på at alt er mulig, eller klage på at "vi må tørre mer".
            2. PUNDIT UTFORDRING: "Hva er det du driver med, [Name]?!"
            3. HOST Sign-off: "Du hørte det her først. Lykke til!"
            4. SIGNATUR: Nils Arne avslutter gjerne med "Go'fot!"
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
    speaker: 'Host' | 'Pundit';
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

    // --- 1. AUDIO GENERATION ---
    const generateAudioForScript = async (lines: ScriptLine[]) => {
        setIsAudioLoading(true);
        setAudioError(false);
        const processedLines = [...lines];

        for (let i = 0; i < processedLines.length; i++) {
            const line = processedLines[i];
            try {
                const { data, error } = await supabase.functions.invoke('generate-audio', {
                    body: { 
                        input: line.text, 
                        speaker_type: line.speaker,
                        lang: langKey 
                    }
                });

                if (error) throw error;

                if (data && data.audioContent) {
                    processedLines[i].audioUrl = `data:audio/mp3;base64,${data.audioContent}`;
                } else {
                    throw new Error("Invalid audio data received");
                }

            } catch (err) {
                console.warn(`Audio Gen Failed for line ${i}. Falling back to TTS.`, err);
                processedLines[i].audioUrl = null; 
                setAudioError(true);
            }
        }
        
        setScript(processedLines);
        setIsAudioLoading(false);
        setIsPlaying(true);
    };

    // --- 2. SMOOTH KARAOKE EFFECT ---
    useEffect(() => {
        if (!script || !isPlaying) return;
        
        const currentLine = script[currentLineIndex];
        if (!currentLine) return;

        if (typewriterRef.current) clearInterval(typewriterRef.current);
        
        const words = currentLine.text.split(" ");
        let wordIdx = 0;
        setDisplayedText(""); 

        const isPundit = currentLine.speaker === 'Pundit';
        const baseSpeed = isPundit ? 180 : 240; 
        
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


    // --- 3. ROBUST AUDIO PLAYER ---
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
            // A. PRE-GENERATED AUDIO
            if (currentLine.audioUrl) {
                if (!audioRef.current) audioRef.current = new Audio();
                const audio = audioRef.current;

                if (audio.src !== currentLine.audioUrl) {
                    audio.src = currentLine.audioUrl;
                    audio.load();
                    
                    audio.onended = advance;
                    audio.onerror = () => {
                        console.warn("Audio file error, falling back to timer.");
                        setTimeout(advance, 2000);
                    };
                    
                    const playPromise = audio.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.warn("Autoplay blocked. User interaction needed.");
                            setIsPlaying(false);
                        });
                    }
                }
            } 
            // B. BROWSER TTS FALLBACK
            else if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(currentLine.text);
                const voices = window.speechSynthesis.getVoices();
                
                if (currentLine.speaker === 'Host') {
                    const female = voices.find(v => v.name.includes('Female') || v.name.includes('Google') || v.name.includes('Samantha'));
                    if (female) utterance.voice = female;
                    utterance.pitch = 1.1;
                } else {
                    utterance.pitch = 0.9;
                    utterance.rate = 1.1;
                }

                utterance.onend = advance;
                window.speechSynthesis.speak(utterance);
            } 
            // C. SILENT TIMER
            else {
                const words = currentLine.text.split(" ").length;
                setTimeout(advance, words * 300);
            }
        } else {
            if (audioRef.current) audioRef.current.pause();
            window.speechSynthesis.cancel();
            if (typewriterRef.current) clearInterval(typewriterRef.current);
        }

        return () => {
            if (typewriterRef.current) clearInterval(typewriterRef.current);
        };
    }, [isPlaying, currentLineIndex, script, mode]);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    // --- 4. GENERATION LOGIC ---
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
            
            // --- LEADERBOARD CONTEXT ---
            let leaderboardContext = "You are currently isolated in the standings.";
            const myIndex = combinedStats.findIndex(s => s.user.email === currentUser.email);
            
            if (myIndex !== -1) {
                const rivalAhead = combinedStats[myIndex - 1]; // Rank 1 is index 0
                const rivalBehind = combinedStats[myIndex + 1];
                
                const parts = [];
                if (rivalAhead) {
                    const diff = rivalAhead.score - myScore;
                    parts.push(`chasing ${rivalAhead.user.name} (${diff} pts ahead)`);
                } else {
                    parts.push("currently leading the pack");
                }
                
                if (rivalBehind) {
                    const diff = myScore - rivalBehind.score;
                    parts.push(`being hunted by ${rivalBehind.user.name} (${diff} pts behind)`);
                }
                
                if (parts.length > 0) leaderboardContext = `You are ${parts.join(' and ')}.`;
            }

            // --- MATCH SELECTION LOGIC ---
            const sortedUpcoming = [...nextMatches]
                .filter(m => m.status === 'UPCOMING' && m.homeTeamId !== 'TBD')
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            let userScorePrediction = ""; 
            let homeTeamName = "Home Team";
            let awayTeamName = "Away Team";
            let homeRank = 50;
            let awayRank = 50;
            let rivalStats = "No rival data available";

            const match = sortedUpcoming.length > 0 ? sortedUpcoming[0] : null;

            if (match) {
                const mp = allPredictions.find(p => p.userId === currentUser.email && p.matchId === match.id);
                const hTeam = teams[match.homeTeamId];
                const aTeam = teams[match.awayTeamId];

                if (!hTeam || !aTeam) {
                    setAnalysis("Waiting for team data to sync... please try again.");
                    setLoading(false);
                    return;
                }

                homeTeamName = hTeam.name;
                awayTeamName = aTeam.name;
                homeRank = hTeam.rank || 50; 
                awayRank = aTeam.rank || 50;
                
                if (mp && mp.home !== undefined) {
                    userScorePrediction = `${mp.home}-${mp.away}`;
                    
                    // RIVAL CONSENSUS
                    const rivalPreds = allPredictions.filter(p => p.matchId === match.id && p.userId !== currentUser.email);
                    if (rivalPreds.length > 0) {
                        const backedHome = rivalPreds.filter(p => p.home > p.away).length;
                        const homePct = Math.round((backedHome / rivalPreds.length) * 100);
                        
                        if (homePct > 60) rivalStats = `Most rivals (${homePct}%) backed ${homeTeamName}.`;
                        else if (homePct < 40) rivalStats = `Most rivals (${100-homePct}%) backed ${awayTeamName}.`;
                        else rivalStats = "Rivals are split 50/50.";
                    }
                }
            }

            if (targetMode === 'coach') {
                const prompt = `
                    Generate a "Coach's Tactical Report" for The Rasten Cup.
                    
                    **DATA:**
                    - User: ${cleanName} (Rank #${myRank})
                    - Rival Context: ${leaderboardContext}
                    - Match: ${homeTeamName} vs ${awayTeamName}
                    - User Pick: ${userScorePrediction || "None yet"}
                    - Rival Consensus: ${rivalStats}
                    
                    **INSTRUCTIONS:**
                    ${t.coachPrompt}
                    
                    OUTPUT: Just the raw text analysis (no markdown, no quotes). Max 100 words.
                `;
                const response = await ai.models.generateContent({
                    model: 'gemini-2.0-flash',
                    contents: [{ role: 'user', parts: [{ text: prompt }] }]
                });
                
                const responseData: any = response; 
                const text = typeof responseData.text === 'function' ? responseData.text() : responseData.text;
                setAnalysis(text);
                setLoading(false);

            } else {
                const prompt = `
                    Write a TV Script for "The Rasten Cup".
                    
                    **CONTEXT:**
                    - User: ${cleanName} (Rank #${myRank})
                    - MATCH: ${homeTeamName} vs ${awayTeamName}
                    - USER PREDICTION: ${userScorePrediction || "No pick yet"}
                    
                    **STRICT RULES:**
                    1. REFER to teams ONLY by these exact names: "${homeTeamName}" and "${awayTeamName}".
                    2. PUNDIT: Challenge the user by name. "What are you on about, ${cleanName}?!"
                    3. HOST: Sign off with "You heard it here first. Good luck, ${cleanName}!"
                    
                    **SCRIPT FORMAT (JSON Array ONLY):**
                    [
                        {"speaker": "Host", "text": "Intro the match and the user's pick..."},
                        {"speaker": "Pundit", "text": "Aggressive reaction. Challenge the user directly using their name."},
                        {"speaker": "Host", "text": "Thoughts on the rival stats?"},
                        {"speaker": "Pundit", "text": "Final verdict on the score."},
                        {"speaker": "Host", "text": "You heard it here first. Good luck, ${cleanName}!"}
                    ]
                    
                    **TONE:** ${t.roastPrompt}
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
                    setLoading(false);
                    generateAudioForScript(parsedScript);
                } catch (err) {
                    console.error("JSON Error", err);
                    setScript([{ speaker: "Host", text: "We are experiencing technical difficulties." }]);
                    setLoading(false);
                }
            }

        } catch (e) {
            console.error(e);
            if (targetMode === 'roast') {
                setScript([{ speaker: "Host", text: "Signal lost... we cannot reach the studio." }]);
            } else {
                setAnalysis(t.error);
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
                            <div className="flex items-center gap-2 text-[10px] text-orange-200">
                                <RefreshCw size={12} className="animate-spin" /> {t.loading}
                            </div>
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
                        <div className="h-2 bg-white/10 rounded w-3/4"></div>
                        <div className="h-2 bg-white/10 rounded w-full"></div>
                        <div className="h-2 bg-white/10 rounded w-1/2"></div>
                    </div>
                ) : mode === 'coach' ? (
                    <p className="text-sm font-medium text-white/90 leading-relaxed drop-shadow-md whitespace-pre-line">
                        {analysis}
                    </p>
                ) : (
                    <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {script && script.map((line, idx) => {
                            if (idx > currentLineIndex) return null;
                            const isCurrent = idx === currentLineIndex;
                            const isHost = line.speaker === 'Host';
                            
                            return (
                                <div key={idx} className={`flex gap-3 ${isHost ? 'flex-row' : 'flex-row-reverse'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10 ${isHost ? 'bg-blue-500/20 text-blue-200' : 'bg-orange-500/20 text-orange-200'}`}>
                                        {isHost ? 'H' : 'P'}
                                    </div>
                                    <div className={`rounded-2xl p-3 text-xs max-w-[85%] relative ${isHost ? 'bg-white/10 text-white rounded-tl-none' : 'bg-orange-500/10 text-orange-100 rounded-tr-none border border-orange-500/20'}`}>
                                        <div className="font-black text-[9px] uppercase opacity-50 mb-1 flex justify-between">
                                            {line.speaker}
                                            {/* Click to play specific line manually */}
                                            {isCurrent && !isPlaying && (
                                                <button onClick={togglePlay} className="p-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                                                    <Volume2 size={10} className="text-white" />
                                                </button>
                                            )}
                                            {isCurrent && isPlaying && <Volume2 size={10} className="animate-pulse text-green-400" />}
                                        </div>
                                        <p className="opacity-100 min-h-[1.5em] leading-relaxed">
                                            {/* KARAOKE TEXT RENDERER */}
                                            {isCurrent ? displayedText : line.text}
                                            {isCurrent && <span className="animate-pulse ml-1 text-sky-400">|</span>}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        {isAudioLoading && <div className="text-[10px] text-white/30 text-center animate-pulse mt-2 flex items-center justify-center gap-2"><RefreshCw size={10} className="animate-spin"/> Connecting audio feed...</div>}
                    </div>
                )}
            </div>

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