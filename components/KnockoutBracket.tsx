
import React, { useState, useMemo } from 'react';
import { Match, Team, Translation, Round, UserProfile, Prediction, TournamentPhase } from '../types';
import { Trophy, Calendar, MapPin, Check, Crown, ChevronRight, Medal, AlertTriangle, Unlock, Activity, ChevronLeft, LayoutGrid, Network, Lock, ArrowRight } from 'lucide-react';
import { generateWhatIfAnalysis } from '../services/engine';
import { useSwipe } from '../hooks/useSwipe';
import { KnockoutTreeView } from './KnockoutTreeView';

interface KnockoutBracketProps {
  matches: Match[];
  teams: Record<string, Team>;
  onUpdate: (id: string, h: number, a: number) => void;
  lang: Translation;
  user: UserProfile | null;
  onSecondChance: () => void;
  rivals?: UserProfile[];
  allPredictions?: Prediction[];
  phase: TournamentPhase;
  isGroupStageComplete?: boolean;
  firstIncompleteGroup?: string | null;
  onGoToGroup?: (groupId: string) => void;
  onTeamClick?: (teamId: string) => void;
}

const getLocalizedDate = (dateString: string) => {
  // Simple parser similar to MatchCard but inline since we can't easily share utility yet
  const parts = dateString.split(',').map(s => s.trim());
  let datePart = parts[0];
  let yearPart = '2026';
  
  if (parts.length >= 2) yearPart = parts[1];

  try {
    const monthMap: Record<string, number> = { 'June': 5, 'July': 6, 'August': 7 };
    const [monthStr, dayStr] = datePart.split(' ');
    const month = monthMap[monthStr] ?? 5;
    const day = parseInt(dayStr);
    const year = parseInt(yearPart);

    const utcDate = new Date(Date.UTC(year, month, day, 12, 0)); // Default noon for knockout
    if (isNaN(utcDate.getTime())) return dateString; // Fallback

    return utcDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  } catch (e) {
    return dateString;
  }
};

