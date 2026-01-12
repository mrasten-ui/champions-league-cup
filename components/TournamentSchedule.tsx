
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Match, Team, Prediction, Translation, UserProfile, LanguageCode } from '../types';
import { calculatePoints } from '../services/engine';
import { Clock, Tv, Activity, Calendar, Trophy, Lock } from 'lucide-react';

interface TournamentScheduleProps {
  matches: Match[];
  teams: Record<string, Team>;
  userPredictions: Prediction[];
  user: UserProfile | null;
  lang: Translation;
  currentLang: LanguageCode;
  onTeamClick?: (teamId: string) => void;
}

// Broadcaster Row Component
const BroadcasterRow: React.FC<{
    match: Match;
    home: Team;
    away: Team;
    prediction?: Prediction;
    user: UserProfile | null;
    lang: Translation;
    channel?: string;
    onTeamClick?: (teamId: string) => void;
}> = ({ match, home, away, prediction, user, lang, channel, onTeamClick }) => {
    
    // Status Logic
    const isLive = ['LIVE', '1H', '2H', 'HT', 'AET', 'PEN'].includes(match.status);
    const isFinished = ['FINISHED', 'FT', 'AET', 'PEN'].includes(match.status);
    const hasScore = match.homeScore !== null && match.awayScore !== null;

    // Time Formatting
    const timeDisplay = match.date.includes('TBD') ? 'TBD' : new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Points / Accuracy Logic
    let pickBadgeColor = 'border-slate-700 text-slate-500 bg-slate-800/50'; 
    let pickPoints = null;

    if (prediction && hasScore) {
        const pts = calculatePoints(prediction.home, prediction.away, match.homeScore, match.awayScore, user?.hasTakenSecondChance || false, match.round);
        pickPoints = pts;
        
        if (match.round) {
            // Knockout Logic (Winner)
            if (pts > 0) pickBadgeColor = 'border-blue-500 text-blue-200 bg-blue-900/30 shadow-[0_0_10px_rgba(59,130,246,0.3)]'; 
            else pickBadgeColor = 'border-red-900 text-red-400 bg-red-900/20'; 
        } else {
            // Group Logic (Exact vs Result)
            if (prediction.home === match.homeScore && prediction.away === match.awayScore) {
                pickBadgeColor = 'border-green-500 text-green-300 bg-green-900/30 shadow-[0_0_10px_rgba(34,197,94,0.3)]'; 
            } else if (pts > 0) {
                pickBadgeColor = 'border-blue-500 text-blue-200 bg-blue-900/30 shadow-[0_0_10px_rgba(59,130,246,0.3)]'; 
            } else {
                pickBadgeColor = 'border-slate-600 text-slate-500 bg-slate-800'; 
            }
        }
    } else if (prediction) {
        pickBadgeColor = 'border-slate-600 text-yellow-500 border-dashed bg-slate-800/50';
    }

    // Team Names (Localized)
    const homeName = lang.teamNames[home.id] || home.name;
    const awayName = lang.teamNames[away.id] || away.name;

    const handleFlagClick = (e: React.MouseEvent, teamId: string) => {
        e.stopPropagation();
        if (onTeamClick && !teamId.startsWith('TBD')) {
            onTeamClick(teamId);
        }
    };

    return (
        <div className="bg-[#0f172a] border-b border-white/5 last:border-0 hover:bg-[#1e293b] transition-colors relative group">
            {/* Status Indicator Stripe */}
            {isLive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 animate-pulse shadow-[0_0_10px_red]"></div>}
            
            <div className="grid grid-cols-[80px_1fr_90px_1fr] sm:grid-cols-[100px_1fr_120px_1fr] items-center py-4 px-3 sm:px-6 gap-2 sm:gap-4 h-24">
                
                {/* 1. Left: Time/Status & TV */}
                <div className="flex flex-col justify-center h-full">
                    {isLive ? (
                        <span className="text-red-500 font-black text-[10px] uppercase tracking-widest animate-pulse flex items-center gap-1 mb-1">
                            <Activity size={10} /> {lang.live}
                        </span>
                    ) : isFinished ? (
                        <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1">{lang.ft}</span>
                    ) : (
                        <span className="text-white font-mono text-sm font-bold tracking-tight mb-1">{timeDisplay}</span>
                    )}
                    
                    {channel && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 w-fit whitespace-nowrap">
                            <Tv size={8} /> {channel}
                        </div>
                    )}
                </div>

                {/* 2. Home Team */}
                <div className="flex items-center justify-end gap-3 text-right">
                    <span 
                        onClick={(e) => handleFlagClick(e, home.id)}
                        className={`text-white font-bold text-xs sm:text-sm uppercase tracking-tight leading-tight hidden sm:block ${onTeamClick ? 'cursor-pointer hover:text-blue-400' : ''}`}
                    >
                        {homeName}
                    </span>
                    <span 
                        onClick={(e) => handleFlagClick(e, home.id)}
                        className={`text-white font-bold text-sm uppercase tracking-tight leading-tight sm:hidden ${onTeamClick ? 'cursor-pointer hover:text-blue-400' : ''}`}
                    >
                        {home.id}
                    </span>
                    <img 
                        src={home.flag} 
                        alt={homeName} 
                        onClick={(e) => handleFlagClick(e, home.id)}
                        className={`w-8 h-6 sm:w-10 sm:h-7 rounded shadow-md object-cover bg-slate-800 ${onTeamClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''}`} 
                    />
                </div>

                {/* 3. Center: Scoreboard & Prediction */}
                <div className="flex flex-col items-center justify-center">
                    {/* Real Score */}
                    <div className={`text-2xl sm:text-3xl font-black tracking-widest flex items-center gap-2 ${isLive ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-white'}`}>
                        <span>{match.homeScore ?? '-'}</span>
                        <span className="opacity-20 text-xl">:</span>
                        <span>{match.awayScore ?? '-'}</span>
                    </div>

                    {/* My Pick Badge */}
                    {prediction ? (
                        <div className={`mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider transition-all ${pickBadgeColor}`}>
                            <span className="hidden sm:inline opacity-70">{lang.myPickShort}:</span>
                            <span className="text-white">{prediction.home}-{prediction.away}</span>
                            {pickPoints !== null && (
                                <span className={`ml-1 ${pickPoints > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                                    +{pickPoints}
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="mt-1 text-[9px] text-slate-600 font-bold uppercase tracking-wider">{lang.noPick}</div>
                    )}
                </div>

                {/* 4. Away Team */}
                <div className="flex items-center justify-start gap-3 text-left">
                    <img 
                        src={away.flag} 
                        alt={awayName} 
                        onClick={(e) => handleFlagClick(e, away.id)}
                        className={`w-8 h-6 sm:w-10 sm:h-7 rounded shadow-md object-cover bg-slate-800 ${onTeamClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''}`}
                    />
                    <span 
                        onClick={(e) => handleFlagClick(e, away.id)}
                        className={`text-white font-bold text-xs sm:text-sm uppercase tracking-tight leading-tight hidden sm:block ${onTeamClick ? 'cursor-pointer hover:text-blue-400' : ''}`}
                    >
                        {awayName}
                    </span>
                    <span 
                        onClick={(e) => handleFlagClick(e, away.id)}
                        className={`text-white font-bold text-sm uppercase tracking-tight leading-tight sm:hidden ${onTeamClick ? 'cursor-pointer hover:text-blue-400' : ''}`}
                    >
                        {away.id}
                    </span>
                </div>

            </div>
        </div>
    );
};

export const TournamentSchedule: React.FC<TournamentScheduleProps> = ({ matches, teams, userPredictions, user, lang, currentLang, onTeamClick }) => {
    const [activeDateId, setActiveDateId] = useState<string | null>(null);
    const dateRefs = useRef<Record<string, HTMLDivElement | null>>({});
    
    // Group Matches by Date
    const groupedMatches = useMemo(() => {
        const groups: Record<string, Match[]> = {};
        const sortedMatches = [...matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        sortedMatches.forEach(m => {
            if (m.homeTeamId === 'TBD' || m.awayTeamId === 'TBD') return; // Skip incomplete
            const dateObj = new Date(m.date);
            const d = dateObj.toLocaleDateString(undefined, { weekday:'long', month: 'short', day: 'numeric'});
            if (!groups[d]) groups[d] = [];
            groups[d].push(m);
        });
        return groups;
    }, [matches]);

    const dateKeys = Object.keys(groupedMatches);

    // Scroll Handler
    const scrollToDate = (date: string) => {
        const el = dateRefs.current[date];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveDateId(date);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0b1120] rounded-2xl overflow-hidden shadow-2xl border border-white/5 min-h-[600px]">
            
            {/* Sticky Date Strip */}
            <div className="sticky top-0 z-20 bg-[#0f172a] border-b border-white/10 shadow-lg">
                <div className="flex overflow-x-auto no-scrollbar py-3 px-2 gap-2 snap-x">
                    {dateKeys.map(date => {
                        // Extract short date for tab (e.g. "Jun 11")
                        const shortDate = date.split(',')[1]?.trim() || date;
                        const isActive = activeDateId === date;
                        return (
                            <button
                                key={date}
                                onClick={() => scrollToDate(date)}
                                className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all snap-center whitespace-nowrap border ${
                                    isActive 
                                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/20' 
                                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                                }`}
                            >
                                {shortDate}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Schedule Feed */}
            <div className="flex-1 overflow-y-auto">
                {dateKeys.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center justify-center opacity-50">
                        <Calendar size={48} className="mb-4 text-slate-600" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest">{lang.noMatches}</p>
                    </div>
                ) : (
                    dateKeys.map(date => (
                        <div key={date} ref={(el) => { dateRefs.current[date] = el; }}>
                            {/* Date Header */}
                            <div className="sticky top-0 z-10 bg-[#1e293b]/95 backdrop-blur-md border-y border-white/5 px-4 py-2 flex items-center gap-2">
                                <Calendar size={14} className="text-blue-400" />
                                <span className="text-xs font-black text-blue-100 uppercase tracking-widest">{date}</span>
                            </div>
                            
                            {/* Matches */}
                            <div>
                                {groupedMatches[date].map(match => {
                                    const home = teams[match.homeTeamId];
                                    const away = teams[match.awayTeamId];
                                    const pred = userPredictions.find(p => p.matchId === match.id);
                                    
                                    // Channel Logic: Check current language first, fall back to 'EN'
                                    const channel = match.channels?.[currentLang] || match.channels?.['EN'];

                                    return (
                                        <BroadcasterRow 
                                            key={match.id}
                                            match={match}
                                            home={home}
                                            away={away}
                                            prediction={pred}
                                            user={user}
                                            lang={lang}
                                            channel={channel}
                                            onTeamClick={onTeamClick}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
