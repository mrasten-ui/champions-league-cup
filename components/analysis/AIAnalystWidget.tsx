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
        conflict: "Conflict found",
        picked: "picked",
        // Jamie Carragher / Scouse Persona
        promptLang: "ENGLISH (The Pundit must speak in a strong LIVERPOOL/SCOUSE dialect, like Jamie Carragher. High energy, fast, passionate. Use terms like 'Lad', 'Kidda', 'Sound', 'Boss', 'Soft', 'Gaffer', 'Absolutely shocker')"
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
        promptLang: "AMERICAN ENGLISH (Use terms like 'Soccer', 'Tie', 'Roster', 'Clinch', 'MVP')"
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
        promptLang: "SCOTTISH ENGLISH (Use terms like 'Aye', 'Lad', 'Rubbish', 'Sitter', 'Pure dead brilliant')"
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
        promptLang: "NORWEGIAN (Use a sharp, knowledgeable football tone)"
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
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<'coach' | 'roast'>('coach');
    const hasFetched = useRef(false);

    const langKey = resolveLanguage(currentLang || 'EN');
    const t = TEXT[langKey];

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
        setIsPlaying(true);
    };

    // --- PLAYBACK CONTROL ---
    useEffect(() => {
        if (mode !== 'roast' || !isPlaying || !script) return;

        const currentLine = script[currentLineIndex];
        if (!currentLine) return; 

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
            audio.src = currentLine.audioUrl;
            audio.onended = advance;
            audio.onerror = () => setTimeout(advance, 2000); 
            audio.play().catch(() => setTimeout(advance, 3000));
        } 
        else if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(currentLine.text);
            utterance.lang = langKey === 'no' ? 'nb-NO' : 'en-GB'; 
            if (currentLine.speaker === 'Pundit') {
                utterance.pitch = 0.8; 
                utterance.rate = 1.1;  
            } else {
                utterance.pitch = 1.1; 
            }
            utterance.onend = advance;
            utterance.onerror = () => setTimeout(advance, 3000);
            window.speechSynthesis.speak(utterance);
        } 
        else {
            const words = currentLine.text.split(' ').length;
            setTimeout(advance, Math.max(2000, words * 300));
        }

        return () => {
            if (audioRef.current) audioRef.current.pause();
            window.speechSynthesis.cancel();
        };

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

            // 1. CALCULATE DEEP STATS
            const myStat = combinedStats.find(s => s.user.email === currentUser.email);
            const myRank = myStat?.rank || 99;
            const myScore = myStat?.score || 0;
            const myDiff = myStat?.diff || 0;
            
            // Find Leader
            const leader = combinedStats.find(s => s.rank === 1);
            const pointsToLeader = leader ? (leader.score - myScore) : 0;
            
            // Find Rival (Closest above)
            const rivalAbove = combinedStats.find(s => s.rank === myRank - 1);
            
            // Movement Context
            let movementContext = "holding steady";
            if (myDiff > 0) movementContext = `climbing up ${myDiff} spots`;
            if (myDiff < 0) movementContext = `crashing down ${Math.abs(myDiff)} spots`;

            // 2. FIND KEY MATCH PREDICTION (SCORING)
            let conflictText = "Predictions align closely.";
            let keyMatch = "Upcoming matches";
            let userScorePrediction = ""; 
            let homeTeamName = "";
            let awayTeamName = "";

            // Priority: Find a Conflict Match first
            let foundConflict = false;
            if (rivalAbove) {
                const myPreds = allPredictions.filter(p => p.userId === currentUser.email);
                const rivalPreds = allPredictions.filter(p => p.userId === rivalAbove.user.email);

                for (const match of nextMatches.slice(0, 3)) { 
                    const mp = myPreds.find(p => p.matchId === match.id);
                    const rp = rivalPreds.find(p => p.matchId === match.id);
                    
                    if (mp && rp) {
                        const myRes = mp.home > mp.away ? t.home : mp.home < mp.away ? t.away : t.draw;
                        const rivalRes = rp.home > rp.away ? t.home : rp.home < rp.away ? t.away : t.draw;
                        
                        // Grab the specific score if available
                        if (mp.home !== undefined && mp.away !== undefined) {
                            userScorePrediction = `${mp.home}-${mp.away}`;
                            homeTeamName = teams[match.homeTeamId]?.name || "Home";
                            awayTeamName = teams[match.awayTeamId]?.name || "Away";
                        }

                        if (myRes !== rivalRes) {
                            keyMatch = `${homeName} vs ${awayName}`;
                            conflictText = `User has ${myRes} (${userScorePrediction}), but ${rivalAbove.user.name} has ${rivalRes}`;
                            foundConflict = true;
                            break;
                        }
                    }
                }
            }

            // Fallback: If no conflict, just grab the first upcoming match prediction
            if (!foundConflict && nextMatches.length > 0) {
                const match = nextMatches[0];
                const mp = allPredictions.find(p => p.userId === currentUser.email && p.matchId === match.id);
                if (mp && mp.home !== undefined) {
                    homeTeamName = teams[match.homeTeamId]?.name || "Home";
                    awayTeamName = teams[match.awayTeamId]?.name || "Away";
                    keyMatch = `${homeTeamName} vs ${awayTeamName}`;
                    userScorePrediction = `${mp.home}-${mp.away}`;
                    conflictText = `User has predicted ${userScorePrediction}`;
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
                const text = typeof responseData.text === 'function' ? responseData.text() : responseData.text;
                setAnalysis(text);
                setLoading(false);

            } else {
                // 3. TARGETED SCRIPT GENERATION
                const prompt = `
                    You are writing a TV Script for a Football Pundit Show about "The Rasten Cup".
                    
                    **THE SUBJECT:**
                    - Name: ${currentUser.name}
                    - Current Rank: #${myRank}
                    - Recent Form: ${movementContext}
                    - UPCOMING PREDICTION: ${userScorePrediction || "No prediction yet"} for ${keyMatch}.
                    
                    **THE CHARACTERS:**
                    1. HOST (Female): Professional. Sets up the stats.
                    2. PUNDIT (Male): Jamie Carragher style (Scouse/Liverpool accent). Loud. Passionate.
                    
                    **THE SCRIPT STRUCTURE (Exactly 4 lines):**
                    - Line 1 (Host): "Welcome back. Let's look at ${currentUser.name}. Currently sitting #${myRank}."
                    - Line 2 (Pundit): Reacts to the rank/form. (e.g. "It's not good enough!" or "Flying high, lad!")
                    - Line 3 (Host): CLOSING STATEMENT. "Well, for the next match, they've tipped ${homeTeamName} to beat ${awayTeamName} ${userScorePrediction}. Thoughts?"
                    - Line 4 (Pundit): FINAL VERDICT. Must mention the TEAMS and the SCORE explicitly. (e.g. "${homeTeamName} winning ${userScorePrediction}?! Against ${awayTeamName}? He's dreaming!")
                    
                    **LANGUAGE:** ${t.promptLang}.
                    
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
                    setScript([{ speaker: "Host", text: "We are experiencing technical difficulties in the studio." }]);
                    setLoading(false);
                }
            }

        } catch (e) {
            console.error(e);
            if (targetMode === 'roast') {
                setScript([{ speaker: "Host", text: "Signal lost... we cannot reach the studio right now." }]);
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
                            <button onClick={() => { setIsPlaying(false); audioRef.current?.pause(); window.speechSynthesis.cancel(); }} className="p-1.5 bg-red-500/20 text-red-300 rounded-full hover:bg-red-500/40"><Pause size={14} fill="currentColor" /></button>
                        ) : (
                            <button onClick={() => { setIsPlaying(true); }} className="p-1.5 bg-green-500/20 text-green-300 rounded-full hover:bg-green-500/40"><Play size={14} fill="currentColor" /></button>
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