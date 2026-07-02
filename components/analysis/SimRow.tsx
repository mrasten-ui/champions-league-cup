import React, { useState, useMemo } from 'react';
import { UserProfile, Match, Prediction, Team, Translation, GroupStanding, LanguageCode } from '../../types'; 
import { getSlotSource } from '../../utils/bracketHelpers';
import { SCORING_RULES } from '../../services/engine';
import { AvatarDisplay } from '../AvatarDisplay';
import { ChevronUp, ChevronDown, Check, Trophy, Calculator } from 'lucide-react';

// LOCAL TRANSLATIONS
const TEXT: Record<string, any> = {
    en: { predicted: "Predicted", tbd: "TBD" },
    'en-US': { predicted: "Picked", tbd: "TBD" },
    sco: { predicted: "Tippit", tbd: "TBD" },
    no: { predicted: "Tippet", tbd: "TBD" }
};

const resolveLanguage = (code: LanguageCode): string => {
    if (code === 'NO') return 'no';
    if (code === 'SCO') return 'sco';
    if (code === 'US') return 'en-US';
    return 'en';
};

// --- SUB-COMPONENTS ---

const ScoreStepper: React.FC<{ 
    value: number; 
    onChange: (val: number) => void; 
    isLocked: boolean;
    isSimulated: boolean;
}> = ({ value, onChange, isLocked, isSimulated }) => {
  return (
    <div className={`flex flex-col items-center justify-between w-12 h-20 bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm group ${isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:border-purple-300 hover:shadow-md'}`}>
      <button 
        disabled={isLocked}
        onClick={(e) => { e.stopPropagation(); onChange(value + 1); }}
        className={`w-full flex-1 flex items-center justify-center rounded-t-xl transition-colors active:bg-purple-50 focus:outline-none ${isSimulated ? 'text-purple-400 group-hover:text-purple-600' : 'text-slate-400 group-hover:text-blue-600'}`}
      >
        <ChevronUp size={18} strokeWidth={3} />
      </button>
      
      <div className={`h-8 flex items-center justify-center text-xl font-black leading-none select-none z-10 bg-white w-full border-y border-slate-100 ${isSimulated ? 'text-purple-600' : 'text-slate-800'}`}>
        {value}
      </div>
      
      <button 
        disabled={isLocked}
        onClick={(e) => { e.stopPropagation(); onChange(Math.max(0, value - 1)); }}
        className={`w-full flex-1 flex items-center justify-center rounded-b-xl transition-colors active:bg-purple-50 focus:outline-none ${isSimulated ? 'text-purple-400 group-hover:text-purple-600' : 'text-slate-400 group-hover:text-blue-600'}`}
      >
        <ChevronDown size={18} strokeWidth={3} />
      </button>
    </div>
  );
};

const WinnerButton: React.FC<{
    team: Team | undefined;
    label: string;
    slotCode?: string;
    isSelected: boolean;
    onClick: () => void;
    tbdText: string;
}> = ({ team, label, slotCode, isSelected, onClick, tbdText }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center gap-2 p-2 rounded-xl border-2 transition-all w-full h-[90px] ${isSelected ? 'bg-purple-50 border-purple-500 shadow-md ring-1 ring-purple-200' : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50'}`}
    >
        <div className="relative">
            {team && team.flag ? (
                <img src={team.flag} alt={team.name} className="w-12 h-8 object-cover rounded shadow-sm" />
            ) : (
                <div className="w-12 h-8 flex items-center justify-center">
                    <div className="bg-gradient-to-br from-[#2e1065] to-purple-700 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ring-2 ring-purple-100/50">
                        <Trophy size={14} className="text-yellow-400" />
                    </div>
                </div>
            )}
            {isSelected && <div className="absolute -right-2 -top-2 bg-purple-500 text-white p-0.5 rounded-full shadow-sm border-2 border-white"><Check size={10} strokeWidth={4} /></div>}
        </div>
        <span className={`text-[10px] font-black uppercase tracking-tight text-center leading-none max-w-full truncate px-1 line-clamp-2 ${isSelected ? 'text-purple-800' : 'text-slate-500'}`}>
            {team ? team.name : (slotCode || label || tbdText)}
        </span>
    </button>
);

const PredictionPill: React.FC<{
    user: UserProfile;
    label: string;
    status: 'exact' | 'correct' | 'wrong' | 'neutral'; 
    isMe: boolean;
    onSelect?: () => void;
    align: 'left' | 'center' | 'right';
    tooltipText: string;
}> = ({ user, label, status, isMe, onSelect, align, tooltipText }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    let baseClass = 'bg-slate-50 text-slate-400 border-slate-100 opacity-80';
    if (status === 'exact') baseClass = 'bg-green-100 text-green-800 border-green-300 ring-1 ring-green-200 opacity-100';
    if (status === 'correct') baseClass = 'bg-blue-50 text-blue-700 border-blue-200 opacity-100';
    if (isMe) baseClass += ' ring-2 ring-purple-400 ring-offset-1 font-black opacity-100';

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if(onSelect) onSelect();
        setIsExpanded(!isExpanded);
    };

    return (
        <button
            onClick={handleClick}
            className={`
                flex items-center gap-1.5 px-1.5 py-1 rounded-lg border text-[9px] font-bold transition-all shadow-sm
                ${baseClass} ${align === 'right' ? 'flex-row-reverse' : 'flex-row'}
                ${isExpanded ? 'z-10 scale-105' : 'hover:scale-105'}
            `}
            title={`${tooltipText}: ${label}`}
        >
            <AvatarDisplay avatar={user.avatar} size="xs" className="w-4 h-4 rounded-full bg-white shadow-sm" />
            {isExpanded && <span className="truncate max-w-[60px] animate-in fade-in zoom-in duration-200">{user.name.split(' ')[0]}</span>}
            <span className={`font-black ${isExpanded ? 'text-[10px]' : ''}`}>{label}</span>
        </button>
    );
};

