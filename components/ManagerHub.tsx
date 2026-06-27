import React, { useState, useMemo } from 'react';
import { useSwipe } from '../hooks/useSwipe';
import { Match, Team, Prediction, UserProfile, Translation, TournamentPhase } from '../types';
import { SecondChancePromo } from './SecondChancePromo';
import { PredictionStamp } from './PredictionStamp';
import { SubstitutionModal } from './SubstitutionModal';
import { AvatarDisplay } from './AvatarDisplay';
import { Trophy, LayoutGrid, CalendarClock, Info, X, ShieldCheck, User, Hash, RefreshCw, ChevronDown } from 'lucide-react';
import { calculateGroupStandings, getAllGroupStandings, getThirdPlaceStandings, calculatePoints } from '../services/engine';
import { MAX_SUBSTITUTIONS, GROUP_CONFIG } from '../constants';

interface ManagerHubProps {
  matches: Match[];
  userMatches: Match[];
  bracketMatches: Match[];
  teams: Record<string, Team>;
  allPredictions: Prediction[];
  currentUser: UserProfile;
  allUsers: UserProfile[];
  lang: Translation;
  onSubstitute: (matchId: string) => void;
  onUnlockSecondChance: () => void;
  onUpdate: (matchId: string, h: number, a: number) => void;
  phase: TournamentPhase;
  groupStageEndTime?: number;
  knockoutStartTime?: number;
  predictedR32Teams?: string[];
}

