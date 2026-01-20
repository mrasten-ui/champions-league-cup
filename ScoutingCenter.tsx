import React, { useState, useMemo, useEffect } from 'react';
import { Team, Translation } from '../types';
import { Search, Swords, Target, Brain, UserPlus, RefreshCw, X } from 'lucide-react';
import { fetchTeamTactics, analyzeMatchup, TeamDNA } from '../services/analyst';

interface ScoutingCenterProps {
  teams: Record<string, Team>;
  lang: Translation;
  currentLang: string;
}

// 1. Reusable "Slot" Component
const SelectionSlot: React.FC<{ 
    label: string, 
    team: Team | null, 
    teamNameDisplay: string, // NEW: Pass the translated name explicitly
    isActive: boolean, 
    onClick: () => void,
    onClear: () => void 
}> = ({ label, team, teamNameDisplay, isActive, onClick, onClear }) => (
    <div 
        onClick={onClick}
        className={`relative h-24 sm:h-32 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
            isActive 
            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 ring-offset-2 scale-[1.02] shadow-lg' 
            : team 
                ? 'border-slate-200 bg-white hover:border-slate-300' 
                : 'border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
        }`}
    >
        {team ? (
            <>
                {/* Background Flag (Faded) */}
                <img src={team.flag} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm" />
                
                <div className="relative z-10 flex flex-col items-center">
                     <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-white shadow-md overflow-hidden mb-1">
                         <img src={team.flag} alt={teamNameDisplay} className="w-full h-full object-cover" />
                     </div>
                     <span className="font-black text-slate-800 uppercase tracking-tight text-xs sm:text-sm text-center px-1 leading-tight">
                        {teamNameDisplay}
                     </span>
                </div>
                
                <button 
                    onClick={(e) => { e.stopPropagation(); onClear(); }}
                    className="absolute top-2 right-2 bg-white/80 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full p-1 transition-colors z-20"
                >
                    <X size={14} />
                </button>
            </>
        ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
                <UserPlus size={24} className={isActive ? 'text-blue-500 animate-bounce' : ''} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-blue-600' : ''}`}>
                    {isActive ? (label.includes('Home') || label.includes('Hjemme') ? 'Select Home' : 'Select Away') : label}
                </span>
            </div>
        )}
    </div>
);

// 2. Stat Bar Helper
const AttributeBar: React.FC<{ label: string, valA: number, valB: number, colorA: string, colorB: string }> = ({ label, valA, valB, colorA, colorB }) => (
    <div className="flex items-center gap-2 text-[10px] font-bold">
        <div className="w-8 text-right text-slate-400">{label}</div>
        <div className="flex-1 flex h-2 bg-slate-100 rounded-full overflow-hidden relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/50 z-10"></div>
            <div className="absolute top-0 bottom-0 left-0 bg-opacity-20 transition-all duration-700" style={{ width: `${valA}%`, backgroundColor: colorA, opacity: 0.3 }}></div>
            <div className="absolute top-0 bottom-0 left-0 transition-all duration-700" style={{ width: `${valA}%`, backgroundColor: colorA, opacity: valA > valB ? 1 : 0.6 }}></div>
            <div className="absolute top-[-2px] bottom-[-2px] w-1 bg-slate-900 z-20 transition-all duration-700 shadow-sm" style={{ left: `${valB}%`, backgroundColor: colorB }}></div>
        </div>
        <div className="w-6 text-slate-900">{valA > valB ? `+${valA-valB}` : ''}</div>
    </div>
);