export const StandingsStrip: React.FC<{
    standings: GroupStanding[];
    teams: Record<string, Team>;
    qualifiedThirdsSet: Set<string>;
}> = ({ standings, teams, qualifiedThirdsSet }) => {
    return (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 w-full">
            {standings.map((row, index) => {
                const rank = index + 1;
                let badgeColor = 'bg-slate-800/50 text-slate-300 border-slate-600/50'; 
                let rankIndicator = null;

                if (rank <= 2) {
                    badgeColor = 'bg-emerald-600 text-white border-emerald-500 shadow-sm';
                } else if (rank === 3) {
                    if (qualifiedThirdsSet.has(row.teamId)) {
                        badgeColor = 'bg-amber-500 text-[#0f2545] border-amber-400 shadow-sm';
                        rankIndicator = <span className="text-[8px] font-black bg-white/20 px-1 rounded ml-1">Q</span>;
                    } else {
                        badgeColor = 'bg-slate-600 text-slate-300 border-slate-500 opacity-80';
                        rankIndicator = <span className="text-[8px] font-bold text-red-300 ml-1">X</span>;
                    }
                }

                const teamName = teams[row.teamId]?.name || row.teamId;
                const teamCode = teamName.substring(0,3).toUpperCase();

                return (
                    <div key={row.teamId} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${badgeColor} shrink-0`}>
                        <span className="text-[9px] font-black">{rank}.</span>
                        <img src={teams[row.teamId]?.flag} className="w-4 h-3 object-cover rounded shadow-sm" alt="" />
                        <span className="text-[9px] font-bold">{teamCode}</span>
                        <span className="text-[9px] font-black opacity-80 border-l border-white/20 pl-1.5 ml-0.5">{row.pts}p</span>
                        {rankIndicator}
                    </div>
                );
            })}
        </div>
    );
};

// --- MAIN EXPORTED COMPONENT ---

export const SimRow: React.FC<{
    match: Match;
    home: Team | undefined;
    away: Team | undefined;
    sim: { home: number, away: number } | undefined;
    onUpdate: (h: number, a: number) => void;
    currentUser: UserProfile;
    rivals: UserProfile[];
    allPredictions: Prediction[];
    userBracketData: Map<string, Record<string, { home: string, away: string, winner: string }>>;
    lang: Translation;
    currentLang: LanguageCode;
    groupStandings?: GroupStanding[];
    teams: Record<string, Team>;
    qualifiedThirdsSet: Set<string>;
}> = ({ match, home, away, sim, onUpdate, currentUser, rivals, allPredictions, userBracketData, lang, currentLang, groupStandings, teams, qualifiedThirdsSet }) => {
    const hVal = sim ? sim.home : (match.homeScore ?? 0);
    const aVal = sim ? sim.away : (match.awayScore ?? 0);
    const isSimulated = !!sim;
    const isKnockout = !match.groupId;
    
    // Explicitly define isLive
    const isLive = ['LIVE', '1H', '2H', 'HT', 'AET', 'PEN'].includes(match.status);
    
    // Select Translations (Robust)
    const langKey = resolveLanguage(currentLang);
    const t = TEXT[langKey];

    const homeSource = useMemo(() => getSlotSource(match.id, 'home'), [match.id]);
    const awaySource = useMemo(() => getSlotSource(match.id, 'away'), [match.id]);
    
    const homeSlotCode = homeSource?.label || t.tbd;
    const awaySlotCode = awaySource?.label || t.tbd;

    const homeLabel = home ? home.name : homeSlotCode;
    const awayLabel = away ? away.name : awaySlotCode;

    const { homePreds, drawPreds, awayPreds } = useMemo(() => {
        const h: { u: UserProfile, label: string, status: 'exact' | 'correct' | 'wrong' | 'neutral' }[] = [];
        const d: { u: UserProfile, label: string, status: 'exact' | 'correct' | 'wrong' | 'neutral' }[] = [];
        const a: { u: UserProfile, label: string, status: 'exact' | 'correct' | 'wrong' | 'neutral' }[] = [];

        [currentUser, ...rivals].forEach(u => {
            if (match.groupId) {
                const p = allPredictions.find(pred => pred.userId === u.email && pred.matchId === match.id);
                if (p) {
                    const label = `${p.home}-${p.away}`;
                    const isExact = (p.home === hVal && p.away === aVal);
                    const predOutcome = p.home > p.away ? 'H' : p.home < p.away ? 'A' : 'D';
                    const simOutcome = hVal > aVal ? 'H' : hVal < aVal ? 'A' : 'D';
                    const isCorrectOutcome = predOutcome === simOutcome;

                    let status: 'exact' | 'correct' | 'wrong' | 'neutral' = 'wrong';
                    if (isExact) status = 'exact';
                    else if (isCorrectOutcome) status = 'correct';

                    if (p.home > p.away) h.push({ u, label, status });
                    else if (p.away > p.home) a.push({ u, label, status });
                    else d.push({ u, label, status });
                }
            } else {
                const userBracket = userBracketData.get(u.email);
                const userMatchState = userBracket ? userBracket[match.id] : null;

                if (userMatchState) {
                    const userHomeTeam = teams[userMatchState.home];
                    const userAwayTeam = teams[userMatchState.away];
                    const userWinnerId = userMatchState.winner;

                    if (home) {
                        if (userMatchState.home === home.id || userMatchState.away === home.id) {
                            const picksWin = userWinnerId === home.id;
                            h.push({ u, label: picksWin ? 'WIN' : '-', status: picksWin ? 'exact' : 'wrong' });
                        }
                    } else {
                        if (userHomeTeam) {
                            const picksWin = userWinnerId === userHomeTeam.id;
                            h.push({ u, label: userHomeTeam.code, status: picksWin ? 'exact' : 'neutral' });
                        }
                    }

                    if (away) {
                        if (userMatchState.home === away.id || userMatchState.away === away.id) {
                            const picksWin = userWinnerId === away.id;
                            a.push({ u, label: picksWin ? 'WIN' : '-', status: picksWin ? 'exact' : 'wrong' });
                        }
                    } else {
                        if (userAwayTeam) {
                            const picksWin = userWinnerId === userAwayTeam.id;
                            a.push({ u, label: userAwayTeam.code, status: picksWin ? 'exact' : 'neutral' });
                        }
                    }
                }
            }
        });
        return { homePreds: h, drawPreds: d, awayPreds: a };
    }, [currentUser, rivals, allPredictions, match.id, userBracketData, home, away, hVal, aVal, teams]);

    return (
        <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 flex flex-col ${isSimulated ? 'border-purple-400 ring-2 ring-purple-50' : 'border-slate-200'}`}>
            <div className="bg-[#2e1065] p-3 border-b border-purple-900/50 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[9px] font-black text-purple-200 uppercase tracking-widest">
                        {isLive ? <span className="text-red-400 animate-pulse">● LIVE</span> : <span>{new Date(match.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>}
                        <span className="text-purple-700">|</span>
                        <span>{match.groupId ? `Group ${match.groupId}` : match.round}</span>
                        {isKnockout && match.round && (SCORING_RULES as any)[match.round] && (
                            <span className="text-amber-300 font-black">
                                +{(SCORING_RULES as any)[match.round]}pts
                            </span>
                        )}
                    </div>
                    {isSimulated && (
                        <div className="flex items-center gap-1 text-[8px] font-black text-[#2e1065] bg-purple-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            <Calculator size={8} /> Sim
                        </div>
                    )}
                </div>
                {groupStandings && (
                    <StandingsStrip standings={groupStandings} teams={teams} qualifiedThirdsSet={qualifiedThirdsSet} />
                )}
            </div>

            <div className="p-3 grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-2 justify-start h-full">
                    {!isKnockout ? (
                        <div className="flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 rounded-xl border border-slate-100 h-[90px]">
                            {home ? (
                                <>
                                    <img src={home.flag} alt="" className="w-10 h-7 rounded shadow-sm object-cover" />
                                    <span className="text-[10px] font-black text-slate-800 uppercase text-center leading-tight line-clamp-2">{home.name}</span>
                                </>
                            ) : (
                                <span className="text-[8px] font-bold uppercase">{homeLabel}</span>
                            )}
                        </div>
                    ) : (
                        <WinnerButton team={home} label={homeLabel} slotCode={!home ? homeSlotCode : undefined} isSelected={hVal > aVal} onClick={() => onUpdate(1, 0)} tbdText={t.tbd} />
                    )}
                    {!isKnockout && (
                        <div className="flex flex-wrap content-start gap-1.5 mt-1">
                            {homePreds.map(item => (
                                <PredictionPill key={item.u.email} user={item.u} label={item.label} status={item.status} isMe={item.u.email === currentUser.email} tooltipText={t.predicted} onSelect={() => { const p = allPredictions.find(pred => pred.userId === item.u.email && pred.matchId === match.id); if(p) onUpdate(p.home, p.away); }} align="left" />
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 items-center justify-start h-full">
                    {!isKnockout ? (
                        <div className="flex items-center gap-1.5 h-[90px]">
                            <ScoreStepper value={hVal} onChange={(v) => onUpdate(v, aVal)} isLocked={false} isSimulated={isSimulated} />
                            <span className="text-slate-300 font-bold">-</span>
                            <ScoreStepper value={aVal} onChange={(v) => onUpdate(hVal, v)} isLocked={false} isSimulated={isSimulated} />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[90px] w-full">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-inner">VS</div>
                        </div>
                    )}
                    {!isKnockout && (
                        <div className="flex flex-wrap justify-center gap-1.5 w-full mt-1">
                            {drawPreds.length > 0 && <div className="h-px bg-slate-100 w-full my-0.5"></div>}
                            {drawPreds.map(item => (
                                <PredictionPill key={item.u.email} user={item.u} label={item.label} status={item.status} isMe={item.u.email === currentUser.email} tooltipText={t.predicted} onSelect={() => { const p = allPredictions.find(pred => pred.userId === item.u.email && pred.matchId === match.id); if(p) onUpdate(p.home, p.away); }} align="center" />
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 justify-start h-full">
                    {!isKnockout ? (
                        <div className="flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 rounded-xl border border-slate-100 h-[90px]">
                            {away ? (
                                <>
                                    <img src={away.flag} alt="" className="w-10 h-7 rounded shadow-sm object-cover" />
                                    <span className="text-[10px] font-black text-slate-800 uppercase text-center leading-tight line-clamp-2">{away.name}</span>
                                </>
                            ) : (
                                <span className="text-[8px] font-bold uppercase">{awayLabel}</span>
                            )}
                        </div>
                    ) : (
                        <WinnerButton team={away} label={awayLabel} slotCode={!away ? awaySlotCode : undefined} isSelected={aVal > hVal} onClick={() => onUpdate(0, 1)} tbdText={t.tbd} />
                    )}
                    {!isKnockout && (
                        <div className="flex flex-wrap justify-end content-start gap-1.5 mt-1">
                            {awayPreds.map(item => (
                                <PredictionPill key={item.u.email} user={item.u} label={item.label} status={item.status} isMe={item.u.email === currentUser.email} tooltipText={t.predicted} onSelect={() => { const p = allPredictions.find(pred => pred.userId === item.u.email && pred.matchId === match.id); if(p) onUpdate(p.home, p.away); }} align="right" />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};