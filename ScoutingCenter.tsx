import React, { useState, useMemo, useEffect } from 'react';
import { Team, Translation, LanguageCode, MatchHistoryItem, ScoutingData } from '../types';
import { Search, Swords, Target, Brain, UserPlus, RefreshCw, X, TrendingUp, AlertCircle, Activity, Crown, Minus, TrendingDown } from 'lucide-react';
import { fetchTeamTactics, analyzeMatchup, TeamDNA } from '../services/analyst';
import { fetchTeamHistory, fetchScoutingOverview, fetchTeamExtendedStats, TeamFormData } from '../services/engine';
import { getScoutingReport } from '../scoutingData';

// --- SUB-COMPONENTS ---

const SelectionSlot: React.FC<{ 
    label: string, 
    team: Team | null, 
    teamNameDisplay: string, 
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
                    {isActive ? (label.includes('Home') ? 'Select Home' : 'Select Away') : label}
                </span>
            </div>
        )}
    </div>
);

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

const RenderPoints = ({ text }: { text?: string }) => {
    if (!text) return <span className="italic opacity-60">Data unavailable</span>;
    const points = text.split(/\.\s+|\.$/).filter(p => p.trim().length > 0);
    if (points.length === 0) return <span>{text}</span>;
    return (
        <ul className="list-none space-y-2 mt-2">
            {points.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed font-medium text-slate-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-40" />
                    <span>{p.trim()}.</span>
                </li>
            ))}
        </ul>
    );
};

const cleanText = (text?: string) => text ? text.replace(/^"|"$/g, '').trim() : '';

// --- MAIN COMPONENT ---

interface ScoutingCenterProps {
  teams: Record<string, Team>;
  lang: Translation;
  currentLang: string;
}

