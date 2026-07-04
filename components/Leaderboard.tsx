
import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, Match, Prediction, Translation, Round, Team, LanguageCode } from '../types';
import { AIAnalystWidget } from './analysis/AIAnalystWidget';
import { calculatePoints, getManagerStats, applyPredictionsToBracket, SCORING_RULES, getQualifiedRounds, QualifiedRound } from '../services/engine';
import { Activity, Trophy, Flame, Target, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, ChevronRight, PieChart, Users, Medal, Check, Shield, X, Calendar, Crown, MapPin, AlertTriangle, ShieldCheck } from 'lucide-react';
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


type TeamStatus = 'confirmed' | 'pending' | 'eliminated';
interface RoundWithAllTeams {
    key: string; label: string; pointsPerTeam: number; totalSlots: number;
    penaltyApplied: boolean; confirmedPoints: number;
    teams: { teamId: string; status: TeamStatus }[];
    isActive: boolean;
}

const getRoundsWithAllTeams = (
    realMatches: Match[],
    userPredictions: Prediction[],
    user: UserProfile,
    teams: Record<string, Team>
): RoundWithAllTeams[] => {
    const bracketPreds = user.bracketPredictions
        ? userPredictions.map(p =>
              /^[A-L]\d$/.test(p.matchId) && user.bracketPredictions![p.matchId]
                  ? { ...p, ...user.bracketPredictions![p.matchId] }
                  : p
          )
        : userPredictions;
    const standardBracket = applyPredictionsToBracket(INITIAL_MATCHES, teams, bracketPreds);
    const unlockedRealMatches = realMatches.map(m => ({ ...m, isLocked: false }));
    const secondChanceBracket = user.hasTakenSecondChance
        ? applyPredictionsToBracket(unlockedRealMatches, teams, userPredictions)
        : standardBracket;
    const computedRealBracket = applyPredictionsToBracket(realMatches, teams, []);

    const getTeamsInRound = (matchList: Match[], round: Round | 'R32_START') => {
        const teamSet = new Set<string>();
        matchList
            .filter(m => round === 'R32_START' ? m.round === 'R32' : m.round === round)
            .forEach(m => {
                if (m.homeTeamId && !m.homeTeamId.startsWith('TBD')) teamSet.add(m.homeTeamId);
                if (m.awayTeamId && !m.awayTeamId.startsWith('TBD')) teamSet.add(m.awayTeamId);
            });
        return teamSet;
    };

    const roundDefs = [
        { key: 'R32_START', label: 'Round of 32',    points: SCORING_RULES.GROUP_RESULT, totalSlots: 32 },
        { key: 'R16',       label: 'Round of 16',    points: SCORING_RULES.R32,          totalSlots: 16 },
        { key: 'QF',        label: 'Quarter Finals', points: SCORING_RULES.R16,          totalSlots: 8  },
        { key: 'SF',        label: 'Semi Finals',    points: SCORING_RULES.QF,           totalSlots: 4  },
        { key: 'FIN',       label: 'Final',          points: SCORING_RULES.SF,           totalSlots: 2  },
        { key: 'CHAMP',     label: 'Champion',       points: SCORING_RULES.FIN,          totalSlots: 1  },
    ];

    const getChamp = (matchList: Match[]) => {
        const fin = matchList.find(m => m.round === 'FIN');
        if (fin && fin.homeScore !== null && fin.awayScore !== null)
            return fin.homeScore > fin.awayScore ? fin.homeTeamId : fin.awayTeamId;
        return null;
    };

    const realChamp = getChamp(computedRealBracket);
    const standardChamp = getChamp(standardBracket);
    const secondChanceChamp = getChamp(secondChanceBracket);
    const statusOrder: Record<TeamStatus, number> = { confirmed: 0, pending: 1, eliminated: 2 };

    // Build a set of teams definitively eliminated: they played a knockout match
    // and lost (score is settled — excludes live/PSO ties where winner is unclear).
    const finishedStatuses = new Set(['FINISHED', 'FT', 'AET', 'PEN']);
    const definitivelyEliminated = new Set<string>();
    realMatches
        .filter(m => m.round && finishedStatuses.has(m.status ?? '') && m.homeScore !== null && m.awayScore !== null && m.homeScore !== m.awayScore)
        .forEach(m => {
            const loserId = m.homeScore! < m.awayScore! ? m.homeTeamId : m.awayTeamId;
            if (loserId && !loserId.startsWith('TBD')) definitivelyEliminated.add(loserId);
        });

    // Use predictedWinnerId from DB: teams in round N = winners (predictedWinnerId) of round N-1.
    const FEEDING_ROUND: Record<string, string> = { R16: 'R32', QF: 'R16', SF: 'QF', FIN: 'SF' };
    const getTeamsFromPredictedWinners = (feedingPrefix: string): Set<string> => {
        const teamSet = new Set<string>();
        userPredictions.forEach(p => {
            if (p.matchId.startsWith(feedingPrefix + '_') && p.predictedWinnerId && !p.predictedWinnerId.startsWith('TBD')) {
                teamSet.add(p.predictedWinnerId);
            }
        });
        return teamSet;
    };
    const storedUserChamp = userPredictions.find(p => p.matchId === 'FIN_1')?.predictedWinnerId ?? null;

    const result: RoundWithAllTeams[] = [];

    roundDefs.forEach(r => {
        let pointsPerTeam = r.points;
        let penaltyApplied = false;
        let targetBracket = standardBracket;
        let userChamp = storedUserChamp ?? standardChamp;

        if (r.key !== 'R32_START' && user.hasTakenSecondChance) {
            targetBracket = secondChanceBracket;
            userChamp = storedUserChamp ?? secondChanceChamp;
            penaltyApplied = true;
            pointsPerTeam = Math.floor(pointsPerTeam * 0.5);
        }

        if (r.key === 'CHAMP') {
            if (!userChamp || userChamp.startsWith('TBD')) return;
            const status: TeamStatus = realChamp === userChamp ? 'confirmed' : realChamp !== null ? 'eliminated' : 'pending';
            result.push({
                key: r.key, label: r.label, pointsPerTeam, totalSlots: r.totalSlots,
                penaltyApplied, confirmedPoints: status === 'confirmed' ? pointsPerTeam : 0,
                teams: [{ teamId: userChamp, status }],
                isActive: realChamp !== null,
            });
        } else {
            const realTeams = getTeamsInRound(computedRealBracket, r.key as any);
            const feedingPrefix = FEEDING_ROUND[r.key];
            let userTeams: Set<string>;
            if (feedingPrefix) {
                const fromDB = getTeamsFromPredictedWinners(feedingPrefix);
                userTeams = fromDB.size > 0 ? fromDB : getTeamsInRound(targetBracket, r.key as any);
            } else {
                userTeams = getTeamsInRound(targetBracket, r.key as any);
            }
            if (userTeams.size === 0) return;

            const teamList: { teamId: string; status: TeamStatus }[] = [];
            userTeams.forEach(teamId => {
                const status: TeamStatus =
                    realTeams.has(teamId)               ? 'confirmed'
                  : realTeams.size >= r.totalSlots       ? 'eliminated'
                  : definitivelyEliminated.has(teamId)  ? 'eliminated'
                  :                                        'pending';
                teamList.push({ teamId, status });
            });
            teamList.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
            const confirmedCount = teamList.filter(t => t.status === 'confirmed').length;
            result.push({
                key: r.key, label: r.label, pointsPerTeam, totalSlots: r.totalSlots,
                penaltyApplied, confirmedPoints: confirmedCount * pointsPerTeam,
                teams: teamList,
                isActive: realTeams.size > 0,
            });
        }
    });

    return result;
};

