import React, { useState, useMemo } from 'react';
import { Match, Team, Prediction, UserProfile, Translation } from '../types';
import { MatchCard } from './MatchCard';
import { Lock, Save, X, AlertTriangle, Briefcase, ChevronRight, RefreshCw } from 'lucide-react';
import { calculatePoints } from '../services/engine';

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
  onUpdate: (matchId: string, home: number, away: number) => void;
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
  onSubstitute, // This is the REAL commit function from App.tsx
  onUpdate
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'LOCKED' | 'OPEN'>('ALL');
  
  // --- THE VAULT LOGIC (Pending Changes) ---
  const [pendingSubstitutions, setPendingSubstitutions] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Helper to check if a match is truly locked or temporarily unlocked by us
  const isMatchUnlocked = (matchId: string) => {
      return (currentUser.unlockedMatches || []).includes(matchId) || pendingSubstitutions.has(matchId);
  };

  // 1. Queue the Sub (Don't spend token yet)
  const handleQueueSub = (matchId: string) => {
      const newPending = new Set(pendingSubstitutions);
      if (newPending.has(matchId)) {
          newPending.delete(matchId); // Toggle off
      } else {
          // Check limits logic
          const currentUsed = (currentUser.unlockedMatches || []).length;
          const pendingCount = newPending.size;
          const totalAllowed = 5; // Hardcoded max subs
          // Or strictly use user.substitutions (remaining)
          if (currentUser.substitutions - pendingCount > 0) {
              newPending.add(matchId);
          } else {
              alert("No substitutions left!");
              return;
          }
      }
      setPendingSubstitutions(newPending);
  };

  // 2. Commit Changes
  const handleSaveChanges = async () => {
      setIsSaving(true);
      // Execute all pending subs sequentially
      for (const matchId of Array.from(pendingSubstitutions)) {
          await onSubstitute(matchId);
      }
      setPendingSubstitutions(new Set()); // Clear queue
      setIsSaving(false);
  };

  // 3. Cancel Changes
  const handleCancelChanges = () => {
      if (window.confirm("Discard unsaved changes?")) {
          setPendingSubstitutions(new Set());
      }
  };

  const sortedMatches = useMemo(() => {
    // We only care about matches the user has predicted OR matches that are locked
    // But typically "My Predictions" shows everything relevant.
    return matches.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [matches]);

  const filteredMatches = useMemo(() => {
      if (activeFilter === 'ALL') return sortedMatches;
      return sortedMatches.filter(m => {
          const isLocked = (['LIVE', 'FT', 'FINISHED'].includes(m.status) || m.isLocked);
          const isUnlocked = isMatchUnlocked(m.id);
          
          if (activeFilter === 'LOCKED') return isLocked && !isUnlocked;
          if (activeFilter === 'OPEN') return !isLocked || isUnlocked;
          return true;
      });
  }, [sortedMatches, activeFilter, pendingSubstitutions, currentUser.unlockedMatches]);

  // Calculate Stats
  const totalPoints = useMemo(() => {
      return matches.reduce((acc, m) => {
          const pred = allPredictions.find(p => p.userId === currentUser.email && p.matchId === m.id);
          if (pred && m.homeScore !== null && m.awayScore !== null) {
              return acc + calculatePoints(pred.home, pred.away, m.homeScore, m.awayScore, currentUser.hasTakenSecondChance, m.round);
          }
          return acc;
      }, 0);
  }, [matches, allPredictions, currentUser]);

  const pendingCount = pendingSubstitutions.size;
  const remainingSubsDisplay = currentUser.substitutions - pendingCount;

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      {/* HEADER: MANAGER PROFILE */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5"><Briefcase size={120} /></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-white/20 shadow-xl overflow-hidden bg-slate-700">
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-xs font-black px-2 py-1 rounded-lg border border-white shadow-sm">
                      Lvl 1
                  </div>
              </div>
              
              <div className="text-center md:text-left flex-1">
                  <h2 className="text-2xl font-black uppercase tracking-tight">{currentUser.name}</h2>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                      <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold flex items-center gap-2">
                          <Briefcase size={14} className="text-yellow-400" />
                          {lang.manager}
                      </span>
                      <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold flex items-center gap-2">
                          <RefreshCw size={14} className={remainingSubsDisplay > 0 ? "text-green-400" : "text-red-400"} />
                          {remainingSubsDisplay} Subs Left
                      </span>
                  </div>
              </div>

              <div className="flex flex-col items-center bg-white/10 p-4 rounded-xl border border-white/5 min-w-[100px]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Total Pts</span>
                  <span className="text-3xl font-black text-white">{totalPoints}</span>
              </div>
          </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          {(['ALL', 'LOCKED', 'OPEN'] as const).map(f => (
              <button 
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeFilter === f ? 'bg-slate-900 text-white shadow' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                  {f === 'ALL' ? lang.allBtn : f === 'LOCKED' ? 'Vault' : 'Active'}
              </button>
          ))}
      </div>

      {/* MATCH LIST */}
      <div className="space-y-4">
          {filteredMatches.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                  <Briefcase size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-bold">No matches found in this view.</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMatches.map(match => (
                      <MatchCard 
                          key={match.id}
                          match={match}
                          homeTeam={teams[match.homeTeamId]}
                          awayTeam={teams[match.awayTeamId]}
                          onUpdate={onUpdate} // Updates score immediately (optimistic)
                          lang={lang}
                          locale={'en-GB'}
                          userTokens={currentUser.tokens}
                          rivals={[]} // Hide rivals in manager view to reduce noise
                          onSpy={() => {}}
                          revealedRivals={[]}
                          currentUser={currentUser}
                          allPredictions={allPredictions}
                          phase={'LIVE'} // Force live logic to enable locking mechanics
                          isAdminMode={false}
                          
                          // THE VAULT LOGIC:
                          // We hijack the onSubstitute to add to our local pending queue instead of committing
                          onSubstitute={() => handleQueueSub(match.id)}
                          
                          // Visual State:
                          substitutionsLeft={remainingSubsDisplay}
                          isUnlockedBySub={isMatchUnlocked(match.id)} // Show as unlocked if in pending queue
                      />
                  ))}
              </div>
          )}
      </div>

      {/* SAVE BAR (THE VAULT ACTION) */}
      {pendingCount > 0 && (
          <div className="fixed bottom-6 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[600px] bg-slate-900 text-white p-4 rounded-2xl shadow-2xl z-50 flex items-center justify-between border-2 border-yellow-500 animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-slate-900">
                      <Save size={20} strokeWidth={3} />
                  </div>
                  <div>
                      <div className="text-sm font-black uppercase tracking-wide text-yellow-400">Unsaved Changes</div>
                      <div className="text-[10px] font-medium text-slate-300">
                          Committing {pendingCount} substitution{pendingCount > 1 ? 's' : ''}. This cannot be undone.
                      </div>
                  </div>
              </div>
              <div className="flex gap-2">
                  <button 
                    onClick={handleCancelChanges}
                    disabled={isSaving}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                  >
                      <X size={18} />
                  </button>
                  <button 
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black uppercase tracking-widest text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
                  >
                      {isSaving ? <RefreshCw className="animate-spin" size={16} /> : 'Save'}
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};