export const ManagerHub: React.FC<ManagerHubProps> = ({
  matches,
  userMatches,
  bracketMatches,
  teams,
  allPredictions,
  currentUser,
  allUsers,
  lang,
  onSubstitute,
  onUnlockSecondChance,
  onUpdate,
  phase,
  groupStageEndTime,
  knockoutStartTime,
  predictedR32Teams = [],
}) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const groupsOver = groupStageEndTime ? Date.now() >= groupStageEndTime : false;
  const allGroupsDone = useMemo(() => {
      const DONE = ['FT', 'AET', 'PEN', 'FINISHED'];
      const grpMatches = matches.filter(m => m.groupId);
      return grpMatches.length > 0 && grpMatches.every(m => DONE.includes(m.status));
  }, [matches]);
  const [viewModeOverride, setViewModeOverride] = useState<'groups' | 'knockout' | null>(null);
  const viewMode = viewModeOverride ?? ((allGroupsDone || groupsOver) ? 'knockout' : 'groups');
  const setViewMode = setViewModeOverride;

  const managerSwipe = useSwipe({
      onSwipeLeft:  () => { if (hasKnockouts) setViewMode('knockout'); },
      onSwipeRight: () => setViewMode('groups'),
  });

  const [showMgrHint, setShowMgrHint] = useState(() => !localStorage.getItem(`rasten_mgr_hint_${currentUser.email}`));
  const [r32Expanded, setR32Expanded] = useState(false);
  const [bracketExpanded, setBracketExpanded] = useState(false);

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

  const r32Tracker = useMemo(() => {
      if (predictedR32Teams.length === 0) return null;
      const DONE_STATUSES = ['FT', 'AET', 'PEN', 'FINISHED'];
      const allRealStandings = getAllGroupStandings(matches, teams);
      const realTop2 = Object.values(allRealStandings).flatMap(g => g.slice(0, 2).map(s => s.teamId));
      const realThirds = getThirdPlaceStandings(allRealStandings).slice(0, 8).map(s => s.teamId);
      const actualR32 = new Set([...realTop2, ...realThirds]);

      // Which group IDs are fully played (all 6 matches done)
      const groupIds = [...new Set(matches.filter(m => m.groupId).map(m => m.groupId!))];
      const completedGroups = new Set(
          groupIds.filter(gid => matches.filter(m => m.groupId === gid).every(m => DONE_STATUSES.includes(m.status)))
      );
      const allGroupsDone = completedGroups.size === groupIds.length;

      let matched = 0, wrong = 0, pending = 0;
      for (const teamId of predictedR32Teams) {
          if (actualR32.has(teamId)) { matched++; continue; }
          const teamGroup = groupIds.find(gid =>
              matches.some(m => m.groupId === gid && (m.homeTeamId === teamId || m.awayTeamId === teamId))
          );
          if (teamGroup && completedGroups.has(teamGroup)) {
              const rank = allRealStandings[teamGroup]?.findIndex(s => s.teamId === teamId) ?? -1;
              if (rank >= 3) {
                  wrong++; // 4th place — definitely eliminated
              } else if (rank === 2 && allGroupsDone) {
                  wrong++; // 3rd place — only eliminated once all groups done (3rd-place selection finalised)
              } else {
                  pending++;
              }
          } else {
              pending++;
          }
      }

      return { matched, wrong, pending, total: predictedR32Teams.length, groupsLeft: groupIds.length - completedGroups.size };
  }, [predictedR32Teams, matches, teams]);

  const DONE_KO = ['FT', 'AET', 'PEN', 'FINISHED'];
  const KO_ROUNDS_ORDERED: Array<{ round: string; label: string }> = [
      { round: 'R32', label: 'R32' }, { round: 'R16', label: 'R16' },
      { round: 'QF', label: 'QF' }, { round: 'SF', label: 'SF' }, { round: 'FIN', label: 'Final' },
  ];

  const bracketTracking = useMemo(() => {
      const myPreds = new Map(
          allPredictions.filter(p => p.userId === currentUser.email).map(p => [p.matchId, p])
      );
      return KO_ROUNDS_ORDERED.map(({ round, label }) => {
          const roundMatches = matches.filter(
              m => m.round === round && m.homeTeamId !== 'TBD' && m.awayTeamId !== 'TBD'
          );
          if (roundMatches.length === 0) return null;
          let matched = 0, wrong = 0, pending = 0;
          for (const m of roundMatches) {
              const pred = myPreds.get(m.id);
              if (!pred) { pending++; continue; }
              if (DONE_KO.includes(m.status) && m.homeScore !== null && m.awayScore !== null) {
                  const predHome = pred.home > pred.away;
                  const actualHome = m.homeScore > m.awayScore;
                  if (predHome === actualHome) matched++; else wrong++;
              } else {
                  pending++;
              }
          }
          return { round, label, matched, wrong, pending, total: roundMatches.length };
      }).filter(Boolean) as { round: string; label: string; matched: number; wrong: number; pending: number; total: number }[];
  }, [matches, allPredictions, currentUser.email]);

  const totalBracketMatched = bracketTracking.reduce((s, r) => s + r.matched, 0);

  const r32ExpandedData = useMemo(() => {
      if (!predictedR32Teams || predictedR32Teams.length === 0) return null;
      const DONE = ['FT', 'AET', 'PEN', 'FINISHED'];

      const teamToGroup: Record<string, string> = {};
      GROUP_CONFIG.forEach(g => g.teams.forEach(t => { teamToGroup[t] = g.id; }));

      const realStandings = getAllGroupStandings(matches, teams);
      const realThirds = getThirdPlaceStandings(realStandings);
      const realTop2 = Object.values(realStandings).flatMap(g => g.slice(0, 2).map(s => s.teamId));
      const actualR32 = new Set([...realTop2, ...realThirds.slice(0, 8).map(s => s.teamId)]);

      const groupIds = [...new Set(matches.filter(m => m.groupId).map(m => m.groupId!))].sort();
      const completedGroups = new Set(
          groupIds.filter(gid =>
              matches.filter(m => m.groupId === gid).every(m => DONE.includes(m.status))
          )
      );
      const allGroupsDone = completedGroups.size === groupIds.length;

      const statusOf = (teamId: string): 'matched' | 'wrong' | 'pending' => {
          if (actualR32.has(teamId)) return 'matched';
          const gid = teamToGroup[teamId];
          if (gid && completedGroups.has(gid)) {
              const rank = realStandings[gid]?.findIndex(s => s.teamId === teamId) ?? -1;
              if (rank >= 3) return 'wrong';
              if (rank === 2 && allGroupsDone) return 'wrong';
          }
          return 'pending';
      };

      const groups = groupIds.map(gid => {
          const realGroup = realStandings[gid] || [];
          const picks = predictedR32Teams
              .filter(t => teamToGroup[t] === gid)
              .map(teamId => ({ teamId, status: statusOf(teamId) }));
          const actualTop2 = realGroup.slice(0, 2);
          const isDone = completedGroups.has(gid);
          return { groupId: gid, picks, actualTop2, isDone };
      });

      return { groups, allGroupsDone };
  }, [matches, teams, predictedR32Teams]);

  const bracketExpandedData = useMemo(() => {
      const myPreds = new Map(
          allPredictions.filter(p => p.userId === currentUser.email).map(p => [p.matchId, p])
      );
      const DONE = ['FT', 'AET', 'PEN', 'FINISHED'];
      const ROUND_LABELS: Record<string, string> = { R32: 'R32', R16: 'R16', QF: 'QF', SF: 'SF', FIN: 'Final', '3RD': '3rd Place' };

      return ['R32', 'R16', 'QF', 'SF', 'FIN', '3RD'].map(round => {
          const roundMatches = matches.filter(
              m => m.round === round && m.homeTeamId !== 'TBD' && m.awayTeamId !== 'TBD'
          );
          if (roundMatches.length === 0) return null;

          const matchDetails = roundMatches.map(m => {
              const pred = myPreds.get(m.id);
              const isDone = DONE.includes(m.status);
              const predictedWinnerId = pred
                  ? (pred.home > pred.away ? m.homeTeamId : pred.away > pred.home ? m.awayTeamId : null)
                  : null;
              const actualWinnerId = isDone && m.homeScore !== null && m.awayScore !== null
                  ? (m.homeScore > m.awayScore ? m.homeTeamId : m.awayScore > m.homeScore ? m.awayTeamId : null)
                  : null;
              let status: 'correct' | 'wrong' | 'pending' = 'pending';
              if (isDone && predictedWinnerId) {
                  status = predictedWinnerId === actualWinnerId ? 'correct' : 'wrong';
              }
              return { matchId: m.id, predictedWinnerId, actualWinnerId, status };
          });

          return { round, label: ROUND_LABELS[round] ?? round, matchDetails };
      }).filter(Boolean) as { round: string; label: string; matchDetails: { matchId: string; predictedWinnerId: string | null; actualWinnerId: string | null; status: 'correct' | 'wrong' | 'pending' }[] }[];
  }, [matches, allPredictions, currentUser.email]);

  const groupedMatches = useMemo(() => {
      const groups: Record<string, Match[]> = {};
      const knockouts: Record<string, Match[]> = {
          'R32': [], 'R16': [], 'QF': [], 'SF': [], 'FIN': [], '3RD': []
      };

      userMatches.forEach(m => {
          if (m.groupId) {
              if (m.homeTeamId === 'TBD' || m.awayTeamId === 'TBD') return;
              if (!groups[m.groupId]) groups[m.groupId] = [];
              groups[m.groupId].push(m);
          }
      });

      bracketMatches.forEach(m => {
          if (!m.groupId && m.round && knockouts[m.round]) {
              knockouts[m.round].push(m);
          }
      });

      const sortedGroups = Object.keys(groups).sort().reduce((obj, key) => {
          obj[key] = groups[key].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          return obj;
      }, {} as Record<string, Match[]>);

      return { groups: sortedGroups, knockouts };
  }, [userMatches, bracketMatches]);

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

  const finishedMatches = matches.filter(m =>
      ['FINISHED', 'FT', 'AET', 'PEN'].includes(m.status) &&
      m.homeScore !== null && m.awayScore !== null
  );

  const { rank, totalPoints } = useMemo(() => {
      // Scope rank to the user's biggest league (most members). Fall back to global if no leagues.
      const userLeagues = currentUser.leagues ?? [];
      let leagueUsers = allUsers;
      if (userLeagues.length > 0) {
          const countByLeague = userLeagues.map(slug => ({
              slug,
              count: allUsers.filter(u => u.leagues?.includes(slug)).length,
          }));
          const biggestLeague = countByLeague.sort((a, b) => b.count - a.count)[0].slug;
          leagueUsers = allUsers.filter(u => u.leagues?.includes(biggestLeague));
      }

      const scores = leagueUsers.map(u => {
          const score = finishedMatches.reduce((sum, m) => {
              const pred = allPredictions.find(p => p.userId === u.email && p.matchId === m.id);
              if (!pred) return sum;
              return sum + calculatePoints(pred.home, pred.away, m.homeScore!, m.awayScore!, !!u.hasTakenSecondChance, m.round);
          }, 0);
          return { email: u.email, score };
      }).sort((a, b) => b.score - a.score);

      const myScore = scores.find(s => s.email === currentUser.email)?.score ?? 0;
      const myRank  = scores.findIndex(s => s.email === currentUser.email) + 1 || scores.length;
      return { rank: myRank, totalPoints: myScore };
  }, [allUsers, allPredictions, finishedMatches, currentUser.email, currentUser.leagues]);

  return (
    <div {...managerSwipe} className="pb-24 animate-fade-in space-y-3 touch-pan-y">

      {/* Merged profile + view-mode card */}
      <div id="tour-manager-hub" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-500">

          {/* Navy header: title left, tabs right */}
          <div id="tour-manager-viewmode" className="bg-[#0f2545] px-4 py-2.5 flex items-center justify-between gap-2 border-b border-slate-700">
              <div className="flex items-center gap-2">
                  <User size={15} className="text-blue-400" />
                  <span className="text-xs font-black text-white uppercase tracking-widest">{lang.managerProfile || "Manager Profile"}</span>
              </div>
              <div className="flex items-center bg-white/10 rounded-xl p-0.5">
                  <button
                      onClick={() => setViewMode('groups')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[11px] font-black uppercase tracking-widest transition-all ${
                          viewMode === 'groups' ? 'bg-[#FFD700] text-[#0f2545]' : 'text-slate-400 hover:text-white'
                      }`}
                  >
                      <LayoutGrid size={11} /> {lang.groups || "Groups"}
                  </button>
                  <button
                      id="tour-knockout-btn"
                      onClick={() => setViewMode('knockout')}
                      disabled={!hasKnockouts}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[11px] font-black uppercase tracking-widest transition-all ${
                          viewMode === 'knockout' ? 'bg-[#FFD700] text-[#0f2545]' : 'text-slate-400 hover:text-white'
                      } disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                      <Trophy size={11} /> {lang.knockouts || "Knockouts"}
                  </button>
              </div>
          </div>

          {/* Body: avatar left, name + stats right */}
          <div className="flex flex-row items-center gap-4 px-4 py-3">
              <div className="relative shrink-0">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl" />
                  <AvatarDisplay avatar={currentUser.avatar} size="lg" className="w-14 h-14 ring-4 ring-white shadow-xl relative z-10" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                  <h2 className="text-base font-black text-slate-800 uppercase tracking-tighter leading-none mb-2 truncate">
                      {currentUser.name}
                  </h2>
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                      <div className="flex-1 flex flex-col items-center">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-0.5">
                              <Hash size={10} /> Rank
                          </div>
                          <div className="text-base font-black text-blue-600">#{rank}</div>
                      </div>
                      <div className="w-px h-6 bg-slate-200" />
                      <div className="flex-1 flex flex-col items-center">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-0.5">
                              <Trophy size={10} /> Pts
                          </div>
                          <div className="text-base font-black text-slate-800">{totalPoints}</div>
                      </div>
                      {phase === 'LIVE' && (
                          <>
                              <div className="w-px h-6 bg-slate-200" />
                              <div className="flex-1 flex flex-col items-center">
                                  <div className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 mb-0.5 ${currentUser.substitutions > 0 ? 'text-blue-500' : 'text-slate-400'}`}>
                                      <RefreshCw size={10} /> Subs
                                  </div>
                                  <div className={`text-base font-black ${currentUser.substitutions > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                                      {currentUser.substitutions}<span className="text-xs text-slate-300 ml-0.5 align-top">/{MAX_SUBSTITUTIONS}</span>
                                  </div>
                              </div>
                          </>
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* 2nd Chance last-week alert */}
      {showScAlert && (
        <div className="px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
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
        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-start gap-3">
          <Info size={16} className="text-indigo-500 mt-0.5 shrink-0" />
          <p className="text-xs text-indigo-800 font-medium flex-1 leading-relaxed">{(lang as any).mgrHint}</p>
          <button onClick={() => { localStorage.setItem(`rasten_mgr_hint_${currentUser.email}`, '1'); setShowMgrHint(false); }} className="text-indigo-400 hover:text-indigo-600 shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {viewMode === 'groups' && (
          <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
              {Object.entries(groupedMatches.groups).map(([groupId, groupMatches], groupIndex) => {
                  const standings = calculateGroupStandings(groupId, userMatches, teams);
                  return (
                      <div key={groupId} id={groupIndex === 0 ? 'tour-manager-first-group' : undefined} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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

              {/* Bracket Tracker */}
              {bracketTracking.length > 0 && (
                  <div className="bg-[#0f2545] rounded-2xl border border-white/10 shadow-sm overflow-hidden">
                      <div
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                          onClick={() => setBracketExpanded(e => !e)}
                      >
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Bracket Tracker</span>
                          <div className="flex items-center gap-2">
                              <span className="text-lg font-black text-white tabular-nums">
                                  {totalBracketMatched}<span className="text-white/30 text-sm font-bold"> correct</span>
                              </span>
                              <ChevronDown size={14} className={`text-white/30 transition-transform ${bracketExpanded ? 'rotate-180' : ''}`} />
                          </div>
                      </div>
                      <div className="px-4 pb-4 space-y-3">
                          {bracketTracking.map(({ round, label, matched, wrong, pending, total }) => (
                              <div key={round}>
                                  <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[9px] font-black uppercase tracking-widest text-white/40 w-10 shrink-0">{label}</span>
                                      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden flex">
                                          {matched > 0 && <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(matched / total) * 100}%` }} />}
                                          {wrong > 0 && <div className="h-full bg-red-500 transition-all" style={{ width: `${(wrong / total) * 100}%` }} />}
                                          {pending > 0 && <div className="h-full bg-white/20 transition-all" style={{ width: `${(pending / total) * 100}%` }} />}
                                      </div>
                                      <span className="text-[9px] font-bold text-white/30 tabular-nums w-10 text-right shrink-0">{matched}/{total}</span>
                                  </div>
                                  <div className="flex items-center gap-3 pl-12">
                                      {matched > 0 && <span className="text-[9px] font-bold text-emerald-400">✓{matched} through</span>}
                                      {wrong > 0 && <span className="text-[9px] font-bold text-red-400">✗{wrong} out</span>}
                                      {pending > 0 && <span className="text-[9px] font-bold text-white/30">●{pending} pending</span>}
                                  </div>
                              </div>
                          ))}
                      </div>
                      {bracketExpanded && bracketExpandedData.length > 0 && (
                          <div className="border-t border-white/10 px-4 py-4 space-y-4">
                              {bracketExpandedData.map(({ round, label, matchDetails }) => (
                                  <div key={round}>
                                      <div className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">{label}</div>
                                      <div className="grid grid-cols-2 gap-1.5">
                                          {matchDetails.map(({ matchId, predictedWinnerId, actualWinnerId, status }) => {
                                              if (!predictedWinnerId) return null;
                                              const team = teams[predictedWinnerId];
                                              const actualTeam = actualWinnerId && actualWinnerId !== predictedWinnerId ? teams[actualWinnerId] : null;
                                              const dotColor = status === 'correct' ? 'bg-emerald-500' : status === 'wrong' ? 'bg-red-500' : 'bg-white/25';
                                              const nameColor = status === 'correct' ? 'text-emerald-300' : status === 'wrong' ? 'text-red-400 line-through opacity-60' : 'text-white/60';
                                              return (
                                                  <div key={matchId} className="flex flex-col gap-1">
                                                      <div className="flex items-center gap-1.5">
                                                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                                                          {team?.flag && <img src={team.flag} className="w-5 h-3.5 object-cover rounded-sm shadow-sm border border-white/10 shrink-0" alt="" />}
                                                          <span className={`text-[9px] font-bold uppercase truncate ${nameColor}`}>
                                                              {team?.name ?? predictedWinnerId}
                                                          </span>
                                                      </div>
                                                      {status === 'wrong' && actualTeam && (
                                                          <div className="flex items-center gap-1.5 pl-3">
                                                              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-amber-400" />
                                                              {actualTeam.flag && <img src={actualTeam.flag} className="w-5 h-3.5 object-cover rounded-sm shadow-sm border border-white/10 shrink-0" alt="" />}
                                                              <span className="text-[9px] font-bold uppercase truncate text-amber-300">
                                                                  {actualTeam.name}
                                                              </span>
                                                          </div>
                                                      )}
                                                  </div>
                                              );
                                          })}
                                      </div>
                                  </div>
                              ))}
                              <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-white/5">
                                  <span className="flex items-center gap-1 text-[9px] text-white/30"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Through</span>
                                  <span className="flex items-center gap-1 text-[9px] text-white/30"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Out</span>
                                  <span className="flex items-center gap-1 text-[9px] text-white/30"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Actual winner</span>
                                  <span className="flex items-center gap-1 text-[9px] text-white/30"><span className="w-1.5 h-1.5 rounded-full bg-white/25" /> Pending</span>
                              </div>
                          </div>
                      )}
                  </div>
              )}

              {/* R32 Prediction Tracker */}
              {r32Tracker && (
                  <div className="bg-[#0f2545] rounded-2xl border border-white/10 shadow-sm overflow-hidden">
                      <div
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                          onClick={() => setR32Expanded(e => !e)}
                      >
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/50">R32 Prediction Tracker</span>
                          <div className="flex items-center gap-2">
                              <span className="text-lg font-black text-white tabular-nums">
                                  {r32Tracker.matched}<span className="text-white/30 text-sm font-bold"> / {r32Tracker.total}</span>
                              </span>
                              <ChevronDown size={14} className={`text-white/30 transition-transform ${r32Expanded ? 'rotate-180' : ''}`} />
                          </div>
                      </div>
                      <div className="px-4 pb-4">
                          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden flex">
                              <div className="h-full bg-green-500 rounded-l-full transition-all" style={{ width: `${(r32Tracker.matched / r32Tracker.total) * 100}%` }} />
                              <div className="h-full bg-red-500 transition-all" style={{ width: `${(r32Tracker.wrong / r32Tracker.total) * 100}%` }} />
                              <div className="h-full bg-white/20 rounded-r-full transition-all" style={{ width: `${(r32Tracker.pending / r32Tracker.total) * 100}%` }} />
                          </div>
                          <div className="flex items-center gap-4 mt-2.5">
                              <span className="flex items-center gap-1 text-[10px] font-bold text-green-400"><span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />{r32Tracker.matched} confirmed</span>
                              {r32Tracker.wrong > 0 && <span className="flex items-center gap-1 text-[10px] font-bold text-red-400"><span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />{r32Tracker.wrong} out</span>}
                              {r32Tracker.pending > 0 && <span className="flex items-center gap-1 text-[10px] font-bold text-white/40"><span className="w-2 h-2 rounded-full bg-white/20 shrink-0" />{r32Tracker.pending} pending</span>}
                              {r32Tracker.groupsLeft > 0 && <span className="ml-auto text-[9px] text-white/30 font-medium">{r32Tracker.groupsLeft} group{r32Tracker.groupsLeft > 1 ? 's' : ''} to go</span>}
                          </div>
                          {r32ExpandedData && (
                              <div className="mt-3 flex flex-wrap gap-1">
                                  {r32ExpandedData.groups.flatMap(g => g.picks)
                                      .sort((a, b) => {
                                          const o: Record<string, number> = { matched: 0, wrong: 1, pending: 2 };
                                          return o[a.status] - o[b.status];
                                      })
                                      .map(({ teamId, status }) => {
                                          const team = teams[teamId];
                                          return (
                                              <div
                                                  key={teamId}
                                                  title={team?.name ?? teamId}
                                                  className={`rounded overflow-hidden border shrink-0 ${
                                                      status === 'matched' ? 'border-emerald-500/70' :
                                                      status === 'wrong' ? 'border-red-500/40 opacity-40' :
                                                      'border-white/10'
                                                  }`}
                                              >
                                                  {team?.flag
                                                      ? <img src={team.flag} className="w-6 h-4 object-cover block" alt={team.name ?? teamId} />
                                                      : <div className="w-6 h-4 bg-white/10 flex items-center justify-center"><span className="text-[6px] text-white/50 font-bold">{teamId.slice(0, 3)}</span></div>
                                                  }
                                              </div>
                                          );
                                      })}
                              </div>
                          )}
                      </div>
                      {r32Expanded && r32ExpandedData && (
                          <div className="border-t border-white/10 px-4 py-4">
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  {r32ExpandedData.groups.map(({ groupId, picks, actualTop2, isDone }) => (
                                      <div key={groupId} className="bg-white/5 rounded-xl p-3 border border-white/5">
                                          <div className="flex items-center justify-between mb-2">
                                              <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Group {groupId}</span>
                                              {isDone
                                                  ? <span className="text-[8px] font-bold text-emerald-400/70 uppercase">Done</span>
                                                  : <span className="text-[8px] font-bold text-white/20 uppercase">Live</span>
                                              }
                                          </div>
                                          <div className="space-y-1.5">
                                              {picks.map(({ teamId, status }) => {
                                                  const team = teams[teamId];
                                                  const dotColor = status === 'matched' ? 'bg-emerald-500' : status === 'wrong' ? 'bg-red-500' : 'bg-white/25';
                                                  const nameColor = status === 'matched' ? 'text-emerald-300' : status === 'wrong' ? 'text-red-400 line-through opacity-60' : 'text-white/60';
                                                  return (
                                                      <div key={teamId} className="flex items-center gap-1.5">
                                                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                                                          {team?.flag && <img src={team.flag} className="w-5 h-3.5 object-cover rounded-sm shadow-sm border border-white/10 shrink-0" alt="" />}
                                                          <span className={`text-[9px] font-bold uppercase truncate ${nameColor}`}>
                                                              {team?.name ?? teamId}
                                                          </span>
                                                      </div>
                                                  );
                                              })}
                                              {isDone && (() => {
                                                  const pickedIds = new Set(picks.map(p => p.teamId));
                                                  const surprise = actualTop2.filter(s => !pickedIds.has(s.teamId));
                                                  if (surprise.length === 0) return null;
                                                  return (
                                                      <div className="mt-1.5 pt-1.5 border-t border-white/10">
                                                          {surprise.map(s => {
                                                              const t = teams[s.teamId];
                                                              return (
                                                                  <div key={s.teamId} className="flex items-center gap-1.5 mt-1">
                                                                      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-amber-400" />
                                                                      {t?.flag && <img src={t.flag} className="w-5 h-3.5 object-cover rounded-sm shadow-sm border border-white/10 shrink-0" alt="" />}
                                                                      <span className="text-[9px] font-bold uppercase truncate text-amber-300">{t?.name ?? s.teamId}</span>
                                                                      <span className="text-[8px] text-amber-400/60 ml-auto shrink-0">through</span>
                                                                  </div>
                                                              );
                                                          })}
                                                      </div>
                                                  );
                                              })()}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                              <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-white/5">
                                  <span className="flex items-center gap-1 text-[9px] text-white/30"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Your pick — through</span>
                                  <span className="flex items-center gap-1 text-[9px] text-white/30"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Your pick — out</span>
                                  <span className="flex items-center gap-1 text-[9px] text-white/30"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Surprise qualifier</span>
                              </div>
                          </div>
                      )}
                  </div>
              )}

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
                                              is3rd={round === '3RD'}
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
          <div className="space-y-4">
              {bracketTracking.length > 0 && (
                  <div className="bg-[#0f2545] rounded-2xl border border-white/10 shadow-sm overflow-hidden">
                      <div
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                          onClick={() => setBracketExpanded(e => !e)}
                      >
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Bracket Tracker</span>
                          <div className="flex items-center gap-2">
                              <span className="text-lg font-black text-white tabular-nums">
                                  {totalBracketMatched}<span className="text-white/30 text-sm font-bold"> correct</span>
                              </span>
                              <ChevronDown size={14} className={`text-white/30 transition-transform ${bracketExpanded ? 'rotate-180' : ''}`} />
                          </div>
                      </div>
                      <div className="px-4 pb-4 space-y-3">
                          {bracketTracking.map(({ round, label, matched, wrong, pending, total }) => (
                              <div key={round}>
                                  <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[9px] font-black uppercase tracking-widest text-white/40 w-10 shrink-0">{label}</span>
                                      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden flex">
                                          {matched > 0 && <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(matched / total) * 100}%` }} />}
                                          {wrong > 0 && <div className="h-full bg-red-500 transition-all" style={{ width: `${(wrong / total) * 100}%` }} />}
                                          {pending > 0 && <div className="h-full bg-white/20 transition-all" style={{ width: `${(pending / total) * 100}%` }} />}
                                      </div>
                                      <span className="text-[9px] font-bold text-white/30 tabular-nums w-10 text-right shrink-0">{matched}/{total}</span>
                                  </div>
                                  <div className="flex items-center gap-3 pl-12">
                                      {matched > 0 && <span className="text-[9px] font-bold text-emerald-400">✓{matched} through</span>}
                                      {wrong > 0 && <span className="text-[9px] font-bold text-red-400">✗{wrong} out</span>}
                                      {pending > 0 && <span className="text-[9px] font-bold text-white/30">●{pending} pending</span>}
                                  </div>
                              </div>
                          ))}
                      </div>
                      {bracketExpanded && bracketExpandedData.length > 0 && (
                          <div className="border-t border-white/10 px-4 py-4 space-y-4">
                              {bracketExpandedData.map(({ round, label, matchDetails }) => (
                                  <div key={round}>
                                      <div className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">{label}</div>
                                      <div className="grid grid-cols-2 gap-1.5">
                                          {matchDetails.map(({ matchId, predictedWinnerId, actualWinnerId, status }) => {
                                              if (!predictedWinnerId) return null;
                                              const team = teams[predictedWinnerId];
                                              const actualTeam = actualWinnerId && actualWinnerId !== predictedWinnerId ? teams[actualWinnerId] : null;
                                              const dotColor = status === 'correct' ? 'bg-emerald-500' : status === 'wrong' ? 'bg-red-500' : 'bg-white/25';
                                              const nameColor = status === 'correct' ? 'text-emerald-300' : status === 'wrong' ? 'text-red-400 line-through opacity-60' : 'text-white/60';
                                              return (
                                                  <div key={matchId} className="flex flex-col gap-1">
                                                      <div className="flex items-center gap-1.5">
                                                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                                                          {team?.flag && <img src={team.flag} className="w-5 h-3.5 object-cover rounded-sm shadow-sm border border-white/10 shrink-0" alt="" />}
                                                          <span className={`text-[9px] font-bold uppercase truncate ${nameColor}`}>
                                                              {team?.name ?? predictedWinnerId}
                                                          </span>
                                                      </div>
                                                      {status === 'wrong' && actualTeam && (
                                                          <div className="flex items-center gap-1.5 pl-3">
                                                              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-amber-400" />
                                                              {actualTeam.flag && <img src={actualTeam.flag} className="w-5 h-3.5 object-cover rounded-sm shadow-sm border border-white/10 shrink-0" alt="" />}
                                                              <span className="text-[9px] font-bold uppercase truncate text-amber-300">
                                                                  {actualTeam.name}
                                                              </span>
                                                          </div>
                                                      )}
                                                  </div>
                                              );
                                          })}
                                      </div>
                                  </div>
                              ))}
                              <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-white/5">
                                  <span className="flex items-center gap-1 text-[9px] text-white/30"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Through</span>
                                  <span className="flex items-center gap-1 text-[9px] text-white/30"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Out</span>
                                  <span className="flex items-center gap-1 text-[9px] text-white/30"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Actual winner</span>
                                  <span className="flex items-center gap-1 text-[9px] text-white/30"><span className="w-1.5 h-1.5 rounded-full bg-white/25" /> Pending</span>
                              </div>
                          </div>
                      )}
                  </div>
              )}
              {r32Tracker && (
                  <div className="bg-[#0f2545] rounded-2xl border border-white/10 shadow-sm overflow-hidden">
                      <div
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                          onClick={() => setR32Expanded(e => !e)}
                      >
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/50">R32 Prediction Tracker</span>
                          <div className="flex items-center gap-2">
                              <span className="text-lg font-black text-white tabular-nums">
                                  {r32Tracker.matched}<span className="text-white/30 text-sm font-bold"> / {r32Tracker.total}</span>
                              </span>
                              <ChevronDown size={14} className={`text-white/30 transition-transform ${r32Expanded ? 'rotate-180' : ''}`} />
                          </div>
                      </div>
                      <div className="px-4 pb-4">
                          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden flex">
                              <div className="h-full bg-green-500 rounded-l-full transition-all" style={{ width: `${(r32Tracker.matched / r32Tracker.total) * 100}%` }} />
                              <div className="h-full bg-red-500 transition-all" style={{ width: `${(r32Tracker.wrong / r32Tracker.total) * 100}%` }} />
                              <div className="h-full bg-white/20 rounded-r-full transition-all" style={{ width: `${(r32Tracker.pending / r32Tracker.total) * 100}%` }} />
                          </div>
                          <div className="flex items-center gap-4 mt-2.5">
                              <span className="flex items-center gap-1 text-[10px] font-bold text-green-400"><span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />{r32Tracker.matched} confirmed</span>
                              {r32Tracker.wrong > 0 && <span className="flex items-center gap-1 text-[10px] font-bold text-red-400"><span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />{r32Tracker.wrong} out</span>}
                              {r32Tracker.pending > 0 && <span className="flex items-center gap-1 text-[10px] font-bold text-white/40"><span className="w-2 h-2 rounded-full bg-white/20 shrink-0" />{r32Tracker.pending} pending</span>}
                              {r32Tracker.groupsLeft > 0 && <span className="ml-auto text-[9px] text-white/30 font-medium">{r32Tracker.groupsLeft} group{r32Tracker.groupsLeft > 1 ? 's' : ''} to go</span>}
                          </div>
                          {r32ExpandedData && (
                              <div className="mt-3 flex flex-wrap gap-1">
                                  {r32ExpandedData.groups.flatMap(g => g.picks)
                                      .sort((a, b) => {
                                          const o: Record<string, number> = { matched: 0, wrong: 1, pending: 2 };
                                          return o[a.status] - o[b.status];
                                      })
                                      .map(({ teamId, status }) => {
                                          const team = teams[teamId];
                                          return (
                                              <div
                                                  key={teamId}
                                                  title={team?.name ?? teamId}
                                                  className={`rounded overflow-hidden border shrink-0 ${
                                                      status === 'matched' ? 'border-emerald-500/70' :
                                                      status === 'wrong' ? 'border-red-500/40 opacity-40' :
                                                      'border-white/10'
                                                  }`}
                                              >
                                                  {team?.flag
                                                      ? <img src={team.flag} className="w-6 h-4 object-cover block" alt={team.name ?? teamId} />
                                                      : <div className="w-6 h-4 bg-white/10 flex items-center justify-center"><span className="text-[6px] text-white/50 font-bold">{teamId.slice(0, 3)}</span></div>
                                                  }
                                              </div>
                                          );
                                      })}
                              </div>
                          )}
                      </div>
                      {r32Expanded && r32ExpandedData && (
                          <div className="border-t border-white/10 px-4 py-4">
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  {r32ExpandedData.groups.map(({ groupId, picks, actualTop2, isDone }) => (
                                      <div key={groupId} className="bg-white/5 rounded-xl p-3 border border-white/5">
                                          <div className="flex items-center justify-between mb-2">
                                              <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Group {groupId}</span>
                                              {isDone
                                                  ? <span className="text-[8px] font-bold text-emerald-400/70 uppercase">Done</span>
                                                  : <span className="text-[8px] font-bold text-white/20 uppercase">Live</span>
                                              }
                                          </div>
                                          <div className="space-y-1.5">
                                              {picks.map(({ teamId, status }) => {
                                                  const team = teams[teamId];
                                                  const dotColor = status === 'matched' ? 'bg-emerald-500' : status === 'wrong' ? 'bg-red-500' : 'bg-white/25';
                                                  const nameColor = status === 'matched' ? 'text-emerald-300' : status === 'wrong' ? 'text-red-400 line-through opacity-60' : 'text-white/60';
                                                  return (
                                                      <div key={teamId} className="flex items-center gap-1.5">
                                                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                                                          {team?.flag && <img src={team.flag} className="w-5 h-3.5 object-cover rounded-sm shadow-sm border border-white/10 shrink-0" alt="" />}
                                                          <span className={`text-[9px] font-bold uppercase truncate ${nameColor}`}>
                                                              {team?.name ?? teamId}
                                                          </span>
                                                      </div>
                                                  );
                                              })}
                                              {isDone && (() => {
                                                  const pickedIds = new Set(picks.map(p => p.teamId));
                                                  const surprise = actualTop2.filter(s => !pickedIds.has(s.teamId));
                                                  if (surprise.length === 0) return null;
                                                  return (
                                                      <div className="mt-1.5 pt-1.5 border-t border-white/10">
                                                          {surprise.map(s => {
                                                              const t = teams[s.teamId];
                                                              return (
                                                                  <div key={s.teamId} className="flex items-center gap-1.5 mt-1">
                                                                      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-amber-400" />
                                                                      {t?.flag && <img src={t.flag} className="w-5 h-3.5 object-cover rounded-sm shadow-sm border border-white/10 shrink-0" alt="" />}
                                                                      <span className="text-[9px] font-bold uppercase truncate text-amber-300">{t?.name ?? s.teamId}</span>
                                                                      <span className="text-[8px] text-amber-400/60 ml-auto shrink-0">through</span>
                                                                  </div>
                                                              );
                                                          })}
                                                      </div>
                                                  );
                                              })()}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                              <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-white/5">
                                  <span className="flex items-center gap-1 text-[9px] text-white/30"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Your pick — through</span>
                                  <span className="flex items-center gap-1 text-[9px] text-white/30"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Your pick — out</span>
                                  <span className="flex items-center gap-1 text-[9px] text-white/30"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Surprise qualifier</span>
                              </div>
                          </div>
                      )}
                  </div>
              )}
              <div className="flex flex-col items-center justify-center py-20 opacity-50 bg-white rounded-3xl border border-slate-200 border-dashed">
                  <CalendarClock size={64} className="text-slate-300 mb-4" />
                  <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest text-center">{lang.knockoutNotYet}</h3>
                  <p className="text-xs font-bold text-slate-300 mt-2 max-w-xs text-center">{lang.knockoutUnlockHint}</p>
              </div>
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