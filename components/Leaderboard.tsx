
import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, Match, Prediction, Translation, Team, LanguageCode } from '../types';
import { AIAnalystWidget } from './analysis/AIAnalystWidget';
import { calculatePoints, calculatePenaltyBonus, resolvePenaltySide, getManagerStats } from '../services/engine';
import { Activity, Trophy, Flame, Target, TrendingUp, TrendingDown, Minus, ChevronUp, ChevronRight, PieChart, Users, Medal, X, Calendar, Crown, MapPin, AlertTriangle, ShieldCheck } from 'lucide-react';
import { AvatarDisplay } from './AvatarDisplay';
import { LEAGUES } from '../constants';

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
        <div className="bg-blue-950/40 backdrop-blur-md rounded-xl border border-white/10 p-3 shadow-sm flex flex-col gap-2 relative overflow-visible mt-2 group">
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
                    <span className="text-xs font-bold truncate text-slate-300">
                        {home?.id}
                    </span>
                </div>

                {/* Score */}
                <div className="flex flex-col items-center px-4">
                    <div className="flex items-center gap-1 text-sm font-black text-white bg-white/10 px-2 py-1 rounded border border-white/10">
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
                    <span className="text-xs font-bold truncate text-slate-300">
                        {away?.id}
                    </span>
                    <img src={away?.flag} className="w-6 h-4 rounded shadow-sm object-cover" alt="" />
                </div>
            </div>
        </div>
    );
};


interface PredictionPillProps { match: Match; pred: Prediction; pts: number; teams: Record<string, Team> }

