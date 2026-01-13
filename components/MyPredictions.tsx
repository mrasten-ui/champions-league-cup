import React, { useState, useMemo } from 'react';
import { Match, Team, Prediction, Translation, UserProfile } from '../types';
import { MatchCard } from './MatchCard';
import { Activity, Shield, Lock, Search, Filter } from 'lucide-react';
import { TeamPulse } from './TeamPulse';

interface MyPredictionsProps {
  matches: Match[];
  teams: Record<string, Team>;
  allPredictions: Prediction[];
  currentUser: UserProfile | null;
  lang: Translation;
  onGoToGroup: (groupId: string) => void;
  onGoToBracket: () => void;
  onUnlockSecondChance?: () => void; // New prop for Pulse action
}

export const MyPredictions: React.FC<MyPredictionsProps> = ({ 
  matches, teams, allPredictions, currentUser, lang, onGoToGroup, onGoToBracket, onUnlockSecondChance 
}) => {
  // View State: 'pulse' (Dashboard) or 'vault' (My Picks List)
  const [viewMode, setViewMode] = useState<'pulse' | 'vault'>('pulse');
  const [filterTeam, setFilterTeam] = useState<string>('');

  const myPreds = useMemo(() => {
    if (!currentUser) return [];
    return allPredictions.filter(p => p.userId === currentUser.email);
  }, [allPredictions, currentUser]);

  // Handle click from Pulse -> Vault
  const handlePulseTeamClick = (teamId: string) => {
      setFilterTeam(teamId);
      setViewMode('vault');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Group Matches Logic for Vault View
  const matchesByGroup = useMemo(() => {
    const groups: Record<string, Match[]> = {};
    matches.forEach(m => {
      // Filter logic: Only show if matches filterTeam (if set)
      if (filterTeam) {
          if (m.homeTeamId !== filterTeam && m.awayTeamId !== filterTeam) return;
      }

      if (m.groupId) {
        if (!groups[m.groupId]) groups[m.groupId] = [];
        groups[m.groupId].push(m);
      } else if (m.round) {
        if (!groups['KO']) groups['KO'] = [];
        groups['KO'].push(m);
      }
    });
    return groups;
  }, [matches, filterTeam]);

  if (!currentUser) return <div className="p-8 text-center text-slate-400">{lang.loginMode}</div>;

  return (
    <div className="space-y-6">
      {/* Navigation Toggle */}
      <div className="flex bg-slate-200 p-1 rounded-xl shadow-inner">
          <button 
            onClick={() => setViewMode('pulse')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === 'pulse' ? 'bg-[#0f2545] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
              <Activity size={16} /> Pulse
          </button>
          <button 
            onClick={() => setViewMode('vault')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === 'vault' ? 'bg-[#0f2545] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
              <Shield size={16} /> The Vault
          </button>
      </div>

      {viewMode === 'pulse' ? (
          <TeamPulse 
             matches={matches}
             teams={teams}
             userPredictions={myPreds}
             lang={lang}
             onTeamClick={handlePulseTeamClick}
             onUnlockSecondChance={() => {
                 if (onUnlockSecondChance) onUnlockSecondChance();
                 else onGoToBracket(); // Fallback
             }}
             hasTakenSecondChance={currentUser.hasTakenSecondChance || false}
          />
      ) : (
          <div className="animate-in slide-in-from-right-2 space-y-4">
              {/* Filter Bar (Only visible if filtering) */}
              {filterTeam && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                          <Filter size={16} className="text-blue-500" />
                          <span className="text-xs font-bold text-blue-700">Filtering: {teams[filterTeam]?.name || filterTeam}</span>
                      </div>
                      <button onClick={() => setFilterTeam('')} className="text-[10px] font-black uppercase bg-white border border-blue-100 px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800">Clear</button>
                  </div>
              )}

              {Object.keys(matchesByGroup).length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                      <Search size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-bold">{lang.noMatches}</p>
                  </div>
              ) : (
                  Object.keys(matchesByGroup).sort().map(gid => (
                      <div key={gid} className="space-y-3">
                          <div className="flex items-center gap-2">
                              <div className="h-4 w-1 bg-blue-500 rounded-full"></div>
                              <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">
                                  {gid === 'KO' ? lang.knockout : `${lang.groups} ${gid}`}
                              </h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {matchesByGroup[gid].map(m => (
                                  <MatchCard 
                                      key={m.id}
                                      match={m}
                                      homeTeam={teams[m.homeTeamId]}
                                      awayTeam={teams[m.awayTeamId]}
                                      onUpdate={() => {}} // Read-only in Vault unless we add substitution logic later
                                      lang={lang}
                                      locale="en-GB"
                                      userTokens={currentUser.tokens}
                                      rivals={[]}
                                      onSpy={() => {}}
                                      revealedRivals={[]}
                                      currentUser={currentUser}
                                      allPredictions={allPredictions}
                                      phase="LIVE" // Force live look
                                      isAdminMode={false}
                                      // Substitutions logic enabled here for "Tactical Changes"
                                      onSubstitute={() => {
                                          // This would need a prop passed down to trigger the sub modal
                                          console.log("Sub triggered from Vault for", m.id);
                                      }}
                                      substitutionsLeft={currentUser.substitutions}
                                      isUnlockedBySub={currentUser.unlockedMatches?.includes(m.id) || false}
                                  />
                              ))}
                          </div>
                      </div>
                  ))
              )}
          </div>
      )}
    </div>
  );
};