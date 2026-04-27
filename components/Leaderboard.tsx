
import React, { useState, useMemo } from 'react';
import { UserProfile, Match, Prediction, Translation, Round, Team, LanguageCode } from '../types';
import { AIAnalystWidget } from './analysis/AIAnalystWidget';
import { calculatePoints, getManagerStats, applyPredictionsToBracket, SCORING_RULES } from '../services/engine';
import { Activity, Trophy, Flame, Target, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, PieChart, Users, Globe, Medal, Check, Shield, X, Calendar, Crown, MapPin, AlertTriangle, ShieldCheck, Lock } from 'lucide-react';
import { AvatarDisplay } from './AvatarDisplay';
import { INITIAL_MATCHES, LEAGUES } from '../constants';

interface LeaderboardProps {
  users: UserProfile[];
  matches: Match[];
  allPredictions: Prediction[];
  lang: Translation;
  currentUserEmail?: string;
  currentUserLeagues?: string[];
  teams: Record<string, Team>;
  onTeamClick?: (teamId: string) => void;
  preloadedAnalysis?: string | null;
  onRefreshBrief?: () => void;
  briefRefreshing?: boolean;
  currentLang?: LanguageCode;
}

const DetailMatchRow: React.FC<{ match: Match, prediction: Prediction, points: number, type: 'EXACT' | 'RESULT', teams: Record<string, Team>, onTeamClick?: (teamId: string) => void }> = ({ match, prediction, points, type, teams, onTeamClick }) => {
    const home = teams[match.homeTeamId];
    const away = teams[match.awayTeamId];
    
    // Parse Date
    let dateDisplay = match.date;
    try {
        const parts = match.date.split(',');
        if (parts.length > 0) dateDisplay = parts[0];
    } catch(e) {}

    // Type Specific Styling for Label and Badge
    let label = '';
    let badgeClass = '';
    
    if (type === 'EXACT') {
        label = 'Exact';
        badgeClass = 'bg-green-100 border-green-600 text-green-900';
    } else if (type === 'RESULT') {
        label = 'Result';
        badgeClass = 'bg-blue-100 border-blue-600 text-blue-900';
    }

    const handleTeamClick = (e: React.MouseEvent, teamId: string) => {
        e.stopPropagation();
        if (onTeamClick && !teamId.startsWith('TBD')) onTeamClick(teamId);
    }

    return (
        <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm flex flex-col gap-2 relative overflow-visible mt-2 group">
            {/* Points Badge - Top Right Corner */}
            <div className={`absolute -top-3 -right-2 w-8 h-8 rounded-full border-2 flex items-center justify-center font-black text-xs shadow-md z-10 ${badgeClass}`}>
                {points}
            </div>

            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <div className="flex items-center gap-1">
                    <Calendar size={10} />
                    <span>{dateDisplay}</span>
                </div>
                <div className="flex items-center gap-2 mr-6">
                    {match.groupId && <span>Grp {match.groupId}</span>}
                </div>
            </div>

            <div className="flex items-center justify-between">
                {/* Home */}
                <div 
                    onClick={(e) => handleTeamClick(e, home?.id)}
                    className={`flex items-center gap-2 flex-1 ${onTeamClick ? 'cursor-pointer hover:text-blue-600' : ''}`}
                >
                    <img src={home?.flag} className="w-6 h-4 rounded shadow-sm object-cover" alt="" />
                    <span className="text-xs font-bold truncate text-slate-700">
                        {home?.id}
                    </span>
                </div>

                {/* Score */}
                <div className="flex flex-col items-center px-4">
                    <div className="flex items-center gap-1 text-sm font-black text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                        <span>{match.homeScore}</span>
                        <span className="text-slate-300">-</span>
                        <span>{match.awayScore}</span>
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 mt-0.5">
                        Pick: {prediction.home}-{prediction.away}
                    </div>
                </div>

                {/* Away */}
                <div 
                    onClick={(e) => handleTeamClick(e, away?.id)}
                    className={`flex items-center gap-2 flex-1 justify-end ${onTeamClick ? 'cursor-pointer hover:text-blue-600' : ''}`}
                >
                    <span className="text-xs font-bold truncate text-slate-700">
                        {away?.id}
                    </span>
                    <img src={away?.flag} className="w-6 h-4 rounded shadow-sm object-cover" alt="" />
                </div>
            </div>
        </div>
    );
};

