import React, { useState } from 'react';
import { Team, Translation } from '../types';
import { Sparkles, X, Check, RefreshCw, Wand2 } from 'lucide-react';

interface HelpingHandModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Record<string, Team>;
  initialFavorites: string[];
  onGenerate: (favorites: string[], scope: 'GROUPS' | 'KNOCKOUT', riskLevel: number) => void;
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
  const [riskValue, setRiskValue] = useState(50);

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
        onGenerate(selectedTeams, mode === 'knockout' ? 'KNOCKOUT' : 'GROUPS', riskValue / 100);
        setIsGenerating(false);
        onClose();
    }, 600);
  };

  const getActionTitle = () => mode === 'knockout' ? lang.simKnockoutTitle : lang.simGroupTitle;
  const getActionDescription = () => mode === 'knockout' ? lang.simKnockoutDesc : lang.simGroupDesc;

  const zone = riskValue <= 33 ? 'banker' : riskValue <= 66 ? 'balanced' : 'wildcard';
  const zoneLabel = zone === 'banker' ? lang.riskBanker : zone === 'balanced' ? lang.riskBalanced : lang.riskWildcard;
  const zoneDesc  = zone === 'banker' ? lang.riskBankerDesc : zone === 'balanced' ? lang.riskBalancedDesc : lang.riskWildcardDesc;
  // Thumb colour interpolates blue → red as riskValue goes 0 → 100
  const t = riskValue / 100;
  const thumbRgb = `rgb(${Math.round(59 + 180 * t)}, ${Math.round(130 - 62 * t)}, ${Math.round(246 - 178 * t)})`;
  // Track: filled area uses thumb colour at ~25% opacity; unfilled shows a faint fixed blue→red hint
  const trackBg = `linear-gradient(to right, ${thumbRgb}44 0%, ${thumbRgb}44 ${riskValue}%, rgba(59,130,246,0.08) ${riskValue}%, rgba(239,68,68,0.12) 100%)`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md transition-opacity" onClick={onClose}></div>

      <div id="tour-magic-wand-panel" className="relative w-full max-w-2xl bg-white rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="bg-[#0f172a] text-white px-5 py-6 flex items-start gap-4 shrink-0">
          <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20 shrink-0 mt-0.5">
            <Wand2 size={28} className="text-yellow-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black uppercase tracking-widest leading-tight">{getActionTitle()}</h2>
            <p className="text-xs text-slate-300 font-medium mt-1.5 leading-relaxed">{getActionDescription()}</p>
            <p className="text-[10px] text-yellow-400/70 font-semibold mt-1.5 leading-snug">{lang.simBoostNote.split('.')[0]}.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors shrink-0 mt-0.5"><X size={20} /></button>
        </div>

        {/* Team Grid */}
        <div className="flex-1 overflow-y-auto p-3 bg-slate-50">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
            {validTeams.map((team) => {
              const teamName = lang.teamNames[team.id] || team.name;
              const isSelected = selectedTeams.includes(team.id);
              const isDisabled = !isSelected && selectedTeams.length >= 3;

              return (
                <button
                  key={team.id}
                  onClick={() => toggleTeam(team.id)}
                  disabled={isDisabled}
                  className={`relative flex flex-col items-center py-2 px-1 rounded-2xl border-2 transition-all duration-200 ${
                    isSelected
                      ? 'bg-white border-yellow-400 shadow-lg scale-105 z-10'
                      : isDisabled
                        ? 'bg-slate-100 border-transparent opacity-25 grayscale cursor-not-allowed'
                        : 'bg-white border-transparent hover:border-slate-200 hover:shadow-md'
                  }`}
                >
                  {team.rank && team.rank < 99 && (
                    <span className="absolute top-1 right-1.5 text-[8px] font-black text-slate-400 leading-none">#{team.rank}</span>
                  )}
                  <div className="w-10 h-7 mb-1 shadow-sm rounded overflow-hidden border border-slate-100">
                    <img src={team.flag} alt={teamName} className="w-full h-full object-cover" />
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-tight leading-none text-center line-clamp-1 ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                    {teamName}
                  </span>
                  {isSelected && (
                    <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-white shadow border-2 border-white">
                      <Check size={10} strokeWidth={4} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Risk Slider */}
        <style>{`
          #risk-slider { appearance: none; -webkit-appearance: none; outline: none; }
          #risk-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 10px; height: 28px;
            border-radius: 4px;
            background: ${thumbRgb};
            cursor: pointer;
            border: 2px solid rgba(255,255,255,0.9);
            box-shadow: 0 2px 8px rgba(0,0,0,0.18);
          }
          #risk-slider::-moz-range-thumb {
            width: 10px; height: 28px;
            border-radius: 4px;
            background: ${thumbRgb};
            cursor: pointer;
            border: 2px solid rgba(255,255,255,0.9);
            box-shadow: 0 2px 8px rgba(0,0,0,0.18);
          }
        `}</style>
        <div className="px-4 py-3 bg-white border-t border-slate-200 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{lang.riskTitle}</p>
            <span className="text-[9px] font-bold text-slate-500 italic">{zoneLabel} — {zoneDesc}</span>
          </div>
          <div className="py-2">
            <input
              id="risk-slider"
              type="range" min="0" max="100" value={riskValue}
              onChange={e => setRiskValue(Number(e.target.value))}
              className="w-full cursor-pointer"
              style={{ height: '8px', borderRadius: '9999px', background: trackBg }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[8px] font-bold text-blue-500">🛡️ {lang.riskBanker}</span>
            <span className="text-[8px] font-bold text-slate-400">{lang.riskBalanced}</span>
            <span className="text-[8px] font-bold text-red-500">{lang.riskWildcard} ⚡</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-white border-t border-slate-200 shrink-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {selectedTeams.length}/3
            </span>
            {selectedTeams.length > 0 && (
              <button onClick={() => setSelectedTeams([])} className="text-[9px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest border border-slate-200 hover:border-red-300 px-2 py-0.5 rounded-lg transition-colors">
                {lang.clearAll || 'Clear'}
              </button>
            )}
          </div>
          <button
            onClick={handleGenerateClick}
            disabled={isGenerating}
            className="bg-[#0f172a] hover:bg-black text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 text-sm border border-white/10"
          >
            {isGenerating
              ? <RefreshCw size={20} className="animate-spin text-yellow-400" />
              : <Sparkles size={20} className="text-yellow-400" />
            }
            <span>{isGenerating ? lang.simulating : lang.runSim}</span>
          </button>
        </div>
      </div>
    </div>
  );
};