import React, { useState, useMemo } from 'react';
import { Match, Team, Prediction, UserProfile, Translation, TournamentPhase } from '../types';
import { ResourceHeader } from './ResourceHeader';
import { SecondChancePromo } from './SecondChancePromo';
import { PredictionStamp } from './PredictionStamp';
import { SubstitutionModal } from './SubstitutionModal';
import { Trophy, LayoutGrid, CalendarClock, Info, X, ShieldCheck } from 'lucide-react';
import { calculateGroupStandings, getAllGroupStandings, getThirdPlaceStandings } from '../services/engine';

interface ManagerHubProps {
  matches: Match[];        
  userMatches: Match[];    
  teams: Record<string, Team>;
  allPredictions: Prediction[];
  currentUser: UserProfile;
  lang: Translation;
  onSubstitute: (matchId: string) => void;
  onUnlockSecondChance: () => void;
  onUpdate: (matchId: string, h: number, a: number) => void;
  phase: TournamentPhase;
  groupStageEndTime?: number;
  knockoutStartTime?: number;
}

export const ManagerHub: React.FC<ManagerHubProps> = ({
  matches,
  userMatches,
  teams,
  allPredictions,
  currentUser,
  lang,
  onSubstitute,
  onUnlockSecondChance,
  onUpdate,
  phase,
  groupStageEndTime,
  knockoutStartTime,
}) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const groupsOver = groupStageEndTime ? Date.now() >= groupStageEndTime : false;
  const [viewMode, setViewMode] = useState<'groups' | 'knockout'>(groupsOver ? 'knockout' : 'groups');

  const [showMgrHint, setShowMgrHint] = useState(() => !localStorage.getItem(`rasten_mgr_hint_${currentUser.email}`));

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const inAlertWindow = groupStageEndTime
      ? Date.now() >= groupStageEndTime - sevenDaysMs && Date.now() < groupStageEndTime
      : false;
  const alertDismissKey = `rasten_sc_alert_${currentUser.email}`;
  const [showScAlert, setShowScAlert] = useState(
      inAlertWindow &&
      !currentUser.hasTakenSecondChance &&
      currentUser.secondChanceStatus !== 'PENDING' &&
      currentUser.secondChanceStatus !== 'ACTIVE' &&
      !localStorage.getItem(alertDismissKey)
  );
  const dismissScAlert = () => {
      localStorage.setItem(alertDismissKey, '1');
      setShowScAlert(false);
  };

  const userPredictions = useMemo(() => {
    return allPredictions.filter(p => p.userId === currentUser.email);
  }, [allPredictions, currentUser.email]);

  const qualifiedThirdsSet = useMemo(() => {
      const allStandings = getAllGroupStandings(userMatches, teams);
      const thirds = getThirdPlaceStandings(allStandings);
      const top8 = thirds.slice(0, 8).map(t => t.teamId);
      return new Set(top8);
  }, [userMatches, teams]);

  const groupedMatches = useMemo(() => {
      const groups: Record<string, Match[]> = {};
      const knockouts: Record<string, Match[]> = {
          'R32': [], 'R16': [], 'QF': [], 'SF': [], 'FIN': [], '3RD': []
      };

      userMatches.forEach(m => {
          if (m.homeTeamId === 'TBD' || m.awayTeamId === 'TBD') return;

          if (m.groupId) {
              if (!groups[m.groupId]) groups[m.groupId] = [];
              groups[m.groupId].push(m);
          } else if (m.round) {
              knockouts[m.round].push(m);
          }
      });

      const sortedGroups = Object.keys(groups).sort().reduce((obj, key) => {
          obj[key] = groups[key].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          return obj;
      }, {} as Record<string, Match[]>);

      return { groups: sortedGroups, knockouts };
  }, [userMatches]);

  const getRealMatch = (userMatchId: string) => {
      return matches.find(m => m.id === userMatchId);
  };

  const canSubMatch = (realMatch: Match | undefined) => {
      if (!realMatch) return false;
      if (realMatch.round) return false;
      const isStarted = ['LIVE', '1H', 'HT', '2H', 'FT', 'FINISHED', 'PEN', 'AET'].includes(realMatch.status);
      if (isStarted) return false;
      
      // If already unlocked, user can just "edit", but the button logic is handled by 'phase' mostly
      // We return true here so the button shows up. Inside handleSubClick we check status.
      return phase === 'LIVE'; 
  };

  // --- DIRECT CONFIRMATION HANDLER ---
  const handleSubClick = (matchId: string) => {
      const isUnlocked = currentUser.unlockedMatches?.includes(matchId);
      
      if (isUnlocked) {
          // Already unlocked -> Open modal directly to Edit
          setSelectedMatchId(matchId);
      } else {
          // Locked -> Confirm First -> Unlock -> Then Open Modal
          const confirmMsg = lang.subConfirm || "Use 1 Substitution to unlock?";
          if (window.confirm(confirmMsg)) {
              onSubstitute(matchId); // Action
              setSelectedMatchId(matchId); // Open Modal (it will render unlocked)
          }
      }
  };

  const hasKnockouts = useMemo(() => {
      return Object.values(groupedMatches.knockouts).some(arr => arr.length > 0);
  }, [groupedMatches]);

  const activeModalMatch = useMemo(() => {
      if (!selectedMatchId) return null;
      const userMatch = userMatches.find(m => m.id === selectedMatchId);
      const realMatch = matches.find(m => m.id === selectedMatchId);
      if (!userMatch || !realMatch) return null;
      
      // Force 'isLocked' to true if in LIVE phase (unless unlocked) 
      // ensuring the modal handles the UI correctly
      const effectiveLocked = phase === 'LIVE' ? true : realMatch.isLocked;

      return {
          ...realMatch,
          isLocked: effectiveLocked,
          homeTeamId: userMatch.homeTeamId,
          awayTeamId: userMatch.awayTeamId
      };
  }, [selectedMatchId, userMatches, matches, phase]);

  const getKnockoutGridClass = (round: string, count: number) => {
      if (round === 'FIN') return 'flex justify-center max-w-sm mx-auto';
      if (round === 'SF') return 'flex flex-wrap justify-center gap-3 max-w-lg mx-auto';
      if (round === 'QF' && count <= 4) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3';
      return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3';
  };

  return (
    <div id="tour-manager-hub" className="pb-24 animate-fade-in space-y-8">
      
      <ResourceHeader
        user={currentUser}
        lang={lang}
        phase={phase}
        rank={99}
        totalPoints={0}
      />

      {/* 2nd Chance last-week alert */}
      {showScAlert && (
        <div className="px-1 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <ShieldCheck size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-0.5">
              2nd Chance — Last chance to decide
            </div>
            <p className="text-xs text-amber-800 leading-snug">
              Group stage ends soon. Switch to Knockouts to see your bracket and decide if you want to buy back in.
            </p>
          </div>
          <button onClick={dismissScAlert} className="text-amber-400 hover:text-amber-600 shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {showMgrHint && (
        <div className="mx-4 p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-start gap-3">
          <Info size={16} className="text-indigo-500 mt-0.5 shrink-0" />
          <p className="text-xs text-indigo-800 font-medium flex-1 leading-relaxed">{(lang as any).mgrHint}</p>
          <button onClick={() => { localStorage.setItem(`rasten_mgr_hint_${currentUser.email}`, '1'); setShowMgrHint(false); }} className="text-indigo-400 hover:text-indigo-600 shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      <div id="tour-manager-viewmode" className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 flex gap-2">
          <button 
            onClick={() => setViewMode('groups')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                viewMode === 'groups' 
                ? 'bg-[#0f2545] text-white shadow-md transform scale-[1.02]' 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            }`}
          >
              <LayoutGrid size={16} />
              {lang.groups || "Group Stage"}
          </button>
          
          <button 
            onClick={() => setViewMode('knockout')}
            disabled={!hasKnockouts}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                viewMode === 'knockout' 
                ? 'bg-[#0f2545] text-white shadow-md transform scale-[1.02]' 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            } ${!hasKnockouts ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
              <Trophy size={16} />
              {lang.knockouts || "Knockouts"}
          </button>
      </div>

      {viewMode === 'groups' && (
          <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
              {Object.entries(groupedMatches.groups).map(([groupId, groupMatches]) => {
                  const standings = calculateGroupStandings(groupId, userMatches, teams);
                  return (
                      <div key={groupId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                          <div className="bg-[#0f2545] p-3 flex flex-col gap-3 border-b border-slate-700/50">
                              <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-white font-black text-xs border border-white/10">{groupId}</div>
                                      <span className="text-white text-xs font-black uppercase tracking-widest">Group {groupId}</span>
                                  </div>
                                  <span className="text-[9px] font-bold text-blue-200 bg-white/5 px-2 py-0.5 rounded border border-white/5">{groupMatches.length} Games</span>
                              </div>
                              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:justify-center">
                                  {standings.map((row, index) => {
                                      const rank = index + 1;
                                      let badgeColor = 'bg-slate-700 text-slate-400 border-slate-600';
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
                                              <span className="text-[9px] font-black opacity-80 border-l border-black/20 pl-1.5 ml-0.5">{row.pts}p</span>
                                              {rankIndicator}
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>
                          <div className="p-4 bg-slate-50/50">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {groupMatches.map(userMatch => {
                                      const realMatch = getRealMatch(userMatch.id) || userMatch;
                                      return (
                                          <PredictionStamp 
                                              key={userMatch.id}
                                              match={realMatch} 
                                              homeTeam={teams[userMatch.homeTeamId]}
                                              awayTeam={teams[userMatch.awayTeamId]}
                                              prediction={userPredictions.find(p => p.matchId === userMatch.id)}
                                              onOpenSub={() => handleSubClick(userMatch.id)} // USE NEW HANDLER
                                              canSubstitute={canSubMatch(realMatch)}
                                              substitutionsLeft={currentUser.substitutions}
                                              userHasPenalty={currentUser.hasTakenSecondChance}
                                              lang={lang}
                                              variant="standard" 
                                          />
                                      );
                                  })}
                              </div>
                          </div>
                      </div>
                  );
              })}
          </div>
      )}

      {viewMode === 'knockout' && hasKnockouts && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <SecondChancePromo
                hasTaken={currentUser.hasTakenSecondChance}
                secondChanceStatus={currentUser.secondChanceStatus}
                onUnlock={onUnlockSecondChance}
                lang={lang}
              />
              {Object.entries(groupedMatches.knockouts).map(([round, roundMatches]) => {
                  if (roundMatches.length === 0) return null;
                  const gridClass = getKnockoutGridClass(round, roundMatches.length);
                  return (
                      <div key={round} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                          <div className="bg-[#0f2545] px-4 py-3 border-b border-slate-700 flex justify-center sm:justify-start">
                              <span className="text-white text-sm font-black uppercase tracking-[0.2em]">{round}</span>
                          </div>
                          <div className="p-4 bg-slate-50/30">
                              <div className={gridClass}>
                                  {roundMatches.map(userMatch => {
                                      const realMatch = getRealMatch(userMatch.id);
                                      const isMatchupCorrect = realMatch && realMatch.homeTeamId === userMatch.homeTeamId && realMatch.awayTeamId === userMatch.awayTeamId;
                                      const displayMatch = isMatchupCorrect ? realMatch : { ...userMatch, homeScore: null, awayScore: null, status: realMatch?.status || 'UPCOMING' };
                                      return (
                                          <PredictionStamp 
                                              key={userMatch.id}
                                              match={displayMatch as Match}
                                              homeTeam={teams[userMatch.homeTeamId]}
                                              awayTeam={teams[userMatch.awayTeamId]}
                                              prediction={userPredictions.find(p => p.matchId === userMatch.id)}
                                              onOpenSub={() => handleSubClick(userMatch.id)} // USE NEW HANDLER
                                              canSubstitute={canSubMatch(realMatch)} 
                                              substitutionsLeft={currentUser.substitutions}
                                              userHasPenalty={currentUser.hasTakenSecondChance}
                                              lang={lang}
                                              variant="knockout"
                                              isFinal={round === 'FIN'}
                                          />
                                      );
                                  })}
                              </div>
                          </div>
                      </div>
                  );
              })}
          </div>
      )}

      {viewMode === 'knockout' && !hasKnockouts && (
          <div className="flex flex-col items-center justify-center py-20 opacity-50 bg-white rounded-3xl border border-slate-200 border-dashed">
              <CalendarClock size={64} className="text-slate-300 mb-4" />
              <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest text-center">{lang.knockoutNotYet}</h3>
              <p className="text-xs font-bold text-slate-300 mt-2 max-w-xs text-center">{lang.knockoutUnlockHint}</p>
          </div>
      )}

      {selectedMatchId && activeModalMatch && teams[activeModalMatch.homeTeamId] && teams[activeModalMatch.awayTeamId] && (
          <SubstitutionModal 
              match={activeModalMatch}
              homeTeam={teams[activeModalMatch.homeTeamId]}
              awayTeam={teams[activeModalMatch.awayTeamId]}
              currentUser={currentUser}
              allPredictions={allPredictions}
              lang={lang}
              onClose={() => setSelectedMatchId(null)}
              onUpdate={onUpdate}
              onSubstitute={() => onSubstitute(selectedMatchId)}
          />
      )}
    </div>
  );
};