const QualifiedTeamsGrid: React.FC<{ 
    realMatches: Match[], 
    userPredictions: Prediction[], 
    user: UserProfile,
    teams: Record<string, Team>,
    onTeamClick?: (teamId: string) => void
}> = ({ realMatches, userPredictions, user, teams, onTeamClick }) => {
    
    // 1. Standard Bracket (from Group Predictions)
    // Used for calculating R32 Qualifiers (Group performance)
    const standardBracket = useMemo(() => {
        return applyPredictionsToBracket(INITIAL_MATCHES, teams, userPredictions);
    }, [userPredictions, teams]);

    // 2. Second Chance Bracket (from Real Matches)
    // Used for calculating R16+ progression if user has taken second chance
    // By starting with 'realMatches', we assume the user has the correct bracket start.
    const secondChanceBracket = useMemo(() => {
        if (!user.hasTakenSecondChance) return standardBracket;
        return applyPredictionsToBracket(realMatches, teams, userPredictions);
    }, [realMatches, userPredictions, user.hasTakenSecondChance, standardBracket, teams]);

    // 2. Helper to get teams in a round
    const getTeamsInRound = (matches: Match[], round: Round | 'R32_START') => {
        const teams = new Set<string>();
        const targetMatches = matches.filter(m => {
            if (round === 'R32_START') return m.round === 'R32';
            return m.round === round;
        });

        targetMatches.forEach(m => {
            if (m.homeTeamId && !m.homeTeamId.startsWith('TBD')) teams.add(m.homeTeamId);
            if (m.awayTeamId && !m.awayTeamId.startsWith('TBD')) teams.add(m.awayTeamId);
        });
        return teams;
    };

    // 3. Rounds to process with slot counts
    const rounds = [
        { key: 'R32_START', label: 'Round of 32', points: SCORING_RULES.GROUP_RESULT, totalSlots: 32 },
        { key: 'R16', label: 'Round of 16', points: SCORING_RULES.R32, totalSlots: 16 },
        { key: 'QF', label: 'Quarter Finals', points: SCORING_RULES.R16, totalSlots: 8 },
        { key: 'SF', label: 'Semi Finals', points: SCORING_RULES.QF, totalSlots: 4 },
        { key: 'FIN', label: 'Final', points: SCORING_RULES.SF, totalSlots: 2 },
        { key: 'CHAMP', label: 'Champion', points: SCORING_RULES.FIN, totalSlots: 1 }
    ];

    const getChamp = (matches: Match[]) => {
        const fin = matches.find(m => m.round === 'FIN');
        if (fin && fin.homeScore !== null && fin.awayScore !== null) {
            return fin.homeScore > fin.awayScore ? fin.homeTeamId : fin.awayTeamId;
        }
        return null;
    };

    const realChamp = getChamp(realMatches);
    const standardChamp = getChamp(standardBracket);
    const secondChanceChamp = getChamp(secondChanceBracket);

    return (
        <div className="space-y-6 pb-4 pt-2">
            {rounds.map((r, idx) => {
                let correctTeams: string[] = [];
                let pointsPerTeam = r.points;
                let penaltyApplied = false;
                
                // DETERMINE WHICH BRACKET TO CHECK AGAINST
                let targetBracket = standardBracket;
                let userChamp = standardChamp;

                if (r.key === 'R32_START') {
                    // Qualification from groups: ALWAYS use standard performance
                    // No penalty
                    targetBracket = standardBracket;
                } else {
                    // Progression in knockouts: Use Second Chance bracket if active
                    if (user.hasTakenSecondChance) {
                        targetBracket = secondChanceBracket;
                        userChamp = secondChanceChamp;
                        penaltyApplied = true;
                        pointsPerTeam = Math.floor(pointsPerTeam * 0.5);
                    }
                }

                if (r.key === 'CHAMP') {
                    if (realChamp && userChamp && realChamp === userChamp && !realChamp.startsWith('TBD')) {
                        correctTeams = [realChamp];
                    }
                } else {
                    const realTeams = getTeamsInRound(realMatches, r.key as any);
                    const userTeams = getTeamsInRound(targetBracket, r.key as any);
                    
                    realTeams.forEach(t => {
                        if (userTeams.has(t)) correctTeams.push(t);
                    });
                }

                if (correctTeams.length === 0) return null;

                const totalPoints = correctTeams.length * pointsPerTeam;

                return (
                    <div key={r.key} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="flex justify-between items-center mb-3 border-b border-slate-200 pb-2">
                            <div className="flex flex-col gap-0.5">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-700">{r.label}</h4>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    {pointsPerTeam} pts / team
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                {penaltyApplied && (
                                    <div className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-1" title="Second Chance Penalty Active">
                                        <Shield size={8} /> 50%
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <div className="bg-purple-600 text-white px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                                        <Trophy size={10} className="text-yellow-300" />
                                        <span className="text-[10px] font-black uppercase tracking-wider">
                                            {correctTeams.length}/{r.totalSlots}
                                        </span>
                                    </div>
                                    <div className="text-sm font-black text-green-600">
                                        +{totalPoints}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                            {correctTeams.map(tid => {
                                const team = teams[tid];
                                return (
                                    <div 
                                        key={tid} 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onTeamClick) onTeamClick(tid);
                                        }}
                                        className={`flex items-center gap-2 bg-white px-2 py-1.5 rounded-lg border border-slate-200 shadow-sm animate-in zoom-in ${onTeamClick ? 'cursor-pointer hover:border-blue-300' : ''}`}
                                    >
                                        <img src={team?.flag} className="w-5 h-3.5 rounded-sm object-cover" alt={tid} />
                                        <span className="text-[10px] font-bold text-slate-700">{tid}</span>
                                        <Check size={10} className="text-green-500 ml-1" strokeWidth={4} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ users, matches, allPredictions, lang, currentUserEmail, currentUserLeagues = [], teams, onTeamClick, preloadedAnalysis, onRefreshBrief, briefRefreshing, currentLang }) => {
  const [showLive, setShowLive] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [activeLeague, setActiveLeague] = useState<string>('global');
  
  // Stats Modal State
  const [modalData, setModalData] = useState<{ user: UserProfile, type: 'EXACT' | 'RESULT' | 'ADVANCED', matches: {m: Match, p: Prediction, pts: number}[] } | null>(null);

  // Filter users based on league selection
  const filteredUsers = useMemo(() => {
      if (activeLeague === 'global') return users;
      return users.filter(u => u.leagues?.includes(activeLeague));
  }, [users, activeLeague]);

  // 1. Calculate Scores for Everyone
  const userStats = filteredUsers.map(user => {
    let totalPoints = 0;
    let bankedPoints = 0; 
    let exactCount = 0;   
    let resultCount = 0;  // Only Group Results
    let advancedCount = 0; // Knockout Correct Winners
    let groupPoints = 0;
    let knockoutPoints = 0;
    
    // Detailed Round Breakdown
    const koBreakdown: Record<string, { count: number, points: number }> = {};

    matches.forEach(match => {
      const pred = allPredictions.find(p => p.userId === user.email && p.matchId === match.id);
      
      if (pred && match.homeScore !== null && match.awayScore !== null) {
        const pts = calculatePoints(pred.home, pred.away, match.homeScore, match.awayScore, user.hasTakenSecondChance || false, match.round);
        
        totalPoints += pts;

        const isFinal = ['FINISHED', 'FT', 'AET', 'PEN'].includes(match.status);
        if (isFinal) {
          bankedPoints += pts;
        }

        if (match.groupId) {
            groupPoints += pts;
            const isExact = pred.home === match.homeScore && pred.away === match.awayScore;
            if (isExact) {
                exactCount++;
            } else if (pts > 0) {
                resultCount++;
            }
        } else {
            knockoutPoints += pts;
            if (pts > 0) {
                advancedCount++;
                if (match.round) {
                    if (!koBreakdown[match.round]) koBreakdown[match.round] = { count: 0, points: 0 };
                    koBreakdown[match.round].count++;
                    koBreakdown[match.round].points += pts;
                }
            }
        }
      }
    });

    const { form, streak } = getManagerStats(user, matches, allPredictions);

    return {
      ...user,
      bankedPoints,
      totalPoints, 
      livePoints: totalPoints - bankedPoints,
      exactCount,
      resultCount,
      advancedCount,
      groupPoints,
      knockoutPoints,
      koBreakdown,
      form,
      streak
    };
  });

  // 2. Determine Ranks
  const liveRanked = [...userStats].sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.exactCount !== a.exactCount) return b.exactCount - a.exactCount;
      return b.knockoutPoints - a.knockoutPoints;
  });
  
  const bankedRanked = [...userStats].sort((a, b) => {
      if (b.bankedPoints !== a.bankedPoints) return b.bankedPoints - a.bankedPoints;
      return b.exactCount - a.exactCount;
  });

  const finalDisplayData = liveRanked.map((user, idx) => {
    const liveRank = idx + 1;
    const prevRankIndex = bankedRanked.findIndex(u => u.email === user.email);
    const prevRank = prevRankIndex === -1 ? liveRank : prevRankIndex + 1;
    const rankDiff = prevRank - liveRank; 

    return { ...user, liveRank, rankDiff };
  });

  const toggleExpand = (email: string) => {
      setExpandedUser(expandedUser === email ? null : email);
  };

  const getLeagueName = (slug: string) =>
    slug === 'global'
      ? (lang.lbGlobal || 'Global League')
      : (LEAGUES[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1));

  const openStatsModal = (user: UserProfile, type: 'EXACT' | 'RESULT' | 'ADVANCED') => {
      const relevantMatches: {m: Match, p: Prediction, pts: number}[] = [];
      
      if (type !== 'ADVANCED') {
          matches.forEach(match => {
              const pred = allPredictions.find(p => p.userId === user.email && p.matchId === match.id);
              if (pred && match.homeScore !== null && match.awayScore !== null) {
                  const pts = calculatePoints(pred.home, pred.away, match.homeScore, match.awayScore, user.hasTakenSecondChance || false, match.round);
                  
                  let isMatch = false;
                  if (type === 'EXACT') {
                      isMatch = !!match.groupId && pred.home === match.homeScore && pred.away === match.awayScore;
                  } else if (type === 'RESULT') {
                      const isExact = pred.home === match.homeScore && pred.away === match.awayScore;
                      isMatch = !!match.groupId && !isExact && pts > 0;
                  }

                  if (isMatch) {
                      relevantMatches.push({ m: match, p: pred, pts });
                  }
              }
          });
          relevantMatches.sort((a, b) => new Date(b.m.date).getTime() - new Date(a.m.date).getTime());
      }

      setModalData({ user, type, matches: relevantMatches });
  };

  const displayList = finalDisplayData;

  return (
    <div className="space-y-3 animate-fade-in pb-20 relative">
      
      {/* BATTLE STRIP + COACH'S REPORT */}
      {(() => {
          const myEntry = displayList.find(u => u.email === currentUserEmail);
          if (!myEntry) return null;
          const leader = displayList[0];
          const myIdx = displayList.findIndex(u => u.email === currentUserEmail);
          const above = myIdx > 0 ? displayList[myIdx - 1] : null;
          const gapToLeader = leader ? leader.totalPoints - myEntry.totalPoints : 0;
          const gapAbove = above ? above.totalPoints - myEntry.totalPoints : 0;
          const isLeader = myIdx === 0;

          const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
          const finishedStatuses = ['FT', 'FINISHED', 'AET', 'PEN'];
          const historicalMatches = matches.filter(m =>
              new Date(m.date).getTime() < threeDaysAgo &&
              finishedStatuses.includes(m.status)
          );
          const hasHistory = historicalMatches.length > 0;
          const historicalRanking = hasHistory
              ? [...displayList]
                  .map(u => ({
                      email: u.email,
                      pts: historicalMatches.reduce((sum, m) => {
                          const pred = allPredictions.find(p => p.userId === u.email && p.matchId === m.id);
                          if (!pred || m.homeScore === null || m.awayScore === null) return sum;
                          return sum + calculatePoints(pred.home, pred.away, m.homeScore, m.awayScore, !!u.hasTakenSecondChance, m.round);
                      }, 0)
                  }))
                  .sort((a, b) => b.pts - a.pts)
              : [];
          const historicalRank = hasHistory
              ? historicalRanking.findIndex(u => u.email === currentUserEmail) + 1
              : myIdx + 1;
          const rankChange = historicalRank - (myIdx + 1);

          return (
              <div id="tour-leaderboard-top" className="rounded-2xl bg-gradient-to-br from-[#1e1b4b] to-[#0f2545] border border-white/10 shadow-lg overflow-hidden">
                  {/* Coach's brief */}
                  {currentLang && (
                      <div className="px-3 pt-3 pb-2">
                          <AIAnalystWidget
                              currentLang={currentLang}
                              preloadedAnalysis={preloadedAnalysis}
                              onRefresh={onRefreshBrief}
                              isRefreshing={briefRefreshing}
                              compact
                          />
                      </div>
                  )}

                  {/* Divider */}
                  {showLive && <div className="border-t border-white/10 mx-3" />}

                  {/* Stats row — only in LIVE mode */}
                  {showLive && (
                      <div className="flex items-center justify-around gap-2 px-3 pt-2 pb-3 text-white">
                          <div className="text-center min-w-0">
                              <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Behind leader</div>
                              <div className="text-lg font-black text-yellow-400">
                                  {isLeader ? '🏆' : `-${gapToLeader}`}
                              </div>
                              {!isLeader && <div className="text-[9px] text-slate-500 truncate max-w-[70px]">{leader.name}</div>}
                          </div>

                          <div className="w-px h-8 bg-white/10" />

                          {above ? (
                              <div className="text-center min-w-0 flex-1">
                                  <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Chasing</div>
                                  <div className="text-sm font-black text-white truncate">{above.name}</div>
                                  <div className="text-[10px] text-red-400 font-bold">-{gapAbove} pts</div>
                              </div>
                          ) : (
                              <div className="text-center flex-1">
                                  <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Position</div>
                                  <div className="text-sm font-black text-green-400">Leading 🎯</div>
                              </div>
                          )}

                          <div className="w-px h-8 bg-white/10" />

                          <div className="text-center min-w-0">
                              <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">3-Day Trend</div>
                              {!hasHistory ? (
                                  <div className="text-lg font-black text-slate-500">–</div>
                              ) : rankChange > 0 ? (
                                  <div className="flex flex-col items-center gap-0">
                                      <TrendingUp size={18} className="text-green-400" />
                                      <span className="text-[10px] font-black text-green-400">+{rankChange}</span>
                                  </div>
                              ) : rankChange < 0 ? (
                                  <div className="flex flex-col items-center gap-0">
                                      <TrendingDown size={18} className="text-red-400" />
                                      <span className="text-[10px] font-black text-red-400">{rankChange}</span>
                                  </div>
                              ) : (
                                  <div className="flex flex-col items-center gap-0">
                                      <Minus size={18} className="text-yellow-400" />
                                      <span className="text-[10px] font-black text-yellow-400">=</span>
                                  </div>
                              )}
                          </div>
                      </div>
                  )}
              </div>
          );
      })()}

      {/* THE LIST */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Navy table header — title + league tabs + LIVE toggle */}
        <div className="bg-[#0f2545] px-4 pt-3 pb-0 border-b border-slate-700">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="bg-yellow-400 p-1.5 rounded-md text-[#0f2545]">
                        <Trophy size={14} />
                    </div>
                    <h2 className="font-black text-sm uppercase tracking-widest text-white">{lang.leaderboard}</h2>
                </div>
                <button
                    onClick={() => setShowLive(!showLive)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${showLive ? 'bg-red-600 text-white shadow-red-500/30 shadow-md animate-pulse' : 'bg-white/10 text-slate-400'}`}
                >
                    <Activity size={11} />
                    <span>{showLive ? 'LIVE' : 'BANKED'}</span>
                </button>
            </div>

            {/* League tabs inline */}
            {currentUserLeagues.length > 0 && (
                <div className="flex overflow-x-auto no-scrollbar gap-1 relative z-20">
                    <button
                        onClick={() => setActiveLeague('global')}
                        className={`shrink-0 px-3 py-1.5 rounded-t-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-b-2 ${activeLeague === 'global' ? 'bg-white/10 text-white border-yellow-400' : 'text-slate-400 border-transparent hover:text-white'}`}
                    >
                        <Globe size={10} className="inline mr-1 -mt-0.5" />{lang.lbGlobal || 'All'}
                    </button>
                    {currentUserLeagues.map(slug => (
                        <button
                            key={slug}
                            onClick={() => setActiveLeague(slug)}
                            className={`shrink-0 px-3 py-1.5 rounded-t-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-b-2 ${activeLeague === slug ? 'bg-white/10 text-white border-yellow-400' : 'text-slate-400 border-transparent hover:text-white'}`}
                        >
                            {getLeagueName(slug)}
                        </button>
                    ))}
                </div>
            )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="w-[15%] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">#</th>
                <th className="w-[50%] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">{lang.manager}</th>
                <th className="w-[20%] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hidden sm:table-cell text-center">Form</th>
                <th className="w-[15%] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayList.map((user) => {
                const points = showLive ? user.totalPoints : user.bankedPoints;
                const isMe = user.email === currentUserEmail;
                const isExpanded = expandedUser === user.email;
                const rank = user.liveRank;
                
                let MoveIcon = Minus;
                let moveColor = "text-slate-300";
                
                if (showLive) {
                    if (user.rankDiff > 0) { MoveIcon = TrendingUp; moveColor = "text-green-500"; } 
                    else if (user.rankDiff < 0) { MoveIcon = TrendingDown; moveColor = "text-red-400"; }
                }

                let RankIcon = null;
                if (rank === 1) RankIcon = <Medal size={20} className="text-yellow-400 drop-shadow-sm" fill="currentColor" />;
                if (rank === 2) RankIcon = <Medal size={20} className="text-slate-300 drop-shadow-sm" fill="currentColor" />;
                if (rank === 3) RankIcon = <Medal size={20} className="text-orange-400 drop-shadow-sm" fill="currentColor" />;

                return (
                  <React.Fragment key={user.email}>
                      <tr 
                        onClick={() => toggleExpand(user.email)}
                        className={`transition-all cursor-pointer group ${isMe ? 'bg-blue-50/60' : 'hover:bg-slate-50'} ${isExpanded ? 'bg-slate-50 shadow-inner' : ''}`}
                      >
                        <td className="w-[15%] px-4 py-4 text-center align-middle relative">
                            {/* FIX: Blue indicator bar is inside this relative TD, preventing layout shift */}
                            {isMe && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                            
                            <div className="flex flex-col items-center justify-center gap-1">
                                {RankIcon ? (
                                    <div className="transform scale-110">{RankIcon}</div>
                                ) : (
                                    <span className="text-sm font-black text-slate-500">#{rank}</span>
                                )}
                                
                                {showLive && (
                                    <div className={`flex items-center gap-0.5 text-[9px] font-bold ${moveColor}`}>
                                        <MoveIcon size={10} /> {Math.abs(user.rankDiff) > 0 ? Math.abs(user.rankDiff) : '-'}
                                    </div>
                                )}
                            </div>
                        </td>

                        <td className="w-[50%] px-4 py-4 align-middle">
                            <div className="flex items-center gap-3">
                                <AvatarDisplay avatar={user.avatar} size="md" ring={rank <= 3} className={rank === 1 ? 'ring-yellow-400' : rank === 2 ? 'ring-slate-300' : rank === 3 ? 'ring-orange-300' : ''} />
                                <div className="flex flex-col min-w-0">
                                    <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5 truncate">
                                        {user.name}
                                        {user.hasTakenSecondChance && (
                                            <Shield size={10} className="text-purple-500 shrink-0" fill="currentColor" />
                                        )}
                                        {user.streak > 2 && (
                                            <Flame size={10} className="text-orange-500 animate-pulse shrink-0" fill="currentColor" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 opacity-70">
                                        <div className="flex items-center gap-1 bg-green-100 px-1.5 py-0.5 rounded text-[8px] font-bold text-green-700" title="Exact Scores (Groups)">
                                            <Target size={8} /> {user.exactCount}
                                        </div>
                                        <div className="flex items-center gap-1 bg-blue-100 px-1.5 py-0.5 rounded text-[8px] font-bold text-blue-700" title="Correct Outcomes (Groups)">
                                            <ShieldCheck size={8} /> {user.resultCount}
                                        </div>
                                        <div className="flex items-center gap-1 bg-purple-100 px-1.5 py-0.5 rounded text-[8px] font-bold text-purple-700" title="Knockout Points">
                                            <Trophy size={8} /> {user.knockoutPoints}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </td>

                        <td className="w-[20%] px-4 py-4 text-center align-middle hidden sm:table-cell">
                            <div className="flex items-center justify-center gap-1">
                                {user.form.map((p, i) => (
                                    <div key={i} className={`w-1.5 h-6 rounded-full ${p > 0 ? 'bg-green-400' : 'bg-red-300'}`} title={`Match ${i+1}: ${p} pts`}></div>
                                ))}
                            </div>
                        </td>

                        <td className="w-[15%] px-4 py-4 text-right align-middle">
                            <div className="text-xl font-black text-slate-900 tracking-tight">{points}</div>
                        </td>
                      </tr>

                      {/* EXPANDED DETAILS */}
                      {isExpanded && (
                          <tr className="bg-slate-50/50">
                              <td colSpan={4} className="px-4 pb-6 pt-2">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                      
                                      {/* STATS BREAKDOWN */}
                                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{lang.lbBreakdown}</h4>
                                          
                                          <div className="grid grid-cols-2 gap-3">
                                              <button onClick={() => openStatsModal(user, 'EXACT')} className="bg-green-50 p-3 rounded-lg border border-green-100 flex flex-col items-center hover:bg-green-100 transition-colors">
                                                  <span className="text-2xl font-black text-green-600">{user.exactCount}</span>
                                                  <span className="text-[9px] font-bold text-green-800 uppercase">{lang.lbExact}</span>
                                              </button>
                                              <button onClick={() => openStatsModal(user, 'RESULT')} className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex flex-col items-center hover:bg-blue-100 transition-colors">
                                                  <span className="text-2xl font-black text-blue-600">{user.resultCount}</span>
                                                  <span className="text-[9px] font-bold text-blue-800 uppercase">{lang.lbCorrect}</span>
                                              </button>
                                              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex flex-col items-center">
                                                  <span className="text-xl font-black text-indigo-600">{user.groupPoints}</span>
                                                  <span className="text-[9px] font-bold text-indigo-800 uppercase">{lang.lbGroupPts}</span>
                                              </div>
                                              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 flex flex-col items-center relative overflow-hidden group hover:bg-purple-100 transition-colors cursor-pointer" onClick={() => openStatsModal(user, 'ADVANCED')}>
                                                  <span className="text-xl font-black text-purple-600 relative z-10">{user.knockoutPoints}</span>
                                                  <span className="text-[9px] font-bold text-purple-800 uppercase relative z-10">{lang.lbKoPts}</span>
                                                  <Trophy size={40} className="absolute -bottom-2 -right-2 text-purple-200 opacity-50 transform rotate-12 group-hover:scale-110 transition-transform" />
                                              </div>
                                          </div>
                                      </div>

                                      {/* QUALIFIED TEAMS GRID (ADVANCED VIEW) */}
                                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm overflow-hidden relative">
                                          <div className="flex justify-between items-center mb-3">
                                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang.lbQualifiedDesc}</h4>
                                              {user.hasTakenSecondChance && (
                                                  <span className="bg-purple-100 text-purple-700 text-[8px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1">
                                                      <Shield size={8} /> 2nd Chance
                                                  </span>
                                              )}
                                          </div>
                                          
                                          {matches.some(m => m.round) ? (
                                               <QualifiedTeamsGrid 
                                                  realMatches={matches} 
                                                  userPredictions={allPredictions.filter(p => p.userId === user.email)} 
                                                  user={user}
                                                  teams={teams}
                                                  onTeamClick={onTeamClick}
                                               />
                                          ) : (
                                              <div className="h-32 flex flex-col items-center justify-center text-slate-400">
                                                  <Lock size={24} className="mb-2 opacity-50" />
                                                  <span className="text-xs font-medium">Knockout Stage Locked</span>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              </td>
                          </tr>
                      )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {modalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setModalData(null)}></div>
              <div className="relative w-full max-w-md bg-slate-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95">
                  <div className="bg-[#0f2545] p-4 text-white flex justify-between items-center shrink-0">
                      <div>
                          <h3 className="font-black uppercase tracking-tight text-lg">{modalData.user.name}</h3>
                          <p className="text-xs text-blue-200 font-medium uppercase tracking-widest">
                              {modalData.type === 'EXACT' ? 'Perfect Scores' : modalData.type === 'RESULT' ? 'Correct Outcomes' : 'Knockout Points'}
                          </p>
                      </div>
                      <button onClick={() => setModalData(null)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"><X size={18} /></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {modalData.type === 'ADVANCED' ? (
                          <QualifiedTeamsGrid 
                              realMatches={matches} 
                              userPredictions={allPredictions.filter(p => p.userId === modalData.user.email)} 
                              user={modalData.user}
                              teams={teams}
                              onTeamClick={onTeamClick}
                          />
                      ) : (
                          modalData.matches.length > 0 ? (
                              modalData.matches.map((item, idx) => (
                                  <DetailMatchRow 
                                      key={idx} 
                                      match={item.m} 
                                      prediction={item.p} 
                                      points={item.pts} 
                                      type={modalData.type as any}
                                      teams={teams}
                                      onTeamClick={onTeamClick}
                                  />
                              ))
                          ) : (
                              <div className="py-10 text-center text-slate-400 text-sm italic">No matches found in this category.</div>
                          )
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
