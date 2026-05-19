import React, { useState } from 'react';
import { Team, Translation } from '../types';
import { Sparkles, X, Check, RefreshCw, Wand2 } from 'lucide-react';

interface HelpingHandModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Record<string, Team>;
  initialFavorites: string[];
  onGenerate: (favorites: string[], scope: 'GROUPS' | 'KNOCKOUT') => void;
  lang: Translation;
  mode: 'groups' | 'knockout' | 'leaderboard';
}

export const HelpingHandModal: React.FC<HelpingHandModalProps> = ({
  isOpen,
  onClose,
  teams,
  initialFavorites,
  onGenerate,
  lang,
  mode
}) => {
  const [selectedTeams, setSelectedTeams] = useState<string[]>(initialFavorites);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  // Participants' home nations pinned first, then the rest by FIFA rank
  const PINNED = ['ENG', 'NOR', 'SCO', 'USA'];
  const validTeams = (Object.values(teams) as Team[])
    .filter(t => !t.id.startsWith('TBD'))
    .sort((a, b) => {
      const aPin = PINNED.indexOf(a.id);
      const bPin = PINNED.indexOf(b.id);
      if (aPin !== -1 && bPin !== -1) return aPin - bPin;
      if (aPin !== -1) return -1;
      if (bPin !== -1) return 1;
      return (a.rank ?? 999) - (b.rank ?? 999);
    });

  const toggleTeam = (teamId: string) => {
    if (selectedTeams.includes(teamId)) {
      setSelectedTeams(prev => prev.filter(id => id !== teamId));
    } else {
      if (selectedTeams.length < 3) {
        setSelectedTeams(prev => [...prev, teamId]);
      }
    }
  };

  const handleGenerateClick = () => {
    setIsGenerating(true);
    setTimeout(() => {
        onGenerate(selectedTeams, mode === 'knockout' ? 'KNOCKOUT' : 'GROUPS');
        setIsGenerating(false);
        onClose();
    }, 600);
  };

  const getActionTitle = () => mode === 'knockout' ? lang.simKnockoutTitle : lang.simGroupTitle;
  const getActionDescription = () => mode === 'knockout' ? lang.simKnockoutDesc : lang.simGroupDesc;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md transition-opacity" onClick={onClose}></div>

      <div id="tour-magic-wand-panel" className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-white/10">
        
        {/* Header - Midnight Stadium Aesthetic */}
        <div className="bg-[#0f172a] text-white p-10 text-center relative shrink-0">
          <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={28} /></button>
          
          <div className="flex justify-center mb-6">
             {/* UPDATED: Gold Theme */}
             <div className="bg-yellow-500/10 p-5 rounded-[2rem] border border-yellow-500/20 shadow-[0_0_40px_rgba(250,204,21,0.15)]">
                <Wand2 size={44} className="text-yellow-400" />
             </div>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 italic">{getActionTitle()}</h2>
          <p className="text-slate-400 text-xs font-black max-w-sm mx-auto leading-relaxed uppercase tracking-widest opacity-80">
            {getActionDescription()}
          </p>
        </div>
        {/* FIFA rank label */}
        <div className="bg-[#0f172a] px-8 pb-4 text-right">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest"># = FIFA World Ranking (Apr 2026)</span>
        </div>

        {/* Team Grid */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {validTeams.map((team) => {
              const teamName = lang.teamNames[team.id] || team.name;
              const isSelected = selectedTeams.includes(team.id);
              const isDisabled = !isSelected && selectedTeams.length >= 3;

              return (
                <button
                  key={team.id}
                  onClick={() => toggleTeam(team.id)}
                  disabled={isDisabled}
                  className={`relative flex flex-col items-center p-3 rounded-3xl border-2 transition-all duration-300 ${
                    isSelected
                      ? 'bg-white border-yellow-400 shadow-xl scale-105 z-10'
                      : isDisabled
                        ? 'bg-slate-100 border-transparent opacity-30 grayscale cursor-not-allowed'
                        : 'bg-white border-transparent hover:border-slate-300 hover:shadow-lg'
                  }`}
                >
                  {/* FIFA rank badge */}
                  {team.rank && team.rank < 99 && (
                    <span className="absolute top-2 right-2 text-[9px] font-black text-slate-400 leading-none">#{team.rank}</span>
                  )}
                  <div className="w-12 h-8 mb-2 shadow-sm rounded overflow-hidden border border-slate-100">
                    <img src={team.flag} alt={teamName} className="w-full h-full object-cover" />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest leading-tight text-center ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                    {teamName}
                  </span>

                  {isSelected && (
                    <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white animate-in zoom-in">
                      <Check size={14} strokeWidth={4} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer - High Contrast Actions */}
        <div className="p-8 bg-white border-t border-slate-100 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                {selectedTeams.length} / 3 {lang.selected}
              </span>
              {selectedTeams.length > 0 && (
                <button
                  onClick={() => setSelectedTeams([])}
                  className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest border border-slate-200 hover:border-red-300 px-2 py-1 rounded-lg transition-colors"
                >
                  Clear
                </button>
              )}
           </div>
           
           <button
             onClick={handleGenerateClick}
             disabled={isGenerating}
             className="w-full sm:w-auto bg-[#0f172a] hover:bg-black text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/5"
           >
             {isGenerating ? (
                /* UPDATED: Gold Icon */
                <RefreshCw size={24} className="animate-spin text-yellow-400" />
             ) : (
                /* UPDATED: Gold Icon */
                <Sparkles size={24} className="text-yellow-400" />
             )}
             <span>{isGenerating ? lang.simulating : lang.runSim}</span>
           </button>
        </div>
      </div>
    </div>
  );
};