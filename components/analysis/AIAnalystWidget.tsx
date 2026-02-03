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

const PERSONAS: Record<string, any> = {
    en: {
        coachTitle: "Coach's Report",
        roastTitle: "Pundit's Corner",
        roastButton: "Listen to Roast",
        coachButton: "Back to Coach",
        loading: "Analyzing tactics...",
        error: "Signal lost... try again.",
        coachPrompt: "ENGLISH. Role: Senior Football Analyst. Tone: Professional, encouraging, but direct. Focus on the user's rank and how to improve.",
        roastPrompt: "ENGLISH. Accent: Scouse/Liverpool (High energy, passionate, Jamie Carragher style). Terms: 'Lad', 'Kidda', 'Sound', 'Boss', 'Gaffer'. RULE: You MUST use the specific Country Names provided (e.g. 'Brazil', 'France'). NEVER say 'Home Team'."
    },
    'en-US': {
        coachTitle: "Coach's Intel",
        roastTitle: "Hot Take Studio",
        roastButton: "Play Roast",
        coachButton: "Back to Stats",
        loading: "Going live...",
        error: "Server timeout...",
        coachPrompt: "AMERICAN ENGLISH. Role: Head Coach. Tone: Serious, strategic.",
        roastPrompt: "AMERICAN ENGLISH. Radio Shock Jock style. Loud, opinionated, aggressive. USE REAL TEAM NAMES."
    },
    sco: {
        coachTitle: "The Gaffer",
        roastTitle: "The Pundit's Box",
        roastButton: "Hear the Roast",
        coachButton: "Back tae Gaffer",
        loading: "Checkin' the tactics...",
        error: "The machine's gubbed...",
        coachPrompt: "SCOTTISH ENGLISH. Role: The Gaffer. Tone: Stern but fair.",
        roastPrompt: "SCOTTISH ENGLISH. Accent: Heavy Glasgow/Scots. Terms: 'Aye', 'Naw', 'Mince', 'Belter'. Pure aggressive banter. USE REAL TEAM NAMES."
    },
    no: {
        coachTitle: "Trenerens Rapport",
        roastTitle: "Studio Ekspertene",
        roastButton: "Hør Diskusjonen",
        coachButton: "Tilbake",
        loading: "Kobler til studio...",
        error: "Teknisk feil...",
        coachPrompt: "NORWEGIAN. Role: Fotballekspert. Tone: Saklig og analytisk.",
        roastPrompt: "NORWEGIAN. Role: Engasjert supporter. Bruk dialekt og fotballslang. BRUK EKTE LAGNAVN."
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
    const typewriterRef = useRef<any>(null); // Using any for timeout ID

    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<'coach' | 'roast'>('coach');
    const hasFetched = useRef(false);

    const langKey = resolveLanguage(currentLang || 'EN');
    const t = PERSONAS[langKey];

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

                const audioBlob = new Blob([data], { type: 'audio/mpeg' });
                if (audioBlob.size < 100) throw new Error("Audio file too small");

                processedLines[i].audioUrl = URL.createObjectURL(audioBlob);

            } catch (err) {
                console.warn(`Audio Gen Failed for line ${i}. Falling back to TTS.`);
                processedLines[i].audioUrl = null; 
                setAudioError(true); // Flag that we are in fallback mode
            }
        }
        
        setScript(processedLines);
        setIsAudioLoading(false);
        setIsPlaying(true); // Auto-start
    };

    // --- 2. SMOOTH KARAOKE EFFECT ---
    useEffect(() => {
        if (!script || !isPlaying) return;
        
        const currentLine = script[currentLineIndex];
        if (!currentLine) return;

        // Clean up previous interval
        if (typewriterRef.current) clearInterval(typewriterRef.current);
        
        // Split text into words for typewriter effect
        const words = currentLine.text.split(" ");
        let wordIdx = 0;
        setDisplayedText(""); // Clear text initially

        // Calculate pacing: faster for Pundit, slower for Host
        const isPundit = currentLine.speaker === 'Pundit';
        const baseSpeed = isPundit ? 180 : 250; // ms per word
        
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

                // Only load if source changed
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
            // B. BROWSER TTS FALLBACK (If API Key Failed)
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
            // C. SILENT TIMER (Last Resort)
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
            const myDiff = myStat?.diff || 0;
            
            let movementContext = "holding position";
            if (myDiff > 0) movementContext = `climbed ${myDiff} spots`;
            if (myDiff < 0) movementContext = `dropped ${Math.abs(myDiff)} spots`;

            // Identify Key Match
            let keyMatch = "Upcoming matches";
            let userScorePrediction = ""; 
            let homeTeamName = "Home Team";
            let awayTeamName = "Away Team";
            let homeRank = 50;
            let awayRank = 50;

            if (nextMatches.length > 0) {
                const match = nextMatches[0];
                const mp = allPredictions.find(p => p.userId === currentUser.email && p.matchId === match.id);
                
                // --- STRICT TEAM NAME LOOKUP ---
                const hTeam = teams[match.homeTeamId];
                const aTeam = teams[match.awayTeamId];

                // If teams aren't loaded yet, stop generation to avoid "Home Team" generic text
                if (!hTeam || !aTeam) {
                    setAnalysis("Waiting for team data to sync... please try again in a moment.");
                    setLoading(false);
                    return;
                }

                homeTeamName = hTeam.name;
                awayTeamName = aTeam.name;
                homeRank = hTeam.rank || 50; 
                awayRank = aTeam.rank || 50;
                
                if (mp && mp.home !== undefined) {
                    keyMatch = `${homeTeamName} vs ${awayTeamName}`;
                    userScorePrediction = `${mp.home}-${mp.away}`;
                }
            }

            if (targetMode === 'coach') {
                const prompt = `
                    You are a Senior Football Analyst for "The Rasten Cup".
                    User: ${currentUser.name} (Rank #${myRank}, Score: ${myScore}).
                    Status: ${movementContext}.
                    Next Pick: ${userScorePrediction ? `${homeTeamName} to beat ${awayTeamName} ${userScorePrediction}` : "No pick yet"}.
                    
                    Task: Write a short, strategic advice summary (max 40 words).
                    Use ONLY these team names: ${homeTeamName} and ${awayTeamName}.
                    Tone: ${t.coachPrompt}
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
                    - User: ${currentUser.name} (Rank #${myRank})
                    - Recent Form: ${movementContext}
                    - NEXT MATCH: ${homeTeamName} (Rank ${homeRank}) vs ${awayTeamName} (Rank ${awayRank}).
                    - USER PREDICTION: ${userScorePrediction || "Has not predicted yet!"}.
                    
                    **CHARACTERS:**
                    1. HOST (Female): Professional intro.
                    2. PUNDIT (Male): Scouse/Liverpool accent. Very opinionated.
                    
                    **STRICT RULES:**
                    - NEVER use "Home Team" or "Away Team". Use "${homeTeamName}" and "${awayTeamName}".
                    - If the user predicted a score (e.g. 2-1), the Pundit MUST mention those numbers.
                    
                    **SCRIPT FORMAT (JSON Array ONLY):**
                    [
                        {"speaker": "Host", "text": "Start with user rank..."},
                        {"speaker": "Pundit", "text": "React to rank..."},
                        {"speaker": "Host", "text": "Mention the prediction for ${homeTeamName} vs ${awayTeamName}."},
                        {"speaker": "Pundit", "text": "Verdict on that specific score."}
                    ]
                    
                    **LANGUAGE:** ${t.roastPrompt}
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
        // Wait for teams to be populated before generating
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