const MatchPredictionPill: React.FC<PredictionPillProps> = ({ match, pred, pts, teams }) => {
    const home = teams[match.homeTeamId];
    const away = teams[match.awayTeamId];
    const renderFlag = (f?: string) => f?.startsWith('http')
        ? <img src={f} alt="" className="w-3.5 h-2.5 object-cover rounded-[2px] shrink-0" />
        : <span className="shrink-0 text-[10px]">{f || '🏳'}</span>;

    return (
        <div className="inline-flex items-center gap-1 bg-white/10 rounded-full pl-2 pr-1.5 py-1 text-[10px] font-bold text-slate-300 whitespace-nowrap">
            {renderFlag(home?.flag)}
            <span className="font-black text-white">{match.homeScore}-{match.awayScore}</span>
            <span className="text-slate-400 font-medium">({pred.home}-{pred.away})</span>
            {renderFlag(away?.flag)}
            <span className={`ml-0.5 w-4 h-4 rounded-full flex items-center justify-center font-black text-[8px] ${pts > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-400'}`}>
                {pts}
            </span>
        </div>
    );
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ users, matches, allPredictions, lang, currentUserEmail, currentUserLeagues = [], teams, onTeamClick, preloadedAnalysis, onRefreshBrief, briefRefreshing, currentLang }) => {
  const [showLive, setShowLive] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [activeLeague, setActiveLeague] = useState<string>(currentUserLeagues?.[0] ?? '');

  // Stats Modal State
  const [modalData, setModalData] = useState<{ user: UserProfile, type: 'EXACT' | 'RESULT' | 'KNOCKOUT', matches: {m: Match, p: Prediction, pts: number}[] } | null>(null);
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

    matches.forEach(match => {
      const pred = allPredictions.find(p => p.userId === user.email && p.matchId === match.id);

      if (pred && match.homeScore !== null && match.awayScore !== null) {
        let pts = calculatePoints(pred.home, pred.away, match.homeScore, match.awayScore, match.round, resolvePenaltySide(pred.predictedWinnerId, match), resolvePenaltySide(match.penaltyWinnerId, match));
        if (match.round) pts += calculatePenaltyBonus(pred.home === pred.away, !!match.penaltyWinnerId);

        totalPoints += pts;

        const isFinal = ['FINISHED', 'FT', 'AET', 'PEN'].includes(match.status);
        if (isFinal) {
          bankedPoints += pts;
        }

        if (!match.round) {
            groupPoints += pts;
            const isExact = pred.home === match.homeScore && pred.away === match.awayScore;
            if (isExact) {
                exactCount++;
            } else if (pts > 0) {
                resultCount++;
            }
        } else {
            knockoutPoints += pts;
            if (pts > 0) advancedCount++;
        }
      }
    });

    // Scouting costs a point per match spied on, permanently — no more token
    // limit, just a real cost (see MatchRow's spy confirm / App.tsx handleSpy).
    const scoutPenalty = user.spiedMatches?.length ?? 0;
    totalPoints  -= scoutPenalty;
    bankedPoints -= scoutPenalty;

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

  // Last 3 finished predictions for the currently expanded user. (Upcoming
  // predictions used to show here too, but that leaked a rival's exact pick
  // for free on matches that hadn't even locked yet — removed; use Scout for
  // that, or the round history browser once a round actually locks.)
  const expandedUserDetail = useMemo(() => {
      if (!expandedUser) return null;
      const userPreds = allPredictions.filter(p => p.userId === expandedUser);
      const finishedStatuses = ['FT', 'FINISHED', 'AET', 'PEN'];

      const last3 = matches
          .filter(m => !m.round && finishedStatuses.includes(m.status) && userPreds.some(p => p.matchId === m.id))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 3)
          .map(m => {
              const pred = userPreds.find(p => p.matchId === m.id)!;
              const pts = calculatePoints(pred.home, pred.away, m.homeScore!, m.awayScore!, m.round);
              return { match: m, pred, pts };
          });

      return { last3 };
  }, [expandedUser, allPredictions, matches]);

  const finishedStatuses = ['FT', 'FINISHED', 'AET', 'PEN'];
  const allGroupsDone = matches
      .filter(m => !m.round)
      .every(m => finishedStatuses.includes(m.status));

  const getLeagueName = (slug: string) =>
    slug === 'global'
      ? (lang.lbGlobal || 'Global League')
      : (LEAGUES[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1));

  const openStatsModal = (user: UserProfile, type: 'EXACT' | 'RESULT' | 'KNOCKOUT') => {
      const relevantMatches: {m: Match, p: Prediction, pts: number}[] = [];

      matches.forEach(match => {
          const pred = allPredictions.find(p => p.userId === user.email && p.matchId === match.id);
          if (pred && match.homeScore !== null && match.awayScore !== null) {
              let pts = calculatePoints(pred.home, pred.away, match.homeScore, match.awayScore, match.round, resolvePenaltySide(pred.predictedWinnerId, match), resolvePenaltySide(match.penaltyWinnerId, match));
              if (match.round) pts += calculatePenaltyBonus(pred.home === pred.away, !!match.penaltyWinnerId);
              const isExact = pred.home === match.homeScore && pred.away === match.awayScore;

              let isMatch = false;
              if (type === 'EXACT') {
                  isMatch = !match.round && isExact;
              } else if (type === 'RESULT') {
                  isMatch = !match.round && !isExact && pts > 0;
              } else if (type === 'KNOCKOUT') {
                  isMatch = !!match.round && pts !== 0;
              }

              if (isMatch) {
                  relevantMatches.push({ m: match, p: pred, pts });
              }
          }
      });
      relevantMatches.sort((a, b) => new Date(b.m.date).getTime() - new Date(a.m.date).getTime());

      setModalData({ user, type, matches: relevantMatches });
  };

  const displayList = finalDisplayData;

  return (
    <div className="space-y-3 animate-fade-in pb-20 relative">
      
      {/* BATTLE STRIP + BRIEF */}
      {(() => {
          const myEntry = displayList.find(u => u.email === currentUserEmail);
          if (!myEntry) return null;
          const leader = displayList[0];
          const myIdx = displayList.findIndex(u => u.email === currentUserEmail);
          const above = myIdx > 0 ? displayList[myIdx - 1] : null;
          const gapToLeader = leader ? leader.totalPoints - myEntry.totalPoints : 0;
          const gapAbove = above ? above.totalPoints - myEntry.totalPoints : 0;
          const isLeader = myIdx === 0;

          return (
              <div id="tour-leaderboard-top" className="rounded-2xl bg-gradient-to-br from-[#1e1b4b] to-[#0f2545] border border-white/10 shadow-lg overflow-hidden">
                  {/* Personal brief */}
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
                      </div>
                  )}
              </div>
          );
      })()}

      {/* THE LIST */}
      <div id="tour-leaderboard-table" className="bg-blue-950/40 backdrop-blur-md rounded-3xl shadow-sm border border-white/15 overflow-hidden">
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
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="w-[15%] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">#</th>
                <th className={`${allGroupsDone ? 'w-[70%]' : 'w-[50%]'} px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400`}>{lang.manager}</th>
                {!allGroupsDone && <th className="w-[20%] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hidden sm:table-cell text-center">Form</th>}
                <th className="w-[15%] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayList.map((user) => {
                const points = showLive ? user.totalPoints : user.bankedPoints;
                const isMe = user.email === currentUserEmail;
                const isExpanded = expandedUser === user.email;
                const rank = user.liveRank;
                
                let MoveIcon = Minus;
                let moveColor = "text-slate-500";
                
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
                        className={`transition-all cursor-pointer group ${isMe ? 'bg-blue-500/10' : 'hover:bg-white/5'} ${isExpanded ? 'bg-white/5 shadow-inner' : ''}`}
                      >
                        <td className="w-[15%] px-4 py-4 text-center align-middle relative">
                            {/* FIX: Blue indicator bar is inside this relative TD, preventing layout shift */}
                            {isMe && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                            
                            <div className="flex flex-col items-center justify-center gap-1">
                                {RankIcon ? (
                                    <div className="transform scale-110">{RankIcon}</div>
                                ) : (
                                    <span className="text-sm font-black text-slate-400">#{rank}</span>
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
                                    <div className={`flex items-center gap-1.5 truncate transition-all ${isExpanded ? 'text-lg font-black text-white' : 'text-sm font-bold text-slate-200'}`}>
                                        {user.name}
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
                            <div className="text-xl font-black text-white tracking-tight">{points}</div>
                        </td>
                      </tr>

                      {/* EXPANDED DETAILS */}
                      {isExpanded && (
                          <tr id={isMe ? 'tour-my-row-expanded' : undefined} className="bg-white/5">
                              <td colSpan={4} className="px-4 pb-6 pt-2">
                              <div className="animate-in fade-in slide-in-from-top-1 duration-200">

                                  {/* Avatar + Last 3 / Next 3 — hidden once all group games are done */}
                                  {!allGroupsDone && (
                                  <div className="flex flex-wrap items-start gap-3 mb-4 pb-3 border-b border-white/10">
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
                                                          <MatchPredictionPill key={m.id} match={m} pred={pred} pts={pts} teams={teams} />
                                                      ))
                                                  ) : (
                                                      <span className="text-[10px] text-slate-400 italic">No finished predictions yet</span>
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
                                      <div className="bg-indigo-500/10 py-3 px-2 rounded-xl border border-indigo-500/30 flex flex-col items-center shadow-sm">
                                          <span className="text-2xl font-black text-indigo-600 leading-none">{user.groupPoints}</span>
                                          <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-wide leading-tight text-center mt-1">{lang.lbGroupPts}</span>
                                      </div>
                                      <div className="bg-purple-50 py-3 px-2 rounded-xl border border-purple-200 flex flex-col items-center relative overflow-hidden group/kopt cursor-pointer hover:bg-purple-100 transition-colors shadow-sm" onClick={() => openStatsModal(user, 'KNOCKOUT')}>
                                          <span className="text-2xl font-black text-purple-600 leading-none relative z-10">{user.knockoutPoints}</span>
                                          <span className="text-[9px] font-bold text-purple-700 uppercase tracking-wide leading-tight text-center mt-1 relative z-10">{lang.lbKoPts}</span>
                                          <Trophy size={32} className="absolute -bottom-1 -right-1 text-purple-200 opacity-50 rotate-12 group-hover/kopt:scale-110 transition-transform" />
                                      </div>
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
              <div className="relative w-full max-w-md bg-blue-950 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95">
                  <div className="bg-cyan-600 p-4 text-white flex justify-between items-center shrink-0">
                      <div>
                          <h3 className="font-black uppercase tracking-tight text-lg">{modalData.user.name}</h3>
                          <p className="text-xs text-cyan-100 font-medium uppercase tracking-widest">
                              {modalData.type === 'EXACT' ? 'Perfect Scores' : modalData.type === 'RESULT' ? 'Correct Outcomes' : 'Knockout Points'}
                          </p>
                      </div>
                      <button onClick={() => setModalData(null)} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"><X size={18} /></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {modalData.matches.length > 0 ? (
                          modalData.matches.map((item, idx) => {
                              const isExact = item.p.home === item.m.homeScore && item.p.away === item.m.awayScore;
                              const rowType = modalData.type === 'EXACT' ? 'EXACT' : modalData.type === 'RESULT' ? 'RESULT' : (isExact ? 'EXACT' : 'RESULT');
                              return (
                                  <DetailMatchRow
                                      key={idx}
                                      match={item.m}
                                      prediction={item.p}
                                      points={item.pts}
                                      type={rowType}
                                      teams={teams}
                                      onTeamClick={onTeamClick}
                                  />
                              );
                          })
                      ) : (
                          <div className="py-10 text-center text-slate-400 text-sm italic">No matches found in this category.</div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* LEADERBOARD PROFILE MODAL */}
      {lbProfileModal && (() => {
        const u = lbProfileModal;
        const totalUsers = finalDisplayData.length;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setLbProfileModal(null)}>
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
            <div className="relative bg-blue-950 rounded-3xl shadow-2xl p-6 flex flex-col items-center gap-4 w-80 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <button onClick={() => setLbProfileModal(null)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>

              <AvatarDisplay avatar={u.avatar} size="5xl" className="ring-4 ring-white shadow-xl" />
              <div className="text-center -mt-1">
                <div className="text-xl font-black text-white">{u.name}</div>
                <div className="text-sm text-slate-500 mt-0.5">#{u.liveRank} of {totalUsers} · {u.totalPoints} pts</div>
                {u.rankDiff !== 0 && (
                  <div className={`text-xs font-bold mt-1 ${u.rankDiff > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {u.rankDiff > 0 ? `↑${u.rankDiff}` : `↓${Math.abs(u.rankDiff)}`} places
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
