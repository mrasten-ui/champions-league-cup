import React, { useMemo } from 'react';
import { Match, Team, Prediction, UserProfile, Translation } from '../types';
import { MatchCard } from './MatchCard';
import { Trophy, AlertCircle, ArrowRight } from 'lucide-react';

interface MyPredictionsProps {
  matches: Match[];
  teams: Record<string, Team>;
  allPredictions: Prediction[];
  currentUser: UserProfile;
  lang: Translation;
  onGoToGroup: (groupId: string) => void;
  onGoToBracket: () => void;
  onUnlockSecondChance: () => void;
  onSubstitute: (matchId: string) => void;
  onUpdate: (matchId: string, h: number, a: number) => void;
}

export const MyPredictions: React.FC<MyPredictionsProps> = ({
  matches,
  teams,
  allPredictions,
  currentUser,
  lang,
  onGoToGroup,
  onGoToBracket,
  onUnlockSecondChance,
  onSubstitute,
  onUpdate
}) => {
  // Sort: Live/Upcoming first, then by date
  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
        const statusOrder = { 'LIVE': 0, '1H': 0, 'HT': 0, '2H': 0, 'ET': 0, 'PEN': 0, 'UPCOMING': 1, 'FT': 2, 'FINISHED': 2 };
        const statA = statusOrder[a.status as keyof typeof statusOrder] ?? 1;
        const statB = statusOrder[b.status as keyof typeof statusOrder] ?? 1;
        
        if (statA !== statB) return statA - statB;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [matches]);

  return (
    <div className="pb-24 animate-fade-in">
        {/* Header Stats */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={120} /></div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Trophy size={24} className="text-yellow-300" /></div>
                    <div>
                        <h2 className="text-xl font-black italic tracking-tighter uppercase">{lang.myPredictions}</h2>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">{lang.managerMode}</div>
                    </div>
                </div>
                <div className="flex gap-4 mt-4">
                    <div className="bg-black/20 rounded-lg px-4 py-2 backdrop-blur-sm border border-white/10">
                        <div className="text-2xl font-black">{currentUser.substitutions}</div>
                        <div className="text-[9px] font-bold uppercase tracking-wider opacity-70">{lang.substitutions}</div>
                    </div>
                    <div className="bg-black/20 rounded-lg px-4 py-2 backdrop-blur-sm border border-white/10">
                        <div className="text-2xl font-black">{currentUser.tokens}</div>
                        <div className="text-[9px] font-bold uppercase tracking-wider opacity-70">{lang.tokens}</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Warning if 2nd Chance not taken */}
        {!currentUser.hasTakenSecondChance && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                <div>
                    <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide mb-1">Second Chance Available</h3>
                    <p className="text-xs text-amber-700 mb-3 leading-relaxed">Bracket busted? Unlock your Second Chance to re-predict the knockout stages for 50% points.</p>
                    <button onClick={onUnlockSecondChance} className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-2">
                        Unlock Now <ArrowRight size={12} />
                    </button>
                </div>
            </div>
        )}

        {/* Match List */}
        <div className="space-y-4">
            {sortedMatches.map(match => {
                const home = teams[match.homeTeamId];
                const away = teams[match.awayTeamId];
                
                if (!home || !away) return null;

                return (
                    <div key={match.id} className="relative">
                        <MatchCard
                            match={match}
                            homeTeam={home}
                            awayTeam={away}
                            onUpdate={onUpdate}
                            lang={lang}
                            locale="en-GB"
                            userTokens={currentUser.tokens}
                            rivals={[]}
                            onSpy={() => {}}
                            revealedRivals={[]}
                            currentUser={currentUser}
                            allPredictions={allPredictions}
                            phase="LIVE"
                            isAdminMode={false}
                            onSubstitute={() => onSubstitute(match.id)}
                            substitutionsLeft={currentUser.substitutions}
                            isUnlockedBySub={currentUser.unlockedMatches?.includes(match.id)}
                            
                            // ENABLE BADGE FOR MANAGER TAB
                            showStatusBadge={true} 
                        />
                    </div>
                );
            })}
        </div>
    </div>
  );
};