const QualifiedTeamsGrid: React.FC<{
    realMatches: Match[],
    userPredictions: Prediction[],
    user: UserProfile,
    teams: Record<string, Team>,
    onTeamClick?: (teamId: string) => void
}> = ({ realMatches, userPredictions, user, teams, onTeamClick }) => {

    const rounds = useMemo(
        () => getQualifiedRounds(realMatches, userPredictions, user, teams),
        [realMatches, userPredictions, user, teams]
    );

    if (rounds.length === 0) return null;

    return (
        <div className="space-y-6 pb-4 pt-2">
            {rounds.map(r => (
                <div key={r.key} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex justify-between items-center mb-3 border-b border-slate-200 pb-2">
                        <div className="flex flex-col gap-0.5">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-700">{r.label}</h4>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {r.pointsPerTeam} pts / team
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            {r.penaltyApplied && (
                                <div className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-1" title="Second Chance Penalty Active">
                                    <Shield size={8} /> 50%
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <div className="bg-purple-600 text-white px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                                    <Trophy size={10} className="text-yellow-300" />
                                    <span className="text-[10px] font-black uppercase tracking-wider">
                                        {r.correctTeams.length}/{r.totalSlots}
                                    </span>
                                </div>
                                <div className="text-sm font-black text-green-600">
                                    +{r.totalPoints}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {r.correctTeams.map(tid => {
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
            ))}
        </div>
    );
};

type PredictionPillProps =
  | { mode: 'result'; match: Match; pred: Prediction; pts: number; teams: Record<string, Team> }
  | { mode: 'prediction'; match: Match; pred: Prediction | null; teams: Record<string, Team> };

const MatchPredictionPill: React.FC<PredictionPillProps> = (props) => {
    const { match, pred, teams } = props;
    const home = teams[match.homeTeamId];
    const away = teams[match.awayTeamId];
    const renderFlag = (f?: string) => f?.startsWith('http')
        ? <img src={f} alt="" className="w-3.5 h-2.5 object-cover rounded-[2px] shrink-0" />
        : <span className="shrink-0 text-[10px]">{f || '🏳'}</span>;

    return (
        <div className="inline-flex items-center gap-1 bg-slate-50 rounded-full pl-2 pr-1.5 py-1 text-[10px] font-bold text-slate-700 whitespace-nowrap">
            {renderFlag(home?.flag)}
            {props.mode === 'result' ? (
                <>
                    <span className="font-black text-slate-800">{match.homeScore}-{match.awayScore}</span>
                    <span className="text-slate-400 font-medium">({pred.home}-{pred.away})</span>
                </>
            ) : (
                <span className="font-black text-slate-800">{pred ? `${pred.home}-${pred.away}` : '?-?'}</span>
            )}
            {renderFlag(away?.flag)}
            {props.mode === 'result' && (
                <span className={`ml-0.5 w-4 h-4 rounded-full flex items-center justify-center font-black text-[8px] ${props.pts > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-400'}`}>
                    {props.pts}
                </span>
            )}
        </div>
    );
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ users, matches, allPredictions, lang, currentUserEmail, currentUserLeagues = [], teams, onTeamClick, preloadedAnalysis, onRefreshBrief, briefRefreshing, currentLang }) => {
  const [showLive, setShowLive] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [activeLeague, setActiveLeague] = useState<string>(currentUserLeagues?.[0] ?? '');
  const [openRoundKeys, setOpenRoundKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
      if (!expandedUser) { setOpenRoundKeys(new Set()); return; }
      const active = new Set<string>();
      const nonTBD = (id: string) => !!id && !id.startsWith('TBD');
      const done = ['FT', 'FINISHED', 'AET', 'PEN'];
      const now = Date.now();
      const MS_24H = 24 * 60 * 60 * 1000;

      // Returns ms timestamp of the last finished match in a set, or null if none finished.
      const lastFinishedMs = (src: Match[]) => {
          const times = src
              .filter(m => done.includes(m.status) && m.date && m.date !== 'TBD')
              .map(m => new Date(m.date).getTime());
          return times.length ? Math.max(...times) : null;
      };

      // Cascade actual R32 results so R16/QF/etc. team slots are known even when
      // the DB hasn't been manually updated after each match.
      const computedBracket = applyPredictionsToBracket(matches, teams, []);

      // Auto-open a round only if it has confirmed real teams AND the last source game
      // finished less than 24 h ago (or hasn't finished yet — still in progress).
      const maybeOpen = (key: string, targetRound: string, srcMatches: Match[]) => {
          if (!computedBracket.some(m => m.round === targetRound && (nonTBD(m.homeTeamId) || nonTBD(m.awayTeamId)))) return;
          const last = lastFinishedMs(srcMatches);
          if (last === null || now - last < MS_24H) active.add(key);
      };

      maybeOpen('R32_START', 'R32', matches.filter(m => !!m.groupId));
      maybeOpen('R16',       'R16', matches.filter(m => m.round === 'R32'));
      maybeOpen('QF',        'QF',  matches.filter(m => m.round === 'R16'));
      maybeOpen('SF',        'SF',  matches.filter(m => m.round === 'QF'));
      maybeOpen('FIN',       'FIN', matches.filter(m => m.round === 'SF'));

      // CHAMP: open once FIN has a result and that result is within 24 h
      const finMatch = matches.find(m => m.round === 'FIN');
      if (finMatch?.homeScore !== null && finMatch?.date && finMatch.date !== 'TBD') {
          const finMs = new Date(finMatch.date).getTime();
          if (now - finMs < MS_24H) active.add('CHAMP');
      }

      setOpenRoundKeys(active);
  }, [expandedUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleRound = (key: string) =>
      setOpenRoundKeys(prev => {
          const next = new Set(prev);
          next.has(key) ? next.delete(key) : next.add(key);
          return next;
      });

  // Stats Modal State
  const [modalData, setModalData] = useState<{ user: UserProfile, type: 'EXACT' | 'RESULT' | 'ADVANCED', matches: {m: Match, p: Prediction, pts: number}[] } | null>(null);
  // Profile spotlight modal (avatar click in expanded row)
  const [lbProfileModal, setLbProfileModal] = useState<(UserProfile & { totalPoints: number; liveRank: number; rankDiff: number }) | null>(null);

  // Filter users based on league selection
  const filteredUsers = useMemo(() => {
      if (!activeLeague || currentUserLeagues.length === 0) return users;
      return users.filter(u => u.leagues?.includes(activeLeague));
  }, [users, activeLeague, currentUserLeagues]);

  // 1. Calculate Scores for Everyone
  const userStats = useMemo(() => filteredUsers.map(user => {
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

    // Bracket qualification points (teams correctly predicted to reach each KO round).
    // getQualifiedRounds handles the second-chance 50% penalty internally.
    const bracketQualPoints = getQualifiedRounds(
        matches,
        allPredictions.filter(p => p.userId === user.email),
        user,
        teams
    ).reduce((sum, qr) => sum + qr.totalPoints, 0);
    totalPoints    += bracketQualPoints;
    bankedPoints   += bracketQualPoints;
    knockoutPoints += bracketQualPoints;

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
  }), [filteredUsers, matches, allPredictions, teams]);

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

  // Last 3 finished + next 3 upcoming predictions for the currently expanded user
  const expandedUserDetail = useMemo(() => {
      if (!expandedUser) return null;
      const userPreds = allPredictions.filter(p => p.userId === expandedUser);
      const u = finalDisplayData.find(d => d.email === expandedUser);
      const finishedStatuses = ['FT', 'FINISHED', 'AET', 'PEN'];
      const now = Date.now();

      const last3 = matches
          .filter(m => !!m.groupId && finishedStatuses.includes(m.status) && userPreds.some(p => p.matchId === m.id))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 3)
          .map(m => {
              const pred = userPreds.find(p => p.matchId === m.id)!;
              const pts = calculatePoints(pred.home, pred.away, m.homeScore!, m.awayScore!, !!u?.hasTakenSecondChance, m.round);
              return { match: m, pred, pts };
          });

      const next3 = matches
          .filter(m => !!m.groupId && !finishedStatuses.includes(m.status) && m.date && m.date !== 'TBD')
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 3)
          .map(m => ({ match: m, pred: userPreds.find(p => p.matchId === m.id) ?? null }));

      return { last3, next3 };
  }, [expandedUser, allPredictions, matches, finalDisplayData]);

  const finishedStatuses = ['FT', 'FINISHED', 'AET', 'PEN'];
  const allGroupsDone = matches
      .filter(m => !!m.groupId)
      .every(m => finishedStatuses.includes(m.status));

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
                              userName={users.find(u => u.email === currentUserEmail)?.name}
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

                          {!allGroupsDone && <>
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
                          </>}
                      </div>
                  )}
              </div>
          );
      })()}

      {/* THE LIST */}
      <div id="tour-leaderboard-table" className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
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

            {/* League tabs inline — only shown when user is in multiple leagues */}
            {currentUserLeagues.length > 1 && (
                <div className="flex overflow-x-auto no-scrollbar gap-1 relative z-20">
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
                <th className={`${allGroupsDone ? 'w-[70%]' : 'w-[50%]'} px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400`}>{lang.manager}</th>
                {!allGroupsDone && <th className="w-[20%] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hidden sm:table-cell text-center">Form</th>}
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
                        id={isMe ? 'tour-my-row' : undefined}
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
                                {!isExpanded && <AvatarDisplay avatar={user.avatar} size="md" ring={rank <= 3} className={rank === 1 ? 'ring-yellow-400' : rank === 2 ? 'ring-slate-300' : rank === 3 ? 'ring-orange-300' : ''} />}
                                <div className="flex flex-col min-w-0">
                                    <div className={`flex items-center gap-1.5 truncate transition-all ${isExpanded ? 'text-lg font-black text-slate-900' : 'text-sm font-bold text-slate-800'}`}>
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

                        {!allGroupsDone && (
                        <td className="w-[20%] px-4 py-4 text-center align-middle hidden sm:table-cell">
                            <div className="flex items-center justify-center gap-1">
                                {user.form.map((p, i) => (
                                    <div key={i} className={`w-1.5 h-6 rounded-full ${p === -1 ? 'bg-slate-300' : p >= 5 ? 'bg-green-400' : p > 0 ? 'bg-blue-400' : 'bg-red-300'}`} title={`Match ${i+1}: ${p === -1 ? 'No prediction' : p + ' pts'}`}></div>
                                ))}
                            </div>
                        </td>
                        )}

                        <td className="w-[15%] px-4 py-4 text-right align-middle">
                            <div className="text-xl font-black text-slate-900 tracking-tight">{points}</div>
                        </td>
                      </tr>

                      {/* EXPANDED DETAILS */}
                      {isExpanded && (
                          <tr id={isMe ? 'tour-my-row-expanded' : undefined} className="bg-slate-50/50">
                              <td colSpan={4} className="px-4 pb-6 pt-2">

                                  {/* Avatar + Last 3 / Next 3 — hidden once all group games are done */}
                                  {!allGroupsDone && (
                                  <div className="flex flex-wrap items-start gap-3 mb-4 pb-3 border-b border-slate-200">
                                      <div
                                          className="shrink-0 flex items-center gap-1 cursor-pointer group"
                                          onClick={() => setLbProfileModal(user)}
                                      >
                                          <AvatarDisplay
                                              avatar={user.avatar}
                                              size="2xl"
                                              ring={rank <= 3}
                                              className={`group-hover:ring-blue-400 transition-all ${rank === 1 ? 'ring-yellow-400' : rank === 2 ? 'ring-slate-300' : rank === 3 ? 'ring-orange-300' : 'ring-white'}`}
                                          />
                                          <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
                                      </div>

                                      <div className="flex-1 min-w-[200px] flex flex-col gap-2.5">
                                          <div>
                                              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Last 3</div>
                                              <div className="flex flex-wrap gap-1.5">
                                                  {expandedUserDetail && expandedUserDetail.last3.length > 0 ? (
                                                      expandedUserDetail.last3.map(({ match: m, pred, pts }) => (
                                                          <MatchPredictionPill key={m.id} mode="result" match={m} pred={pred} pts={pts} teams={teams} />
                                                      ))
                                                  ) : (
                                                      <span className="text-[10px] text-slate-400 italic">No finished predictions yet</span>
                                                  )}
                                              </div>
                                          </div>
                                          <div>
                                              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Next 3</div>
                                              <div className="flex flex-wrap gap-1.5">
                                                  {expandedUserDetail && expandedUserDetail.next3.length > 0 ? (
                                                      expandedUserDetail.next3.map(({ match: m, pred }) => (
                                                          <MatchPredictionPill key={m.id} mode="prediction" match={m} pred={pred} teams={teams} />
                                                      ))
                                                  ) : (
                                                      <span className="text-[10px] text-slate-400 italic">No upcoming predictions</span>
                                                  )}
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                                  )}

                                  {/* Horizontal stats chips */}
                                  <div className="grid grid-cols-4 gap-2 mb-4">
                                      <button onClick={() => openStatsModal(user, 'EXACT')} className="bg-green-50 py-3 px-2 rounded-xl border border-green-200 flex flex-col items-center hover:bg-green-100 transition-colors shadow-sm">
                                          <span className="text-2xl font-black text-green-600 leading-none">{user.exactCount}</span>
                                          <span className="text-[9px] font-bold text-green-700 uppercase tracking-wide leading-tight text-center mt-1">{lang.lbExact}</span>
                                      </button>
                                      <button onClick={() => openStatsModal(user, 'RESULT')} className="bg-blue-50 py-3 px-2 rounded-xl border border-blue-200 flex flex-col items-center hover:bg-blue-100 transition-colors shadow-sm">
                                          <span className="text-2xl font-black text-blue-600 leading-none">{user.resultCount}</span>
                                          <span className="text-[9px] font-bold text-blue-700 uppercase tracking-wide leading-tight text-center mt-1">{lang.lbCorrect}</span>
                                      </button>
                                      <div className="bg-indigo-50 py-3 px-2 rounded-xl border border-indigo-200 flex flex-col items-center shadow-sm">
                                          <span className="text-2xl font-black text-indigo-600 leading-none">{user.groupPoints}</span>
                                          <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-wide leading-tight text-center mt-1">{lang.lbGroupPts}</span>
                                      </div>
                                      <div className="bg-purple-50 py-3 px-2 rounded-xl border border-purple-200 flex flex-col items-center relative overflow-hidden group/kopt cursor-pointer hover:bg-purple-100 transition-colors shadow-sm" onClick={() => openStatsModal(user, 'ADVANCED')}>
                                          <span className="text-2xl font-black text-purple-600 leading-none relative z-10">{user.knockoutPoints}</span>
                                          <span className="text-[9px] font-bold text-purple-700 uppercase tracking-wide leading-tight text-center mt-1 relative z-10">{lang.lbKoPts}</span>
                                          <Trophy size={32} className="absolute -bottom-1 -right-1 text-purple-200 opacity-50 rotate-12 group-hover/kopt:scale-110 transition-transform" />
                                      </div>
                                  </div>

                                  {/* Collapsible bracket rounds */}
                                  {(() => {
                                      const userPreds = allPredictions.filter(p => p.userId === user.email);
                                      const roundDetails = getRoundsWithAllTeams(matches, userPreds, user, teams);
                                      if (roundDetails.length === 0) return null;

                                      return (
                                          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                                                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang.lbQualifiedDesc}</h4>
                                                  {user.hasTakenSecondChance && (
                                                      <span className="bg-purple-100 text-purple-700 text-[8px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1">
                                                          <Shield size={8} /> 2nd Chance
                                                      </span>
                                                  )}
                                              </div>
                                              <div className="divide-y divide-slate-50">
                                                  {roundDetails.map(r => {
                                                      const isOpen = openRoundKeys.has(r.key);
                                                      return (
                                                          <div key={r.key}>
                                                              <div
                                                                  className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                                                                  onClick={() => toggleRound(r.key)}
                                                              >
                                                                  <div className="flex flex-col gap-0.5">
                                                                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{r.label}</span>
                                                                      <span className="text-[9px] text-slate-400 font-medium">{r.pointsPerTeam} pts / team</span>
                                                                  </div>
                                                                  <div className="flex items-center gap-2">
                                                                      {r.penaltyApplied && (
                                                                          <span className="text-[8px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">50%</span>
                                                                      )}
                                                                      <span className="bg-purple-600 text-white text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1">
                                                                          <Trophy size={8} className="text-yellow-300" />
                                                                          {r.teams.filter(t => t.status === 'confirmed').length}/{r.totalSlots}
                                                                      </span>
                                                                      <span className="text-sm font-black text-green-600">+{r.confirmedPoints}</span>
                                                                      <ChevronDown size={12} className={`text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                                                  </div>
                                                              </div>
                                                              {isOpen && (
                                                                  <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                                                                      {r.teams.map(({ teamId, status }) => {
                                                                          const team = teams[teamId];
                                                                          return (
                                                                              <div
                                                                                  key={teamId}
                                                                                  onClick={e => { e.stopPropagation(); if (onTeamClick && status !== 'pending') onTeamClick(teamId); }}
                                                                                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold ${
                                                                                      status === 'confirmed' ? 'bg-white border-slate-200 text-slate-700 cursor-pointer hover:border-blue-300'
                                                                                    : status === 'pending'  ? 'bg-slate-50 border-slate-100 text-slate-400'
                                                                                    :                         'bg-red-50 border-red-100 text-red-400'
                                                                                  }`}
                                                                              >
                                                                                  <img src={team?.flag} className={`w-5 h-3.5 object-cover rounded-sm shadow-sm ${status === 'pending' ? 'opacity-40' : ''}`} alt={teamId} />
                                                                                  <span className={status === 'eliminated' ? 'line-through' : ''}>{teamId}</span>
                                                                                  {status === 'confirmed'  && <Check size={9} className="text-green-500" strokeWidth={3} />}
                                                                                  {status === 'eliminated' && <X    size={9} className="text-red-400"   strokeWidth={3} />}
                                                                              </div>
                                                                          );
                                                                      })}
                                                                  </div>
                                                              )}
                                                          </div>
                                                      );
                                                  })}
                                              </div>
                                          </div>
                                      );
                                  })()}
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
                      {modalData.type === 'ADVANCED' ? (() => {
                          const userPreds = allPredictions.filter(p => p.userId === modalData.user.email);
                          const finishedStatuses = ['FT', 'FINISHED', 'AET', 'PEN'];
                          const qualRounds = getQualifiedRounds(matches, userPreds, modalData.user, teams);
                          if (qualRounds.length === 0) {
                              return <div className="py-10 text-center text-slate-400 text-sm italic">No knockout points yet.</div>;
                          }
                          return (
                              <>
                                  {qualRounds.length > 0 && (
                                      <QualifiedTeamsGrid
                                          realMatches={matches}
                                          userPredictions={userPreds}
                                          user={modalData.user}
                                          teams={teams}
                                          onTeamClick={onTeamClick}
                                      />
                                  )}
                              </>
                          );
                      })() : (
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

      {/* LEADERBOARD PROFILE MODAL */}
      {lbProfileModal && (() => {
        const u = lbProfileModal;
        const totalUsers = finalDisplayData.length;
        const userPreds = allPredictions.filter(p => p.userId === u.email);

        const finishedStatuses = ['FT', 'FINISHED', 'AET', 'PEN'];
        const now = Date.now();
        const next3 = matches
          .filter(m => !!m.groupId && !finishedStatuses.includes(m.status) && m.date && m.date !== 'TBD')
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 3)
          .map(m => ({ match: m, pred: userPreds.find(p => p.matchId === String(m.id)) ?? null }));

        const finPred = userPreds.find(p => p.matchId === 'FIN_1');
        let champId: string | null = finPred?.predictedWinnerId ?? null;
        if (!champId) {
          const userBracket = applyPredictionsToBracket(matches, teams, userPreds);
          const finMatch = userBracket.find(m => m.round === 'FIN');
          if (finMatch && finMatch.homeScore !== null && finMatch.awayScore !== null) {
            const winnerId = finMatch.homeScore >= finMatch.awayScore ? finMatch.homeTeamId : finMatch.awayTeamId;
            if (winnerId && !winnerId.startsWith('TBD')) champId = winnerId;
          }
        }

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setLbProfileModal(null)}>
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
            <div className="relative bg-white rounded-3xl shadow-2xl p-6 flex flex-col items-center gap-4 w-80 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <button onClick={() => setLbProfileModal(null)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>

              <AvatarDisplay avatar={u.avatar} size="5xl" className="ring-4 ring-white shadow-xl" />
              <div className="text-center -mt-1">
                <div className="text-xl font-black text-slate-800">{u.name}</div>
                <div className="text-sm text-slate-500 mt-0.5">#{u.liveRank} of {totalUsers} · {u.totalPoints} pts</div>
                {u.rankDiff !== 0 && (
                  <div className={`text-xs font-bold mt-1 ${u.rankDiff > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {u.rankDiff > 0 ? `↑${u.rankDiff}` : `↓${Math.abs(u.rankDiff)}`} places
                  </div>
                )}
              </div>

              {next3.length > 0 && (
                <div className="w-full">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Next Predictions</div>
                  <div className="flex flex-col gap-2">
                    {next3.map(({ match: m, pred }) => {
                      const homeFlag = teams[m.homeTeamId]?.flag ?? '';
                      const awayFlag = teams[m.awayTeamId]?.flag ?? '';
                      const renderFlag = (f: string) => f.startsWith('http')
                        ? <img src={f} alt="" className="w-5 h-4 object-cover rounded-sm shrink-0" />
                        : <span className="shrink-0">{f || '🏳'}</span>;
                      const matchDate = new Date(m.date);
                      const dateLabel = matchDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + matchDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={m.id} className="bg-slate-50 rounded-xl px-3 py-2 text-xs font-bold text-slate-700">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1 min-w-0 flex-1">
                              {renderFlag(homeFlag)}
                              <span className="truncate">{teams[m.homeTeamId]?.name ?? m.homeTeamId}</span>
                            </div>
                            <div className="text-sm font-black text-slate-800 mx-2 shrink-0">
                              {pred ? `${pred.home}–${pred.away}` : '?–?'}
                            </div>
                            <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
                              <span className="truncate">{teams[m.awayTeamId]?.name ?? m.awayTeamId}</span>
                              {renderFlag(awayFlag)}
                            </div>
                          </div>
                          <div className="text-[9px] text-slate-400 font-medium mt-1 text-center">{dateLabel}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {champId && teams[champId] && (
                <div className="w-full bg-amber-50 rounded-2xl p-3 border border-amber-100 flex items-center gap-3">
                  {teams[champId].flag?.startsWith('http')
                    ? <img src={teams[champId].flag} alt="" className="w-8 h-6 object-cover rounded-sm" />
                    : <span className="text-2xl">{teams[champId].flag || '🏳'}</span>
                  }
                  <div>
                    <div className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Tournament Winner</div>
                    <div className="text-sm font-black text-slate-800">{teams[champId].name}</div>
                  </div>
                  <span className="ml-auto text-xl">🏆</span>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