export const ScoutingCenter: React.FC<ScoutingCenterProps> = ({ teams, lang, currentLang }) => {
  // VS Tool State
  const [slotA, setSlotA] = useState<string | null>(null);
  const [slotB, setSlotB] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<'A' | 'B' | null>('A'); 
  const [dnaA, setDnaA] = useState<TeamDNA | null>(null);
  const [dnaB, setDnaB] = useState<TeamDNA | null>(null);
  
  // Grid/Modal State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  
  // Modal Data State
  const [history, setHistory] = useState<MatchHistoryItem[]>([]);
  const [scoutingData, setScoutingData] = useState<ScoutingData | null>(null);
  const [extendedStats, setExtendedStats] = useState<TeamFormData | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Helper to get translated name
  const getTeamName = (team: Team | null) => {
      if (!team) return '';
      return (lang.teamNames && lang.teamNames[team.id]) ? lang.teamNames[team.id] : team.name;
  };

  // --- VS TOOL EFFECTS ---
  useEffect(() => {
    if (slotA) fetchTeamTactics(slotA, currentLang).then(setDnaA);
    else setDnaA(null);
  }, [slotA, currentLang]);

  useEffect(() => {
    if (slotB) fetchTeamTactics(slotB, currentLang).then(setDnaB);
    else setDnaB(null);
  }, [slotB, currentLang]);

  const analysis = useMemo(() => {
    if (!slotA || !slotB || !dnaA || !dnaB) return null;
    return analyzeMatchup(teams[slotA], dnaA, teams[slotB], dnaB, currentLang);
  }, [slotA, slotB, dnaA, dnaB, teams, currentLang]);

  const handleTeamClick = (teamId: string) => {
    // If VS Tool is active (selecting a slot), fill the slot
    if (activeSlot === 'A') {
        setSlotA(teamId);
        setActiveSlot('B'); 
    } else if (activeSlot === 'B') {
        setSlotB(teamId);
        setActiveSlot(null); 
    } else {
        // If no slot active, open detailed modal
        setSelectedTeam(teams[teamId]);
    }
  };

  // --- MODAL DATA EFFECTS ---
  useEffect(() => {
      if (selectedTeam) {
          setLoadingHistory(true);
          const loadData = async () => {
              const [dbHistory, dbScouting, dbExtended] = await Promise.all([
                  fetchTeamHistory(selectedTeam.id),
                  fetchScoutingOverview(selectedTeam.id, currentLang as LanguageCode),
                  fetchTeamExtendedStats(selectedTeam.id)
              ]);

              if (dbExtended) {
                  setExtendedStats(dbExtended);
                  setHistory(dbExtended.history);
              } else {
                  setHistory(dbHistory);
              }

              if (dbScouting) {
                  setScoutingData(dbScouting);
              } else {
                  // Fallback to local file if DB empty
                  const localReport = getScoutingReport(selectedTeam.id, currentLang as LanguageCode);
                  if (localReport) {
                      setScoutingData({
                          id: 0,
                          team_id: selectedTeam.id,
                          team_name: selectedTeam.name,
                          confederation: localReport.confederation || 'FIFA',
                          fifa_rank: localReport.fifa_rank || selectedTeam.rank || 99,
                          star_player: localReport.star_player || 'Key Player',
                          strengths: localReport.strengths || '',
                          weaknesses: localReport.weaknesses || '',
                          scout_notes: localReport.scout_notes || '',
                          recent_form: localReport.recent_form || '',
                          last_5_matches: localReport.last_5_matches || '',
                          created_at: new Date().toISOString(),
                          // lang is now optional in types, so we can omit it or pass currentLang
                      });
                  }
              }
              setLoadingHistory(false);
          };
          loadData();
      } else {
          setHistory([]);
          setScoutingData(null);
          setExtendedStats(null);
      }
  }, [selectedTeam, currentLang]);

  // --- RENDERING HELPERS ---
  const teamList = useMemo(() => {
      return Object.values(teams)
        .filter(t => t.id !== 'TBD' && t.id !== 'TBC' && t.name !== 'TBD') 
        .sort((a, b) => (a.rank || 99) - (b.rank || 99));
  }, [teams]);

  const filteredTeams = useMemo(() => {
      return teamList.filter(t => {
          const name = getTeamName(t).toLowerCase();
          return name.includes(searchTerm.toLowerCase());
      });
  }, [teamList, searchTerm, lang]);

  const getParsedMatches = (stats: TeamFormData | null, fallbackHist: MatchHistoryItem[]) => {
      if (stats) return stats.history;
      if (fallbackHist.length > 0) return fallbackHist;
      return [];
  };

  const parsedMatches = useMemo(() => getParsedMatches(extendedStats, history), [extendedStats, history]);

  const calculateTrend = (matches: MatchHistoryItem[]) => {
      if (!matches || matches.length === 0) return { label: 'Unknown', color: 'text-slate-400', icon: Minus, bg: 'bg-slate-100' };
      let points = 0;
      matches.slice(0, 5).forEach(m => {
          if (m.result === 'W') points += 3;
          else if (m.result === 'D') points += 1;
      });
      if (points >= 10) return { label: lang.trendUp || 'Heating Up', color: 'text-green-500', bg: 'bg-green-100', icon: TrendingUp };
      if (points >= 7) return { label: lang.trendUp || 'Heating Up', color: 'text-green-600', bg: 'bg-green-50', icon: TrendingUp };
      if (points >= 4) return { label: lang.trendFlat || 'Inconsistent', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Minus };
      return { label: lang.trendDown || 'Cooling Off', color: 'text-red-500', bg: 'bg-red-50', icon: TrendingDown };
  };
  
  const trend = useMemo(() => calculateTrend(parsedMatches), [parsedMatches, lang]);
  const displayRank = extendedStats?.fifaRank || scoutingData?.fifa_rank || selectedTeam?.rank || 99;
  const modalTeamName = selectedTeam ? getTeamName(selectedTeam) : '';

  return (
    <div className="pb-24 animate-fade-in space-y-6">
      
      {/* VS MATCHUP ENGINE */}
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

      {/* DEEP DIVE MODAL (Detailed Report) */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div 
             className="absolute inset-0 bg-slate-900/90 backdrop-blur-md transition-opacity"
             onClick={() => setSelectedTeam(null)}
           ></div>

           <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="relative h-32 bg-[#0f2545] shrink-0">
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-5"></div>
                  <div className="absolute -bottom-8 left-6 w-24 h-16 rounded-lg border-4 border-white shadow-lg overflow-hidden bg-white z-10 transform -rotate-2">
                      <img src={selectedTeam.flag} alt={selectedTeam.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                      <span className="text-white/60 text-[9px] font-black uppercase tracking-widest">{lang.fifaRank}</span>
                      <div className="text-4xl font-black text-white italic tracking-tighter drop-shadow-md">#{displayRank}</div>
                  </div>
                  <button onClick={() => setSelectedTeam(null)} className="absolute top-4 left-4 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors backdrop-blur-sm">
                    <X size={20} />
                  </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto pt-12 px-6 pb-6 bg-slate-50">
                  <div className="mb-6">
                      <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-1">{modalTeamName}</h2>
                      <div className="flex items-center gap-2">
                          <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-sm">{selectedTeam.id}</span>
                          {scoutingData?.confederation && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-blue-200">{scoutingData.confederation}</span>
                          )}
                      </div>
                  </div>

                  {/* Key Player */}
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-5 flex items-center gap-4 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl group-hover:bg-yellow-400/20 transition-all"></div>
                      <div className="bg-yellow-100 text-yellow-600 p-3 rounded-full shrink-0 relative z-10">
                          <Crown size={24} fill="currentColor" className="text-yellow-500" />
                      </div>
                      <div className="relative z-10">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{lang.starPlayer}</div>
                          <div className="text-xl font-black text-slate-900 leading-none">{cleanText(scoutingData?.star_player) || selectedTeam.starPlayer}</div>
                      </div>
                  </div>

                  {/* Strengths / Weaknesses */}
                  {scoutingData && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                          <div className="bg-green-50/60 rounded-xl p-4 border border-green-100/50">
                              <h4 className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-2 flex items-center gap-1.5"><TrendingUp size={14} /> {lang.strengthsLabel}</h4>
                              <RenderPoints text={cleanText(scoutingData.strengths)} />
                          </div>
                          <div className="bg-red-50/60 rounded-xl p-4 border border-red-100/50">
                              <h4 className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-2 flex items-center gap-1.5"><AlertCircle size={14} /> {lang.weaknessesLabel}</h4>
                              <RenderPoints text={cleanText(scoutingData.weaknesses)} />
                          </div>
                      </div>
                  )}

                  {/* Form & History */}
                  <div className="mb-2">
                      <div className="flex justify-between items-center mb-3">
                          <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><Activity size={16} className="text-slate-400" /> {lang.formGuide}</h3>
                          {trend && (
                              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${trend.bg}`}>
                                  <trend.icon size={12} className={trend.color} />
                                  <span className={`text-[10px] font-black uppercase tracking-wide ${trend.color}`}>{trend.label}</span>
                              </div>
                          )}
                      </div>
                      
                      {loadingHistory ? (
                          <div className="flex justify-center py-4"><RefreshCw className="animate-spin text-slate-300" /></div>
                      ) : (
                          <>
                             <div className="flex gap-2 mb-4">
                                  {(parsedMatches || []).slice(0, 5).map((m, i) => {
                                      const r = m.result;
                                      const color = r === 'W' ? 'bg-green-500 shadow-green-200' : r === 'D' ? 'bg-slate-400 shadow-slate-200' : 'bg-red-500 shadow-red-200';
                                      return (
                                          <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-md ${color} transform transition-transform hover:scale-110`}>{r}</div>
                                      )
                                  })}
                             </div>
                             
                             <div className="space-y-2">
                                {(parsedMatches || []).slice(0, 5).map((m, idx) => {
                                    const oppName = (lang.teamNames && lang.teamNames[m.opponent]) || m.opponent;
                                    return (
                                        <div key={idx} className="bg-white border border-slate-200 p-2.5 rounded-xl flex justify-between items-center text-xs shadow-sm">
                                            <div className="font-bold text-slate-700 uppercase tracking-tight">{oppName.replace(/^vs\s+/i, '')}</div>
                                            <span className={`font-mono font-black px-2 py-0.5 rounded text-[10px] ${m.result === 'W' ? 'bg-green-100 text-green-700' : m.result === 'L' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{m.score}</span>
                                        </div>
                                    );
                                })}
                             </div>
                          </>
                      )}
                  </div>
              </div>
              
              <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                  <button onClick={() => setSelectedTeam(null)} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-colors shadow-lg">
                      {lang.closeReport}
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};