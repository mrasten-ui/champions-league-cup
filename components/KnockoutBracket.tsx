import React, { useState, useMemo } from 'react';
import { Match, Team, Translation, UserProfile, Prediction, TournamentPhase, Round } from '../types';
import { MatchCard } from './MatchCard';
import { KnockoutTreeView } from './KnockoutTreeView';
import { List, GitGraph, Lock, ArrowRight, Trophy, Sparkles, Crown } from 'lucide-react';

interface KnockoutBracketProps {
  matches: Match[];
  teams: Record<string, Team>;
  onUpdate: (id: string, h: number, a: number) => void;
  lang: Translation;
  user: UserProfile | null;
  onSecondChance: () => void;
  rivals: UserProfile[];
  allPredictions: Prediction[];
  phase: TournamentPhase;
  isGroupStageComplete: boolean;
  firstIncompleteGroup: string | null;
  onGoToGroup: (groupId: string) => void;
  onTeamClick?: (teamId: string) => void;
}

export const KnockoutBracket: React.FC<KnockoutBracketProps> = ({ 
  matches, teams, onUpdate, lang, user, onSecondChance, rivals, allPredictions, phase, 
  isGroupStageComplete, firstIncompleteGroup, onGoToGroup, onTeamClick 
}) => {
  // 1. DEFAULT TO LIST VIEW
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [activeRound, setActiveRound] = useState<Round>('R32');

  // Removed 'FIN' from tabs as it has its own dedicated section
  const rounds: Round[] = ['R32', 'R16', 'QF', 'SF'];
  
  const finalMatch = useMemo(() => matches.find(m => m.round === 'FIN'), [matches]);

  const gridMatches = useMemo(() => {
      if (viewMode === 'tree') return matches; 
      // Filter out Final from the grid
      return matches
        .filter(m => m.round === activeRound && m.round !== 'FIN')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [matches, activeRound, viewMode]);

  const userPredictions = useMemo(() => {
      if (!user) return [];
      return allPredictions.filter(p => p.userId === user.email);
  }, [allPredictions, user]);

  // Determine Final Winner Prediction for Celebration
  const finalPrediction = finalMatch ? userPredictions.find(p => p.matchId === finalMatch.id) : null;
  let finalWinnerTeam: Team | null = null;
  if (finalPrediction && finalMatch) {
      if (finalPrediction.home > finalPrediction.away) finalWinnerTeam = teams[finalMatch.homeTeamId];
      else if (finalPrediction.away > finalPrediction.home) finalWinnerTeam = teams[finalMatch.awayTeamId];
  }

  // Unlock check
  const isLocked = !isGroupStageComplete && !user?.hasTakenSecondChance;

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-in pb-20">
        
        {/* NEW DARK HEADER (Aligned with TournamentSchedule) */}
        <div className="bg-[#0f172a] rounded-2xl border border-white/10 shadow-lg p-2 sticky top-4 z-30">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                
                {/* View Toggle */}
                <div className="flex bg-[#1e293b] p-1 rounded-lg w-full sm:w-auto">
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-[#3b82f6] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <List size={14} /> List
                    </button>
                    <button 
                        onClick={() => setViewMode('tree')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'tree' ? 'bg-[#3b82f6] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <GitGraph size={14} /> Tree
                    </button>
                </div>

                {/* Round Selectors (Only in List Mode) */}
                {viewMode === 'list' && (
                    <div className="flex overflow-x-auto no-scrollbar gap-2 w-full sm:w-auto pb-1 sm:pb-0 snap-x justify-start sm:justify-end">
                        {rounds.map(r => (
                            <button
                                key={r}
                                onClick={() => setActiveRound(r)}
                                className={`flex-shrink-0 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all snap-center whitespace-nowrap border ${
                                    activeRound === r 
                                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/20' 
                                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                                }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* Locked State Warning */}
        {isLocked && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
                <div className="bg-amber-100 p-3 rounded-full text-amber-600"><Lock size={32} /></div>
                <h3 className="text-lg font-black text-amber-900 uppercase">Bracket Locked</h3>
                <p className="text-sm text-amber-700 max-w-md">
                    You must complete your Group Stage predictions before unlocking the Knockout Bracket.
                </p>
                <button 
                    onClick={() => firstIncompleteGroup && onGoToGroup(firstIncompleteGroup)}
                    className="mt-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg flex items-center gap-2 transition-all"
                >
                    Complete Group {firstIncompleteGroup || 'Stage'} <ArrowRight size={16} />
                </button>
            </div>
        )}

        {/* Content View */}
        <div className={isLocked ? 'opacity-50 pointer-events-none filter blur-sm select-none' : ''}>
            {viewMode === 'list' ? (
                <div className="space-y-12">
                    {/* STANDARD GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {gridMatches.map(match => (
                            <MatchCard 
                                key={match.id}
                                match={match}
                                homeTeam={teams[match.homeTeamId]}
                                awayTeam={teams[match.awayTeamId]}
                                onUpdate={onUpdate}
                                lang={lang}
                                locale="en-GB"
                                userTokens={user?.tokens || 0}
                                rivals={rivals}
                                onSpy={() => {}}
                                revealedRivals={[]}
                                currentUser={user}
                                allPredictions={allPredictions}
                                phase={phase}
                                isAdminMode={false}
                                onSubstitute={() => {}}
                                substitutionsLeft={0}
                                isUnlockedBySub={false}
                                onTeamClick={onTeamClick}
                            />
                        ))}
                        {gridMatches.length === 0 && (
                            <div className="col-span-full text-center py-12 text-slate-400 flex flex-col items-center gap-2">
                                <Trophy size={48} className="opacity-20" />
                                <p className="font-bold uppercase tracking-widest text-xs">No matches in this round yet</p>
                            </div>
                        )}
                    </div>

                    {/* THE GRAND FINAL STAGE */}
                    {finalMatch && (
                        <div className="relative pt-8 pb-12">
                            {/* Decorative Separator */}
                            <div className="flex items-center justify-center gap-4 mb-8 opacity-80">
                                <div className="h-px w-24 bg-gradient-to-r from-transparent to-amber-400"></div>
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-2 text-amber-500 mb-1">
                                        <Sparkles size={16} />
                                        <Trophy size={24} />
                                        <Sparkles size={16} />
                                    </div>
                                    <span className="text-xl font-black uppercase tracking-[0.3em] text-slate-800">The Final</span>
                                </div>
                                <div className="h-px w-24 bg-gradient-to-l from-transparent to-amber-400"></div>
                            </div>

                            {/* Centered Stage */}
                            <div className="flex flex-col items-center justify-center relative z-10">
                                {/* Glow Effect */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-64 bg-amber-500/10 blur-3xl rounded-full pointer-events-none"></div>
                                
                                <div className="w-full max-w-md transform transition-all duration-500 hover:scale-[1.02] relative">
                                    {/* Winner Celebration Banner */}
                                    {finalWinnerTeam && (
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-6 py-2 rounded-full shadow-lg z-20 flex items-center gap-2 border-2 border-white animate-in slide-in-from-bottom-2 zoom-in fade-in duration-700">
                                            <Crown size={18} fill="currentColor" className="text-yellow-100" />
                                            <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">
                                                Champion: {finalWinnerTeam.name}
                                            </span>
                                        </div>
                                    )}

                                    <div className="shadow-2xl shadow-amber-900/10 rounded-2xl">
                                        <MatchCard 
                                            match={finalMatch}
                                            homeTeam={teams[finalMatch.homeTeamId]}
                                            awayTeam={teams[finalMatch.awayTeamId]}
                                            onUpdate={onUpdate}
                                            lang={lang}
                                            locale="en-GB"
                                            userTokens={user?.tokens || 0}
                                            rivals={rivals}
                                            onSpy={() => {}}
                                            revealedRivals={[]}
                                            currentUser={user}
                                            allPredictions={allPredictions}
                                            phase={phase}
                                            isAdminMode={false}
                                            onSubstitute={() => {}}
                                            substitutionsLeft={0}
                                            isUnlockedBySub={false}
                                            onTeamClick={onTeamClick}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <KnockoutTreeView 
                    matches={matches} 
                    teams={teams} 
                    userPredictions={userPredictions} 
                    onUpdate={onUpdate}
                    lang={lang}
                />
            )}
        </div>
    </div>
  );
};