const ChampionDisplay: React.FC<{ winner: Team | null, lang: Translation, onTeamClick?: (id: string) => void }> = ({ winner, lang, onTeamClick }) => {
  if (!winner) return null;
  const teamName = lang.teamNames[winner.id] || winner.name;
  return (
    <div className="mb-8 animate-in zoom-in slide-in-from-top duration-700">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 p-1 shadow-2xl">
         <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
         <div className="relative bg-white/90 backdrop-blur-sm rounded-xl p-8 text-center flex flex-col items-center gap-4">
             <div className="relative">
                 <Crown size={64} className="text-yellow-500 drop-shadow-md animate-bounce" />
                 <div className="absolute -inset-4 bg-yellow-400/30 blur-xl rounded-full -z-10"></div>
             </div>
             <div className="space-y-1">
                 <h3 className="text-sm font-bold text-yellow-600 tracking-widest uppercase">{lang.champion}</h3>
                 <div className="text-5xl font-black text-slate-900 uppercase tracking-tighter drop-shadow-sm">{teamName}</div>
             </div>
             <div 
                onClick={() => onTeamClick && onTeamClick(winner.id)}
                className={`w-32 h-24 relative shadow-lg rounded-lg overflow-hidden border-4 border-yellow-100 transform rotate-2 ${onTeamClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
             >
                  <img src={winner.flag} alt={teamName} className="w-full h-full object-cover" />
             </div>
         </div>
      </div>
    </div>
  );
};

const KnockoutMatchCard: React.FC<{
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  onPickWinner: (winner: 'home' | 'away') => void;
  user?: UserProfile | null;
  rivals?: UserProfile[];
  allPredictions?: Prediction[];
  phase: TournamentPhase;
  lang: Translation;
  onTeamClick?: (teamId: string) => void;
}> = ({ match, homeTeam, awayTeam, onPickWinner, user, rivals, allPredictions, phase, lang, onTeamClick }) => {
  const homeWin = match.homeScore !== null && match.homeScore > (match.awayScore || 0);
  const awayWin = match.awayScore !== null && match.awayScore > (match.homeScore || 0);
  
  let analysisText = null;
  const isLive = match.status === 'LIVE' || match.status === '1H' || match.status === '2H' || match.status === 'HT';
  if (isLive && user && rivals && allPredictions) {
      const userPred = allPredictions.find(p => p.userId === user.email && p.matchId === match.id);
      if (userPred) {
          analysisText = generateWhatIfAnalysis(match, userPred, user, rivals, allPredictions, lang);
      }
  }

  const isSecondChanceActive = phase === 'LIVE' && user?.hasTakenSecondChance;
  // Unlock if pre-live and not specifically locked by some other mechanism
  const isLocked = isSecondChanceActive 
      ? (match.status !== 'UPCOMING' && match.status !== 'NS') 
      : (phase === 'LIVE' || match.isLocked);

  const formattedDate = useMemo(() => getLocalizedDate(match.date), [match.date]);

  const handleFlagClick = (e: React.MouseEvent, teamId: string) => {
      e.stopPropagation();
      if (onTeamClick && !teamId.startsWith('TBD')) {
          onTeamClick(teamId);
      }
  };

  const renderTeam = (team: Team, side: 'home' | 'away', isWinner: boolean) => {
    const isPlaceholder = team?.id?.startsWith('TBD') || team?.name === 'TBD';
    // Use rank directly
    const rank = team && !team.id.startsWith('TBD') ? team.rank : null;
    const teamName = team ? (lang.teamNames[team.id] || team.name) : 'TBD';

    return (
      <button
        onClick={() => onPickWinner(side)}
        disabled={isLocked || isPlaceholder}
        className={`flex-1 relative flex flex-col items-center justify-center p-2 sm:p-4 rounded-xl border-2 transition-all duration-200 group overflow-visible h-36 sm:h-40 ${
          isWinner 
            ? "bg-green-50 border-green-500 shadow-md z-10" 
            : isPlaceholder
              ? "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed"
              : isLocked 
                ? "bg-slate-50 border-slate-200 opacity-90"
                : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm"
        }`}
      >
        {isWinner && (
           <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1 shadow-sm animate-in zoom-in">
              <Check size={12} strokeWidth={4} />
           </div>
        )}

        <div 
            onClick={(e) => !isPlaceholder && handleFlagClick(e, team.id)}
            className={`relative w-12 h-8 sm:w-16 sm:h-10 mb-3 transition-transform ${isWinner ? 'scale-110' : 'group-hover:scale-105'} ${onTeamClick && !isPlaceholder ? 'cursor-pointer hover:ring-2 hover:ring-blue-300 rounded' : ''}`}
        >
            <div className="w-full h-full rounded shadow-sm overflow-hidden border border-black/5">
                {team?.flag ? <img src={team.flag} alt={teamName} className="w-full h-full object-cover" /> : null}
            </div>
            {rank && (
              <div className="absolute -bottom-3 -right-3 bg-[#0f2545] text-white text-[12px] font-black w-10 h-10 flex items-center justify-center rounded-full border-4 border-white shadow-2xl z-20">
                  #{rank}
              </div>
            )}
        </div>

        <div className={`text-xs sm:text-sm font-black uppercase tracking-tight text-center leading-tight ${isWinner ? 'text-green-800' : 'text-slate-700'}`}>
            {teamName}
        </div>
      </button>
    );
  };

  return (
    <div className="relative mb-3">
        <div className="flex items-center justify-center gap-2 mb-1.5 opacity-60">
            <Calendar size={10} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{formattedDate}</span>
            {match.venue && (
              <>
                <span className="mx-1">•</span>
                <MapPin size={10} />
                <span className="text-[10px] font-bold uppercase tracking-wider truncate max-w-[100px]">{match.venue}</span>
              </>
            )}
        </div>

        <div className="flex gap-2 sm:gap-4 items-stretch">
            {renderTeam(homeTeam, 'home', homeWin)}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                <div className="bg-[#0f2545] text-white text-[10px] font-black p-1.5 rounded-lg shadow-lg border-2 border-white/20">
                    VS
                </div>
            </div>
            {renderTeam(awayTeam, 'away', awayWin)}
        </div>

        {analysisText && (
            <div className="mt-2 bg-blue-50 border border-blue-100 p-2 rounded-lg flex items-start gap-2">
                <Activity size={14} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-800 font-medium leading-tight">{analysisText}</p>
            </div>
        )}
    </div>
  );
};

export const KnockoutBracket: React.FC<KnockoutBracketProps> = ({ 
  matches, teams, onUpdate, lang, user, onSecondChance, rivals, allPredictions, phase, isGroupStageComplete, firstIncompleteGroup, onGoToGroup, onTeamClick
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [activeRound, setActiveRound] = useState<Round>('R32');

  const rounds: Round[] = ['R32', 'R16', 'QF', 'SF', '3RD', 'FIN'];

  // LOCK SCREEN IF GROUP STAGE IS NOT COMPLETE
  if (phase === 'PRE_LIVE' && isGroupStageComplete === false) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in slide-in-from-bottom-4">
         <div className="bg-slate-100 p-8 rounded-full mb-6 relative">
            <Lock size={64} className="text-slate-400" />
            <div className="absolute -bottom-2 -right-2 bg-yellow-400 p-3 rounded-full border-4 border-white">
                <AlertTriangle size={24} className="text-yellow-900" />
            </div>
         </div>
         <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-3 text-center">{lang.lockedBracketTitle}</h2>
         <p className="text-slate-500 text-sm font-medium text-center max-w-xs mb-8">
            {lang.lockedBracketDesc}
         </p>
         {firstIncompleteGroup && onGoToGroup && (
             <button 
                onClick={() => onGoToGroup(firstIncompleteGroup)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/30 flex items-center gap-2 transition-all transform hover:scale-105"
             >
                <span>{lang.finishGroupBtn.replace('{0}', firstIncompleteGroup)}</span>
                <ArrowRight size={16} />
             </button>
         )}
      </div>
    );
  }
  
  const goToNextRound = () => {
      const idx = rounds.indexOf(activeRound);
      if (idx < rounds.length - 1) setActiveRound(rounds[idx + 1]);
  };
  
  const goToPrevRound = () => {
      const idx = rounds.indexOf(activeRound);
      if (idx > 0) setActiveRound(rounds[idx - 1]);
  };

  const swipeHandlers = useSwipe({ onSwipeLeft: goToNextRound, onSwipeRight: goToPrevRound });

  const currentMatches = matches.filter(m => m.round === activeRound);
  
  const isRoundComplete = (r: Round) => {
      const roundMatches = matches.filter(m => m.round === r);
      if (roundMatches.length === 0) return false;
      return roundMatches.every(m => m.homeScore !== null && m.awayScore !== null);
  };

  const finalMatch = matches.find(m => m.round === 'FIN');
  const championId = finalMatch && finalMatch.homeScore !== null && finalMatch.awayScore !== null
      ? (finalMatch.homeScore > finalMatch.awayScore ? finalMatch.homeTeamId : finalMatch.awayTeamId)
      : null;
  const champion = championId && championId !== 'TBD' ? teams[championId] : null;

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="flex justify-center">
          <div className="inline-flex bg-slate-200 p-1 rounded-xl shadow-inner">
             <button 
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-[#0f2545] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
             >
                <LayoutGrid size={14} /> {lang.listView}
             </button>
             <button 
                onClick={() => setViewMode('tree')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'tree' ? 'bg-[#0f2545] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
             >
                <Network size={14} /> {lang.treeView}
             </button>
          </div>
      </div>

      {viewMode === 'tree' ? (
          <div className="space-y-6">
              <KnockoutTreeView matches={matches} teams={teams} onUpdate={onUpdate} lang={lang} user={user} phase={phase} />
              
              {champion && (
                  <div className="mt-8">
                      <ChampionDisplay winner={champion} lang={lang} onTeamClick={onTeamClick} />
                  </div>
              )}
          </div>
      ) : (
          <div className="space-y-6">
              {activeRound === 'FIN' && <ChampionDisplay winner={champion} lang={lang} onTeamClick={onTeamClick} />}

              <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 overflow-x-auto no-scrollbar">
                  {rounds.map(round => {
                     const isActive = activeRound === round;
                     const isDone = isRoundComplete(round);
                     return (
                         <button
                            key={round}
                            onClick={() => setActiveRound(round)}
                            className={`flex-1 min-w-[60px] py-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all relative ${isActive ? 'bg-[#0f2545] text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                         >
                            {round}
                            {isDone && !isActive && (
                                <span className="absolute top-1 right-1 text-green-500"><Check size={8} strokeWidth={4} /></span>
                            )}
                         </button>
                     );
                  })}
              </div>

              <div {...swipeHandlers} className="min-h-[400px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentMatches.map(match => {
                         const home = teams[match.homeTeamId];
                         const away = teams[match.awayTeamId];
                         
                         const handleWin = (winnerSide: 'home' | 'away') => {
                             if (winnerSide === 'home') onUpdate(match.id, 1, 0);
                             else onUpdate(match.id, 0, 1);
                         };

                         return (
                             <KnockoutMatchCard 
                                key={match.id} 
                                match={match} 
                                homeTeam={home} 
                                awayTeam={away} 
                                onPickWinner={handleWin}
                                user={user}
                                rivals={rivals}
                                allPredictions={allPredictions}
                                phase={phase}
                                lang={lang}
                                onTeamClick={onTeamClick}
                             />
                         );
                      })}
                  </div>
              </div>

              <div className="mt-8 mb-4 flex flex-col items-center gap-4">
                <div className="flex gap-3 w-full max-w-sm">
                    <button 
                        onClick={goToPrevRound}
                        disabled={activeRound === 'R32'}
                        className={`flex-1 px-4 py-4 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-500 font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group ${activeRound === 'R32' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span>{lang.prevRound}</span>
                    </button>
                    <button 
                        onClick={goToNextRound}
                        disabled={activeRound === 'FIN'}
                        className={`flex-[2] px-6 py-4 bg-gradient-to-r from-[#0f2545] to-blue-900 text-white rounded-xl shadow-lg border-t border-blue-400/20 font-black uppercase tracking-widest hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group ${activeRound === 'FIN' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <span>{lang.nextRound}</span>
                        <ChevronRight size={16} className="text-yellow-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
              </div>
          </div>
      )}
    </div>
  );
};
