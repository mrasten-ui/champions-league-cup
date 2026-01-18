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
  onSpy: (matchId: string) => void;
  revealedRivals: string[]; 
  activeRound: Round; // Now received as prop
}

export const KnockoutBracket: React.FC<KnockoutBracketProps> = ({ 
  matches, teams, onUpdate, lang, user, onSecondChance, rivals, allPredictions, phase, 
  isGroupStageComplete, firstIncompleteGroup, onGoToGroup, onTeamClick,
  onSpy, revealedRivals, activeRound 
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');

  const matchesToDisplay = useMemo(() => {
      if (viewMode === 'tree') return matches; 
      return matches
        .filter(m => m.round === activeRound)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [matches, activeRound, viewMode]);

  const userPredictions = useMemo(() => {
      if (!user) return [];
      return allPredictions.filter(p => p.userId === user.email);
  }, [allPredictions, user]);

  const finalMatch = matches.find(m => m.round === 'FIN');
  const finalPrediction = finalMatch ? userPredictions.find(p => p.matchId === finalMatch.id) : null;
  let finalWinnerTeam: Team | null = null;
  if (finalPrediction && finalMatch) {
      if (finalPrediction.home > finalPrediction.away) finalWinnerTeam = teams[finalMatch.homeTeamId];
      else if (finalPrediction.away > finalPrediction.home) finalWinnerTeam = teams[finalMatch.awayTeamId];
  }

  const isLocked = !isGroupStageComplete && !user?.hasTakenSecondChance;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-20">
        
        {/* VIEW TOGGLE & INFO (Header is now in AppHeader.tsx) */}
        <div className="flex justify-end">
            <div className="flex p-1 bg-white rounded-lg border border-slate-200 shadow-sm">
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                    title="List View"
                >
                    <List size={16} />
                </button>
                <div className="w-px bg-slate-100 my-1 mx-1"></div>
                <button 
                    onClick={() => setViewMode('tree')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'tree' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Tree View"
                >
                    <GitGraph size={16} />
                </button>
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
                <>
                    {/* SPECIAL VIEW: GRAND FINAL */}
                    {activeRound === 'FIN' && finalMatch ? (
                        <div className="relative pt-8 pb-12 animate-in fade-in zoom-in duration-500">
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
                                            onSpy={(id) => onSpy(id)}
                                            revealedRivals={revealedRivals}
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
                    ) : (
                        /* STANDARD GRID VIEW (R32, R16, QF, SF) */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {matchesToDisplay.map(match => (
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
                                    onSpy={(id) => onSpy(id)}
                                    revealedRivals={revealedRivals}
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
                            {matchesToDisplay.length === 0 && (
                                <div className="col-span-full text-center py-12 text-slate-400 flex flex-col items-center gap-2">
                                    <Trophy size={48} className="opacity-20" />
                                    <p className="font-bold uppercase tracking-widest text-xs">No matches in this round yet</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
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