export const ScoutingCenter: React.FC<ScoutingCenterProps> = ({ teams, lang, currentLang }) => {
  const [slotA, setSlotA] = useState<string | null>(null);
  const [slotB, setSlotB] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<'A' | 'B' | null>('A'); 
  
  const [dnaA, setDnaA] = useState<TeamDNA | null>(null);
  const [dnaB, setDnaB] = useState<TeamDNA | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Helper to get translated name safely
  const getTeamName = (team: Team | null) => {
      if (!team) return '';
      // Check translation map first, fallback to English name
      return lang.teamNames?.[team.id] || team.name;
  };

  // 1. Fetch DNA
  useEffect(() => {
    if (slotA) fetchTeamTactics(slotA, currentLang).then(setDnaA);
    else setDnaA(null);
  }, [slotA, currentLang]);

  useEffect(() => {
    if (slotB) fetchTeamTactics(slotB, currentLang).then(setDnaB);
    else setDnaB(null);
  }, [slotB, currentLang]);

  // 2. Analysis
  const analysis = useMemo(() => {
    if (!slotA || !slotB || !dnaA || !dnaB) return null;
    return analyzeMatchup(teams[slotA], dnaA, teams[slotB], dnaB, currentLang);
  }, [slotA, slotB, dnaA, dnaB, teams, currentLang]);

  const handleTeamClick = (teamId: string) => {
    if (activeSlot === 'A') {
        setSlotA(teamId);
        setActiveSlot('B'); 
    } else if (activeSlot === 'B') {
        setSlotB(teamId);
        setActiveSlot(null); 
    } else {
        setSlotA(teamId);
        setActiveSlot('B');
    }
  };

  const teamList = useMemo(() => {
      return Object.values(teams)
        .filter(t => t.id !== 'TBD' && t.id !== 'TBC' && t.name !== 'TBD') 
        .sort((a, b) => (a.rank || 99) - (b.rank || 99));
  }, [teams]);

  // Filter based on the TRANSLATED name
  const filteredTeams = useMemo(() => {
      return teamList.filter(t => {
          const name = getTeamName(t).toLowerCase();
          return name.includes(searchTerm.toLowerCase());
      });
  }, [teamList, searchTerm, lang]);

  return (
    <div className="pb-24 animate-fade-in space-y-6">
      
      {/* SELECTION ARENA */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-4">
              <h2 className="font-black uppercase tracking-widest flex items-center gap-2 text-slate-800">
                  <Swords size={20} className="text-blue-600" /> {lang.vsTool || "Matchup Engine"}
              </h2>
              {slotA && slotB && (
                  <button onClick={() => { setSlotA(null); setSlotB(null); setActiveSlot('A'); }} className="text-[10px] font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1">
                      <RefreshCw size={12} /> {lang.resetBtn}
                  </button>
              )}
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-4 items-center">
              <SelectionSlot 
                  label="Home Team" 
                  team={slotA ? teams[slotA] : null} 
                  teamNameDisplay={getTeamName(slotA ? teams[slotA] : null)}
                  isActive={activeSlot === 'A'} 
                  onClick={() => setActiveSlot('A')}
                  onClear={() => { setSlotA(null); setActiveSlot('A'); }}
              />
              
              <div className="flex flex-col items-center justify-center">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-xs sm:text-sm border-2 ${analysis ? 'bg-amber-400 border-amber-500 text-white animate-pulse' : 'bg-slate-100 border-slate-200 text-slate-300'}`}>
                      VS
                  </div>
              </div>

              <SelectionSlot 
                  label="Away Team" 
                  team={slotB ? teams[slotB] : null} 
                  teamNameDisplay={getTeamName(slotB ? teams[slotB] : null)}
                  isActive={activeSlot === 'B'} 
                  onClick={() => setActiveSlot('B')}
                  onClear={() => { setSlotB(null); setActiveSlot('B'); }}
              />
          </div>
      </div>

      {/* ANALYSIS RESULTS */}
      {analysis && (
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden animate-in slide-in-from-bottom-4">
                {/* Header Narrative */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center">
                    <div className="flex justify-center items-center gap-2 opacity-80 mb-2">
                        <Brain size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{lang.aiInsight || "AI Analysis"}</span>
                    </div>
                    <p className="text-lg sm:text-xl font-bold leading-relaxed">"{analysis.story}"</p>
                    <div className="mt-4 inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-medium">
                        <Target size={14} className="text-amber-400" />
                        Key Factor: <span className="font-bold text-amber-300">{analysis.keyFactor}</span>
                    </div>
                </div>

                {/* Data Grid */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{lang.tacticalAnalysis}</h3>
                        <AttributeBar label={lang.attack} valA={analysis.home.attributes.attack} valB={analysis.away.attributes.attack} colorA="#3b82f6" colorB="#ef4444" />
                        <AttributeBar label={lang.defense} valA={analysis.home.attributes.defense} valB={analysis.away.attributes.defense} colorA="#3b82f6" colorB="#ef4444" />
                        <AttributeBar label="PACE" valA={analysis.home.attributes.pace} valB={analysis.away.attributes.pace} colorA="#3b82f6" colorB="#ef4444" />
                        <AttributeBar label="TECH" valA={analysis.home.attributes.technique} valB={analysis.away.attributes.technique} colorA="#3b82f6" colorB="#ef4444" />
                    </div>

                    <div className="flex flex-col justify-center">
                        <div className="text-center mb-2">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">{lang.winChance}</span>
                        </div>
                        <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                             <div className="bg-blue-500 flex items-center justify-start px-2 text-[10px] font-bold text-white transition-all duration-1000" style={{ width: `${analysis.winProb}%` }}>
                                {analysis.winProb}%
                             </div>
                             <div className="bg-red-500 flex items-center justify-end px-2 text-[10px] font-bold text-white transition-all duration-1000" style={{ width: `${100 - analysis.winProb}%` }}>
                                {100 - analysis.winProb}%
                             </div>
                        </div>
                        <div className="flex justify-between mt-1 px-1">
                            <span className="text-[10px] font-bold text-blue-600">{getTeamName(teams[slotA!])}</span>
                            <span className="text-[10px] font-bold text-red-600">{getTeamName(teams[slotB!])}</span>
                        </div>
                    </div>
                </div>
          </div>
      )}

      {/* TEAM SELECTOR GRID */}
      <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                  {activeSlot ? `${lang.selectTeam}: ${activeSlot === 'A' ? 'Home' : 'Away'}` : lang.allNations}
              </h3>
              <div className="relative w-40">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder={lang.searchNation} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-blue-500"
                  />
              </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredTeams.map(team => {
                  const isSelected = slotA === team.id || slotB === team.id;
                  const translatedName = getTeamName(team);
                  return (
                      <button 
                          key={team.id} 
                          onClick={() => handleTeamClick(team.id)}
                          disabled={isSelected && activeSlot !== null} 
                          className={`
                              flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                              ${isSelected 
                                ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed' 
                                : activeSlot 
                                    ? 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer' 
                                    : 'bg-white border-slate-200 hover:bg-slate-50'}
                          `}
                      >
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100 shrink-0">
                              <img src={team.flag} alt={translatedName} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                              <div className="font-bold text-slate-800 text-xs truncate">{translatedName}</div>
                              <div className="text-[9px] font-medium text-slate-400">{lang.fifaRank} {team.rank}</div>
                          </div>
                      </button>
                  );
              })}
          </div>
      </div>
    </div>
  );
};