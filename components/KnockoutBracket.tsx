import React, { useState, useMemo } from 'react';
import { Match, Team, Translation, UserProfile, Prediction, TournamentPhase, Round } from '../types';
import { MatchCard } from './MatchCard';
import { KnockoutTreeView } from './KnockoutTreeView';
import { List, GitGraph, AlertTriangle, ArrowRight, ShieldCheck, Lock } from 'lucide-react';

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

  const rounds: Round[] = ['R32', 'R16', 'QF', 'SF', 'FIN'];
  
  const roundMatches = useMemo(() => {
      if (viewMode === 'tree') return matches; // Tree needs all matches
      return matches.filter(m => m.round === activeRound).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [matches, activeRound, viewMode]);

  const userPredictions = useMemo(() => {
      if (!user) return [];
      return allPredictions.filter(p => p.userId === user.email);
  }, [allPredictions, user]);

  // Unlock check
  const isLocked = !isGroupStageComplete && !user?.hasTakenSecondChance;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
        
        {/* Header / Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-[#0f2545] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <List size={16} /> List
                </button>
                <button 
                    onClick={() => setViewMode('tree')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'tree' ? 'bg-[#0f2545] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <GitGraph size={16} /> Tree
                </button>
            </div>

            {viewMode === 'list' && (
                <div className="flex overflow-x-auto no-scrollbar gap-2 w-full sm:w-auto pb-2 sm:pb-0">
                    {rounds.map(r => (
                        <button
                            key={r}
                            onClick={() => setActiveRound(r)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeRound === r ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                            {r === 'FIN' ? 'Final' : r}
                        </button>
                    ))}
                </div>
            )}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roundMatches.map(match => (
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
                            onSubstitute={() => {}} // Handled in Vault
                            substitutionsLeft={0}
                            isUnlockedBySub={false}
                            onTeamClick={onTeamClick}
                        />
                    ))}
                    {roundMatches.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-400">
                            <p className="font-bold">No matches scheduled for this round yet.</p>
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