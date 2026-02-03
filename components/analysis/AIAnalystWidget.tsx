import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Match, Prediction, Team, Translation, LanguageCode } from '../../types'; 
import { GoogleGenAI } from "@google/genai";
import { HOST_KEYS } from '../../constants';
import { Sparkles, RefreshCw, BrainCircuit, Mic, Play, Pause, Radio, Volume2 } from 'lucide-react';
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

// DEFINING DISTINCT PERSONAS
const PERSONAS: Record<string, any> = {
    en: {
        coachTitle: "Coach's Report",
        roastTitle: "Pundit's Corner",
        roastButton: "Listen to Roast",
        coachButton: "Back to Coach",
        loading: "Analyzing tactics...",
        error: "Signal lost... try again.",
        home: "Home",
        away: "Away",
        draw: "Draw",
        conflict: "Conflict found",
        picked: "picked",
        
        // 1. THE COACH (Professional, Helpful, Slight Accent)
        coachPrompt: "ENGLISH. Role: Senior Football Analyst. Tone: Professional, encouraging, but direct. Use the metric system. You may use 1-2 local terms (e.g., 'Lad', 'Gaffer', 'Solid') to sound authentic, but DO NOT be a comedian. Focus 100% on the user's rank and how to improve.",
        
        // 2. THE PUNDIT (Wild, Loud, Scouse)
        roastPrompt: "ENGLISH. Accent: Scouse/Liverpool (High energy, passionate, Jamie Carragher style). Terms: 'Lad', 'Kidda', 'Sound', 'Boss', 'Gaffer'. RULE: DO NOT use fake team names. Use ONLY the provided team names."
    },
    'en-US': {
        coachTitle: "Coach's Intel",
        roastTitle: "Hot Take Studio",
        roastButton: "Play Roast",
        coachButton: "Back to Stats",
        loading: "Going live...",
        error: "Server timeout...",
        home: "Home",
        away: "Away",
        draw: "Tie",
        conflict: "Matchup conflict",
        picked: "picked",
        coachPrompt: "AMERICAN ENGLISH. Role: Head Coach. Tone: Serious, strategic. Use terms like 'Roster', 'Clinch', 'Playoffs'.",
        roastPrompt: "AMERICAN ENGLISH. Radio Shock Jock style. Loud, opinionated, aggressive."
    },
    sco: {
        coachTitle: "The Gaffer",
        roastTitle: "The Pundit's Box",
        roastButton: "Hear the Roast",
        coachButton: "Back tae Gaffer",
        loading: "Checkin' the tactics...",
        error: "The machine's gubbed...",
        home: "Hame",
        away: "Awa",
        draw: "Draw",
        conflict: "Battle",
        picked: "backed",
        coachPrompt: "SCOTTISH ENGLISH. Role: The Gaffer. Tone: Stern but fair. Use terms like 'Lad', 'Son', 'Dig in'. Focus on the points.",
        roastPrompt: "SCOTTISH ENGLISH. Accent: Heavy Glasgow/Scots. Terms: 'Aye', 'Naw', 'Mince', 'Belter'. Pure aggressive banter."
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
        coachPrompt: "NORWEGIAN. Role: Fotballekspert. Tone: Saklig og analytisk.",
        roastPrompt: "NORWEGIAN. Role: Engasjert supporter. Bruk dialekt og fotballslang."
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
    
    // Audio Ref with init check
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<'coach' | 'roast'>('coach');
    const hasFetched = useRef(false);

    const langKey = resolveLanguage(currentLang || 'EN');
    const t = PERSONAS[langKey];

    // --- AUDIO GENERATION ---
    const generateAudioForScript = async (lines: ScriptLine[]) => {
        setIsAudioLoading(true);
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
            }
        }
        
        setScript(processedLines);
        setIsAudioLoading(false);
        
        // Auto-play attempt (might be blocked by browser, handled in useEffect)
        setIsPlaying(true);
    };

    // --- ROBUST PLAYBACK CONTROL ---
    useEffect(() => {
        if (mode !== 'roast' || !script) return;

        const currentLine = script[currentLineIndex];
        if (!currentLine) return; 

        // Function to move to next line
        const advance = () => {
            if (currentLineIndex < script.length - 1) {
                setCurrentLineIndex(prev => prev + 1);
            } else {
                setIsPlaying(false);
            }
        };

        if (isPlaying) {
            // OPTION 1: GOOGLE CLOUD AUDIO
            if (currentLine.audioUrl) {
                // Initialize audio object if missing
                if (!audioRef.current) audioRef.current = new Audio();
                
                const audio = audioRef.current;

                // Only set source if it's different (prevents reloading loop)
                if (audio.src !== currentLine.audioUrl) {
                    audio.src = currentLine.audioUrl;
                    audio.onended = advance;
                    audio.onerror = () => {
                        console.warn("Audio Error, skipping");
                        setTimeout(advance, 1500);
                    };
                }

                // Play and catch autoplay errors
                audio.play().catch(err => {
                    console.warn("Autoplay blocked. Waiting for user interaction.", err);
                    setIsPlaying(false); // Stop UI so user sees "Play" button
                });
            } 
            // OPTION 2: BROWSER FALLBACK (Robot Voice)
            else if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(currentLine.text);
                
                // Voice selection
                const voices = window.speechSynthesis.getVoices();
                if (currentLine.speaker === 'Host') {
                    const female = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google'));
                    if (female) utterance.voice = female;
                    utterance.pitch = 1.1;
                } else {
                    utterance.pitch = 0.9;
                    utterance.rate = 1.1;
                }

                utterance.onend = advance;
                utterance.onerror = () => setTimeout(advance, 3000);
                window.speechSynthesis.speak(utterance);
            } 
            // OPTION 3: SILENT TIMER (Just read)
            else {
                const duration = Math.max(2000, currentLine.text.split(' ').length * 300);
                const timer = setTimeout(advance, duration);
                return () => clearTimeout(timer);
            }
        } else {
            // If paused, pause the audio
            if (audioRef.current) audioRef.current.pause();
            window.speechSynthesis.cancel();
        }

    }, [isPlaying, currentLineIndex, script, mode]);

    // Simple handler to unblock audio
    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

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

            // Stats Calc
            const myStat = combinedStats.find(s => s.user.email === currentUser.email);
            const myRank = myStat?.rank || 99;
            const myScore = myStat?.score || 0;
            const myDiff = myStat?.diff || 0;
            
            // Movement Context
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
                
                const hTeam = teams[match.homeTeamId];
                const aTeam = teams[match.awayTeamId];

                if (hTeam) { homeTeamName = hTeam.name; homeRank = hTeam.rank || 50; }
                if (aTeam) { awayTeamName = aTeam.name; awayRank = aTeam.rank || 50; }
                
                if (mp && mp.home !== undefined) {
                    keyMatch = `${homeTeamName} vs ${awayTeamName}`;
                    userScorePrediction = `${mp.home}-${mp.away}`;
                }
            }

            if (targetMode === 'coach') {
                // 1. COACH PROMPT (Professional + Helpful)
                const prompt = `
                    You are a Senior Football Analyst for "The Rasten Cup".
                    
                    **USER SITUATION:**
                    - Name: ${currentUser.name}
                    - Rank: #${myRank} (Score: ${myScore})
                    - Recent Form: ${movementContext}
                    - Next Prediction: ${userScorePrediction ? `Predicted ${userScorePrediction} for ${homeTeamName} vs ${awayTeamName}` : "No prediction made yet"}
                    
                    **TASK:**
                    Write a short report (max 50 words).
                    1. Acknowledge their current rank/form professionally.
                    2. Give specific advice on the next match (e.g. "Brazil are strong, consider that" or "You need points, take a risk").
                    3. Tone: ${t.coachPrompt}.
                    
                    Use ONLY real team names. No jokes.
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
                // 2. PUNDIT PROMPT (Fun/Scouse)
                const prompt = `
                    TV Script for "The Rasten Cup".
                    
                    **CONTEXT:**
                    - User: ${currentUser.name} (Rank #${myRank})
                    - Status: ${movementContext}
                    - BET: ${userScorePrediction || "No pick"} for ${homeTeamName} (Rank ${homeRank}) vs ${awayTeamName} (Rank ${awayRank}).
                    
                    **CHARACTERS:**
                    1. HOST (Female): Professional.
                    2. PUNDIT (Male): Scouse/Liverpool accent. Loud.
                    
                    **RULES:**
                    - Use ONLY these team names: ${homeTeamName}, ${awayTeamName}.
                    - Pundit must mention the specific score ${userScorePrediction}.
                    
                    **SCRIPT (4 Lines):**
                    1. HOST: Intro user and rank.
                    2. PUNDIT: Reaction to rank.
                    3. HOST: "They've tipped ${homeTeamName} to beat ${awayTeamName} ${userScorePrediction}. Thoughts?"
                    4. PUNDIT: Verdict.
                    
                    **LANGUAGE:** ${t.roastPrompt}.
                    
                    OUTPUT: JSON Array only: [{"speaker": "Host", "text": "..."}, {"speaker": "Pundit", "text": "..."}]
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
        if (!hasFetched.current && combinedStats.length > 0) {
            generateInsight('coach');
            hasFetched.current = true;
        }
    }, [combinedStats]);

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
                            <button onClick={togglePlay} className="p-1.5 bg-green-500/20 text-green-300 rounded-full hover:bg-green-500/40"><Play size={14} fill="currentColor" /></button>
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
                                        <p className={isCurrent && isPlaying ? "opacity-100" : "opacity-80"}>{line.text}</p>
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